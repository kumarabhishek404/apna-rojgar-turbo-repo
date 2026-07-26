"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/auth";
import { useAdminAccess } from "@/components/webapp/admin/useAdminAccess";
import { BlogPost, formatBlogDate } from "@/lib/blogs";
import { ROJGAR_TIPS_PATH, rojgarTipsArticlePath } from "@/constants";
import Link from "next/link";

type BlogFormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  authorName: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

const emptyForm: BlogFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  authorName: "Apna Rojgar",
  status: "PUBLISHED",
};

export default function AdminBlogsPage() {
  const access = useAdminAccess();
  const searchParams = useSearchParams();
  const editIdFromQuery = searchParams.get("edit") || "";

  const [rows, setRows] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const loadBlogs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "50");
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await apiRequest<{ data: { blogs: BlogPost[] } }>(
        `/admin/blogs?${params.toString()}`,
      );
      setRows(res?.data?.blogs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (access !== "allowed") return;
    void loadBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [access, search, statusFilter]);

  useEffect(() => {
    if (access !== "allowed" || !editIdFromQuery) return;
    let mounted = true;
    apiRequest<{ data: BlogPost }>(`/admin/blogs/${editIdFromQuery}`)
      .then((res) => {
        if (!mounted || !res?.data) return;
        const blog = res.data;
        setEditingId(blog._id);
        setForm({
          title: blog.title || "",
          slug: blog.slug || "",
          excerpt: blog.excerpt || "",
          content: blog.content || "",
          coverImageUrl: blog.coverImageUrl || "",
          authorName: blog.authorName || "Apna Rojgar",
          status: (blog.status as BlogFormState["status"]) || "PUBLISHED",
        });
        setShowForm(true);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [access, editIdFromQuery]);

  const heading = useMemo(
    () => (editingId ? "Edit blog" : "Add new blog"),
    [editingId],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (editingId) {
        await apiRequest(`/admin/blogs/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
        setMessage("Blog updated");
      } else {
        await apiRequest(`/admin/blogs`, {
          method: "POST",
          body: JSON.stringify(form),
        });
        setMessage("Blog created");
      }
      resetForm();
      await loadBlogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (blog: BlogPost) => {
    setEditingId(blog._id);
    setForm({
      title: blog.title || "",
      slug: blog.slug || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      coverImageUrl: blog.coverImageUrl || "",
      authorName: blog.authorName || "Apna Rojgar",
      status: (blog.status as BlogFormState["status"]) || "DRAFT",
    });
    setShowForm(true);
    setMessage("");
    setError("");
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this blog permanently?")) return;
    setError("");
    try {
      await apiRequest(`/admin/blogs/${id}`, { method: "DELETE" });
      setMessage("Blog deleted");
      if (editingId === id) resetForm();
      await loadBlogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const onImportNow = async () => {
    setImporting(true);
    setError("");
    setMessage("");
    try {
      const res = await apiRequest<{ data?: { message?: string; reason?: string } }>(
        `/admin/blogs/import/google-run`,
        { method: "POST" },
      );
      setMessage(res?.data?.message || res?.data?.reason || "Import finished");
      await loadBlogs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  if (access === "loading") {
    return <section className="rounded-2xl bg-white p-6">Checking admin access...</section>;
  }
  if (access === "denied") return null;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-[#1e3f8a] to-[#22409a] p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Blogs</h1>
        <p className="mt-1 text-sm text-blue-100">
          Admin only — create, edit, delete blogs, or publish the next Google Doc
          tab (renamed to &quot;… - Uploaded&quot; after publish).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setShowForm(true);
            setMessage("");
            setError("");
          }}
          className="rounded-xl bg-[#22409a] px-4 py-2 text-sm font-semibold text-white"
        >
          Add blog
        </button>
        <button
          type="button"
          onClick={() => void onImportNow()}
          disabled={importing}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          {importing ? "Importing..." : "Publish next Google Doc tab now"}
        </button>
        <Link
          href={ROJGAR_TIPS_PATH}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          View public articles
        </Link>
      </div>

      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h2 className="text-lg font-bold text-[#16264f]">{heading}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Title</span>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Slug (optional)</span>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="auto from title"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Author</span>
              <input
                value={form.authorName}
                onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-600">Status</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as BlogFormState["status"],
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-600">Cover image URL</span>
              <input
                value={form.coverImageUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coverImageUrl: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-600">Excerpt</span>
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-600">Content</span>
              <textarea
                required
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={12}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#22409a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update blog" : "Create blog"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title / slug"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm md:col-span-2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading blogs...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No blogs yet.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((blog) => (
              <article
                key={blog._id}
                className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[#16264f]">
                    {blog.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {blog.status} · {formatBlogDate(blog.publishedAt || blog.createdAt)} · /
                    {blog.slug}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={rojgarTipsArticlePath(blog.slug)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    View
                  </Link>
                  <button
                    type="button"
                    onClick={() => onEdit(blog)}
                    className="rounded-lg border border-[#22409a]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#22409a]"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(blog._id)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
