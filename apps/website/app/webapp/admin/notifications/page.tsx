"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { useAdminAccess } from "@/components/webapp/admin/useAdminAccess";
import InfiniteScrollSentinel from "@/components/webapp/admin/InfiniteScrollSentinel";

type AdminNotification = {
  _id: string;
  title?: string;
  body?: string;
  category?: string;
  type?: string;
  status?: "PENDING" | "SENT" | "FAILED";
  read?: boolean;
  createdAt?: string;
  userId?: { name?: string; mobile?: string; role?: string };
};

export default function AdminNotificationsPage() {
  const access = useAdminAccess();
  const [rows, setRows] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    unread: 0,
  });
  const limit = 20;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [readFilter, setReadFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    setRows([]);
    setPages(1);
    setTotal(0);
    setPage(1);
  }, [search, statusFilter, readFilter, categoryFilter]);

  useEffect(() => {
    if (access !== "allowed") return;
    setLoading(page === 1);
    setLoadingMore(page > 1);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search.trim()) params.set("search", search.trim());
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (readFilter !== "ALL") params.set("read", readFilter);
    if (categoryFilter !== "ALL") params.set("category", categoryFilter);

    apiRequest<{
      data: AdminNotification[];
      stats?: {
        total?: number;
        sent?: number;
        pending?: number;
        failed?: number;
        unread?: number;
      };
      pagination?: { total?: number; page?: number; pages?: number };
    }>(`/admin/notifications?${params.toString()}`)
      .then((res) => {
        setRows((prev) => (page === 1 ? res?.data || [] : [...prev, ...(res?.data || [])]));
        setPages(res?.pagination?.pages || 1);
        setTotal(res?.pagination?.total || 0);
        setStats({
          total: res?.stats?.total || 0,
          sent: res?.stats?.sent || 0,
          pending: res?.stats?.pending || 0,
          failed: res?.stats?.failed || 0,
          unread: res?.stats?.unread || 0,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load notifications"))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [access, page, search, statusFilter, readFilter, categoryFilter]);

  const canLoadMore = page < pages;
  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !canLoadMore) return;
    setPage((prev) => prev + 1);
  }, [canLoadMore, loading, loadingMore]);

  if (access === "loading") return <section className="rounded-2xl bg-white p-6">Checking admin access...</section>;
  if (access === "denied") return null;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-cyan-700 to-blue-600 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="mt-1 text-sm text-cyan-100">Notification delivery overview from backend `Notification` model.</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, body, type"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">All</option>
              <option value="SENT">SENT</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Read
            </label>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">All</option>
              <option value="true">Read</option>
              <option value="false">Unread</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">All</option>
              <option value="SYSTEM">SYSTEM</option>
              <option value="MY_SERVICES">MY_SERVICES</option>
              <option value="LIVE_SERVICE">LIVE_SERVICE</option>
              <option value="SPECIFIC_SERVICE">SPECIFIC_SERVICE</option>
              <option value="ALL_USERS">ALL_USERS</option>
              <option value="SPECIFIC_USER">SPECIFIC_USER</option>
              <option value="BOOKING_REQUEST">BOOKING_REQUEST</option>
              <option value="PROFILE">PROFILE</option>
              <option value="TEAM_REQUEST">TEAM_REQUEST</option>
              <option value="EMPLOYER">EMPLOYER</option>
            </select>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Sent" value={stats.sent} />
        <Stat title="Pending" value={stats.pending} />
        <Stat title="Failed" value={stats.failed} />
        <Stat title="Unread" value={stats.unread} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="p-4 text-sm text-slate-500">Loading notifications...</p> : null}
        {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}
        {!loading && !error ? (
          <div className="space-y-3 p-4">
            {rows.map((n) => (
              <article key={n._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-white px-2 py-1 font-semibold text-slate-700">{n.category || "SYSTEM"}</span>
                  <span className="rounded bg-white px-2 py-1 font-semibold text-slate-700">{n.type || "-"}</span>
                  <span className="rounded bg-white px-2 py-1 font-semibold text-slate-700">{n.status || "-"}</span>
                  <span className="rounded bg-white px-2 py-1 font-semibold text-slate-700">{n.read ? "READ" : "UNREAD"}</span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-slate-800">{n.title || "-"}</h3>
                <p className="mt-1 text-sm text-slate-600">{n.body || "-"}</p>
                <p className="mt-2 text-xs text-slate-500">
                  User: {n.userId?.name || "-"} {n.userId?.mobile ? `(${n.userId.mobile})` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : "-"}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        Loaded <span className="font-semibold text-slate-800">{rows.length}</span>
        {total ? ` of ${total}` : ""} notifications
      </div>
      {loadingMore ? (
        <p className="text-center text-sm text-slate-500">Loading more notifications...</p>
      ) : null}
      <InfiniteScrollSentinel
        enabled={canLoadMore && !loading}
        loading={loadingMore}
        onLoadMore={handleLoadMore}
      />
      {!canLoadMore && rows.length > 0 ? (
        <p className="text-center text-xs text-slate-500">
          You reached the end of notifications list.
        </p>
      ) : null}
    </section>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-cyan-700">{value}</p>
    </div>
  );
}

