import React, { useMemo } from "react";
import {
  ActivityIndicator,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useAtomValue } from "jotai";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import Atoms from "@/app/AtomStore";
import HomeHeroSection from "@/components/unified/HomeHeroSection";
import CustomHeading from "@/components/commons/CustomHeading";
import CustomText from "@/components/commons/CustomText";
import ListingHorizontalWorkers from "@/components/commons/ListingHorizontalWorkers";
import ListingHorizontalServices from "@/components/commons/ListingHorizontalServices";
import EmptyDataPlaceholder from "@/components/commons/EmptyDataPlaceholder";
import ScrollHint from "@/components/commons/ScrollToRight";
import { WORKERTYPES } from "@/constants";
import SERVICE from "@/app/api/services";
import USER from "@/app/api/user";
import EMPLOYER from "@/app/api/employer";
import PULL_TO_REFRESH from "@/app/hooks/usePullToRefresh";
import { t } from "@/utils/translationHelper";
import SocialLinks from "@/components/commons/SocialLinks";
import {
  isCoreProfileIncomplete,
  isMediatorProfileIncomplete,
} from "@/constants/functions";
import APP_CONTEXT from "@/app/context/locale";
import HomePageLinks from "@/components/commons/HomePageLinks";

const HOME_HEADING = "#1F2E4D";
const CTA_OUTLINE_BORDER = "rgba(14, 79, 197, 0.35)";
const CTA_SOFT_BG = "#EAF2FF";
const CATEGORY_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  constructionWork: "construct-outline",
  factoryJobs: "business-outline",
  shopWork: "storefront-outline",
  farmingWork: "leaf-outline",
  generalLabour: "hammer-outline",
  homeMaintenance: "home-outline",
  driverJobs: "car-sport-outline",
  electricalRepair: "flash-outline",
};

