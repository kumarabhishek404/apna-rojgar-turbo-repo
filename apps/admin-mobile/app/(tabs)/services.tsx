import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import { useFilterPage } from "@/lib/paging";
import { getService, openService, rememberServices, useRecordsVersion } from "@/lib/records";
import { label } from "@/lib/labels";
import { type AdminService, type ServiceStats } from "@/lib/types";
import { ServiceListCard } from "@/components/cards";
import {
  AppliedChips,
  Banner,
  ChoiceRow,
  EmptyState,
  Field,
  LoadingBlock,
  Accordion,
  PageTitle,
  PrimaryButton,
  SearchBar,
  Sheet,
  StatGrid,
  contentWidth,
} from "@/components/ui";

const statuses = ["ALL", "HIRING", "COMPLETED", "CANCELLED", "PENDING", "REJECTED"].map((value) => ({
  value,
  label: value === "ALL" ? "All status" : label(value),
}));
const bookings = [
  { value: "ALL", label: "All types" },
  { value: "byService", label: "Open listing" },
  { value: "direct", label: "Direct booking" },
];

export default function ServicesScreen() {
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("ALL");
  const [bookingType, setBookingType] = useState("ALL");
  const [rows, setRows] = useState<AdminService[]>([]);
  const [stats, setStats] = useState<ServiceStats>({});
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const filterKey = [status, bookingType, debounced, reload].join("|");
  const { page, setPage, epoch } = useFilterPage(filterKey);

  useEffect(() => {
    let cancelled = false;
    setLoading(page === 1);
    setLoadingMore(page > 1);
    setError("");
    const params = new URLSearchParams();
    params.set("status", status);
    params.set("bookingType", bookingType);
    params.set("page", String(page));
    params.set("limit", "20");
    if (debounced) params.set("search", debounced);
    apiRequest<{
      data?: AdminService[];
      stats?: ServiceStats;
      pagination?: { pages?: number; total?: number };
    }>(`/admin/all-services?${params}`)
      .then((res) => {
        if (cancelled) return;
        const next = res.data || [];
        rememberServices(next);
        setRows((prev) => (page === 1 ? next : [...prev, ...next]));
        setStats(res.stats || {});
        setPages(res.pagination?.pages || 1);
        setTotal(res.pagination?.total || 0);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load services");
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

  useRecordsVersion();
  const visible = rows.map((row) => getService(row._id) || row);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[styles.list, { maxWidth: contentWidth(width) }]}
        onEndReached={() => {
          if (!loading && !loadingMore && page < pages) setPage((value) => value + 1);
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <PageTitle title="Services" subtitle="Every work registered in the service collection." />
            <Accordion title="Stats">
              <StatGrid
                items={[
                  { label: "Total", value: stats.total ?? 0, icon: "layers", onPress: () => setStatus("ALL") },
                  { label: "Hiring", value: stats.hiring ?? 0, icon: "megaphone", onPress: () => setStatus("HIRING") },
                  { label: "Completed", value: stats.completed ?? 0, icon: "checkmark-done", onPress: () => setStatus("COMPLETED") },
                  { label: "Cancelled", value: stats.cancelled ?? 0, icon: "close-circle", onPress: () => setStatus("CANCELLED") },
                  { label: "Pending", value: stats.pending ?? 0, icon: "time", onPress: () => setStatus("PENDING") },
                  { label: "Promoted", value: stats.promoted ?? 0, icon: "trending-up" },
                  { label: "Featured", value: stats.featured ?? 0, icon: "star" },
                ]}
              />
            </Accordion>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Job ID, type, address, employer"
              onFilter={() => setFiltersOpen(true)}
              filterCount={(status !== "ALL" ? 1 : 0) + (bookingType !== "ALL" ? 1 : 0)}
            />
            <AppliedChips
              chips={[
                ...(status !== "ALL"
                  ? [{ id: "status", eyebrow: "Status", value: label(status), icon: "ellipse-outline" as const, onRemove: () => setStatus("ALL") }]
                  : []),
                ...(bookingType !== "ALL"
                  ? [{ id: "booking", eyebrow: "Booking", value: bookingType === "direct" ? "Direct" : "Listing", icon: "briefcase-outline" as const, onRemove: () => setBookingType("ALL") }]
                  : []),
              ]}
              onClear={() => {
                setStatus("ALL");
                setBookingType("ALL");
              }}
            />
            <Text style={styles.count}>
              Loaded {rows.length}
              {total ? ` of ${total}` : ""} services
            </Text>
            {error ? <Banner text={error} /> : null}
            {loading ? <LoadingBlock label="Loading services…" /> : null}
          </View>
        }
        ListEmptyComponent={!loading && !error ? <EmptyState title="No services" body="Nothing matches these filters." /> : null}
        renderItem={({ item }) => <ServiceListCard service={item} onPress={() => openService(item)} />}
        ListFooterComponent={loadingMore ? <LoadingBlock label="Loading more services…" /> : <View style={{ height: 88 }} />}
      />
      <Pressable style={styles.fab} onPress={() => setCreating(true)}>
        <Ionicons name="add" color="#fff" size={28} />
      </Pressable>
      <Sheet visible={filtersOpen} title="Filter services" onClose={() => setFiltersOpen(false)}>
        <ChoiceRow label="Status" options={statuses} value={status} onChange={setStatus} />
        <ChoiceRow label="Booking type" options={bookings} value={bookingType} onChange={setBookingType} />
        <PrimaryButton label="Show services" onPress={() => setFiltersOpen(false)} />
      </Sheet>
      <CreateService
        visible={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false);
          setReload((value) => value + 1);
        }}
      />
    </SafeAreaView>
  );
}

function CreateService({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [employerMobile, setEmployerMobile] = useState("");
  const [type, setType] = useState("");
  const [subType, setSubType] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("1");
  const [bookingType, setBookingType] = useState("byService");
  const [workerMobile, setWorkerMobile] = useState("");
  const [skill, setSkill] = useState("");
  const [count, setCount] = useState("1");
  const [pay, setPay] = useState("700");
  const [food, setFood] = useState(false);
  const [living, setLiving] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!type.trim() || !subType.trim() || !address.trim() || !startDate.trim()) {
      setError("Type, sub type, address, and start date are required.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      setError("Start date must look like 2026-10-23.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiRequest("/admin/services", {
        method: "POST",
        body: {
          employerMobile: employerMobile.replace(/\D/g, ""),
          type: type.trim(),
          subType: subType.trim(),
          address: address.trim(),
          description: description.trim(),
          startDate: startDate.trim(),
          duration: Number(duration),
          bookingType,
          workerMobile: workerMobile.replace(/\D/g, ""),
          requirements: [
            {
              name: skill.trim(),
              count: Number(count),
              payPerDay: Number(pay),
              food,
              living,
            },
          ],
          facilities: { food, living },
        },
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} title="New service" onClose={onClose}>
      <Field label="Employer mobile" value={employerMobile} onChangeText={setEmployerMobile} keyboardType="phone-pad" placeholder="Existing user" />
      <Field label="Work type" value={type} onChangeText={setType} placeholder="Construction" />
      <Field label="Sub type" value={subType} onChangeText={setSubType} placeholder="Mason" />
      <Field label="Address" value={address} onChangeText={setAddress} placeholder="Site address" />
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="Optional" />
      <Field label="Start date" value={startDate} onChangeText={setStartDate} placeholder="2026-10-23" />
      <Field label="Duration (days)" value={duration} onChangeText={setDuration} keyboardType="number-pad" />
      <ChoiceRow label="Booking type" value={bookingType} onChange={setBookingType} options={bookings.filter((item) => item.value !== "ALL")} />
      {bookingType === "direct" ? (
        <Field label="Booked worker mobile" value={workerMobile} onChangeText={setWorkerMobile} keyboardType="phone-pad" />
      ) : null}
      <Field label="Worker skill" value={skill} onChangeText={setSkill} placeholder="Mason" />
      <View style={styles.split}>
        <Field label="Count" value={count} onChangeText={setCount} keyboardType="number-pad" />
        <Field label="Pay / day" value={pay} onChangeText={setPay} keyboardType="number-pad" />
      </View>
      <View style={styles.switchRow}>
        <Text>Food</Text>
        <Switch value={food} onValueChange={setFood} />
        <Text>Stay</Text>
        <Switch value={living} onValueChange={setLiving} />
      </View>
      {error ? <Banner text={error} /> : null}
      <PrimaryButton label={busy ? "Creating…" : "Create service"} onPress={submit} disabled={busy} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 12, width: "100%", alignSelf: "center" },
  count: { color: colors.muted, fontSize: 13 },
  split: { flexDirection: "row", gap: 10 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
