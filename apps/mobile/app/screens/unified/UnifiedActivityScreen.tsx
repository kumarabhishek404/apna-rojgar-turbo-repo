/**
 * Activity tab — role-based sections with icon tabs and rich empty states.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import Colors from "@/constants/Colors";
import Atoms from "@/app/AtomStore";
import WORKER from "@/app/api/workers";
import EMPLOYER from "@/app/api/employer";
import MEDIATOR from "@/app/api/mediator";
import PULL_TO_REFRESH from "@/app/hooks/usePullToRefresh";
import { getToken } from "@/utils/authStorage";
import { t } from "@/utils/translationHelper";
import ListingsServices from "@/components/commons/ListingServices";
import ListingsVerticalServices from "@/components/commons/ListingsVerticalServices";
import ListingsBookedWorkers from "@/components/commons/ListingBookedWorkers";
import ListingsVerticalBookings from "@/components/commons/ListingVerticalBookings";
import ListingsServicesPlaceholder from "@/components/commons/LoadingPlaceholders/ListingServicePlaceholder";
import CustomText from "@/components/commons/CustomText";
import CustomHeading from "@/components/commons/CustomHeading";
import ProfilePicture from "@/components/commons/ProfilePicture";

type ApiRole = "WORKER" | "EMPLOYER" | "MEDIATOR";

const dedupeById = (rows: any[]) =>
  Object.values(
    (rows || []).reduce((acc: any, item: any) => {
      if (!item?._id) return acc;
      acc[item._id] = item;
      return acc;
    }, {}),
  );

/* ─────────────────────────────────────────
   Shared: fade-in wrapper
───────────────────────────────────────── */
const FadeIn = ({ children }: { children: React.ReactNode }) => {
  const o = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(o, { toValue: 1, duration: 340, useNativeDriver: true }).start();
  }, [o]);
  return <Animated.View style={[{ opacity: o }, { flex: 1 }]}>{children}</Animated.View>;
};

/* ─────────────────────────────────────────
   Shared: Icon tab bar
───────────────────────────────────────── */
type TabDef = {
  labelKey: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const IconTabBar = ({
  tabs,
  selected,
  onChange,
}: {
  tabs: TabDef[];
  selected: number;
  onChange: (i: number) => void;
}) => (
  <View style={tabStyles.bar}>
    {tabs.map((tab, i) => {
      const active = selected === i;
      return (
        <TouchableOpacity
          key={tab.labelKey}
          style={[tabStyles.tab, active && tabStyles.tabActive]}
          onPress={() => onChange(i)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={tab.icon}
            size={20}
            color={active ? Colors.white : "#5F7BA8"}
          />
          <CustomText
            baseFont={12}
            fontWeight={active ? "700" : "600"}
            color={active ? Colors.white : "#5F7BA8"}
            textAlign="center"
            numberOfLines={1}
          >
            {t(tab.labelKey)}
          </CustomText>
        </TouchableOpacity>
      );
    })}
  </View>
);

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 16,
    padding: 5,
    gap: 4,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.08)",
  },
  tab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});

/* ─────────────────────────────────────────
   Shared: Rich empty state with CTA
───────────────────────────────────────── */
type EmptyStateConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  message: string;
  ctaLabel?: string;
  ctaIcon?: keyof typeof Ionicons.glyphMap;
  ctaColor?: string;
  onCta?: () => void;
  secondaryCtaLabel?: string;
  onSecondaryCta?: () => void;
};

const RichEmptyState = (cfg: EmptyStateConfig) => (
  <View style={emptyStyles.root}>
    <View style={[emptyStyles.iconCircle, { backgroundColor: cfg.iconBg }]}>
      <Ionicons name={cfg.icon} size={44} color={cfg.iconColor} />
    </View>
    <CustomHeading baseFont={17} textAlign="center" style={emptyStyles.title}>
      {cfg.title}
    </CustomHeading>
    <CustomText
      baseFont={14}
      color={Colors.subHeading}
      textAlign="center"
      style={emptyStyles.msg}
    >
      {cfg.message}
    </CustomText>
    {cfg.ctaLabel && cfg.onCta ? (
      <TouchableOpacity
        style={[emptyStyles.cta, { backgroundColor: cfg.ctaColor ?? Colors.primary }]}
        onPress={cfg.onCta}
        activeOpacity={0.88}
      >
        {cfg.ctaIcon ? (
          <Ionicons name={cfg.ctaIcon} size={16} color={Colors.white} />
        ) : null}
        <CustomText baseFont={14} fontWeight="700" color={Colors.white}>
          {cfg.ctaLabel}
        </CustomText>
      </TouchableOpacity>
    ) : null}
    {cfg.secondaryCtaLabel && cfg.onSecondaryCta ? (
      <TouchableOpacity
        style={emptyStyles.secondaryCta}
        onPress={cfg.onSecondaryCta}
        activeOpacity={0.8}
      >
        <CustomText baseFont={13} fontWeight="700" color={Colors.primary}>
          {cfg.secondaryCtaLabel}
        </CustomText>
      </TouchableOpacity>
    ) : null}
  </View>
);

const emptyStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
  },
  msg: {
    lineHeight: 21,
    marginBottom: 24,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 12,
  },
  secondaryCta: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
});

/* ─────────────────────────────────────────
   Worker
───────────────────────────────────────── */
const WORKER_TABS: TabDef[] = [
  { labelKey: "activityTabApplied", icon: "checkmark-circle-outline" },
  { labelKey: "activityTabBookings", icon: "mail-outline" },
];

const WorkerActivity = () => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const firstRef = useRef(true);
  const [tab, setTab] = useState(0);

  const bookingsQ = useInfiniteQuery({
    queryKey: ["activityWorkerBookings", userDetails?._id],
    queryFn: async ({ pageParam = 1 }) => WORKER.fetchAllMyBookings({ pageParam }),
    initialPageParam: 1,
    enabled: !!userDetails?._id,
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const bookingInvitesQ = useInfiniteQuery({
    queryKey: ["activityWorkerBookingInvites", userDetails?._id],
    queryFn: async ({ pageParam = 1 }) =>
      WORKER.fetchAllBookingReceivedInvitations({ pageParam }),
    initialPageParam: 1,
    enabled: !!userDetails?._id,
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  useFocusEffect(
    useCallback(() => {
      if (firstRef.current) { firstRef.current = false; return; }
      bookingsQ.refetch();
      bookingInvitesQ.refetch();
    }, [bookingsQ.refetch, bookingInvitesQ.refetch]),
  );

  const services = useMemo(
    () => dedupeById(bookingsQ.data?.pages?.flatMap((p: any) => p.data || []) || []),
    [bookingsQ.data],
  );
  const bookingInvites = useMemo(
    () => bookingInvitesQ.data?.pages?.flatMap((p: any) => p.data || []) || [],
    [bookingInvitesQ.data],
  );

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(async () => {
    await Promise.all([bookingsQ.refetch(), bookingInvitesQ.refetch()]);
  });

  if (bookingsQ.isLoading && !bookingsQ.data) return <ListingsServicesPlaceholder />;

  return (
    <FadeIn>
      <View style={styles.panel}>
        <IconTabBar tabs={WORKER_TABS} selected={tab} onChange={setTab} />

        <View style={styles.body}>
          {tab === 0 ? (
            services.length === 0 ? (
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
              >
                <RichEmptyState
                  icon="briefcase-outline"
                  iconColor="#2563EB"
                  iconBg="#EEF4FF"
                  title={t("activityTabWorkerAppliedTitle")}
                  message={t("activityEmptyLineApplied")}
                  ctaLabel={t("browseJobs")}
                  ctaIcon="search-outline"
                  onCta={() => router.push("/(tabs)/second")}
                  secondaryCtaLabel={t("completeProfile")}
                  onSecondaryCta={() => router.push("/screens/profile")}
                />
              </ScrollView>
            ) : (
              <FlatList
                data={services}
                keyExtractor={(it: any) => String(it?._id ?? "")}
                renderItem={({ item }) => (
                  <View style={styles.cardWrap}><ListingsServices item={item} /></View>
                )}
                contentContainerStyle={styles.listInner}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                onEndReached={() => bookingsQ.hasNextPage && !bookingsQ.isFetchingNextPage && bookingsQ.fetchNextPage()}
                onEndReachedThreshold={0.25}
                ListFooterComponent={
                  bookingsQ.isFetchingNextPage
                    ? <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} />
                    : <View style={{ height: 80 }} />
                }
              />
            )
          ) : null}

          {tab === 1 ? (
            bookingInvitesQ.isLoading && !bookingInvitesQ.data ? (
              <View style={styles.loading}><ActivityIndicator size="large" color={Colors.primary} /></View>
            ) : bookingInvites.length === 0 ? (
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
              >
                <RichEmptyState
                  icon="mail-outline"
                  iconColor="#7C3AED"
                  iconBg="#F5F3FF"
                  title={t("activityTabWorkerBookingTitle")}
                  message={t("activityEmptyLineBookingInvites")}
                  ctaLabel={t("completeProfile")}
                  ctaIcon="person-outline"
                  ctaColor="#7C3AED"
                  onCta={() => router.push("/screens/profile")}
                />
              </ScrollView>
            ) : (
              <ListingsVerticalBookings
                category="recievedRequests"
                listings={bookingInvites}
                loadMore={() => bookingInvitesQ.hasNextPage && !bookingInvitesQ.isFetchingNextPage && bookingInvitesQ.fetchNextPage()}
                isFetchingNextPage={bookingInvitesQ.isFetchingNextPage}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
              />
            )
          ) : null}
        </View>
      </View>
    </FadeIn>
  );
};

/* ─────────────────────────────────────────
   Employer
───────────────────────────────────────── */
const EMPLOYER_TABS: TabDef[] = [
  { labelKey: "myServices",      icon: "briefcase-outline" },
  { labelKey: "bookedWorkers",   icon: "people-outline" },
];

const EmployerActivity = () => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const firstRef = useRef(true);
  const [tab, setTab] = useState(0);

  const servicesQ = useInfiniteQuery({
    queryKey: ["activityEmployerServices", userDetails?._id],
    queryFn: async ({ pageParam = 1 }) =>
      EMPLOYER.fetchMyServices({ pageParam, status: "HIRING" }),
    initialPageParam: 1,
    enabled: !!userDetails?._id,
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const bookedQ = useInfiniteQuery({
    queryKey: ["activityEmployerBookings", userDetails?._id],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      if (!token || !userDetails?._id) throw new Error("Unauthorized");
      return EMPLOYER.fetchAllBookedWorkers({ pageParam, token });
    },
    initialPageParam: 1,
    enabled: !!userDetails?._id,
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  useFocusEffect(
    useCallback(() => {
      if (firstRef.current) { firstRef.current = false; return; }
      servicesQ.refetch();
      bookedQ.refetch();
    }, [servicesQ.refetch, bookedQ.refetch]),
  );

  const services = useMemo(
    () => dedupeById(servicesQ.data?.pages?.flatMap((p: any) => p.data || []) || []),
    [servicesQ.data],
  );
  const bookedListings = useMemo(
    () => bookedQ.data?.pages?.flatMap((p: any) => p.data || []) || [],
    [bookedQ.data],
  );

  const { refreshing: refreshingS, onRefresh: onRefreshS } = PULL_TO_REFRESH.usePullToRefresh(servicesQ.refetch);
  const { refreshing: refreshingB, onRefresh: onRefreshB } = PULL_TO_REFRESH.usePullToRefresh(bookedQ.refetch);

  if (servicesQ.isLoading && !servicesQ.data) return <ListingsServicesPlaceholder />;

  return (
    <FadeIn>
      <View style={styles.panel}>
        <IconTabBar tabs={EMPLOYER_TABS} selected={tab} onChange={setTab} />

        <View style={styles.body}>
          {/* ── My Services tab ── */}
          {tab === 0 ? (
            services.length === 0 ? (
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={<RefreshControl refreshing={refreshingS} onRefresh={onRefreshS} tintColor={Colors.primary} />}
              >
                <RichEmptyState
                  icon="briefcase-outline"
                  iconColor="#059669"
                  iconBg="#ECFDF5"
                  title={t("noCreatedServicesTitle")}
                  message={t("noCreatedServicesMessage")}
                  ctaLabel={t("createNewService")}
                  ctaIcon="add-circle-outline"
                  ctaColor="#059669"
                  onCta={() => router.push("/screens/addService")}
                  secondaryCtaLabel={t("browseWorkers")}
                  onSecondaryCta={() => router.push("/(tabs)/third")}
                />
              </ScrollView>
            ) : (
              <ListingsVerticalServices
                listings={services as any}
                loadMore={() => servicesQ.hasNextPage && !servicesQ.isFetchingNextPage && servicesQ.fetchNextPage()}
                isFetchingNextPage={servicesQ.isFetchingNextPage}
                refreshControl={<RefreshControl refreshing={refreshingS} onRefresh={onRefreshS} tintColor={Colors.primary} />}
              />
            )
          ) : null}

          {/* ── Booked Workers tab ── */}
          {tab === 1 ? (
            bookedListings.length === 0 ? (
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={<RefreshControl refreshing={refreshingB} onRefresh={onRefreshB} tintColor={Colors.primary} />}
              >
                <RichEmptyState
                  icon="people-outline"
                  iconColor="#2563EB"
                  iconBg="#EEF4FF"
                  title={t("noBookedWorkersTitle")}
                  message={t("noBookedWorkersMessage")}
                  ctaLabel={t("browseWorkers")}
                  ctaIcon="search-outline"
                  ctaColor="#2563EB"
                  onCta={() => router.push("/(tabs)/third")}
                />
              </ScrollView>
            ) : (
              <ListingsVerticalBookings
                listings={bookedListings}
                loadMore={() => bookedQ.hasNextPage && !bookedQ.isFetchingNextPage && bookedQ.fetchNextPage()}
                isFetchingNextPage={bookedQ.isFetchingNextPage}
                isLoading={false}
                refreshControl={<RefreshControl refreshing={refreshingB} onRefresh={onRefreshB} tintColor={Colors.primary} />}
                showEngagementStrip
              />
            )
          ) : null}
        </View>
      </View>
    </FadeIn>
  );
};

/* ─────────────────────────────────────────
   Mediator
───────────────────────────────────────── */
const MEDIATOR_TABS: TabDef[] = [
  { labelKey: "activityTabApplied", icon: "briefcase-outline" },
  { labelKey: "activityTabTeam",    icon: "people-outline" },
  { labelKey: "activityTabBooked",  icon: "calendar-outline" },
];

const MediatorActivity = () => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const firstRef = useRef(true);
  const [tab, setTab] = useState(0);

  const appliedQ = useInfiniteQuery({
    queryKey: ["activityMedApplied", userDetails?._id],
    queryFn: ({ pageParam = 1 }) =>
      MEDIATOR.fetchMyAppliedServicesAsMediator({ pageParam }),
    initialPageParam: 1,
    enabled: !!userDetails?._id,
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const membersQ = useInfiniteQuery({
    queryKey: ["activityMedMembers", userDetails?._id],
    queryFn: ({ pageParam = 1 }) =>
      MEDIATOR.fetchAllMembers({ mediatorId: userDetails?._id, pageParam, category: "" }),
    initialPageParam: 1,
    enabled: !!userDetails?._id,
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const bookedQ = useInfiniteQuery({
    queryKey: ["activityMedBooked", userDetails?._id],
    queryFn: ({ pageParam = 1 }) => MEDIATOR.fetchMyBookingsAsMediator({ pageParam }),
    initialPageParam: 1,
    enabled: !!userDetails?._id,
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  useFocusEffect(
    useCallback(() => {
      if (firstRef.current) { firstRef.current = false; return; }
      appliedQ.refetch();
      membersQ.refetch();
      bookedQ.refetch();
    }, [appliedQ.refetch, membersQ.refetch, bookedQ.refetch]),
  );

  const applied = useMemo(
    () => dedupeById(appliedQ.data?.pages?.flatMap((p: any) => p.data || []) || []),
    [appliedQ.data],
  );
  const members = useMemo(() => {
    const out: any[] = [];
    (membersQ.data?.pages || []).forEach((p: any) => {
      if (Array.isArray(p?.data))
        p.data.forEach((block: any) => {
          if (Array.isArray(block?.workers)) out.push(...block.workers);
        });
    });
    return dedupeById(out);
  }, [membersQ.data]);
  const booked = useMemo(
    () => bookedQ.data?.pages?.flatMap((p: any) => p.data || []) || [],
    [bookedQ.data],
  );

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(async () => {
    await Promise.all([appliedQ.refetch(), membersQ.refetch(), bookedQ.refetch()]);
  });

  const onEndReached = () => {
    if (tab === 0 && appliedQ.hasNextPage && !appliedQ.isFetchingNextPage) appliedQ.fetchNextPage();
    else if (tab === 1 && membersQ.hasNextPage && !membersQ.isFetchingNextPage) membersQ.fetchNextPage();
    else if (tab === 2 && bookedQ.hasNextPage && !bookedQ.isFetchingNextPage) bookedQ.fetchNextPage();
  };

  if (appliedQ.isLoading && !appliedQ.data) return <ListingsServicesPlaceholder />;

  return (
    <FadeIn>
      <View style={styles.panel}>
        <IconTabBar tabs={MEDIATOR_TABS} selected={tab} onChange={setTab} />

        <View style={styles.body}>
          {tab === 0 ? (
            applied.length === 0 ? (
              <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
                <RichEmptyState
                  icon="briefcase-outline"
                  iconColor="#2563EB"
                  iconBg="#EEF4FF"
                  title={t("activityTabMedAppliedTitle")}
                  message={t("activityEmptyLineApplied")}
                  ctaLabel={t("browseJobs")}
                  ctaIcon="search-outline"
                  onCta={() => router.push("/(tabs)/second")}
                />
              </ScrollView>
            ) : (
              <FlatList
                data={applied}
                keyExtractor={(it: any) => it._id}
                renderItem={({ item }) => <View style={styles.cardWrap}><ListingsServices item={item} /></View>}
                contentContainerStyle={styles.listInner}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.25}
                ListFooterComponent={appliedQ.isFetchingNextPage ? <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} /> : <View style={{ height: 80 }} />}
              />
            )
          ) : null}

          {tab === 1 ? (
            members.length === 0 ? (
              <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
                <RichEmptyState
                  icon="people-outline"
                  iconColor="#D97706"
                  iconBg="#FEF3C7"
                  title={t("activityTabMedTeamTitle")}
                  message={t("activityEmptyLineTeam")}
                  ctaLabel={t("browseWorkers")}
                  ctaIcon="person-add-outline"
                  ctaColor="#D97706"
                  onCta={() => router.push("/(tabs)/third")}
                />
              </ScrollView>
            ) : (
              <FlatList
                data={members}
                keyExtractor={(it, idx) => String(it?._id || it?.worker || idx)}
                renderItem={({ item: w }) => {
                  const u = w?.worker && typeof w.worker === "object" ? w.worker : w;
                  const uid = u?._id || w?.worker;
                  const pic = u?.profilePicture;
                  const name = u?.name || "—";
                  return (
                    <TouchableOpacity
                      style={styles.memberRow}
                      activeOpacity={0.85}
                      onPress={() => router.push({ pathname: "/screens/users/[id]", params: { id: String(uid), title: "workers", type: "all" } })}
                    >
                      <ProfilePicture uri={pic} style={{ width: 48, height: 48, borderRadius: 24 }} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <CustomText fontWeight="700" baseFont={16}>{name}</CustomText>
                        {w?.status ? <CustomText baseFont={12} color={Colors.subHeading}>{String(w.status)}</CustomText> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={Colors.subHeading} />
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.listInner}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.25}
                ListFooterComponent={membersQ.isFetchingNextPage ? <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} /> : <View style={{ height: 80 }} />}
              />
            )
          ) : null}

          {tab === 2 ? (
            booked.length === 0 ? (
              <ScrollView contentContainerStyle={{ flexGrow: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>
                <RichEmptyState
                  icon="calendar-outline"
                  iconColor="#7C3AED"
                  iconBg="#F5F3FF"
                  title={t("activityTabMedBookedTitle")}
                  message={t("activityEmptyLineBooked")}
                  ctaLabel={t("browseJobs")}
                  ctaIcon="search-outline"
                  ctaColor="#7C3AED"
                  onCta={() => router.push("/(tabs)/second")}
                />
              </ScrollView>
            ) : (
              <FlatList
                data={booked}
                keyExtractor={(it: any) => it._id}
                renderItem={({ item }) => <View style={styles.cardWrap}><ListingsBookedWorkers title="bookingDetails" item={item} showEngagementStrip /></View>}
                contentContainerStyle={styles.listInner}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.25}
                ListFooterComponent={bookedQ.isFetchingNextPage ? <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} /> : <View style={{ height: 80 }} />}
              />
            )
          ) : null}
        </View>
      </View>
    </FadeIn>
  );
};

/* ─────────────────────────────────────────
   Root
───────────────────────────────────────── */
const UnifiedActivityScreen = () => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const role = (userDetails?.role || "WORKER") as ApiRole;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>
        {role === "EMPLOYER" ? (
          <EmployerActivity />
        ) : role === "MEDIATOR" ? (
          <MediatorActivity />
        ) : (
          <WorkerActivity />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF4FF" },
  panel: { flex: 1 },
  body: { flex: 1 },
  loading: { flex: 1, paddingTop: 48, alignItems: "center", justifyContent: "center" },
  listInner: { paddingHorizontal: 10, paddingBottom: 100, paddingTop: 6, flexGrow: 1 },
  cardWrap: { marginBottom: 8 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(34,64,154,0.08)",
  },
});

export default UnifiedActivityScreen;
