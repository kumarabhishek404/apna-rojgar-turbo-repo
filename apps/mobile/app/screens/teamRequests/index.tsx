import Colors from "@/constants/Colors";
import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, RefreshControl } from "react-native";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ListingVerticalRequests from "@/components/commons/ListingVerticalRequests";
import CustomHeader from "@/components/commons/Header";
import CustomText from "@/components/commons/CustomText";
import TOAST from "@/app/hooks/toast";
import { t } from "@/utils/translationHelper";
import REFRESH_USER from "@/app/hooks/useRefreshUser";
import PULL_TO_REFRESH from "@/app/hooks/usePullToRefresh";
import SegmentedControl from "@/components/commons/SegmentedControl";
import TeamRequestsEmptyState from "@/components/commons/TeamRequestsEmptyState";
import WORKER from "@/app/api/workers";
import MEDIATOR from "@/app/api/mediator";
import ListingsBookingsPlaceholder from "@/components/commons/LoadingPlaceholders/ListingBookingPlaceholder";

const Requests = () => {
  const { refreshUser } = REFRESH_USER.useRefreshUser();
  const [filteredData, setFilteredData]: any = useState([]);
  const { title, initialCategory } = useLocalSearchParams<{
    title?: string;
    initialCategory?: string;
  }>();
  const [category, setCategory] = useState<"RECEIVED" | "SENT">("RECEIVED");

  useEffect(() => {
    if (initialCategory === "SENT" || initialCategory === "RECEIVED") {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  const teamRequestSegments = useMemo(
    () => [
      {
        label: t("received"),
        icon: "mail-unread-outline" as const,
        accessibilityLabel: t("received"),
      },
      {
        label: t("sent"),
        icon: "send-outline" as const,
        accessibilityLabel: t("sent"),
      },
    ],
    [],
  );

  const guideText =
    category === "RECEIVED"
      ? t("teamRequestsGuideReceived")
      : t("teamRequestsGuideSent");

  const fetchRequests =
    category === "RECEIVED"
      ? WORKER.fetchAllRecievedTeamRequests
      : MEDIATOR.fetchSentTeamRequests;

  const {
    data: response,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["teamRequests", category],
    queryFn: ({ pageParam }) => fetchRequests({ pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage?.pagination?.page < lastPage?.pagination?.pages
        ? lastPage?.pagination?.page + 1
        : undefined;
    },
    retry: false,
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [category, refetch]),
  );

  useFocusEffect(
    React.useCallback(() => {
      setFilteredData(response?.pages?.flatMap((page) => page.data || []));
    }, [response]),
  );

  const mutationAcceptRequest = useMutation({
    mutationFn: (id) => WORKER.acceptTeamRequest({ userId: id }),
    onSuccess: () => {
      refetch();
      refreshUser();
      TOAST?.success(t("requestAcceptedSuccessfully"));
    },
  });

  const mutationRejectRequest = useMutation({
    mutationFn: (id) => WORKER.rejectTeamRequest({ userId: id }),
    onSuccess: () => {
      refetch();
    },
  });

  const mutationCancelRequest = useMutation({
    mutationFn: (id) => MEDIATOR.cancelTeamRequest({ userId: id }),
    onSuccess: () => {
      refetch();
    },
  });

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(() =>
    refetch(),
  );

  const refreshControl = (
    <RefreshControl
      refreshing={!isRefetching && refreshing}
      onRefresh={onRefresh}
    />
  );

  const hasData = filteredData && filteredData.length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              title={title as string}
              left="back"
              right="notification"
            />
          ),
        }}
      />
      <View style={styles.root}>
        {isLoading ? (
          <ListingsBookingsPlaceholder />
        ) : (
          <View style={styles.container}>
            <View style={styles.tabsWrap}>
              <SegmentedControl
                segments={teamRequestSegments}
                selectedIndex={category === "RECEIVED" ? 0 : 1}
                onChange={(i) => setCategory(i === 0 ? "RECEIVED" : "SENT")}
              />
            </View>

            <View style={styles.guideCard}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={Colors.primary}
              />
              <CustomText textAlign="left" baseFont={13} style={styles.guideText}>
                {guideText}
              </CustomText>
            </View>

            {hasData ? (
              <ListingVerticalRequests
                listings={filteredData || []}
                requestType="teamJoiningRequest"
                isLoading={
                  mutationCancelRequest?.isPending ||
                  mutationAcceptRequest?.isPending ||
                  mutationRejectRequest?.isPending
                }
                loadMore={loadMore}
                refreshControl={refreshControl}
                isFetchingNextPage={isFetchingNextPage}
                onCancelRequest={mutationCancelRequest.mutate}
                onAcceptRequest={mutationAcceptRequest.mutate}
                onRejectRequest={mutationRejectRequest.mutate}
              />
            ) : (
              <TeamRequestsEmptyState tab={category} refreshControl={refreshControl} />
            )}
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.fourth,
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  tabsWrap: {
    paddingTop: 12,
    paddingBottom: 10,
  },
  guideCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.1)",
  },
  guideText: {
    flex: 1,
    lineHeight: 20,
    color: Colors.subHeading,
  },
});

export default Requests;
