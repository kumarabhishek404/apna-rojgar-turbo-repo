import fs from "fs";
import os from "os";
import path from "path";
import { google } from "googleapis";
import { uploadOnCloudinary } from "./cloudinary.js";
import {
  extractGoogleDocId,
  getBlogDocumentId,
  getGoogleAuthClient,
} from "./googleSheets.js";

/** Legacy prefixes (still recognized so old tabs are not re-published). */
export const POSTED_TAB_PREFIX = "[POSTED]";
export const SKIPPED_TAB_PREFIX = "[SKIPPED]";

/** Shown on the Doc tab after a successful website publish. */
export const UPLOADED_TAB_SUFFIX = "- Uploaded";
export const SKIPPED_TAB_SUFFIX = "- Skipped";

const getDocsClient = async () => {
  const auth = getGoogleAuthClient();
  await auth.authorize();
  return google.docs({ version: "v1", auth });
};

const getAccessToken = async () => {
  const auth = getGoogleAuthClient();
  await auth.authorize();
  const token = await auth.getAccessToken();
  return typeof token === "string" ? token : token?.token;
};

const flattenTabs = (tabs = [], acc = []) => {
  for (const tab of tabs) {
    if (!tab) continue;
    acc.push(tab);
    if (Array.isArray(tab.childTabs) && tab.childTabs.length) {
      flattenTabs(tab.childTabs, acc);
    }
  }
  return acc;
};

const readParagraphText = (paragraph) => {
  const parts = [];
  for (const element of paragraph?.elements || []) {
    if (element?.textRun?.content) parts.push(element.textRun.content);
  }
  return parts.join("");
};

const readStructuralElements = (elements = []) => {
  const chunks = [];
  for (const element of elements) {
    if (element.paragraph) {
      chunks.push(readParagraphText(element.paragraph));
    } else if (element.table) {
      for (const row of element.table.tableRows || []) {
        for (const cell of row.tableCells || []) {
          chunks.push(readStructuralElements(cell.content || []));
        }
      }
    } else if (element.tableOfContents) {
      chunks.push(readStructuralElements(element.tableOfContents.content || []));
    }
  }
  return chunks.join("");
};

const extractHeading1 = (elements = []) => {
  for (const element of elements) {
    if (!element.paragraph) continue;
    const style = element.paragraph.paragraphStyle?.namedStyleType;
    if (style === "HEADING_1" || style === "TITLE") {
      const text = readParagraphText(element.paragraph).replace(/\s+/g, " ").trim();
      if (text) return text;
    }
  }
  return "";
};

const extractFirstImageUrl = (documentTab) => {
  const inlineObjects = documentTab?.inlineObjects || {};
  for (const object of Object.values(inlineObjects)) {
    const uri =
      object?.inlineObjectProperties?.embeddedObject?.imageProperties?.contentUri;
    if (uri) return String(uri).trim();
  }
  return "";
};

const stripStatusMarker = (title = "") =>
  String(title)
    .replace(/^\[POSTED\]\s*/i, "")
    .replace(/^\[SKIPPED\]\s*/i, "")
    .replace(/^✅\s*/u, "")
    .replace(/\s*[-–—]\s*Uploaded\s*$/i, "")
    .replace(/\s*[-–—]\s*Skipped\s*$/i, "")
    .replace(/\s+Uploaded\s*$/i, "")
    .replace(/\s+Skipped\s*$/i, "")
    .trim();

/** @deprecated use stripStatusMarker */
const stripStatusPrefix = stripStatusMarker;

export const isPendingBlogTabTitle = (title = "") => {
  const raw = String(title || "").trim();
  if (!raw) return false;
  if (/^\[POSTED\]/i.test(raw)) return false;
  if (/^\[SKIPPED\]/i.test(raw)) return false;
  if (/^✅/.test(raw)) return false;
  if (/\bUploaded\s*$/i.test(raw)) return false;
  if (/\bSkipped\s*$/i.test(raw)) return false;
  return true;
};

const parsePlainTextBlog = (rawText = "") => {
  const text = String(rawText).replace(/^\uFEFF/, "").trim();
  if (!text) return { title: "", content: "" };
  const lines = text.split(/\r?\n/);
  const title = (lines.find((line) => line.trim()) || "").trim();
  const titleIndex = lines.findIndex((line) => line.trim() === title);
  const content = lines
    .slice(titleIndex + 1)
    .join("\n")
    .replace(/^\n+/, "")
    .trim();
  return { title, content };
};

/**
 * Upload first embedded image from exported HTML (data URI) to Cloudinary.
 */
export const uploadCoverImageFromHtml = async (html = "") => {
  const match = String(html).match(
    /src="(data:image\/[a-zA-Z+]+;base64,[^"]+)"/i,
  );
  if (!match) return "";

  const dataUri = match[1];
  const parts = dataUri.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!parts) return "";

  const mime = parts[1];
  const b64 = parts[2];
  const ext = mime.includes("png")
    ? "png"
    : mime.includes("jpeg") || mime.includes("jpg")
      ? "jpg"
      : "bin";
  const tmpPath = path.join(
    os.tmpdir(),
    `apna-rojgar-blog-cover-${Date.now()}.${ext}`,
  );
  fs.writeFileSync(tmpPath, Buffer.from(b64, "base64"));
  const url = await uploadOnCloudinary(tmpPath);
  return url || "";
};

/**
 * Exact per-tab export via docs.google.com/export (works without Docs API).
 * Tab ids look like t.0, t.1, ...
 */