const UnifiedHomeDashboard = () => {
  const { role, locale } = APP_CONTEXT.useApp();
  const userDetails = useAtomValue(Atoms.UserAtom);
  const {
    data: servicesRes,
    isLoading: loadingServices,
    isRefetching: refetchingServices,
    isFetchingNextPage: fetchingMoreServices,
    fetchNextPage: fetchMoreServices,
    hasNextPage: hasMoreServices,
    refetch: refetchServices,
  } = useInfiniteQuery({
    queryKey: ["unifiedHomeServices"],
    queryFn: ({ pageParam }) =>
      SERVICE.fetchAllServices({
        pageParam,
        status: "ACTIVE",
      }),
    initialPageParam: 1,
    retry: false,
    enabled: !!userDetails?._id && userDetails?.status === "ACTIVE",
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  const { data: categoryRes, isLoading: loadingCategories } = useQuery({
    queryKey: ["unifiedHomeServiceCategories"],
    queryFn: () => SERVICE.fetchServiceCategories(),
    retry: false,
    enabled:
      !!userDetails?._id &&
      userDetails?.status === "ACTIVE" &&
      (role === "WORKER" || role === "MEDIATOR"),
  });

  const {
    data: workersRes,
    isLoading: loadingWorkers,
    isFetchingNextPage: fetchingMoreWorkers,
    fetchNextPage: fetchMoreWorkers,
    hasNextPage: hasMoreWorkers,
  } = useInfiniteQuery({
    queryKey: ["unifiedHomeWorkers"],
    queryFn: ({ pageParam }) => USER.fetchAllUsers({ pageParam }),
    initialPageParam: 1,
    retry: false,
    enabled: !!userDetails?._id && userDetails?.status === "ACTIVE",
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  const serviceList = useMemo(
    () => servicesRes?.pages?.flatMap((p: any) => p.data || []) || [],
    [servicesRes],
  );

  const workerList = useMemo(
    () => workersRes?.pages?.flatMap((p: any) => p.data || []) || [],
    [workersRes],
  );
  const serviceCategories = useMemo(() => {
    const rows = Array.isArray(categoryRes?.data) ? categoryRes.data : [];
    return rows.filter((item: any) => item?.type);
  }, [categoryRes]);
  const getCategoryLabel = (rawType: string) => {
    const translated = t(rawType);
    if (translated && translated !== rawType) return translated;
    return rawType.replace(/([a-z])([A-Z])/g, "$1 $2");
  };
  const availableServicesCount =
    servicesRes?.pages?.[0]?.pagination?.total ?? serviceList?.length ?? 0;
  const hasAvailableServicesCount =
    typeof servicesRes?.pages?.[0]?.pagination?.total === "number";

  const {
    data: myPostedRes,
    isLoading: loadingMyPosted,
    isRefetching: refetchingMyPosted,
    refetch: refetchMyPosted,
  } = useInfiniteQuery({
    queryKey: ["unifiedHomeMyPostedServices", userDetails?._id],
    queryFn: ({ pageParam }) =>
      EMPLOYER.fetchMyServices({ pageParam, status: "HIRING" }),
    initialPageParam: 1,
    retry: false,
    enabled:
      !!userDetails?._id &&
      userDetails?.status === "ACTIVE" &&
      role === "EMPLOYER",
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
  const myPostedCount = myPostedRes?.pages?.[0]?.pagination?.total ?? 0;
  const hasMyPostedCount =
    typeof myPostedRes?.pages?.[0]?.pagination?.total === "number";

  const DASHBOARD_CONFIG: Record<string, any> = useMemo(() => {
    return {
      WORKER: {
        hero: {
          title: "dashboard.worker.heroTitle",
          subtitle: "dashboard.worker.heroSubtitle",
          count: availableServicesCount,
          countLoading:
            !hasAvailableServicesCount &&
            (loadingServices || refetchingServices),
          onPress: () =>
            router.push({ pathname: "/(tabs)/second", params: { tab: 0 } }),
        },
      },

      EMPLOYER: {
        hero: {
          title: "dashboard.employer.heroTitle",
          subtitle: "dashboard.employer.heroSubtitle",
          count: myPostedCount,
          countLoading:
            !hasMyPostedCount && (loadingMyPosted || refetchingMyPosted),
          onPress: () =>
            router.push({ pathname: "/(tabs)/fourth", params: { tab: 0 } }),
        },
      },

      MEDIATOR: {
        hero: {
          title: "dashboard.mediator.heroTitle",
          subtitle: "dashboard.mediator.heroSubtitle",
          count: availableServicesCount,
          countLoading:
            !hasAvailableServicesCount &&
            (loadingServices || refetchingServices),
          onPress: () =>
            router.push({ pathname: "/(tabs)/third", params: { tab: 1 } }),
        },
      },
    };
  }, [
    role,
    availableServicesCount,
    myPostedCount,
    loadingServices,
    refetchingServices,
    loadingMyPosted,
    refetchingMyPosted,
    hasAvailableServicesCount,
    hasMyPostedCount,
  ]);

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(
    async () => {
      await Promise.all([refetchServices()]);
      if (role === "EMPLOYER") await refetchMyPosted();
    },
  );

  const loadMoreServices = () => {
    if (hasMoreServices && !fetchingMoreServices) fetchMoreServices();
  };
  const loadMoreWorkers = () => {
    if (hasMoreWorkers && !fetchingMoreWorkers) fetchMoreWorkers();
  };

  const profileIncomplete =
    isCoreProfileIncomplete(userDetails as Record<string, unknown>) ||
    isMediatorProfileIncomplete(userDetails as Record<string, unknown>);

  const DashboardHeroCard = ({
    title,
    subtitle,
    count,
    countLoading,
    onPress,
  }: any) => (
    <TouchableOpacity
      style={styles.heroCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View>
        <CustomText
          baseFont={16}
          fontWeight="800"
          textAlign="left"
          style={styles.heroTitle}
        >
          {title}
        </CustomText>
        <CustomText baseFont={12} textAlign="left" style={styles.heroSubtitle}>
          {subtitle}
        </CustomText>
      </View>

      <View style={styles.heroRight}>
        {countLoading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <CustomText baseFont={22} fontWeight="900" style={styles.heroCount}>
            {count}
          </CustomText>
        )}
        <Ionicons name="chevron-forward" size={22} color="#fff" />
      </View>
    </TouchableOpacity>
  );

  const dashboard = useMemo(() => {
    return DASHBOARD_CONFIG[role] || DASHBOARD_CONFIG["WORKER"];
  }, [
    role,
    availableServicesCount,
    myPostedCount,
    loadingServices,
    refetchingServices,
    loadingMyPosted,
    refetchingMyPosted,
    hasAvailableServicesCount,
    hasMyPostedCount,
  ]);

  const dashboardSection = (
    <View style={styles.dashboardContainer}>
      <DashboardHeroCard
        title={t(dashboard.hero.title)}
        subtitle={t(dashboard.hero.subtitle)}
        count={dashboard.hero.count}
        countLoading={dashboard.hero.countLoading}
        onPress={dashboard.hero.onPress}
      />
    </View>
  );

  const categorySection =
    role === "WORKER" || role === "MEDIATOR" ? (
      <View style={styles.section}>
        <CustomHeading
          textAlign="left"
          baseFont={18}
          style={styles.sectionHeader}
          color={HOME_HEADING}
        >
          {t("serviceCategories")}
        </CustomHeading>
        {loadingCategories ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : serviceCategories.length > 0 ? (
          <View style={styles.categoryGrid}>
            {serviceCategories.map((category: any) => (
              <TouchableOpacity
                key={category.type}
                style={styles.categoryCard}
                activeOpacity={0.85}
                onPress={() =>
                  role === "WORKER"
                    ? router.push({
                        pathname: "/(tabs)/second",
                        params: {
                          categoryType: category.type,
                        },
                      })
                    : router.push({
                        pathname: "/screens/service",
                        params: {
                          title: "allServices",
                          type: "all",
                          searchCategory: JSON.stringify({
                            type: category.type,
                          }),
                        },
                      })
                }
              >
                <View style={styles.categoryIconWrap}>
                  <Ionicons
                    name={CATEGORY_ICON_MAP[category.type] || "grid-outline"}
                    size={18}
                    color="#0E4FC5"
                  />
                </View>
                <CustomText
                  fontWeight="800"
                  baseFont={13}
                  textAlign="left"
                  numberOfLines={1}
                  style={styles.categoryTitle}
                >
                  {getCategoryLabel(category.type)}
                </CustomText>
                <CustomText
                  baseFont={11}
                  color={Colors.subHeading}
                  textAlign="left"
                >
                  {category.count || 0} {t("services")}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    ) : null;

  // Helper component for a cleaner look
  const SectionLoader = () => (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="small" color={Colors.primary} />
    </View>
  );

  const servicesSection = (
    <View style={styles.section}>
      <CustomHeading
        textAlign="left"
        baseFont={18}
        color={HOME_HEADING}
        style={styles.sectionHeader}
      >
        {t("recommendedServices")}
      </CustomHeading>

      {loadingServices ? (
        <SectionLoader />
      ) : serviceList.length > 0 ? (
        <View style={styles.listWrapper}>
          <ListingHorizontalServices
            listings={serviceList as any}
            loadMore={loadMoreServices}
            isFetchingNextPage={fetchingMoreServices}
          />
          <ScrollHint />
        </View>
      ) : (
        <EmptyDataPlaceholder title="service" />
      )}
    </View>
  );

  const workersSection = (
    <View style={styles.section}>
      <CustomHeading
        textAlign="left"
        baseFont={18}
        color={HOME_HEADING}
        style={styles.sectionHeader}
      >
        {t("nearbyWorkers")}
      </CustomHeading>

      {loadingWorkers ? (
        <SectionLoader />
      ) : workerList.length > 0 ? (
        <View style={styles.listWrapper}>
          <ListingHorizontalWorkers
            availableInterest={WORKERTYPES}
            listings={workerList as any}
            loadMore={loadMoreWorkers}
            isFetchingNextPage={fetchingMoreWorkers}
          />
          <ScrollHint />
        </View>
      ) : (
        <EmptyDataPlaceholder title="worker" />
      )}
    </View>
  );

  const workerTeamJoinSection =
    role === "WORKER" ? (
      <View style={styles.teamSection}>
        <CustomHeading textAlign="left" baseFont={17} color={HOME_HEADING}>
          {t("homeTeamSectionTitle")}
        </CustomHeading>
        <TouchableOpacity
          style={styles.teamCard}
          activeOpacity={0.88}
          onPress={() =>
            router.push({
              pathname: "/screens/teamRequests",
              params: {
                title: "teamJoiningRequest",
                initialCategory: "RECEIVED",
              },
            })
          }
        >
          <View style={styles.teamCardIcon}>
            <Ionicons
              name="mail-unread-outline"
              size={22}
              color={Colors.primary}
            />
          </View>
          <View style={styles.teamCardText}>
            <CustomText fontWeight="800" baseFont={15}>
              {t("homeTeamInvitesTitle")}
            </CustomText>
            <CustomText
              baseFont={12}
              color={Colors.subHeading}
              style={{ marginTop: 2 }}
            >
              {t("homeTeamInvitesSubtitle")}
            </CustomText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={22}
            color={Colors.subHeading}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.teamCard, styles.teamCardMuted]}
          activeOpacity={0.88}
          onPress={() => router.push({ pathname: "/(tabs)/third" })}
        >
          <View style={styles.teamCardIcon}>
            <Ionicons name="people-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.teamCardText}>
            <CustomText fontWeight="800" baseFont={15}>
              {t("homeTeamBrowseTitle")}
            </CustomText>
            <CustomText
              baseFont={12}
              color={Colors.subHeading}
              style={{ marginTop: 2 }}
            >
              {t("homeTeamBrowseSubtitle")}
            </CustomText>
          </View>
          <Ionicons
            name="chevron-forward"
            size={22}
            color={Colors.subHeading}
          />
        </TouchableOpacity>
      </View>
    ) : null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || refetchingServices}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <HomeHeroSection userDetails={userDetails as any} />
          <View style={styles.contentSurface}>
            {profileIncomplete && (
              <View style={styles.sectionGap}>
                <TouchableOpacity
                  style={styles.completeProfileBanner}
                  onPress={() => router.push("/screens/profile" as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.completeProfileIcon}>
                    <Ionicons name="person-outline" size={20} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <CustomHeading
                      baseFont={14}
                      textAlign="left"
                      style={{ color: "#4C1D95" }}
                      fontWeight="800"
                    >
                      {t("completeProfileTitle")}
                    </CustomHeading>
                    <CustomText baseFont={12} color="#6D28D9" textAlign="left">
                      {t("completeProfileSubtitle")}
                    </CustomText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#7C3AED" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.sectionGap}>{dashboardSection}</View>
            <HomePageLinks />

            {workerTeamJoinSection ? (
              <View style={styles.sectionGap}>{workerTeamJoinSection}</View>
            ) : null}

            {categorySection ? (
              <View style={styles.sectionGap}>{categorySection}</View>
            ) : null}

            {userDetails?.role !== "EMPLOYER" ? (
              <View style={styles.sectionGap}>{servicesSection}</View>
            ) : null}
            <View style={styles.sectionGap}>{workersSection}</View>

            <View style={styles.sectionGap}>
              <SocialLinks />
            </View>
            <View style={{ height: 50 }} />
            <CustomText style={styles.copyright}>
              © 2024 Apna Rojgar. All rights reserved.
            </CustomText>
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF4FF" },
  scroll: { paddingBottom: 24, paddingHorizontal: 16, paddingTop: 0 },
  contentSurface: {
    backgroundColor: "#EEF4FF",
    marginHorizontal: -16,
    marginTop: 0,
    paddingHorizontal: 10,
    paddingTop: 16,
  },

  section: {
    marginVertical: 12,
    backgroundColor: "transparent",
  },
  sectionHeader: {
    marginBottom: 10,
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  loaderContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  listWrapper: {
    marginTop: 4,
    paddingBottom: 8,
  },
  scrollHintContainer: {
    alignItems: "center",
    marginTop: 8,
    opacity: 0.6,
  },
  sectionGap: { marginBottom: 16 },
  ctaStack: { gap: 12 },
  ctaRowPair: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  ctaPill: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 24,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaFlex: { flex: 1, minWidth: 0 },
  ctaFull: { width: "100%" },
  ctaOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: CTA_OUTLINE_BORDER,
    shadowColor: "#0E4FC5",
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  ctaSoft: {
    backgroundColor: CTA_SOFT_BG,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.2)",
  },
  ctaSolid: {
    backgroundColor: "#0E4FC5",
    shadowColor: "#0E4FC5",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  ctaMyServices: {
    flex: 1,
    backgroundColor: "#ECFDF5",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#6EE7B7",
  },
  teamSection: { gap: 12 },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(14, 79, 197, 0.14)",
    shadowColor: "#0E4FC5",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  teamCardMuted: {
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  teamCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(14, 79, 197, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  teamCardText: { flex: 1 },

  /* Complete profile banner */
  completeProfileBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F5F3FF",
    borderWidth: 1,
    borderColor: "#C4B5FD",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  completeProfileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Quick-action pill row */
  quickActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  quickBtnShare: {
    backgroundColor: "#EAF2FF",
    borderColor: "rgba(14,79,197,0.25)",
  },
  quickBtnWA: {
    backgroundColor: "#F0FBF3",
    borderColor: "#B2ECC0",
  },
  quickBtnIG: {
    backgroundColor: "#FFF1F5",
    borderColor: "#F7B8CC",
  },
  dashboardContainer: {
    marginBottom: 16,
  },

  /* HERO CARD */
  heroCard: {
    backgroundColor: "#0E4FC5",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    shadowColor: "#0E4FC5",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  heroTitle: {
    color: "#fff",
  },

  heroSubtitle: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  heroRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  heroCount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
  },
  copyright: {
    textAlign: "center",
    marginBottom: 16,
    color: "#666",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.16)",
    gap: 6,
    shadowColor: "#0E4FC5",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  categoryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(14,79,197,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  categoryTitle: {
    color: "#172B57",
  },
});

export default UnifiedHomeDashboard;
