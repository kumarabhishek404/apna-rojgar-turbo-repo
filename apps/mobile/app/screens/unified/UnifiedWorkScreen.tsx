/**
 * Work tab — single list by role (no toggles, no add-work header):
 * WORKER → active service listings; EMPLOYER / MEDIATOR → labours only (API role=WORKER, not contractors).
 */
import React, { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import Colors from "@/constants/Colors";
import Atoms from "@/app/AtomStore";
import SERVICE from "@/app/api/services";
import USER from "@/app/api/user";
import PULL_TO_REFRESH from "@/app/hooks/usePullToRefresh";
import AllServices from "@/app/screens/bottomTabs/(user)/search/allServices";
import AllWorkers from "@/app/screens/bottomTabs/(user)/search/allWorkers";
import APP_CONTEXT from "@/app/context/locale";
import {
  type ServiceSortId,
  type WorkerSortId,
} from "@/utils/listingBrowse";

type ApiRole = "WORKER" | "EMPLOYER" | "MEDIATOR";

const dedupeById = (rows: any[]) =>
  Object.values(
    (rows || []).reduce((acc: any, item: any) => {
      if (!item?._id) return acc;
      acc[item._id] = item;
      return acc;
    }, {}),
  );

const UnifiedWorkScreen = () => {
  const { locale } = APP_CONTEXT.useApp();
  const userDetails = useAtomValue(Atoms.UserAtom);
  const role = (userDetails?.role || "WORKER") as ApiRole;
  const params = useLocalSearchParams<{ categoryType?: string | string[] }>();
  // Ensure translated text inside nested work lists updates when language changes.
  void locale;

  const isWorker = role === "WORKER";
  const isLabours = role === "EMPLOYER" || role === "MEDIATOR";
  const categoryType = useMemo(() => {
    const raw = params?.categoryType;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params?.categoryType]);
  const canQuery =
    !!userDetails?._id && userDetails?.status === "ACTIVE";
  const [serviceSort, setServiceSort] = useState<ServiceSortId>("nearest");
  const [workerSort, setWorkerSort] = useState<WorkerSortId>("nearest");

  const {
    data: servicesRes,
    isLoading: loadingServices,
    isRefetching: refetchingServices,
    isFetching: isFetchingServices,
    isFetchingNextPage: fetchingMoreServices,
    fetchNextPage: fetchMoreServices,
    hasNextPage: hasMoreServices,
    refetch: refetchServices,
  } = useInfiniteQuery({
    queryKey: [
      "unifiedWorkActiveServices",
      userDetails?._id,
      serviceSort,
      categoryType || "",
    ],
    queryFn: ({ pageParam }) =>
      SERVICE.fetchAllServices({
        pageParam,
        status: "ACTIVE",
        payload: {
          sortBy: serviceSort,
          ...(categoryType ? { type: categoryType } : {}),
        },
      }),
    initialPageParam: 1,
    retry: false,
    enabled: isWorker && canQuery,
    placeholderData: keepPreviousData,
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  const {
    data: laboursRes,
    isLoading: loadingLabours,
    isRefetching: refetchingLabours,
    isFetchingNextPage: fetchingMoreLabours,
    fetchNextPage: fetchMoreLabours,
    hasNextPage: hasMoreLabours,
    refetch: refetchLabours,
  } = useInfiniteQuery({
    queryKey: ["unifiedWorkLabours", userDetails?._id, workerSort],
    queryFn: ({ pageParam }) =>
      USER.fetchAllUsers({
        pageParam,
        role: "WORKER",
        payload: {
          sortBy: workerSort,
        },
      }),
    initialPageParam: 1,
    retry: false,
    enabled: isLabours && canQuery,
    placeholderData: keepPreviousData,
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

  const labourRows = useMemo(
    () => laboursRes?.pages?.flatMap((p: any) => p.data || []) || [],
    [laboursRes],
  );
  const labourList = useMemo(() => dedupeById(labourRows), [labourRows]);

  const totalServices = servicesRes?.pages?.[0]?.pagination?.total ?? 0;
  const totalLabours = laboursRes?.pages?.[0]?.pagination?.total ?? 0;

  const loadMoreServices = () => {
    if (hasMoreServices && !fetchingMoreServices) fetchMoreServices();
  };
  const loadMoreLabours = () => {
    if (hasMoreLabours && !fetchingMoreLabours) fetchMoreLabours();
  };

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(
    async () => {
      if (isWorker) await refetchServices();
      else await refetchLabours();
    },
  );
  const clearCategoryFilter = () => {
    router.setParams({ categoryType: undefined });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>
        {isWorker ? (
          <AllServices
            isLoading={loadingServices}
            isRefetching={refetchingServices}
            isFetching={isFetchingServices}
            isFetchingNextPage={fetchingMoreServices}
            refreshing={refreshing}
            memoizedData={serviceList}
            onRefresh={onRefresh}
            loadMore={loadMoreServices}
            totalData={totalServices}
            headingTitleKey="activeWorkHeading"
            selectedSort={serviceSort}
            onSelectSort={setServiceSort}
            activeCategoryType={categoryType}
            onClearCategoryFilter={clearCategoryFilter}
          />
        ) : (
          <AllWorkers
            isLoading={loadingLabours}
            isRefetching={refetchingLabours}
            isFetchingNextPage={fetchingMoreLabours}
            refreshing={refreshing}
            memoizedData={labourList}
            onRefresh={onRefresh}
            loadMore={loadMoreLabours}
            totalData={totalLabours}
            sectionTitleKey="allWorkers"
            listingRoleType="worker"
            selectedSort={workerSort}
            onSelectSort={setWorkerSort}
          />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.primary },
});

export default UnifiedWorkScreen;
