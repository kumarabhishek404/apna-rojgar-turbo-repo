"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { useAdminAccess } from "@/components/webapp/admin/useAdminAccess";
import InfiniteScrollSentinel from "@/components/webapp/admin/InfiniteScrollSentinel";

type AppEvent = {
  _id: string;
  eventName?: string;
  platform?: "web" | "android" | "ios";
  sessionId?: string;
  serverTimestamp?: string;
  userId?: { name?: string; mobile?: string };
};

export default function AdminAnalyticsPage() {
  const access = useAdminAccess();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    web: 0,
    android: 0,
    ios: 0,
  });
  const limit = 25;
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("ALL");
  const [eventName, setEventName] = useState("");

  useEffect(() => {
    setEvents([]);
    setPages(1);
    setTotal(0);
    setPage(1);
  }, [search, platform, eventName]);

  useEffect(() => {
    if (access !== "allowed") return;
    setLoading(page === 1);
    setLoadingMore(page > 1);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (search.trim()) params.set("search", search.trim());
    if (platform !== "ALL") params.set("platform", platform.toLowerCase());
    if (eventName.trim()) params.set("eventName", eventName.trim());

    apiRequest<{
      data: AppEvent[];
      stats?: { total?: number; web?: number; android?: number; ios?: number };
      pagination?: { total?: number; page?: number; pages?: number };
    }>(`/admin/analytics-events?${params.toString()}`)
      .then((res) => {
        setEvents((prev) => (page === 1 ? res?.data || [] : [...prev, ...(res?.data || [])]));
        setPages(res?.pagination?.pages || 1);
        setTotal(res?.pagination?.total || 0);
        setStats({
          total: res?.stats?.total || 0,
          web: res?.stats?.web || 0,
          android: res?.stats?.android || 0,
          ios: res?.stats?.ios || 0,
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load analytics events"))
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [access, page, search, platform, eventName]);

  const canLoadMore = page < pages;
  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !canLoadMore) return;
    setPage((prev) => prev + 1);
  }, [canLoadMore, loading, loadingMore]);

  if (access === "loading") return <section className="rounded-2xl bg-white p-6">Checking admin access...</section>;
  if (access === "denied") return null;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-600 p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-indigo-100">Usage events from backend `app_events` collection.</p>
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
              placeholder="Event name or session id"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            >
              <option value="ALL">All</option>
              <option value="web">web</option>
              <option value="android">android</option>
              <option value="ios">ios</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Event name
            </label>
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Exact event name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none ring-[#22409a] focus:ring-2"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat title="Total events" value={stats.total} />
        <Stat title="Web events" value={stats.web} />
        <Stat title="Android events" value={stats.android} />
        <Stat title="iOS events" value={stats.ios} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? <p className="p-4 text-sm text-slate-500">Loading analytics events...</p> : null}
        {error ? <p className="p-4 text-sm text-red-600">{error}</p> : null}
        {!loading && !error ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Platform</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event._id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{event.eventName || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{event.platform || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{event.sessionId || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {event.userId?.name || "-"} {event.userId?.mobile ? `(${event.userId.mobile})` : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {event.serverTimestamp ? new Date(event.serverTimestamp).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        Loaded <span className="font-semibold text-slate-800">{events.length}</span>
        {total ? ` of ${total}` : ""} events
      </div>
      {loadingMore ? (
        <p className="text-center text-sm text-slate-500">Loading more events...</p>
      ) : null}
      <InfiniteScrollSentinel
        enabled={canLoadMore && !loading}
        loading={loadingMore}
        onLoadMore={handleLoadMore}
      />
      {!canLoadMore && events.length > 0 ? (
        <p className="text-center text-xs text-slate-500">You reached the end of events list.</p>
      ) : null}
    </section>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-indigo-700">{value}</p>
    </div>
  );
}

