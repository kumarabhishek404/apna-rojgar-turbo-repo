import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import { useFilterPage } from "@/lib/paging";
import { getUser, openUser, rememberUsers, useRecordsVersion } from "@/lib/records";
import { label } from "@/lib/labels";
import { type AdminUser, type CityOption, type SkillOption, type UserStats } from "@/lib/types";
import { UserListCard } from "@/components/cards";
import {
  AppliedChips,
  Banner,
  ChoiceRow,
  EmptyState,
  Field,
  LoadingBlock,
  Accordion,
  PageTitle,
  PickerField,
  PrimaryButton,
  SearchBar,
  Sheet,
  StatGrid,
  contentWidth,
} from "@/components/ui";

const emptyStats: UserStats = {
  total: 0,
  admin: 0,
  workers: 0,
  mediators: 0,
  employers: 0,
  unassigned: 0,
  verification: { pending: 0, applied: 0, completed: 0 },
};

const roles = [
  { value: "ALL", label: "All roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "WORKER", label: "Worker" },
  { value: "MEDIATOR", label: "Contractor" },
  { value: "EMPLOYER", label: "Employer" },
  { value: "-", label: "Unassigned" },
];
const statuses = ["ALL", "ACTIVE", "PENDING", "SUSPENDED", "DISABLED", "DELETED"].map((value) => ({
  value,
  label: value === "ALL" ? "All status" : label(value),
}));
const sources = [
  { value: "ALL", label: "All sources" },
  { value: "web", label: "Web" },
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
  { value: "-", label: "Unknown" },
];
const verifications = ["ALL", "Pending", "Applied", "Completed"].map((value) => ({
  value,
  label: value === "ALL" ? "All verification" : value,
}));

export default function UsersScreen() {
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [verification, setVerification] = useState("ALL");
  const [city, setCity] = useState("");
  const [skill, setSkill] = useState("");
  const [cities, setCities] = useState<CityOption[]>([]);
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats>(emptyStats);
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

  const filterKey = [role, status, source, verification, city, skill, debounced, reload].join("|");
  const { page, setPage, epoch } = useFilterPage(filterKey);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (role !== "ALL") params.set("role", role);
    if (source !== "ALL") params.set("source", source);
    if (debounced) params.set("search", debounced);
    if (skill) params.set("skill", skill);
    if (verification !== "ALL") params.set("verification", verification);
    let cancelled = false;
    apiRequest<{ data?: CityOption[] }>(`/admin/user-cities?${params}`)
      .then((res) => {
        if (!cancelled) setCities(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });
    return () => {
      cancelled = true;
    };
  }, [role, status, source, verification, skill, debounced]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (role !== "ALL") params.set("role", role);
    if (source !== "ALL") params.set("source", source);
    if (debounced) params.set("search", debounced);
    if (city) params.set("city", city);
    if (verification !== "ALL") params.set("verification", verification);
    let cancelled = false;
    apiRequest<{ data?: SkillOption[] }>(`/admin/user-skills?${params}`)
      .then((res) => {
        if (!cancelled) setSkills(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setSkills([]);
      });
    return () => {
      cancelled = true;
    };
  }, [role, status, source, verification, city, debounced]);

  useEffect(() => {
    let cancelled = false;
    setLoading(page === 1);
    setLoadingMore(page > 1);
    setError("");
    const params = new URLSearchParams();
    params.set("status", status);
    params.set("page", String(page));
    params.set("limit", "20");
    if (role !== "ALL") params.set("role", role);
    if (source !== "ALL") params.set("source", source);
    if (debounced) params.set("search", debounced);
    if (city) params.set("city", city);
    if (skill) params.set("skill", skill);
    if (verification !== "ALL") params.set("verification", verification);

    apiRequest<{
      data?: AdminUser[];
      stats?: UserStats;
      pagination?: { pages?: number; total?: number };
    }>(`/admin/all-users?${params}`)
      .then((res) => {
        if (cancelled) return;
        const next = res.data || [];
        rememberUsers(next);
        setRows((prev) => (page === 1 ? next : [...prev, ...next]));
        setPages(res.pagination?.pages || 1);
        setTotal(res.pagination?.total || 0);
        if (res.stats) setStats({ ...emptyStats, ...res.stats, verification: { ...emptyStats.verification, ...res.stats.verification } });
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load users");
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
  const visible = rows.map((row) => getUser(row._id) || row);

  const filterCount =
    [role, status, source, verification].filter((value) => value !== "ALL").length +
    (city ? 1 : 0) +
    (skill ? 1 : 0);
  const chips = [
    role !== "ALL" ? { id: "role", eyebrow: "Role", value: roles.find((item) => item.value === role)?.label || role, icon: "people-outline" as const, onRemove: () => setRole("ALL") } : null,
    status !== "ALL" ? { id: "status", eyebrow: "Status", value: label(status), icon: "ellipse-outline" as const, onRemove: () => setStatus("ALL") } : null,
    source !== "ALL" ? { id: "source", eyebrow: "Source", value: source, icon: "phone-portrait-outline" as const, onRemove: () => setSource("ALL") } : null,
    verification !== "ALL" ? { id: "verification", eyebrow: "Verification", value: verification, icon: "shield-checkmark-outline" as const, onRemove: () => setVerification("ALL") } : null,
    city ? { id: "city", eyebrow: "City", value: city, icon: "location-outline" as const, onRemove: () => setCity("") } : null,
    skill ? { id: "skill", eyebrow: "Skill", value: label(skill), icon: "construct-outline" as const, onRemove: () => setSkill("") } : null,
  ].filter((chip): chip is NonNullable<typeof chip> => Boolean(chip));

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
            <PageTitle title="Users" subtitle="Every registered account, including incomplete profiles." />
            <Accordion title="Stats">
              <StatGrid
                items={[
                  { label: "Total", value: stats.total, icon: "people" },
                  { label: "Admins", value: stats.admin, icon: "shield-checkmark" },
                  { label: "Workers", value: stats.workers, icon: "hammer" },
                  { label: "Contractors", value: stats.mediators, icon: "git-network" },
                  { label: "Employers", value: stats.employers, icon: "business" },
                  { label: "Verified", value: stats.verification.completed, icon: "checkmark-circle" },
                  { label: "Applied", value: stats.verification.applied, icon: "time" },
                  { label: "Pending", value: stats.verification.pending, icon: "hourglass" },
                ]}
              />
            </Accordion>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Name, mobile, or email"
              onFilter={() => setFiltersOpen(true)}
              filterCount={filterCount}
            />
            <AppliedChips
              chips={chips}
              onClear={() => {
                setRole("ALL");
                setStatus("ALL");
                setSource("ALL");
                setVerification("ALL");
                setCity("");
                setSkill("");
              }}
            />
            <Text style={styles.count}>
              Loaded {rows.length}
              {total ? ` of ${total}` : ""} users
            </Text>
            {error ? <Banner text={error} /> : null}
            {loading ? <LoadingBlock label="Loading users…" /> : null}
          </View>
        }
        ListEmptyComponent={
          !loading && !error ? <EmptyState title="No users" body="No accounts match these filters." /> : null
        }
        renderItem={({ item }) => <UserListCard user={item} onPress={() => openUser(item)} />}
        ListFooterComponent={loadingMore ? <LoadingBlock label="Loading more users…" /> : <View style={{ height: 88 }} />}
      />
      <Pressable style={styles.fab} onPress={() => setCreating(true)}>
        <Ionicons name="add" color="#fff" size={28} />
      </Pressable>
      <Sheet visible={filtersOpen} title="Filter users" onClose={() => setFiltersOpen(false)}>
        <ChoiceRow label="Role" options={roles} value={role} onChange={setRole} />
        <ChoiceRow label="Status" options={statuses} value={status} onChange={setStatus} />
        <ChoiceRow label="Source" options={sources} value={source} onChange={setSource} />
        <ChoiceRow label="Verification" options={verifications} value={verification} onChange={setVerification} />
        <PickerField
          label="City"
          value={city}
          placeholder="All cities"
          onChange={setCity}
          options={[{ value: "", label: "All cities" }, ...cities.map((item) => ({ value: item.city, label: `${item.city} (${item.count})` }))]}
        />
        <PickerField
          label="Skill"
          value={skill}
          placeholder="All skills"
          onChange={setSkill}
          options={[{ value: "", label: "All skills" }, ...skills.map((item) => ({ value: item.skill, label: `${label(item.skill)} (${item.count})` }))]}
        />
        <PrimaryButton label="Show users" onPress={() => setFiltersOpen(false)} />
      </Sheet>
      <CreateUser
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

function CreateUser({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("WORKER");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const digits = mobile.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Mobile number must be 10 digits.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await apiRequest("/admin/users", {
        method: "POST",
        body: { name: name.trim(), mobile: digits, role, gender, address: address.trim() },
      });
      setName("");
      setMobile("");
      setAddress("");
      setGender("");
      setRole("WORKER");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} title="New user" onClose={onClose}>
      <Field label="Name" value={name} onChangeText={setName} placeholder="Optional for incomplete profiles" />
      <Field label="Mobile" value={mobile} onChangeText={setMobile} placeholder="10-digit mobile" keyboardType="phone-pad" />
      <ChoiceRow
        label="Role"
        value={role}
        onChange={setRole}
        options={[
          { value: "WORKER", label: "Worker" },
          { value: "EMPLOYER", label: "Employer" },
          { value: "MEDIATOR", label: "Contractor" },
          { value: "ADMIN", label: "Admin" },
        ]}
      />
      <ChoiceRow
        label="Gender"
        value={gender}
        onChange={setGender}
        options={[
          { value: "", label: "Skip" },
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "other", label: "Other" },
        ]}
      />
      <Field label="Address" value={address} onChangeText={setAddress} placeholder="City, district" />
      {error ? <Banner text={error} /> : null}
      <PrimaryButton label={busy ? "Creating…" : "Create user"} onPress={submit} disabled={busy} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 12, paddingBottom: 24 },
  count: { color: colors.muted, fontSize: 13 },
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
    elevation: 4,
  },
});
