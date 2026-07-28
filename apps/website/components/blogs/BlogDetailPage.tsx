"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageProvider";
import { STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID } from "@/lib/staticExportDynamicRoutes";
import {
  BlogPost,
  fetchPublishedBlog,
  formatBlogDate,
} from "@/lib/blogs";
import {
  linkifyBrandMentions,
  linkifyBrandMentionsInHtml,
} from "@/lib/blogBrandLinks";
import { ROJGAR_TIPS_PATH } from "@/constants";
import BlogEngagement from "@/components/blogs/BlogEngagement";
import { useConfirmedAdmin } from "@/lib/useConfirmedAdmin";

function renderBlogBody(content: string) {
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  if (looksLikeHtml) {
    return (
      <div
        className="prose prose-slate max-w-none prose-headings:text-[#16264f] prose-a:text-[#22409a]"
        dangerouslySetInnerHTML={{
          __html: linkifyBrandMentionsInHtml(content),
        }}
      />
    );
  }

  return (
    <div className="space-y-4 text-[1.05rem] leading-8 text-slate-700">
      {content.split(/\n{2,}/).map((para, index) => (
        <p key={index} className="whitespace-pre-wrap">
          {linkifyBrandMentions(para)}
        </p>
      ))}
    </div>
  );
}

function resolveSlugFromPath(pathname: string | null, fallback: string) {
  const fromPath = (pathname || "").split("/").filter(Boolean).pop() || "";
  if (fromPath && fromPath !== STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) {
    return fromPath;
  }
  if (fallback && fallback !== STATIC_EXPORT_DYNAMIC_PLACEHOLDER_ID) {
    return fallback;
  }
  return "";
}

export default function BlogDetailPage({ slug: slugProp }: { slug: string }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { showAdminUi } = useConfirmedAdmin();
  // Prefer the browser URL so Render rewrites to __static.html still load the right post.
  const slug = useMemo(
    () => resolveSlugFromPath(pathname, slugProp),
    [pathname, slugProp],
  );
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7525/ingest/43a9946a-cc57-4e2a-9a4b-4a42e3195227", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d31d2b",
      },
      body: JSON.stringify({
        sessionId: "d31d2b",
        runId: "post-fix",
        hypothesisId: "C",
        location: "BlogDetailPage.tsx:fetch",
        message: "blog detail fetch start",
        data: { slug, pathname, slugProp },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (!slug) {
      setLoading(false);
      setError("Blog not found");
      return;
    }

    let mounted = true;
    setLoading(true);
    setError("");
    setBlog(null);
    fetchPublishedBlog(slug)
      .then((data) => {
        if (!mounted) return;
        // #region agent log
        fetch(
          "http://127.0.0.1:7525/ingest/43a9946a-cc57-4e2a-9a4b-4a42e3195227",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "d31d2b",
            },
            body: JSON.stringify({
              sessionId: "d31d2b",
              runId: "post-fix",
              hypothesisId: "D",
              location: "BlogDetailPage.tsx:fetchSuccess",
              message: "blog detail fetch ok",
              data: { slug, title: data?.title || null },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion
        setBlog(data);
      })
      .catch((e) => {
        if (!mounted) return;
        // #region agent log
        fetch(
          "http://127.0.0.1:7525/ingest/43a9946a-cc57-4e2a-9a4b-4a42e3195227",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "d31d2b",
            },
            body: JSON.stringify({
              sessionId: "d31d2b",
              runId: "post-fix",
              hypothesisId: "D",
              location: "BlogDetailPage.tsx:fetchError",
              message: "blog detail fetch failed",
              data: {
                slug,
                error: e instanceof Error ? e.message : String(e),
              },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion
        setError(e instanceof Error ? e.message : "Failed to load blog");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#eef3ff] via-white to-[#f8fafc] px-4 pb-16 pt-20 md:pt-24 lg:pt-28">
        <article className="mx-auto max-w-3xl">
          {loading ? (
            <p className="text-sm text-slate-500">{t("loading", "Loading...")}</p>
          ) : error || !blog ? (
            <>
              <div className="mb-6">
                <Link
                  href={ROJGAR_TIPS_PATH}
                  className="text-sm font-semibold text-[#22409a] hover:underline"
                >
                  ← {t("allBlogs", "All rojgar tips")}
                </Link>
              </div>
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error || t("blogNotFound", "Blog not found")}
              </p>
            </>
          ) : (
            <BlogEngagement
              blogId={blog._id}
              slug={blog.slug}
              title={blog.title}
              initialLikeCount={blog.likeCount || 0}
              initialCommentCount={blog.commentCount || 0}
              initialShareCount={blog.shareCount || 0}
              topBar={
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={ROJGAR_TIPS_PATH}
                    className="text-sm font-semibold text-[#22409a] hover:underline"
                  >
                    ← {t("allBlogs", "All rojgar tips")}
                  </Link>
                  {showAdminUi ? (
                    <Link
                      href={`/admin/blogs?edit=${blog._id}`}
                      className="rounded-lg border border-[#22409a]/30 bg-white px-3 py-1.5 text-sm font-semibold text-[#22409a]"
                    >
                      {t("editBlog", "Edit blog")}
                    </Link>
                  ) : null}
                </div>
              }
            >
              {blog.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blog.coverImageUrl}
                  alt=""
                  className="mb-6 h-auto w-full rounded-2xl object-contain"
                />
              ) : null}
              <p className="text-sm font-medium text-slate-500">
                {formatBlogDate(blog.publishedAt || blog.createdAt)}
                {blog.authorName ? ` · ${blog.authorName}` : ""}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#16264f] md:text-4xl">
                {blog.title}
              </h1>
              {blog.excerpt ? (
                <p className="mt-4 text-lg text-slate-600">
                  {linkifyBrandMentions(blog.excerpt)}
                </p>
              ) : null}
              <div className="mt-8">{renderBlogBody(blog.content)}</div>
            </BlogEngagement>
          )}
        </article>
      </main>
    </>
  );
}
