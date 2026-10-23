import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import { useFilterPage } from "@/lib/paging";
import { formatWhen, shortDate, type AnalyticsSummary, type AppEvent } from "@/lib/types";
import {
  ActivityHeatmap,
  InteractiveBarChart,
  InteractiveDonut,
  InteractiveLineChart,
  chartColors,
  type ChartSeries,
} from "@/components/charts";
import {
  Banner,
  ChoiceRow,
  EmptyState,
  Field,
  LoadingBlock,
  PageTitle,
  StatGrid,
  contentWidth,
} from "@/components/ui";

type RangePreset = 7 | 30 | 90 | "all";

const platforms = [
  { value: "ALL", label: "All" },
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
  { value: "web", label: "Web" },
];

const categoryEvent: Record<string, string> = {
  sessions: "session_start",
  views: "service_view",
  calls: "call_tap",
  conversions: "service_apply_success",
};

function seriesFrom(
  rows: Array<Record<string, string | number>> | undefined,
  keys: Array<{ key: string; name: string; color: string }>,
): { labels: string[]; series: ChartSeries[] } {
  const safe = rows || [];
  return {
    labels: safe.map((row) => shortDate(String(row.date || ""))),
    series: keys.map((item) => ({
      ...item,
      values: safe.map((row) => Number(row[item.key] || 0)),
    })),
  };
}