export const exportGoogleDocTabExact = async (documentId, tabId) => {
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Failed to obtain Google access token");

  const base = `https://docs.google.com/document/d/${documentId}/export`;
  const headers = { Authorization: `Bearer ${accessToken}` };

  const [txtRes, htmlRes] = await Promise.all([
    fetch(`${base}?format=txt&tab=${encodeURIComponent(tabId)}`, { headers }),
    fetch(`${base}?format=html&tab=${encodeURIComponent(tabId)}`, { headers }),
  ]);

  if (!txtRes.ok) {
    throw new Error(`Tab ${tabId} text export failed (${txtRes.status})`);
  }

  const rawText = await txtRes.text();
  const { title, content } = parsePlainTextBlog(rawText);
  let coverImageUrl = "";
  if (htmlRes.ok) {
    const html = await htmlRes.text();
    coverImageUrl = await uploadCoverImageFromHtml(html);
  }

  return {
    documentId,
    tabId,
    tabTitle: title || tabId,
    heading1: title,
    title,
    content,
    coverImageUrl,
    pending: true,
  };
};

/**
 * Probe sequential tab ids when Docs API is unavailable.
 */
export const fetchBlogDocumentTabsViaExport = async (
  documentId = getBlogDocumentId(),
  { maxTabs = 40 } = {},
) => {
  const docId = extractGoogleDocId(documentId) || documentId;
  if (!docId) {
    throw new Error(
      "Set GOOGLE_BLOG_DOC_ID to your Google Doc that stores blogs as tabs",
    );
  }

  const accessToken = await getAccessToken();
  const headers = { Authorization: `Bearer ${accessToken}` };
  const tabs = [];

  for (let i = 0; i < maxTabs; i += 1) {
    const tabId = `t.${i}`;
    const url = `https://docs.google.com/document/d/${docId}/export?format=txt&tab=${encodeURIComponent(tabId)}`;
    const res = await fetch(url, { headers });
    if (res.status === 429) break;
    if (!res.ok) break;

    const rawText = await res.text();
    const { title, content } = parsePlainTextBlog(rawText);
    if (!title || content.length < 20) continue;

    // Fetch HTML only for tabs we may publish (caller uploads image later as needed)
    tabs.push({
      documentId: docId,
      tabId,
      tabTitle: title,
      heading1: title,
      title,
      content,
      coverImageUrl: "",
      pending: true,
      needsHtmlImage: true,
    });
  }

  return { documentId: docId, documentTitle: "", tabs };
};

/**
 * Load all tabs (including nested) from the blogs Google Doc.
 * Falls back to per-tab export when Docs API is disabled.
 */
export const fetchBlogDocumentTabs = async (documentId = getBlogDocumentId()) => {
  const docId = extractGoogleDocId(documentId) || documentId;
  if (!docId) {
    throw new Error(
      "Set GOOGLE_BLOG_DOC_ID to your Google Doc that stores blogs as tabs",
    );
  }

  try {
    const docs = await getDocsClient();
    const response = await docs.documents.get({
      documentId: docId,
      includeTabsContent: true,
    });

    const tabs = flattenTabs(response.data.tabs || []).map((tab) => {
      const tabId = tab.tabProperties?.tabId || "";
      const tabTitle = tab.tabProperties?.title || "";
      const bodyContent = tab.documentTab?.body?.content || [];
      const fullText = readStructuralElements(bodyContent).trim();
      const heading1 = extractHeading1(bodyContent);
      const coverImageUrl = extractFirstImageUrl(tab.documentTab);

      return {
        documentId: docId,
        tabId,
        tabTitle,
        heading1,
        title: heading1 || stripStatusPrefix(tabTitle),
        content: fullText,
        coverImageUrl,
        pending: isPendingBlogTabTitle(tabTitle),
      };
    });

    return {
      documentId: docId,
      documentTitle: response.data.title || "",
      tabs,
      via: "docs-api",
    };
  } catch (error) {
    const message = String(error?.message || error);
    if (
      !/Docs API has not been used|accessNotConfigured|PERMISSION_DENIED|403/i.test(
        message,
      )
    ) {
      throw error;
    }
    console.warn(
      "⚠️ Docs API unavailable; falling back to per-tab Google export URLs",
    );
    const fallback = await fetchBlogDocumentTabsViaExport(docId);
    return { ...fallback, via: "export-fallback" };
  }
};

/**
 * Rename a tab after publish/skip so the daily job won't pick it again.
 * Example: "blog 1" → "blog 1 - Uploaded"
 * Soft-fails when Docs API is disabled (Mongo googleSourceId still blocks duplicates).
 */
export const markBlogDocumentTab = async (
  documentId,
  tabId,
  { status = "POSTED", originalTitle = "" } = {},
) => {
  if (!documentId || !tabId) return null;

  const suffix =
    status === "SKIPPED" ? SKIPPED_TAB_SUFFIX : UPLOADED_TAB_SUFFIX;
  const baseTitle = stripStatusMarker(originalTitle) || "blog";
  const nextTitle = `${baseTitle} ${suffix}`.slice(0, 100);

  try {
    const docs = await getDocsClient();
    const requestWithEmoji = {
      updateDocumentTabProperties: {
        tabProperties: {
          tabId,
          title: nextTitle,
          iconEmoji: status === "SKIPPED" ? "⏭️" : "✅",
        },
        fields: "title,iconEmoji",
      },
    };
    const requestTitleOnly = {
      updateDocumentTabProperties: {
        tabProperties: {
          tabId,
          title: nextTitle,
        },
        fields: "title",
      },
    };

    try {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [requestWithEmoji] },
      });
    } catch {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests: [requestTitleOnly] },
      });
    }
    return nextTitle;
  } catch (error) {
    console.warn(
      `⚠️ Could not rename Google Doc tab ${tabId} to "${nextTitle}": ${error.message || error}. Enable Google Docs API and share the Doc as Editor with the service account.`,
    );
    return null;
  }
};
