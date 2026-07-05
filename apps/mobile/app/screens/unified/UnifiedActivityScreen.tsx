/**
 * Activity tab — role-based sections with icon tabs and rich empty states.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Colors from "@/constants/Colors";
import Atoms from "@/app/AtomStore";
import WORKER from "@/app/api/workers";
import EMPLOYER from "@/app/api/employer";
import MEDIATOR from "@/app/api/mediator";
import PULL_TO_REFRESH from "@/app/hooks/usePullToRefresh";
import { getToken } from "@/utils/authStorage";
import { t } from "@/utils/translationHelper";
import APP_CONTEXT from "@/app/context/locale";
import { flattenPaginatedPages } from "@/utils/paginatedApi";
import { canUserActAsMediator, resolveDisplayUserRole } from "@/utils/resolveDisplayUserRole";
import ListingsServices from "@/components/commons/ListingServices";
import ListingsVerticalServices from "@/components/commons/ListingsVerticalServices";
import ListingsVerticalBookings from "@/components/commons/ListingVerticalBookings";
import ListingsBookedWorkers from "@/components/commons/ListingBookedWorkers";
import ListingsServicesPlaceholder from "@/components/commons/LoadingPlaceholders/ListingServicePlaceholder";
import CustomText from "@/components/commons/CustomText";
import CustomHeading from "@/components/commons/CustomHeading";

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
    Animated.timing(o, {
      toValue: 1,
      duration: 340,
      useNativeDriver: true,
    }).start();
  }, [o]);
  return (
    <Animated.View style={[{ opacity: o }, { flex: 1 }]}>
      {children}
    </Animated.View>
  );
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
    marginHorizontal: 10,
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
        style={[
          emptyStyles.cta,
          { backgroundColor: cfg.ctaColor ?? Colors.primary },
        ]}
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


const BOOKING_REQUESTS_HINT: Record<ApiRole, string> = {
  WORKER: "activityBookingRequestsHintWorker",
  EMPLOYER: "activityBookingRequestsHintEmployer",
  MEDIATOR: "activityBookingRequestsHintMediator",
};

const BookingRequestsEntry = ({
  role,
  activityTab,
}: {
  role: ApiRole;
  activityTab: number;
}) => (
  <TouchableOpacity
    style={requestsEntryStyles.card}
    activeOpacity={0.88}
    onPress={() => {
      router.setParams({ tab: String(activityTab) });
      router.push({
        pathname: "/screens/bookings/directBookingRequests",
        params: { role, returnTab: String(activityTab) },
      });
    }}
  >
    <View style={requestsEntryStyles.iconWrap}>
      <Ionicons name="mail-unread-outline" size={22} color={Colors.primary} />
    </View>
    <View style={requestsEntryStyles.textWrap}>
      <CustomText baseFont={14} fontWeight="700" color={Colors.primary}>
        {t("activityOpenBookingRequests")}
      </CustomText>
      <CustomText baseFont={12} color={Colors.subHeading} numberOfLines={2}>
        {t(BOOKING_REQUESTS_HINT[role])}
      </CustomText>
    </View>
    <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
  </TouchableOpacity>
);

const requestsEntryStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.12)",
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
});

const ConfirmedBookingsTab = ({
  role,
  activityTab,
}: {
  role: ApiRole;
  activityTab: number;
}) => {
  const userDetails = useAtomValue(Atoms.UserAtom);

  const employerBookedQ = useInfiniteQuery({
    queryKey: ["activityEmployerBookings", userDetails?._id],
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken();
      if (!token || !userDetails?._id) throw new Error("Unauthorized");
      return EMPLOYER.fetchAllBookedWorkers({ pageParam, token });
    },
    initialPageParam: 1,
    enabled: !!userDetails?._id && role === "EMPLOYER",
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const workerBookedQ = useInfiniteQuery({
    queryKey: ["activityWorkerConfirmedBookings", userDetails?._id],
    queryFn: async ({ pageParam = 1 }) =>
      WORKER.fetchAllMyBookings({ pageParam }),
    initialPageParam: 1,
    enabled: !!userDetails?._id && role === "WORKER",
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const mediatorBookedQ = useInfiniteQuery({
    queryKey: ["activityMedBooked", userDetails?._id],
    queryFn: ({ pageParam = 1 }) =>
      MEDIATOR.fetchMyBookingsAsMediator({ pageParam }),
    initialPageParam: 1,
    enabled: !!userDetails?._id && role === "MEDIATOR",
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const activeQuery =
    role === "EMPLOYER"
      ? employerBookedQ
      : role === "WORKER"
        ? workerBookedQ
        : mediatorBookedQ;

  useFocusEffect(
    useCallback(() => {
      activeQuery.refetch();
    }, [activeQuery.refetch]),
  );

  const bookedList = useMemo(() => {
    if (role === "WORKER") {
      return flattenPaginatedPages(workerBookedQ.data?.pages);
    }
    if (role === "MEDIATOR") {
      return flattenPaginatedPages(mediatorBookedQ.data?.pages);
    }
    return flattenPaginatedPages(employerBookedQ.data?.pages);
  }, [role, employerBookedQ.data, workerBookedQ.data, mediatorBookedQ.data]);

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(
    activeQuery.refetch,
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Colors.primary}
    />
  );

  const loadMore = () => {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      activeQuery.fetchNextPage();
    }
  };

  const isLoading =
    activeQuery.isLoading &&
    !(activeQuery.data as { pages?: unknown[] } | undefined)?.pages;

  const emptyConfig = (): EmptyStateConfig => {
    if (role === "MEDIATOR") {
      return {
        icon: "calendar-outline",
        iconColor: "#7C3AED",
        iconBg: "#F5F3FF",
        title: t("activityTabMedBookedTitle"),
        message: t("activityEmptyLineBooked"),
        ctaLabel: t("browseWorkers"),
        ctaIcon: "search-outline",
        ctaColor: "#7C3AED",
        onCta: () => router.push("/(tabs)/second"),
      };
    }
    if (role === "WORKER") {
      return {
        icon: "briefcase-outline",
        iconColor: "#7C3AED",
        iconBg: "#F5F3FF",
        title: t("activityTabWorkerBookingTitle"),
        message: t("activityEmptyLineBooked"),
        ctaLabel: t("browseJobs"),
        ctaIcon: "search-outline",
        ctaColor: "#7C3AED",
        onCta: () => router.push("/(tabs)/second"),
      };
    }
    return {
      icon: "people-outline",
      iconColor: "#2563EB",
      iconBg: "#EEF4FF",
      title: t("noBookedWorkersTitle"),
      message: t("noBookedWorkersMessage"),
      ctaLabel: t("browseWorkers"),
      ctaIcon: "search-outline",
      ctaColor: "#2563EB",
      onCta: () => router.push("/(tabs)/second"),
    };
  };

  return (
    <View style={{ flex: 1 }}>
      <BookingRequestsEntry role={role} activityTab={activityTab} />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : bookedList.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={refreshControl}
        >
          <RichEmptyState {...emptyConfig()} />
        </ScrollView>
      ) : role === "MEDIATOR" ? (
        <FlatList
          data={bookedList}
          keyExtractor={(it: any) => String(it?._id ?? "")}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ListingsBookedWorkers
                title="bookingDetails"
                item={item}
                showEngagementStrip
              />
            </View>
          )}
          contentContainerStyle={styles.listInner}
          refreshControl={refreshControl}
          onEndReached={loadMore}
          onEndReachedThreshold={0.25}
          ListFooterComponent={
            activeQuery.isFetchingNextPage ? (
              <ActivityIndicator
                color={Colors.primary}
                style={{ padding: 16 }}
              />
            ) : (
              <View style={{ height: 80 }} />
            )
          }
        />
      ) : (
        <ListingsVerticalBookings
          listings={bookedList}
          loadMore={loadMore}
          isFetchingNextPage={activeQuery.isFetchingNextPage}
          isLoading={false}
          refreshControl={refreshControl}
          showEngagementStrip
        />
      )}
    </View>
  );
};

const useTabWithParams = (DEFAULT_TAB: number) => {
  const params = useLocalSearchParams();
  const [tab, setTab] = useState(() => {
    if (params?.tab !== undefined && params.tab !== "") {
      const nextTab = Number(params.tab);
      if (!isNaN(nextTab)) return nextTab;
    }
    return DEFAULT_TAB;
  });

  useFocusEffect(
    useCallback(() => {
      if (params?.tab !== undefined && params.tab !== "") {
        const nextTab = Number(params.tab);
        if (!isNaN(nextTab)) {
          setTab(nextTab);
        }
      }
    }, [params?.tab]),
  );

  return { tab, setTab };
};

/* ─────────────────────────────────────────
   Worker
───────────────────────────────────────── */
const WORKER_TABS: TabDef[] = [
  { labelKey: "activityTabWorkerAppliedServices", icon: "checkmark-circle-outline" },
  { labelKey: "activityTabWorkerMyBookings", icon: "calendar-outline" },
];

