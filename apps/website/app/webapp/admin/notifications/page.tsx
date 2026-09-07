"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { List } from "lucide-react";
import { apiRequest } from "@/lib/auth";
import { useAdminAccess } from "@/components/webapp/admin/useAdminAccess";
import InfiniteScrollSentinel from "@/components/webapp/admin/InfiniteScrollSentinel";
import {
  ACTIVE_NOTIFICATIONS,
  type ActiveNotificationItem,
} from "@/lib/activeNotifications";

type AdminNotification = {
  _id: string;
  title?: string;
  body?: string;
  category?: string;
  type?: string;
  status?: "PENDING" | "SENT" | "FAILED";
  priority?: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  source?: "EVENT" | "CRON" | "DEFERRED" | "ADMIN";
  read?: boolean;
  openedAt?: string;
  scheduledFor?: string;
  failureReason?: string;
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
    opened: 0,
    sentLast24h: 0,
    optedOutUsers: 0,
    deliveryRate: 0,
    openRate: 0,
    duplicateSkipsLast24h: 0,
    capSkipsLast24h: 0,
    optOutsLast24h: 0,
  });
  const limit = 20;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [readFilter, setReadFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showActiveCatalog, setShowActiveCatalog] = useState(false);

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
        opened?: number;
        sentLast24h?: number;
        optedOutUsers?: number;
        deliveryRate?: number;
        openRate?: number;
        duplicateSkipsLast24h?: number;
        capSkipsLast24h?: number;
        optOutsLast24h?: number;
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
          opened: res?.stats?.opened || 0,
          sentLast24h: res?.stats?.sentLast24h || 0,
          optedOutUsers: res?.stats?.optedOutUsers || 0,
          deliveryRate: res?.stats?.deliveryRate || 0,
          openRate: res?.stats?.openRate || 0,
          duplicateSkipsLast24h: res?.stats?.duplicateSkipsLast24h || 0,
          capSkipsLast24h: res?.stats?.capSkipsLast24h || 0,
          optOutsLast24h: res?.stats?.optOutsLast24h || 0,
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="mt-1 text-sm text-cyan-100">
              Notification delivery overview from backend `Notification` model.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowActiveCatalog(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/25"
          >
            <List className="h-4 w-4" />
            Active notifications
          </button>
        </div>
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
              <option value="TRANSACTIONAL">TRANSACTIONAL</option>
              <option value="REMINDER">REMINDER</option>
              <option value="DISCOVERY">DISCOVERY</option>
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
        <Stat title="Sent (24h)" value={stats.sentLast24h} />
        <Stat title="Delivery rate" value={`${stats.deliveryRate}%`} />
        <Stat title="Open rate" value={`${stats.openRate}%`} />
        <Stat title="Opened" value={stats.opened} />
        <Stat title="Users opted out" value={stats.optedOutUsers} />
        <Stat title="Duplicates blocked (24h)" value={stats.duplicateSkipsLast24h} />
        <Stat title="Daily-cap blocks (24h)" value={stats.capSkipsLast24h} />
        <Stat title="Opt-outs (24h)" value={stats.optOutsLast24h} />
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
                  <span className="rounded bg-white px-2 py-1 font-semibold text-slate-700">{n.priority || "NORMAL"}</span>
                  <span className="rounded bg-white px-2 py-1 font-semibold text-slate-700">{n.source || "EVENT"}</span>
                  <span className="rounded bg-white px-2 py-1 font-semibold text-slate-700">{n.read ? "READ" : "UNREAD"}</span>
                  {n.openedAt ? (
                    <span className="rounded bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">OPENED</span>
                  ) : null}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-slate-800">{n.title || "-"}</h3>
                <p className="mt-1 text-sm text-slate-600">{n.body || "-"}</p>
                <p className="mt-2 text-xs text-slate-500">
                  User: {n.userId?.name || "-"} {n.userId?.mobile ? `(${n.userId.mobile})` : ""}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : "-"}
                </p>
                {n.scheduledFor ? (
                  <p className="mt-1 text-xs text-amber-700">
                    Scheduled: {new Date(n.scheduledFor).toLocaleString()}
                  </p>
                ) : null}
                {n.failureReason ? (
                  <p className="mt-1 text-xs text-red-600">Failure: {n.failureReason}</p>
                ) : null}
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

      {showActiveCatalog ? (
        <ActiveNotificationsModal onClose={() => setShowActiveCatalog(false)} />
      ) : null}
    </section>
  );
}

function ActiveNotificationsModal({ onClose }: { onClose: () => void }) {
  const grouped = useMemo(() => {
    return ACTIVE_NOTIFICATIONS.reduce<Record<string, ActiveNotificationItem[]>>(
      (acc, item) => {
        (acc[item.category] ||= []).push(item);
        return acc;
      },
      {},
    );
  }, []);

  const categoryOrder = [
    "Reminder",
    "Promo",
    "Discovery",
    "Transactional",
    "System",
  ] as const;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-3"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="active-notifications-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="active-notifications-title"
              className="text-lg font-bold text-slate-900"
            >
              Active notifications
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {ACTIVE_NOTIFICATIONS.length} notification types currently enabled
              in the app.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {categoryOrder.map((category) => {
            const items = grouped[category];
            if (!items?.length) return null;
            return (
              <section key={category}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {category} ({items.length})
                </h3>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {items.map((item) => (
                    <li
                      key={item.key}
                      className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500">{item.audience}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-medium text-cyan-800">
                        {item.trigger}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-cyan-700">{value}</p>
    </div>
  );
}

