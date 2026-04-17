"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { useAdminAccess } from "@/components/webapp/admin/useAdminAccess";
import InfiniteScrollSentinel from "@/components/webapp/admin/InfiniteScrollSentinel";

type ErrorLog = {
  _id: string;
  message?: string;
  apiRoute?: string;
  method?: string;
  statusCode?: number;
  createdAt?: string;
  user?: { name?: string; mobile?: string };
};

export default function AdminErrorLogsPage() {
  const access = useAdminAccess();
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("ALL");
  const [statusCode, setStatusCode] = useState("ALL");

  useEffect(() => {
    setLogs([]);
    setPages(1);
    setTotal(0);
    setPage(1);
  }, [search, method, statusCode]);

  useEffect(() => {
    if (access !== "allowed") return;
    setLoading(page === 1);
    setLoadingMore(page > 1);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search.trim()) params.set("search", search.trim());
    if (method !== "ALL") params.set("method", method);
    if (statusCode !== "ALL") params.set("statusCode", statusCode);

    apiRequest<{
      data: ErrorLog[];
      pagination?: { total?: number; page?: number; pages?: number };
    }>(`/admin/error-logs?${params.toString()}`)
      .then((res) => {
        setLogs((prev) => (page === 1 ? res?.data || [] : [...prev, ...(res?.data || [])]));
        setPages(res?.pagination?.pages || 1);
        setTotal(res?.pagination?.total || 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load error logs"))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [access, page, search, method, statusCode]);

  const canLoadMore = page < pages;
  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !canLoadMore) return;
    setPage((prev) => prev + 1);
  }, [canLoadMore, loading, loadingMore]);

  if (access === "loading") return <section className="rounded-2xl bg-white p-6">Checking admin access...</section>;
  if (access === "denied") return null;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-rose-700 to-orange-600 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Error Logs</h1>
        <p className="mt-1 text-sm text-rose-100">System errors from backend `ErrorLog` model.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Message, route, method"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">All</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status code
            </label>
            <select
              value={statusCode}
              onChange={(e) => setStatusCode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">All</option>
              <option value="400">400</option>
              <option value="401">401</option>
              <option value="403">403</option>
              <option value="404">404</option>
              <option value="500">500</option>
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="p-4 text-sm text-slate-500">Loading error logs...</p> : null}
        {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}
        {!loading && !error ? (
          <div className="space-y-3 p-4">
            {logs.map((log) => (
              <div key={log._id} className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded bg-rose-100 px-2 py-1 text-rose-700">
                    {(log.method || "NA").toUpperCase()}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-1 text-slate-700">
                    Status: {log.statusCode ?? "-"}
                  </span>
                  <span className="text-slate-500">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : "-"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-800">{log.message || "Unknown error"}</p>
                <p className="mt-1 text-xs text-slate-600">Route: {log.apiRoute || "-"}</p>
                <p className="mt-1 text-xs text-slate-600">
                  User: {log.user?.name || "-"} {log.user?.mobile ? `(${log.user.mobile})` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        Loaded <span className="font-semibold text-slate-800">{logs.length}</span>
        {total ? ` of ${total}` : ""} logs
      </div>
      {loadingMore ? (
        <p className="text-center text-sm text-slate-500">Loading more logs...</p>
      ) : null}
      <InfiniteScrollSentinel
        enabled={canLoadMore && !loading}
        loading={loadingMore}
        onLoadMore={handleLoadMore}
      />
      {!canLoadMore && logs.length > 0 ? (
        <p className="text-center text-xs text-slate-500">You reached the end of logs list.</p>
      ) : null}
    </section>
  );
}