const WorkerActivity = () => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const { tab, setTab } = useTabWithParams(0);
  const appliedQ = useInfiniteQuery({
    queryKey: ["activityWorkerApplied", userDetails?._id],
    queryFn: async ({ pageParam = 1 }) =>
      WORKER.fetchMyAppliedServices({ pageParam }),
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
      appliedQ.refetch();
    }, [appliedQ.refetch]),
  );

  const services = useMemo(
    () => dedupeById(flattenPaginatedPages(appliedQ.data?.pages)),
    [appliedQ.data],
  );

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(
    appliedQ.refetch,
  );

  if (appliedQ.isLoading && !appliedQ.data)
    return <ListingsServicesPlaceholder />;

  return (
    <FadeIn>
      <View style={styles.panel}>
        <IconTabBar tabs={WORKER_TABS} selected={tab} onChange={setTab} />

        <View style={styles.body}>
          {tab === 0 ? (
            services.length === 0 ? (
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={Colors.primary}
                  />
                }
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
                />
              </ScrollView>
            ) : (
              <FlatList
                data={services}
                keyExtractor={(it: any) => String(it?._id ?? "")}
                renderItem={({ item }) => (
                  <View style={styles.cardWrap}>
                    <ListingsServices item={item} />
                  </View>
                )}
                contentContainerStyle={styles.listInner}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={Colors.primary}
                  />
                }
                onEndReached={() =>
                  appliedQ.hasNextPage &&
                  !appliedQ.isFetchingNextPage &&
                  appliedQ.fetchNextPage()
                }
                onEndReachedThreshold={0.25}
                ListFooterComponent={
                  appliedQ.isFetchingNextPage ? (
                    <ActivityIndicator
                      color={Colors.primary}
                      style={{ padding: 16 }}
                    />
                  ) : (
                    <View style={{ height: 80 }} />
                  )
                }
              />
            )
          ) : null}

          {tab === 1 ? <ConfirmedBookingsTab role="WORKER" activityTab={1} /> : null}
        </View>
      </View>
    </FadeIn>
  );
};