export default function AnalyticsScreen() {
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<RangePreset>(30);
  const [platform, setPlatform] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [eventName, setEventName] = useState("");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setSummaryLoading(true);
    setSummaryError("");
    const params = new URLSearchParams();
    params.set("to", new Date().toISOString());
    if (range === "all") params.set("range", "all");
    else params.set("from", new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString());
    if (platform !== "ALL") params.set("platform", platform);
    apiRequest<{ data?: AnalyticsSummary }>(`/admin/analytics-summary?${params}`)
      .then((res) => {
        if (!cancelled) setSummary(res.data || null);
      })
      .catch((err) => {
        if (!cancelled) setSummaryError(err instanceof Error ? err.message : "Failed to load analytics");
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, platform]);

  const filterKey = [debounced, platform, eventName].join("|");
  const { page, setPage, epoch } = useFilterPage(filterKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(page === 1);
    setLoadingMore(page > 1);
    setError("");
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "25");
    if (debounced) params.set("search", debounced);
    if (platform !== "ALL") params.set("platform", platform);
    if (eventName.trim()) params.set("eventName", eventName.trim());
    apiRequest<{ data?: AppEvent[]; pagination?: { pages?: number; total?: number } }>(
      `/admin/analytics-events?${params}`,
    )
      .then((res) => {
        if (cancelled) return;
        const next = res.data || [];
        setEvents((prev) => (page === 1 ? next : [...prev, ...next]));
        setPages(res.pagination?.pages || 1);
        setTotal(res.pagination?.total || 0);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load events");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page, epoch]);

  const sessions = useMemo(
    () =>
      seriesFrom(summary?.dailySessions, [
        { key: "session_start", name: "Session start", color: chartColors.primary },
        { key: "app_foreground", name: "App open", color: chartColors.light },
        { key: "app_background", name: "App close", color: chartColors.slate },
      ]),
    [summary],
  );
  const views = useMemo(
    () =>
      seriesFrom(summary?.dailyViews, [
        { key: "service_view", name: "Service views", color: chartColors.primary },
        { key: "profile_view", name: "Profile views", color: chartColors.light },
      ]),
    [summary],
  );
  const calls = useMemo(
    () => seriesFrom(summary?.dailyCalls, [{ key: "call_tap", name: "Call taps", color: chartColors.orange }]),
    [summary],
  );
  const conversions = useMemo(
    () =>
      seriesFrom(summary?.dailyConversions, [
        { key: "service_apply_success", name: "Applies", color: chartColors.success },
        { key: "service_unapply_success", name: "Unapplies", color: chartColors.amber },
        { key: "worker_booking_request_success", name: "Bookings", color: chartColors.primary },
      ]),
    [summary],
  );

  const kpis = summary?.kpis;
  const pickEvent = (name: string, label: string) => {
    setEventName(name);
    setSelection(label);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={events}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[styles.list, { maxWidth: contentWidth(width) }]}
        onEndReached={() => {
          if (!loading && !loadingMore && page < pages) setPage((value) => value + 1);
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <PageTitle title="Analytics" subtitle="Tap a stat or chart to filter the event stream." />
            <View style={styles.filters}>
              <ChoiceRow
                label="Date range"
                value={String(range)}
                onChange={(value) => setRange(value === "all" ? "all" : (Number(value) as RangePreset))}
                options={[
                  { value: "7", label: "7d" },
                  { value: "30", label: "30d" },
                  { value: "90", label: "90d" },
                  { value: "all", label: "All" },
                ]}
              />
              <ChoiceRow label="Platform" value={platform} onChange={setPlatform} options={platforms} />
            </View>
            {summaryError ? <Banner text={summaryError} /> : null}
            {summaryLoading ? <LoadingBlock label="Loading charts…" /> : null}
            <StatGrid
              items={[
                { label: "Events", value: kpis?.totalEvents ?? 0, icon: "pulse", onPress: () => pickEvent("", "All events") },
                { label: "Users", value: kpis?.uniqueUsers ?? 0, icon: "people" },
                { label: "Sessions", value: kpis?.uniqueSessions ?? 0, icon: "time", onPress: () => pickEvent("session_start", "Session starts") },
                { label: "Service views", value: kpis?.serviceViews ?? 0, icon: "eye", onPress: () => pickEvent("service_view", "Service views") },
                { label: "Profile views", value: kpis?.profileViews ?? 0, icon: "person", onPress: () => pickEvent("profile_view", "Profile views") },
                { label: "Call taps", value: kpis?.callTaps ?? 0, icon: "call", onPress: () => pickEvent("call_tap", "Call taps") },
                { label: "App opens", value: kpis?.sessionStarts ?? 0, icon: "phone-portrait", onPress: () => pickEvent("session_start", "App opens") },
                { label: "Applies", value: kpis?.serviceApplies ?? 0, icon: "checkmark-circle", onPress: () => pickEvent("service_apply_success", "Applies") },
                { label: "Bookings", value: kpis?.bookingRequests ?? 0, icon: "calendar", onPress: () => pickEvent("worker_booking_request_success", "Booking requests") },
              ]}
            />
            <ChartCard title="Sessions">
              <InteractiveLineChart
                labels={sessions.labels}
                series={sessions.series}
                onSelect={(point) => pickEvent(point.seriesKey, `${point.seriesName} · ${point.label} · ${point.value}`)}
              />
            </ChartCard>
            <ChartCard title="Views">
              <InteractiveLineChart
                labels={views.labels}
                series={views.series}
                onSelect={(point) => pickEvent(point.seriesKey, `${point.seriesName} · ${point.label} · ${point.value}`)}
              />
            </ChartCard>
            <ChartCard title="Calls">
              <InteractiveBarChart
                labels={calls.labels}
                series={calls.series}
                onSelect={(point) => pickEvent(point.seriesKey, `${point.seriesName} · ${point.label} · ${point.value}`)}
              />
            </ChartCard>
            <ChartCard title="Conversions">
              <InteractiveBarChart
                labels={conversions.labels}
                series={conversions.series}
                onSelect={(point) => pickEvent(point.seriesKey, `${point.seriesName} · ${point.label} · ${point.value}`)}
              />
            </ChartCard>
            <ChartCard title="Category mix">
              <InteractiveDonut
                slices={(summary?.byCategory || []).map((slice, index) => ({
                  key: slice.category,
                  label: slice.category,
                  value: slice.count,
                  color: [chartColors.primary, chartColors.light, chartColors.orange, chartColors.success, chartColors.amber, chartColors.slate][index % 6],
                }))}
                onSelect={(slice) => {
                  const mapped = categoryEvent[slice.key];
                  if (mapped) pickEvent(mapped, `${slice.label} · ${slice.value}`);
                  else setSelection(`${slice.label} · ${slice.value}`);
                }}
              />
            </ChartCard>
            <ChartCard title="Platform mix">
              <InteractiveDonut
                slices={(summary?.byPlatform || []).map((slice) => ({
                  key: slice.platform,
                  label: slice.platform,
                  value: slice.count,
                  color:
                    slice.platform === "android"
                      ? chartColors.success
                      : slice.platform === "ios"
                        ? chartColors.primary
                        : slice.platform === "web"
                          ? chartColors.orange
                          : chartColors.slate,
                }))}
                onSelect={(slice) => {
                  if (["android", "ios", "web"].includes(slice.key)) setPlatform(slice.key);
                  setSelection(`${slice.label} · ${slice.value.toLocaleString("en-IN")}`);
                }}
              />
            </ChartCard>
            <ChartCard title="Activity by hour">
              <ActivityHeatmap
                series={summary?.byHourWeekday || []}
                onSelect={(cell) => setSelection(`${cell.day} ${cell.hour}:00 · ${cell.value} events`)}
              />
            </ChartCard>
            {selection ? <Banner text={selection} tone="ok" /> : null}
            <View style={styles.filters}>
              <Field label="Search events" value={search} onChangeText={setSearch} placeholder="Event name or session id" />
              <Field label="Exact event" value={eventName} onChangeText={setEventName} placeholder="Filled when you tap a chart" />
              <Text style={styles.count}>
                Loaded {events.length}
                {total ? ` of ${total}` : ""} events
              </Text>
            </View>
            {error ? <Banner text={error} /> : null}
            {loading ? <LoadingBlock label="Loading events…" /> : null}
          </View>
        }
        ListEmptyComponent={!loading && !error ? <EmptyState title="No events" body="No analytics events match these filters." /> : null}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => {
              if (item.eventName) pickEvent(item.eventName, item.eventName);
            }}
          >
            <Text style={styles.title}>{item.eventName || "Event"}</Text>
            <Text style={styles.meta}>
              {item.platform || "unknown"} · {item.userId?.name || "Guest"} {item.userId?.mobile ? `(${item.userId.mobile})` : ""}
            </Text>
            <Text style={styles.meta}>{item.sessionId || "No session"} · {formatWhen(item.serverTimestamp)}</Text>
          </Pressable>
        )}
        ListFooterComponent={loadingMore ? <LoadingBlock label="Loading more events…" /> : <View style={{ height: 24 }} />}
      />
    </SafeAreaView>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.chart}>
      <Text style={styles.chartTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 12, width: "100%", alignSelf: "center" },
  filters: { backgroundColor: "#fff", borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: colors.line },
  chart: { backgroundColor: "#fff", borderRadius: 18, padding: 14, gap: 8, borderWidth: 1, borderColor: colors.line },
  chartTitle: { fontWeight: "800", color: colors.ink, fontSize: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 14, gap: 4, borderWidth: 1, borderColor: colors.line, marginTop: 10 },
  title: { fontWeight: "800", color: colors.ink },
  meta: { color: colors.muted, fontSize: 12 },
  count: { color: colors.muted, fontSize: 13 },
});
