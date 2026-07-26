import Blog, {
  buildBlogContentHash,
  slugifyBlogTitle,
} from "../models/blog.model.js";
import { formatSheetDate } from "./formatSheetDate.js";
import {
  exportGoogleDocTabExact,
  fetchBlogDocumentTabs,
  markBlogDocumentTab,
  UPLOADED_TAB_SUFFIX,
} from "./googleDocsBlogs.js";
import {
  BLOG_QUEUE_HEADERS,
  BLOG_QUEUE_SHEET_CONFIG,
  ensureBlogQueueSpreadsheet,
  exportGoogleDocPlainText,
  extractGoogleDocId,
  getBlogDocumentId,
  isGoogleBlogImportEnabled,
  readSheetRows,
  updateSheetRowValues,
} from "./googleSheets.js";

const col = (name) => BLOG_QUEUE_HEADERS.indexOf(name);

const cell = (row, name) => String(row[col(name)] ?? "").trim();

const buildRowValues = (row, overrides = {}) => {
  const next = [...BLOG_QUEUE_HEADERS.map((_, i) => row[i] ?? "")];
  for (const [key, value] of Object.entries(overrides)) {
    const index = col(key);
    if (index >= 0) next[index] = value;
  }
  return next;
};

async function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let attempt = 0;
  while (attempt < 50) {
    const exists = await Blog.exists({ slug });
    if (!exists) return slug;
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }
  return `${baseSlug}-${Date.now()}`;
}

const buildExcerpt = (content) => {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.slice(0, 180) + (flat.length > 180 ? "…" : "");
};

/**
 * Primary path: one unpublished tab from GOOGLE_BLOG_DOC_ID → website blog,
 * then rename the tab to "… - Uploaded".
 */
export const publishNextPendingBlogFromDocTabs = async () => {
  const documentId = getBlogDocumentId();
  if (!documentId) {
    return {
      skipped: true,
      reason: "GOOGLE_BLOG_DOC_ID is not set",
    };
  }

  const { tabs } = await fetchBlogDocumentTabs(documentId);
  const pendingTabs = tabs.filter((tab) => tab.pending && tab.tabId);

  if (!pendingTabs.length) {
    return {
      skipped: true,
      reason: `No pending Google Doc tabs (all marked ${UPLOADED_TAB_SUFFIX} / Skipped or empty)`,
      documentId,
    };
  }

  for (const tab of pendingTabs) {
    const googleSourceId = `gdoc:${documentId}:tab:${tab.tabId}`;
    // Prefer the Doc tab label (e.g. "blog 1"), not the article H1.
    const tabLabel = String(tab.tabTitle || "").trim() || `tab ${tab.tabId}`;

    try {
      // Prefer exact txt+html export so body + embedded image match the Doc tab.
      let exact = tab;
      try {
        exact = await exportGoogleDocTabExact(documentId, tab.tabId);
      } catch (exportError) {
        console.warn(
          `⚠️ Exact tab export failed for ${tab.tabId}, using Docs API payload:`,
          exportError.message || exportError,
        );
      }

      const title = String(exact.title || tab.title || "").trim();
      const content = String(exact.content || tab.content || "").trim();
      const coverImageUrl = String(
        exact.coverImageUrl || tab.coverImageUrl || "",
      ).trim();

      if (!title || title.length < 3) {
        throw new Error("Tab needs a Heading 1 / title (min 3 chars)");
      }
      if (!content || content.length < 20) {
        throw new Error("Tab content is too short (min 20 chars)");
      }

      const existingSource = await Blog.findOne({ googleSourceId }).select(
        "_id slug",
      );
      if (existingSource) {
        await markBlogDocumentTab(documentId, tab.tabId, {
          status: "SKIPPED",
          originalTitle: tabLabel,
        });
        continue;
      }

      const contentHash = buildBlogContentHash(title, content);
      const existingHash = await Blog.findOne({ contentHash }).select(
        "_id slug title",
      );
      if (existingHash) {
        await markBlogDocumentTab(documentId, tab.tabId, {
          status: "SKIPPED",
          originalTitle: tabLabel,
        });
        continue;
      }

      let slug = await ensureUniqueSlug(slugifyBlogTitle(title));

      const blog = await Blog.create({
        title,
        slug,
        excerpt: buildExcerpt(content),
        content,
        coverImageUrl,
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorName: "Apna Rojgar",
        source: "GOOGLE_DOC",
        googleSourceId,
        contentHash,
      });

      const markedTitle = await markBlogDocumentTab(documentId, tab.tabId, {
        status: "POSTED",
        originalTitle: tabLabel,
      });

      return {
        skipped: false,
        documentId,
        tabId: tab.tabId,
        markedTitle,
        blogId: blog._id.toString(),
        slug: blog.slug,
        title: blog.title,
        source: "GOOGLE_DOC",
        message: markedTitle
          ? `Published blog "${blog.title}" and renamed tab to "${markedTitle}"`
          : `Published blog "${blog.title}" but could not rename the Doc tab (enable Docs API / Editor share)`,
      };
    } catch (error) {
      // Leave tab unmarked so it can be fixed and retried tomorrow.
      return {
        skipped: false,
        failed: true,
        documentId,
        tabId: tab.tabId,
        tabTitle: tab.tabTitle,
        message: error.message || "Failed to publish blog from Google Doc tab",
      };
    }
  }

  return {
    skipped: true,
    reason: "Pending tabs were duplicates and marked [SKIPPED]",
    documentId,
  };
};