/* ─────────────────────────────────────────
   Employer
───────────────────────────────────────── */
const EMPLOYER_TABS: TabDef[] = [
  { labelKey: "myServices", icon: "briefcase-outline" },
  { labelKey: "bookedWorkers", icon: "people-outline" },
];

const EmployerActivity = () => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const { tab, setTab } = useTabWithParams(0);
  const servicesQ = useInfiniteQuery({
    queryKey: ["activityEmployerServices", userDetails?._id],
    queryFn: async ({ pageParam = 1 }) =>
      EMPLOYER.fetchMyServices({ pageParam, status: "HIRING" }),
    initialPageParam: 1,
    enabled: !!userDetails?._id,
    retry: 1,
    staleTime: 0,
    refetchOnMount: "always",
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  useFocusEffect(
    useCallback(() => {
      servicesQ.refetch();
    }, [servicesQ.refetch]),
  );

  const services = useMemo(
    () => dedupeById(flattenPaginatedPages(servicesQ.data?.pages)),
    [servicesQ.data],
  );

  const { refreshing: refreshingS, onRefresh: onRefreshS } =
    PULL_TO_REFRESH.usePullToRefresh(servicesQ.refetch);

  if (servicesQ.isLoading && !servicesQ.data)
    return <ListingsServicesPlaceholder />;

  if (servicesQ.isError && !services.length) {
    return (
      <FadeIn>
        <View style={styles.panel}>
          <IconTabBar tabs={EMPLOYER_TABS} selected={tab} onChange={setTab} />
          <View style={styles.body}>
            <RichEmptyState
              icon="cloud-offline-outline"
              iconColor="#DC2626"
              iconBg="#FEE2E2"
              title={t("serviceCreateFailed")}
              message={t("noCreatedServicesMessage")}
              ctaLabel={t("refresh")}
              ctaIcon="refresh-outline"
              ctaColor="#DC2626"
              onCta={() => servicesQ.refetch()}
            />
          </View>
        </View>
      </FadeIn>
    );
  }

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
                refreshControl={
                  <RefreshControl
                    refreshing={refreshingS}
                    onRefresh={onRefreshS}
                    tintColor={Colors.primary}
                  />
                }
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
                  onSecondaryCta={() => router.push("/(tabs)/second")}
                />
              </ScrollView>
            ) : (
              <ListingsVerticalServices
                listings={services as any}
                loadMore={() =>
                  servicesQ.hasNextPage &&
                  !servicesQ.isFetchingNextPage &&
                  servicesQ.fetchNextPage()
                }
                isFetchingNextPage={servicesQ.isFetchingNextPage}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshingS}
                    onRefresh={onRefreshS}
                    tintColor={Colors.primary}
                  />
                }
              />
            )
          ) : null}

          {/* ── Bookings tab ── */}
          {tab === 1 ? (
            <ConfirmedBookingsTab role="EMPLOYER" activityTab={1} />
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
  { labelKey: "myServices", icon: "people-outline" },
  { labelKey: "activityTabApplied", icon: "briefcase-outline" },
  { labelKey: "activityTabBooked", icon: "calendar-outline" },
];

const MediatorActivity = () => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const { tab, setTab } = useTabWithParams(0);

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

  const servicesQ = useInfiniteQuery({
    queryKey: ["activityMediatorServices", userDetails?._id],
    queryFn: async ({ pageParam = 1 }) =>
      EMPLOYER.fetchMyServices({ pageParam, status: "HIRING" }),
    initialPageParam: 1,
    enabled: !!userDetails?._id,
    retry: 1,
    staleTime: 0,
    refetchOnMount: "always",
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  useFocusEffect(
    useCallback(() => {
      appliedQ.refetch();
      servicesQ.refetch();
    }, [appliedQ.refetch, servicesQ.refetch]),
  );

  const applied = useMemo(
    () => dedupeById(flattenPaginatedPages(appliedQ.data?.pages)),
    [appliedQ.data],
  );
  const postedServices = useMemo(
    () => dedupeById(flattenPaginatedPages(servicesQ.data?.pages)),
    [servicesQ.data],
  );

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(
    async () => {
      await Promise.all([appliedQ.refetch(), servicesQ.refetch()]);
    },
  );

  const onEndReached = () => {
    if (tab === 0 && servicesQ.hasNextPage && !servicesQ.isFetchingNextPage)
      servicesQ.fetchNextPage();
    else if (tab === 1 && appliedQ.hasNextPage && !appliedQ.isFetchingNextPage)
      appliedQ.fetchNextPage();
  };

  if (
    (servicesQ.isLoading && !servicesQ.data) ||
    (appliedQ.isLoading && !appliedQ.data)
  )
    return <ListingsServicesPlaceholder />;

  return (
    <FadeIn>
      <View style={styles.panel}>
        <IconTabBar tabs={MEDIATOR_TABS} selected={tab} onChange={setTab} />

        <View style={styles.body}>
          {/* Tab 0 — works posted by this mediator */}
          {tab === 0 ? (
            postedServices.length === 0 ? (
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={Colors.primary}
                  />
                }
              >
                <RichEmptyState
                  icon="briefcase-outline"
                  iconColor="#059669"
                  iconBg="#ECFDF5"
                  title={t("myServices")}
                  message={t("noCreatedServicesMessage")}
                  ctaLabel={t("createNewService")}
                  ctaIcon="add-circle-outline"
                  ctaColor="#059669"
                  onCta={() => router.push("/screens/addService")}
                />
              </ScrollView>
            ) : (
              <ListingsVerticalServices
                listings={postedServices as any}
                loadMore={() =>
                  servicesQ.hasNextPage &&
                  !servicesQ.isFetchingNextPage &&
                  servicesQ.fetchNextPage()
                }
                isFetchingNextPage={servicesQ.isFetchingNextPage}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={Colors.primary}
                  />
                }
              />
            )
          ) : null}

          {/* Tab 1 — works applied for as a mediator */}
          {tab === 1 ? (
            applied.length === 0 ? (
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={Colors.primary}
                  />
                }
              >
                <RichEmptyState
                  icon="briefcase-outline"
                  iconColor="#2563EB"
                  iconBg="#EEF4FF"
                  title={t("activityTabMedAppliedTitle")}
                  message={t("activityEmptyLineApplied")}
                  ctaLabel={t("browseJobs")}
                  ctaIcon="search-outline"
                  ctaColor="#2563EB"
                  onCta={() => router.push("/(tabs)/third")}
                />
              </ScrollView>
            ) : (
              <FlatList
                data={applied}
                keyExtractor={(it: any) => it._id}
                renderItem={({ item }) => (
                  <View style={styles.cardWrap}>
                    <ListingsServices item={item} />
                  </View>
                )}
                contentContainerStyle={styles.listInner}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={Colors.primary}
                  />
                }
                onEndReached={onEndReached}
                onEndReachedThreshold={0.25}
                ListFooterComponent={
                  appliedQ.isFetchingNextPage ? (
                    <ActivityIndicator
                      color={Colors.primary}
                      style={{ padding: 16 }}
                    />
                  ) : (
                    <View style={{ height: 80 }} />
                  )
                }
              />
            )
          ) : null}

          {tab === 2 ? (
            <ConfirmedBookingsTab role="MEDIATOR" activityTab={2} />
          ) : null}
        </View>
      </View>
    </FadeIn>
  );
};

