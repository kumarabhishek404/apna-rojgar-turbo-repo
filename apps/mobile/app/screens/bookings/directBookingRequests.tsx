/**
 * Direct booking requests — sent / received sub-tabs by role.
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Colors from "@/constants/Colors";
import Atoms from "@/app/AtomStore";
import WORKER from "@/app/api/workers";
import EMPLOYER from "@/app/api/employer";
import PULL_TO_REFRESH from "@/app/hooks/usePullToRefresh";
import { t } from "@/utils/translationHelper";
import ListingsVerticalBookings from "@/components/commons/ListingVerticalBookings";
import CustomText from "@/components/commons/CustomText";
import CustomHeading from "@/components/commons/CustomHeading";
import CustomHeader from "@/components/commons/Header";
import { router } from "expo-router";

type ApiRole = "WORKER" | "EMPLOYER" | "MEDIATOR";
type RequestMode = "received" | "sent";

const REQUEST_MODES: Record<ApiRole, RequestMode[]> = {
  WORKER: ["received"],
  EMPLOYER: ["sent"],
  MEDIATOR: ["received", "sent"],
};

const MODE_LABELS: Record<RequestMode, string> = {
  received: "directBookingReceivedSubTab",
  sent: "directBookingSentSubTab",
};

const RequestSubTabBar = ({
  modes,
  selected,
  onChange,
}: {
  modes: RequestMode[];
  selected: RequestMode;
  onChange: (mode: RequestMode) => void;
}) => {
  if (modes.length <= 1) {
    return (
      <View style={styles.singleTabWrap}>
        <View style={[styles.tabPill, styles.tabPillActive]}>
          <Ionicons
            name={modes[0] === "received" ? "mail-open-outline" : "send-outline"}
            size={14}
            color={Colors.white}
          />
          <CustomText baseFont={12} fontWeight="700" color={Colors.white}>
            {t(MODE_LABELS[modes[0]])}
          </CustomText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabBar}>
      {modes.map((mode) => {
        const active = selected === mode;
        return (
          <TouchableOpacity
            key={mode}
            style={[styles.tabPill, active && styles.tabPillActive]}
            onPress={() => onChange(mode)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={mode === "received" ? "mail-open-outline" : "send-outline"}
              size={14}
              color={active ? Colors.white : "#5F7BA8"}
            />
            <CustomText
              baseFont={12}
              fontWeight={active ? "700" : "600"}
              color={active ? Colors.white : "#5F7BA8"}
            >
              {t(MODE_LABELS[mode])}
            </CustomText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const BOOKINGS_TAB_BY_ROLE: Record<ApiRole, string> = {
  WORKER: "1",
  EMPLOYER: "1",
  MEDIATOR: "2",
};

const DirectBookingRequestsScreen = () => {
  const params = useLocalSearchParams<{ role?: string; returnTab?: string }>();
  const role = (params.role as ApiRole) || "EMPLOYER";
  const returnTab = params.returnTab ?? BOOKINGS_TAB_BY_ROLE[role];
  const userDetails = useAtomValue(Atoms.UserAtom);
  const modes = REQUEST_MODES[role] ?? REQUEST_MODES.EMPLOYER;
  const [subTab, setSubTab] = useState<RequestMode>(modes[0]);

  const receivedQ = useInfiniteQuery({
    queryKey: ["directBookingRequestsReceived", userDetails?._id, role],
    queryFn: async ({ pageParam = 1 }) =>
      WORKER.fetchAllBookingReceivedInvitations({ pageParam }),
    initialPageParam: 1,
    enabled: !!userDetails?._id && modes.includes("received"),
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const sentQ = useInfiniteQuery({
    queryKey: ["directBookingRequestsSent", userDetails?._id, role],
    queryFn: async ({ pageParam = 1 }) =>
      EMPLOYER.fetchAllBookingSentRequests({ pageParam }),
    initialPageParam: 1,
    enabled: !!userDetails?._id && modes.includes("sent"),
    retry: false,
    getNextPageParam: (lastPage: any) =>
      lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  useFocusEffect(
    useCallback(() => {
      if (modes.includes("received")) receivedQ.refetch();
      if (modes.includes("sent")) sentQ.refetch();
    }, [modes, receivedQ.refetch, sentQ.refetch]),
  );

  const receivedList = useMemo(
    () => receivedQ.data?.pages?.flatMap((p: any) => p.data || []) || [],
    [receivedQ.data],
  );
  const sentList = useMemo(
    () => sentQ.data?.pages?.flatMap((p: any) => p.data || []) || [],
    [sentQ.data],
  );

  const activeQuery = subTab === "received" ? receivedQ : sentQ;
  const activeList = subTab === "received" ? receivedList : sentList;

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

  const goBackToActivityBookings = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace({
      pathname: "/(tabs)/fourth",
      params: { tab: returnTab },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              title="bookingRequests"
              left="back"
              onLeftAction={goBackToActivityBookings}
            />
          ),
        }}
      />
      <View style={styles.root}>
        <RequestSubTabBar modes={modes} selected={subTab} onChange={setSubTab} />

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : activeList.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyScroll}
            refreshControl={refreshControl}
          >
            <View style={styles.emptyIcon}>
              <Ionicons
                name={subTab === "received" ? "mail-open-outline" : "send-outline"}
                size={40}
                color="#7C3AED"
              />
            </View>
            <CustomHeading baseFont={17} textAlign="center">
              {subTab === "received"
                ? t("activityTabWorkerBookingTitle")
                : t("noSentRequestsTitle")}
            </CustomHeading>
            <CustomText
              baseFont={14}
              color={Colors.subHeading}
              textAlign="center"
              style={styles.emptyMsg}
            >
              {subTab === "received"
                ? t("activityEmptyLineBookingInvites")
                : t("noSentRequestsSubtitle")}
            </CustomText>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => router.push("/(tabs)/second")}
            >
              <CustomText baseFont={14} fontWeight="700" color={Colors.white}>
                {t("browseWorkers")}
              </CustomText>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ListingsVerticalBookings
            category={
              subTab === "received" ? "recievedRequests" : "sentRequests"
            }
            listings={activeList}
            loadMore={loadMore}
            isFetchingNextPage={activeQuery.isFetchingNextPage}
            refreshControl={refreshControl}
          />
        )}
      </View>
    </>
  );
};

export default DirectBookingRequestsScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  singleTabWrap: {
    flexDirection: "row",
    marginBottom: 10,
  },
  tabBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  tabPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.12)",
  },
  tabPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
  },
  emptyScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyMsg: {
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  emptyCta: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
});
