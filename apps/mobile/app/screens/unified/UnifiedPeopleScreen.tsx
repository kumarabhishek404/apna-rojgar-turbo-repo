/**
 * People tab — single list by role (no switcher):
 * WORKER / EMPLOYER → contractors (users with role MEDIATOR via API).
 * MEDIATOR → active service listings (same source as “active work” elsewhere).
 */
import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import Colors from "@/constants/Colors";
import Atoms from "@/app/AtomStore";
import SERVICE from "@/app/api/services";
import USER from "@/app/api/user";
import PULL_TO_REFRESH from "@/app/hooks/usePullToRefresh";
import AllServices from "@/app/screens/bottomTabs/(user)/search/allServices";
import AllWorkers from "@/app/screens/bottomTabs/(user)/search/allWorkers";

type ApiRole = "WORKER" | "EMPLOYER" | "MEDIATOR";

const dedupeById = (rows: any[]) =>
  Object.values(
    (rows || []).reduce((acc: any, item: any) => {
      if (!item?._id) return acc;
      acc[item._id] = item;
      return acc;
    }, {}),
  );

const UnifiedPeopleScreen = () => {
  const userDetails = useAtomValue(Atoms.UserAtom);
  const role = (userDetails?.role || "WORKER") as ApiRole;

  const showContractors = role === "WORKER" || role === "EMPLOYER";
  const showActiveWorks = role === "MEDIATOR";
  const canQuery =
    !!userDetails?._id && userDetails?.status === "ACTIVE";

  const {
    data: servicesRes,
    isLoading: loadingServices,
    isRefetching: refetchingServices,
    isFetchingNextPage: fetchingMoreServices,
    fetchNextPage: fetchMoreServices,
    hasNextPage: hasMoreServices,
    refetch: refetchServices,
  } = useInfiniteQuery({
    queryKey: ["unifiedPeopleActiveServices", userDetails?._id],
    queryFn: ({ pageParam }) =>
      SERVICE.fetchAllServices({
        pageParam,
        status: "ACTIVE",
      }),
    initialPageParam: 1,
    retry: false,
    enabled: showActiveWorks && canQuery,
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  const {
    data: contractorsRes,
    isLoading: loadingContractors,
    isRefetching: refetchingContractors,
    isFetchingNextPage: fetchingMoreContractors,
    fetchNextPage: fetchMoreContractors,
    hasNextPage: hasMoreContractors,
    refetch: refetchContractors,
  } = useInfiniteQuery({
    queryKey: ["unifiedPeopleContractors", userDetails?._id],
    queryFn: ({ pageParam }) =>
      USER.fetchAllUsers({
        pageParam,
        role: "MEDIATOR",
      }),
    initialPageParam: 1,
    retry: false,
    enabled: showContractors && canQuery,
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  const serviceRows = useMemo(
    () => servicesRes?.pages?.flatMap((p: any) => p.data || []) || [],
    [servicesRes],
  );
  const serviceList = useMemo(() => dedupeById(serviceRows), [serviceRows]);

  const contractorRows = useMemo(
    () => contractorsRes?.pages?.flatMap((p: any) => p.data || []) || [],
    [contractorsRes],
  );
  const contractorList = useMemo(
    () => dedupeById(contractorRows),
    [contractorRows],
  );

  const totalServices = servicesRes?.pages?.[0]?.pagination?.total ?? 0;
  const totalContractors = contractorsRes?.pages?.[0]?.pagination?.total ?? 0;

  const loadMoreServices = () => {
    if (hasMoreServices && !fetchingMoreServices) fetchMoreServices();
  };
  const loadMoreContractors = () => {
    if (hasMoreContractors && !fetchingMoreContractors) fetchMoreContractors();
  };

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(
    async () => {
      if (showActiveWorks) await refetchServices();
      else await refetchContractors();
    },
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>
        {showActiveWorks ? (
          <AllServices
            isLoading={loadingServices}
            isRefetching={refetchingServices}
            isFetchingNextPage={fetchingMoreServices}
            refreshing={refreshing}
            memoizedData={serviceList}
            onRefresh={onRefresh}
            loadMore={loadMoreServices}
            totalData={totalServices}
            headingTitleKey="activeWorkHeading"
          />
        ) : (
          <AllWorkers
            isLoading={loadingContractors}
            isRefetching={refetchingContractors}
            isFetchingNextPage={fetchingMoreContractors}
            refreshing={refreshing}
            memoizedData={contractorList}
            onRefresh={onRefresh}
            loadMore={loadMoreContractors}
            totalData={totalContractors}
            sectionTitleKey="contractors"
            listingRoleType="mediator"
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
});

export default UnifiedPeopleScreen;