/* ─────────────────────────────────────────
   Root
───────────────────────────────────────── */
const resolveActivityRole = (
  userDetails: Record<string, unknown> | null | undefined,
  appRole: string,
): ApiRole => {
  const normalizedAppRole = String(appRole ?? "")
    .toUpperCase()
    .trim();
  if (
    normalizedAppRole === "WORKER" ||
    normalizedAppRole === "EMPLOYER" ||
    normalizedAppRole === "MEDIATOR"
  ) {
    return normalizedAppRole;
  }

  const profile = {
    role: userDetails?.role || appRole,
    skills: userDetails?.skills,
  };
  const inferredRole = resolveDisplayUserRole(profile);
  const hasPostedServices =
    Number(
      (userDetails?.serviceDetails as { byService?: { total?: number } })
        ?.byService?.total,
    ) > 0;

  if (canUserActAsMediator(profile)) {
    return "MEDIATOR";
  }
  if (inferredRole === "EMPLOYER" || hasPostedServices) {
    return "EMPLOYER";
  }
  return inferredRole;
};

const UnifiedActivityScreen = () => {
  const { locale, role: appRole } = APP_CONTEXT.useApp();
  const userDetails = useAtomValue(Atoms.UserAtom);
  const role = resolveActivityRole(userDetails, appRole);
  // Ensure all translated labels in this screen refresh on locale change.
  void locale;

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
  body: { flex: 1, paddingHorizontal: 10 },
  loading: {
    flex: 1,
    paddingTop: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  listInner: {
    paddingHorizontal: 10,
    paddingBottom: 100,
    paddingTop: 6,
    flexGrow: 1,
  },
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
