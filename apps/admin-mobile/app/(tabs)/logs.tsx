import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import { useFilterPage } from "@/lib/paging";
import { formatWhen, type ErrorLog } from "@/lib/types";
import { Badge, Banner, ChoiceRow, EmptyState, LoadingBlock, PageTitle, SearchBar, contentWidth } from "@/components/ui";

const methods = ["ALL", "GET", "POST", "PUT", "PATCH", "DELETE"].map((value) => ({
  value,
  label: value === "ALL" ? "All methods" : value,
}));
const codes = ["ALL", "400", "401", "403", "404", "500"].map((value) => ({
  value,
  label: value === "ALL" ? "All codes" : value,
}));

export default function LogsScreen() {
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [method, setMethod] = useState("ALL");
  const [statusCode, setStatusCode] = useState("ALL");
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const filterKey = [debounced, method, statusCode].join("|");
  const { page, setPage, epoch } = useFilterPage(filterKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(page === 1);
    setLoadingMore(page > 1);
    setError("");
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (debounced) params.set("search", debounced);
    if (method !== "ALL") params.set("method", method);
    if (statusCode !== "ALL") params.set("statusCode", statusCode);
    apiRequest<{ data?: ErrorLog[]; pagination?: { pages?: number; total?: number } }>(
      `/admin/error-logs?${params}`,
    )
      .then((res) => {
        if (cancelled) return;
        const next = res.data || [];
        setLogs((prev) => (page === 1 ? next : [...prev, ...next]));
        setPages(res.pagination?.pages || 1);
        setTotal(res.pagination?.total || 0);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load error logs");
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

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[styles.list, { maxWidth: contentWidth(width) }]}
        onEndReached={() => {
          if (!loading && !loadingMore && page < pages) setPage((value) => value + 1);
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <PageTitle title="Error logs" subtitle={`${loading && !total ? "…" : total} recorded system errors.`} />
            <SearchBar value={search} onChangeText={setSearch} placeholder="Message, route, or method" />
            <ChoiceRow label="Method" options={methods} value={method} onChange={setMethod} />
            <ChoiceRow label="Status code" options={codes} value={statusCode} onChange={setStatusCode} />
            {error ? <Banner text={error} /> : null}
            {loading ? <LoadingBlock label="Loading error logs…" /> : null}
          </View>
        }
        ListEmptyComponent={!loading && !error ? <EmptyState title="No errors" body="No logs match these filters." /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.badges}>
              <Badge label={(item.method || "NA").toUpperCase()} tone="rose" />
              <Badge label={`Status ${item.statusCode ?? "—"}`} tone="slate" />
            </View>
            <Text style={styles.message}>{item.message || "Unknown error"}</Text>
            <Text style={styles.meta}>Route: {item.apiRoute || "—"}</Text>
            <Text style={styles.meta}>
              User: {item.user?.name || "—"} {item.user?.mobile ? `(${item.user.mobile})` : ""}
            </Text>
            <Text style={styles.meta}>{formatWhen(item.createdAt)}</Text>
          </View>
        )}
        ListFooterComponent={loadingMore ? <LoadingBlock label="Loading more logs…" /> : <View style={{ height: 24 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 12, width: "100%", alignSelf: "center" },
  filters: { backgroundColor: "#fff", borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: colors.line },
  total: { backgroundColor: "rgba(255,255,255,0.16)", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, alignItems: "flex-end" },
  totalLabel: { color: "#ffe4e6", fontSize: 11, fontWeight: "700" },
  totalValue: { color: "#fff", fontSize: 28, fontWeight: "800" },
  card: { backgroundColor: "#fff7f8", borderRadius: 16, padding: 14, gap: 6, borderWidth: 1, borderColor: "#fecdd3", marginTop: 10 },
  badges: { flexDirection: "row", gap: 6 },
  message: { color: colors.ink, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 12 },
});
