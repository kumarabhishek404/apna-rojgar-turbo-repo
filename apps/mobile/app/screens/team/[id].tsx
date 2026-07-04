import React, { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import Loader from "@/components/commons/Loaders/Loader";
import MEDIATOR from "@/app/api/mediator";
import { Stack, useLocalSearchParams } from "expo-router";
import PaginationString from "@/components/commons/Pagination/PaginationString";
import CustomHeader from "@/components/commons/Header";
import ListingsVerticalWorkers from "@/components/commons/ListingsVerticalWorkers";
import { WORKERTYPES } from "@/constants";
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import Colors from "@/constants/Colors";
import EmptyDataPlaceholder from "@/components/commons/EmptyDataPlaceholder";

const Members = () => {
  const [totalData, setTotalData] = useState(0);
  const userDetails = useAtomValue(Atoms?.UserAtom);
  const { id } = useLocalSearchParams();
  const mediatorId = Array.isArray(id) ? id[0] : id;

  const {
    data: response,
    isLoading,
    refetch,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["members", mediatorId || userDetails?._id],
    queryFn: ({ pageParam }) =>
      MEDIATOR?.fetchAllMembers({
        mediatorId: mediatorId || userDetails?._id,
        pageParam,
        category: "",
      }),
    retry: false,
    initialPageParam: 1,
    getNextPageParam: (lastPage: any, pages) => {
      if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
        return lastPage?.pagination?.page + 1;
      }
      return undefined;
    },
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const memoizedData = useMemo(() => {
    const pages = Array.isArray(response?.pages) ? response.pages : [];
    return pages.flatMap((page: any) => {
      const rawTeams = Array.isArray(page?.data)
        ? page.data
        : page?.data
          ? [page.data]
          : [];
      return rawTeams.flatMap((team: any) =>
        Array.isArray(team?.workers) ? team.workers : [],
      );
    });
  }, [response]);

  React.useEffect(() => {
    if (!response?.pages?.length) {
      setTotalData(0);
      return;
    }
    const firstPage = response.pages[0];
    const firstPageTeams = Array.isArray(firstPage?.data)
      ? firstPage.data
      : firstPage?.data
        ? [firstPage.data]
        : [];
    const firstPageWorkerCount = firstPageTeams.reduce(
      (acc: number, team: any) =>
        acc + (Array.isArray(team?.workers) ? team.workers.length : 0),
      0,
    );
    setTotalData(firstPageWorkerCount || memoizedData.length);
  }, [response, memoizedData.length]);

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader title="members" left="back" right="notification" />
          ),
        }}
      />
      <View style={{ flex: 1 }}>
        <Loader loading={isLoading} />
        <View style={styles.container}>
          <PaginationString
            type="members"
            isLoading={isLoading}
            totalFetchedData={memoizedData?.length}
            totalData={totalData}
          />

          {memoizedData && memoizedData?.length > 0 ? (
            <ListingsVerticalWorkers
              listings={memoizedData || []}
              category="workers"
              loadMore={loadMore}
              isFetchingNextPage={isFetchingNextPage}
              availableInterest={WORKERTYPES}
              type="member"
            />
          ) : (
            <EmptyDataPlaceholder title="members" />
          )}
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors?.fourth,
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 8,
  },
});

export default Members;
