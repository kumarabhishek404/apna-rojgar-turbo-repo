/**
 * Unified home: same sections for everyone; order and CTA emphasis follow userDetails.role (API).
 */
import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Linking,
} from "react-native";
import { useAtomValue } from "jotai";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
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
import PULL_TO_REFRESH from "@/app/hooks/usePullToRefresh";
import { t } from "@/utils/translationHelper";
import SocialLinks from "@/components/commons/SocialLinks";
import { isCoreProfileIncomplete } from "@/constants/functions";

const APP_LINK = "https://play.google.com/store/apps/details?id=com.apnarojgar";

const HOME_HEADING = "#1F2E4D";
const CTA_OUTLINE_BORDER = "rgba(14, 79, 197, 0.35)";
const CTA_SOFT_BG = "#EAF2FF";

const UnifiedHomeDashboard = () => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const role = (userDetails?.role || "WORKER") as
    | "WORKER"
    | "EMPLOYER"
    | "MEDIATOR";

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

  const {
    data: workersRes,
    isLoading: loadingWorkers,
    isRefetching: refetchingWorkers,
    isFetchingNextPage: fetchingMoreWorkers,
    fetchNextPage: fetchMoreWorkers,
    hasNextPage: hasMoreWorkers,
    refetch: refetchWorkers,
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

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(
    async () => {
      await Promise.all([refetchServices(), refetchWorkers()]);
    },
  );

  const loadMoreServices = () => {
    if (hasMoreServices && !fetchingMoreServices) fetchMoreServices();
  };
  const loadMoreWorkers = () => {
    if (hasMoreWorkers && !fetchingMoreWorkers) fetchMoreWorkers();
  };

  const profileIncomplete = isCoreProfileIncomplete(
    userDetails as Record<string, unknown>
  );

  const shareAppLink = async () => {
    try {
      await Share.share({
        message: `Join me on Apna Rojgar — find work or hire workers near you!\n${APP_LINK}`,
        url: APP_LINK,
      });
    } catch (e) {
      console.warn("Share failed", e);
    }
  };

  const openUrl = async (url: string) => {
    try {
      if (await Linking.canOpenURL(url)) Linking.openURL(url);
    } catch (e) {}
  };

  const findWorkCta = (
    <TouchableOpacity
      style={[styles.ctaPill, styles.ctaOutline, styles.ctaFlex]}
      onPress={() => router.push({ pathname: "/(tabs)/second" })}
      activeOpacity={0.88}
    >
      <CustomText color={Colors.primary} fontWeight="800" baseFont={14}>
        {t("findWork")}
      </CustomText>
    </TouchableOpacity>
  );

  const postWorkCta = (
    <TouchableOpacity
      style={[styles.ctaPill, styles.ctaSolid, styles.ctaFlex]}
      onPress={() => router.push({ pathname: "/screens/addService" })}
      activeOpacity={0.88}
    >
      <CustomText color={Colors.white} fontWeight="800" baseFont={14}>
        {t("postWork")}
      </CustomText>
    </TouchableOpacity>
  );

  const searchWorkersCta = (fullWidth: boolean) => (
    <TouchableOpacity
      style={[
        styles.ctaPill,
        styles.ctaSoft,
        fullWidth ? styles.ctaFull : styles.ctaFlex,
      ]}
      onPress={() => router.push({ pathname: "/(tabs)/third" })}
      activeOpacity={0.88}
    >
      <CustomText color={Colors.primary} fontWeight="800" baseFont={14}>
        {t("searchWorkersTitle")}
      </CustomText>
    </TouchableOpacity>
  );

  const myServicesCta = (
    <TouchableOpacity
      style={[styles.ctaPill, styles.ctaMyServices]}
      onPress={() => router.push({ pathname: "/(tabs)/fourth" } as any)}
      activeOpacity={0.88}
    >
      <Ionicons name="briefcase-outline" size={16} color="#059669" />
      <CustomText color="#059669" fontWeight="800" baseFont={14}>
        {t("myServices")}
      </CustomText>
    </TouchableOpacity>
  );

  /** Role priority: employer → post first; worker → find first; mediator → two-row layout. */
  const primaryCta =
    role === "MEDIATOR" ? (
      <View style={styles.ctaStack}>
        <View style={styles.ctaRowPair}>
          {findWorkCta}
          {postWorkCta}
        </View>
        <View style={styles.ctaRowPair}>
          {searchWorkersCta(false)}
          {myServicesCta}
        </View>
      </View>
    ) : (
      <View style={styles.ctaStack}>
        <View style={styles.ctaRowPair}>
          {role === "WORKER" && findWorkCta}
          {role === "EMPLOYER" && postWorkCta}
          {searchWorkersCta(false)}
        </View>
        {role === "EMPLOYER" && (
          <View style={styles.ctaRowPair}>
            {myServicesCta}
          </View>
        )}
      </View>
    );

  const servicesSection = (
    <View style={styles.section}>
      <CustomHeading textAlign="left" baseFont={18} color={HOME_HEADING}>
        {t("recommendedServices")}
      </CustomHeading>
      {loadingServices ? null : serviceList.length > 0 ? (
        <ListingHorizontalServices
          listings={serviceList as any}
          loadMore={loadMoreServices}
          isFetchingNextPage={fetchingMoreServices}
        />
      ) : (
        <EmptyDataPlaceholder title="service" />
      )}
    </View>
  );

  const workersSection = (
    <View style={styles.section}>
      <CustomHeading textAlign="left" baseFont={18} color={HOME_HEADING}>
        {t("nearbyWorkers")}
      </CustomHeading>
      {loadingWorkers ? null : workerList.length > 0 ? (
        <>
          <ListingHorizontalWorkers
            availableInterest={WORKERTYPES}
            listings={workerList as any}
            loadMore={loadMoreWorkers}
            isFetchingNextPage={fetchingMoreWorkers}
          />
          <ScrollHint />
        </>
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
            <Ionicons name="mail-unread-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.teamCardText}>
            <CustomText fontWeight="800" baseFont={15}>
              {t("homeTeamInvitesTitle")}
            </CustomText>
            <CustomText baseFont={12} color={Colors.subHeading} style={{ marginTop: 2 }}>
              {t("homeTeamInvitesSubtitle")}
            </CustomText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={Colors.subHeading} />
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
            <CustomText baseFont={12} color={Colors.subHeading} style={{ marginTop: 2 }}>
              {t("homeTeamBrowseSubtitle")}
            </CustomText>
          </View>
          <Ionicons name="chevron-forward" size={22} color={Colors.subHeading} />
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
              refreshing={
                refreshing || refetchingServices || refetchingWorkers
              }
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <HomeHeroSection userDetails={userDetails as any} />
          <View style={styles.contentSurface}>
            {/* Complete profile banner — only when profile incomplete */}
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
                    <CustomHeading baseFont={14} textAlign="left" style={{ color: "#4C1D95" }}>
                      Complete Your Profile
                    </CustomHeading>
                    <CustomText baseFont={12} color="#6D28D9">
                      Add skills, address & more to get noticed
                    </CustomText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#7C3AED" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.sectionGap}>{primaryCta}</View>

            {/* Share app + social quick-actions */}
            <View style={[styles.sectionGap, styles.quickActionsRow]}>
              {/* Share app link */}
              <TouchableOpacity
                style={[styles.quickBtn, styles.quickBtnShare]}
                onPress={shareAppLink}
                activeOpacity={0.82}
              >
                <MaterialCommunityIcons name="share-variant" size={18} color="#0E4FC5" />
                <CustomText baseFont={12} fontWeight="700" color="#0E4FC5">
                  Share App
                </CustomText>
              </TouchableOpacity>

              {/* WhatsApp */}
              <TouchableOpacity
                style={[styles.quickBtn, styles.quickBtnWA]}
                onPress={() => openUrl("https://chat.whatsapp.com/E5IuGZ8EXJR5ZO490tlfoD?mode=gi_t")}
                activeOpacity={0.82}
              >
                <FontAwesome5 name="whatsapp" size={18} color="#25D366" />
                <CustomText baseFont={12} fontWeight="700" color="#25D366">
                  WhatsApp
                </CustomText>
              </TouchableOpacity>

              {/* Instagram */}
              <TouchableOpacity
                style={[styles.quickBtn, styles.quickBtnIG]}
                onPress={() => openUrl("https://instagram.com/apnarojgarindia")}
                activeOpacity={0.82}
              >
                <FontAwesome5 name="instagram" size={18} color="#E1306C" />
                <CustomText baseFont={12} fontWeight="700" color="#E1306C">
                  Instagram
                </CustomText>
              </TouchableOpacity>
            </View>

            {workerTeamJoinSection ? (
              <View style={styles.sectionGap}>{workerTeamJoinSection}</View>
            ) : null}
            <View style={styles.sectionGap}>{servicesSection}</View>
            <View style={styles.sectionGap}>{workersSection}</View>
            <View style={styles.sectionGap}>
              <SocialLinks />
            </View>
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EEF4FF" },
  scroll: { paddingBottom: 24, paddingHorizontal: 16, paddingTop: 8 },
  contentSurface: {
    backgroundColor: "#EEF4FF",
    marginHorizontal: -16,
    marginTop: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: { gap: 8 },
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
});

export default UnifiedHomeDashboard;
