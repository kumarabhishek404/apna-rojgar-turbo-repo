"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageProvider";
import { useConfirmedAdmin } from "@/lib/useConfirmedAdmin";
import { rojgarTipsArticlePath } from "@/constants";
import {
  BlogPost,
  fetchPublishedBlogs,
  formatBlogDate,
} from "@/lib/blogs";

export default function BlogsListPage() {
  const { t } = useLanguage();
  const { showAdminUi } = useConfirmedAdmin();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    fetchPublishedBlogs({ page, limit: 12, search })
      .then((data) => {
        if (!mounted) return;
        setBlogs(data.blogs || []);
        setPages(data.pagination?.pages || 1);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load blogs");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [page, search]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#eef3ff] via-white to-[#f8fafc] px-4 pb-16 pt-20 md:pt-24 lg:pt-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-[#22409a]/80">
                Apna Rojgar
              </p>
              <h1 className="mt-1 text-3xl font-bold text-[#16264f] md:text-4xl">
                {t("blogs", "Rojgar Tips")}
              </h1>
              <p className="mt-2 max-w-2xl text-slate-600">
                {t(
                  "blogsSubtitle",
                  "Tips, updates, and stories for workers, employers, and mediators.",
                )}
              </p>
            </div>
            {showAdminUi ? (
              <Link
                href="/admin/blogs"
                className="rounded-xl bg-[#22409a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1a3278]"
              >
                {t("manageBlogs", "Manage blogs")}
              </Link>
            ) : null}
          </div>

          <div className="mb-6">
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder={t("searchBlogs", "Search rojgar tips...")}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none ring-[#22409a] focus:ring-2"
            />
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">{t("loading", "Loading...")}</p>
          ) : error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : blogs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-slate-500">
              {t("noBlogsYet", "No articles published yet. Check back soon.")}
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {blogs.map((blog) => (
                <Link
                  key={blog._id}
                  href={rojgarTipsArticlePath(blog.slug)}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative">
                    {blog.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={blog.coverImageUrl}
                        alt=""
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-40 items-end bg-gradient-to-br from-[#22409a] to-[#3b6bd4] p-4">
                        <span className="text-sm font-semibold text-white/90">
                          Apna Rojgar
                        </span>
                      </div>
                    )}
                    <div className="pointer-events-none absolute right-2 top-2 flex flex-col gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        <Heart size={12} className="shrink-0 fill-white/90" />
                        {blog.likeCount || 0}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        <MessageCircle size={12} className="shrink-0" />
                        {blog.commentCount || 0}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        <Share2 size={12} className="shrink-0" />
                        {blog.shareCount || 0}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      {formatBlogDate(blog.publishedAt || blog.createdAt)}
                      {blog.authorName ? ` · ${blog.authorName}` : ""}
                    </p>
                    <h2 className="text-lg font-bold text-[#16264f] group-hover:text-[#22409a]">
                      {blog.title}
                    </h2>
                    <p className="line-clamp-3 text-sm text-slate-600">
                      {blog.excerpt || blog.content}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {pages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm text-slate-600">
                {page} / {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