/**
 * Legacy fallback: Google Sheet "Blog Queue" rows.
 */
export const publishNextPendingBlogFromSheet = async () => {
  const { spreadsheetId } = await ensureBlogQueueSpreadsheet();
  const rows = await readSheetRows(
    spreadsheetId,
    BLOG_QUEUE_SHEET_CONFIG.tabName,
  );

  if (rows.length <= 1) {
    return {
      skipped: true,
      reason: "Blog Queue sheet is empty (add rows under the header)",
      spreadsheetId,
    };
  }

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    const rowNumber = i + 1;
    const status = cell(row, "Status").toLowerCase() || "pending";

    if (status !== "pending") continue;

    const title = cell(row, "Title");
    const excerpt = cell(row, "Excerpt");
    const coverImageUrl = cell(row, "Cover Image URL");
    const docId = extractGoogleDocId(cell(row, "Google Doc ID"));
    let content = cell(row, "Content");
    let source = "GOOGLE_SHEET";
    let googleSourceId = `sheet:${spreadsheetId}:row:${rowNumber}`;

    try {
      if (docId) {
        content = await exportGoogleDocPlainText(docId);
        source = "GOOGLE_DOC";
        googleSourceId = `doc:${docId}`;
      }

      if (!title || title.length < 3) {
        throw new Error("Title is required (min 3 chars)");
      }
      if (!content || content.length < 20) {
        throw new Error(
          "Content is required (min 20 chars). Paste into Content or share a Google Doc with the service account.",
        );
      }

      const existingSource = await Blog.findOne({ googleSourceId }).select(
        "_id slug",
      );
      if (existingSource) {
        await updateSheetRowValues(
          spreadsheetId,
          BLOG_QUEUE_SHEET_CONFIG.tabName,
          rowNumber,
          buildRowValues(row, {
            Status: "skipped",
            Error: `Duplicate google source (already ${existingSource.slug})`,
          }),
        );
        continue;
      }

      const contentHash = buildBlogContentHash(title, content);
      const existingHash = await Blog.findOne({ contentHash }).select(
        "_id slug title",
      );
      if (existingHash) {
        await updateSheetRowValues(
          spreadsheetId,
          BLOG_QUEUE_SHEET_CONFIG.tabName,
          rowNumber,
          buildRowValues(row, {
            Status: "skipped",
            Error: `Duplicate content matches ${existingHash.slug}`,
          }),
        );
        continue;
      }

      let slug = cell(row, "Slug").toLowerCase() || slugifyBlogTitle(title);
      slug = await ensureUniqueSlug(slug);

      const blog = await Blog.create({
        title,
        slug,
        excerpt: excerpt || buildExcerpt(content),
        content,
        coverImageUrl,
        status: "PUBLISHED",
        publishedAt: new Date(),
        authorName: "Apna Rojgar",
        source,
        googleSourceId,
        contentHash,
      });

      await updateSheetRowValues(
        spreadsheetId,
        BLOG_QUEUE_SHEET_CONFIG.tabName,
        rowNumber,
        buildRowValues(row, {
          Slug: slug,
          Status: "posted",
          "Posted At": formatSheetDate(new Date()),
          Error: "",
        }),
      );

      return {
        skipped: false,
        spreadsheetId,
        blogId: blog._id.toString(),
        slug: blog.slug,
        title: blog.title,
        source,
        rowNumber,
        message: `Published blog "${blog.title}"`,
      };
    } catch (error) {
      await updateSheetRowValues(
        spreadsheetId,
        BLOG_QUEUE_SHEET_CONFIG.tabName,
        rowNumber,
        buildRowValues(row, {
          Status: "error",
          Error: String(error.message || error).slice(0, 500),
        }),
      ).catch(() => undefined);

      return {
        skipped: false,
        failed: true,
        spreadsheetId,
        rowNumber,
        message: error.message || "Failed to publish blog from Google queue",
      };
    }
  }

  return {
    skipped: true,
    reason: "No pending rows in Blog Queue",
    spreadsheetId,
  };
};

/**
 * Prefers Google Doc tabs (your workflow). Falls back to Sheet queue if no doc id.
 */
export const publishNextPendingBlogFromGoogle = async () => {
  if (!isGoogleBlogImportEnabled()) {
    return {
      skipped: true,
      reason: "GOOGLE_BLOG_IMPORT_ENABLED is not true",
    };
  }

  if (getBlogDocumentId()) {
    return publishNextPendingBlogFromDocTabs();
  }

  return publishNextPendingBlogFromSheet();
};
