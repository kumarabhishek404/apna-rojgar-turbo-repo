"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/auth";
import { useAdminAccess } from "@/components/webapp/admin/useAdminAccess";
import InfiniteScrollSentinel from "@/components/webapp/admin/InfiniteScrollSentinel";
import AnalyticsKpiStrip from "@/components/webapp/admin/analytics/AnalyticsKpiStrip";
import SessionsAreaChart from "@/components/webapp/admin/analytics/SessionsAreaChart";
import ViewsLineChart from "@/components/webapp/admin/analytics/ViewsLineChart";
import CallsColumnChart from "@/components/webapp/admin/analytics/CallsColumnChart";
import ConversionsBarChart from "@/components/webapp/admin/analytics/ConversionsBarChart";
import CategoryDonutChart from "@/components/webapp/admin/analytics/CategoryDonutChart";
import PlatformDonutChart from "@/components/webapp/admin/analytics/PlatformDonutChart";
import ActivityHeatmapChart from "@/components/webapp/admin/analytics/ActivityHeatmapChart";
import type { AnalyticsSummaryData } from "@/components/webapp/admin/analytics/types";

type AppEvent = {
  _id: string;
  eventName?: string;
  platform?: "web" | "android" | "ios";
  sessionId?: string;
  serverTimestamp?: string;
  userId?: { name?: string; mobile?: string };
};

type RangePreset = 7 | 30 | 90;

function rangeFromPreset(days: RangePreset) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function AdminAnalyticsPage() {
  const access = useAdminAccess();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("ALL");
  const [eventName, setEventName] = useState("");
  const [rangeDays, setRangeDays] = useState<RangePreset>(30);

  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const chartRange = useMemo(() => rangeFromPreset(rangeDays), [rangeDays]);

  useEffect(() => {
    setEvents([]);
    setPages(1);
    setTotal(0);
    setPage(1);
  }, [search, platform, eventName]);

  useEffect(() => {
    if (access !== "allowed") return;
    setSummaryLoading(true);
    setSummaryError("");
    const params = new URLSearchParams();
    params.set("from", chartRange.from);
    params.set("to", chartRange.to);
    if (platform !== "ALL") params.set("platform", platform.toLowerCase());

    apiRequest<{ data?: AnalyticsSummaryData }>(
      `/admin/analytics-summary?${params.toString()}`,
    )
      .then((res) => setSummary(res?.data || null))
      .catch((e) =>
        setSummaryError(
          e instanceof Error ? e.message : "Failed to load analytics summary",
        ),
      )
      .finally(() => setSummaryLoading(false));
  }, [access, chartRange.from, chartRange.to, platform]);

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
      pagination?: { total?: number; page?: number; pages?: number };
    }>(`/admin/analytics-events?${params.toString()}`)
      .then((res) => {
        setEvents((prev) =>
          page === 1 ? res?.data || [] : [...prev, ...(res?.data || [])],
        );
        setPages(res?.pagination?.pages || 1);
        setTotal(res?.pagination?.total || 0);
      })
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Failed to load analytics events",
        ),
      )
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

  if (access === "loading") {
    return (
      <section className="rounded-2xl bg-white p-6">
        Checking admin access...
      </section>
    );
  }
  if (access === "denied") return null;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-[#162b6b] to-[#22409a] p-6 text-white shadow-sm">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-blue-100">
          Charts and event stream from `app_events` — sessions, views, calls,
          and conversions.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date range
            </label>
            <div className="flex gap-2">
              {([7, 30, 90] as RangePreset[]).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRangeDays(days)}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
                    rangeDays === days
                      ? "bg-[#22409a] text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
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
        </div>
      </div>

      {summaryError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {summaryError}
        </p>
      ) : null}

      <AnalyticsKpiStrip kpis={summary?.kpis} loading={summaryLoading} />

      <div className="grid gap-4 md:grid-cols-2">
        <SessionsAreaChart
          data={summary?.dailySessions}
          loading={summaryLoading}
        />
        <ViewsLineChart data={summary?.dailyViews} loading={summaryLoading} />
        <CallsColumnChart data={summary?.dailyCalls} loading={summaryLoading} />
        <CategoryDonutChart
          data={summary?.byCategory}
          loading={summaryLoading}
        />
        <PlatformDonutChart
          data={summary?.byPlatform}
          loading={summaryLoading}
        />
        <ConversionsBarChart
          data={summary?.dailyConversions}
          loading={summaryLoading}
        />
        <ActivityHeatmapChart
          data={summary?.byHourWeekday}
          loading={summaryLoading}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">
          Event stream
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading analytics events...</p>
        ) : null}
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
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {event.eventName || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {event.platform || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {event.sessionId || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {event.userId?.name || "-"}{" "}
                      {event.userId?.mobile
                        ? `(${event.userId.mobile})`
                        : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {event.serverTimestamp
                        ? new Date(event.serverTimestamp).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        Loaded{" "}
        <span className="font-semibold text-slate-800">{events.length}</span>
        {total ? ` of ${total}` : ""} events
      </div>
      {loadingMore ? (
        <p className="text-center text-sm text-slate-500">
          Loading more events...
        </p>
      ) : null}
      <InfiniteScrollSentinel
        enabled={canLoadMore && !loading}
        loading={loadingMore}
        onLoadMore={handleLoadMore}
      />
      {!canLoadMore && events.length > 0 ? (
        <p className="text-center text-xs text-slate-500">
          You reached the end of events list.
        </p>
      ) : null}
    </section>
  );
}
