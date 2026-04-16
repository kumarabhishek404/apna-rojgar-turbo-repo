import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import USER from "@/app/api/user";
import PULL_TO_REFRESH from "@/app/hooks/usePullToRefresh";

import ListingsVerticalWorkers from "@/components/commons/ListingsVerticalWorkers";
import EmptyDataPlaceholder from "@/components/commons/EmptyDataPlaceholder";
import WorkersLoadingPlaceholder from "@/components/commons/LoadingPlaceholders/ListingVerticalWorkerPlaceholder";
import CustomText from "@/components/commons/CustomText";
import Colors from "@/constants/Colors";
import { WORKERTYPES } from "@/constants";
import { t } from "@/utils/translationHelper";
import FiltersWorkers from "../../search/filterWorkers";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import EMPLOYER from "@/app/api/employer";

const AllTopWorkers = () => {
  const [isAddFilters, setIsAddFilters] = useState(false);
  const [filteredData, setFilteredData]: any = useState([]);

  /* ---------------- API FETCH (Infinite Scroll) ---------------- */

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setIsAddFilters(false);
      };
    }, [])
  );
  
  const {
    data: response,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["allTopWorkers"],
    queryFn: ({ pageParam }) =>
      USER?.fetchAllUsers({
        pageParam,
      }),
    initialPageParam: 1,
    retry: false,
    getNextPageParam: (lastPage: any) => {
      if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
        return lastPage?.pagination?.page + 1;
      }
      return undefined;
    },
  });

  const { data: uniqueSkills } = useQuery({
    queryKey: ["uniqueSkills"],
    queryFn: () => EMPLOYER?.getAllUniqueSkills(),
  });

  /* ---------------- Merge + Deduplicate Workers ---------------- */

  React.useEffect(() => {
    const mergedData = response?.pages?.flatMap((page: any) => page.data || []);

    const uniqueData: any = Object.values(
      (mergedData || []).reduce((acc: any, item: any) => {
        acc[item._id] = item;
        return acc;
      }, {}),
    );

    setFilteredData(uniqueData);
  }, [response]);

  /* ---------------- Load More ---------------- */

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const onSearchWorkers = (data: any) => {
    setIsAddFilters(false);
    const searchCategory = {
      distance: data?.distance,
      completedServices: data?.completedServices,
      rating: data?.rating,
      skills: data?.skills,
    };

    router?.push({
      pathname: "/screens/users",
      params: {
        title: "allWorkers",
        type: "all",
        searchCategory: JSON.stringify(searchCategory),
      },
    });
  };

  /* ---------------- Pull To Refresh ---------------- */

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(
    async () => {
      await refetch();
    },
  );

  /* ---------------- Memoized Data ---------------- */

  const memoizedData = useMemo(() => {
    const unique = Object.values(
      (filteredData || []).reduce((acc: any, item: any) => {
        acc[item._id] = item;
        return acc;
      }, {}),
    );
    return unique;
  }, [filteredData]);

  /* ---------------- Loading State ---------------- */

  if (isLoading) {
    return <WorkersLoadingPlaceholder />;
  }

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      {/* ⭐ Friendly Guided Heading */}
      <View style={styles.headerRow}>
        <View style={styles.headingTextWrapper}>
          <CustomText
            baseFont={26}
            fontWeight="800"
            color={Colors.white}
            textAlign="left"
          >
            👷 {t("discoverWorkers")}
          </CustomText>
        </View>

        {/* Modern Filter Trigger */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsAddFilters(true)}
          style={styles.filterTrigger}
        >
          <Ionicons name="options-outline" size={22} color={Colors.white} />
          {/* Subtle indicator dot if filters are active (optional) */}
          <View style={styles.filterDot} />
        </TouchableOpacity>
      </View>

      {/* Worker List */}
      {Array.isArray(memoizedData) && memoizedData.length > 0 ? (
        <ListingsVerticalWorkers
          style={styles.listContainer}
          availableInterest={WORKERTYPES}
          listings={memoizedData}
          loadMore={loadMore}
          type={"worker"}
          isFetchingNextPage={isFetchingNextPage}
          refreshControl={
            <RefreshControl
              refreshing={!isRefetching && refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      ) : (
        <EmptyDataPlaceholder title="worker" type="gradient" />
      )}

      <FiltersWorkers
        filterVisible={isAddFilters}
        setFilterVisible={setIsAddFilters}
        onApply={onSearchWorkers}
        skills={uniqueSkills?.data}
      />
    </View>
  );
};

export default AllTopWorkers;

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0, // Remove top padding as HeaderAction handles it
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10, // Reduced from 20
    marginTop: 5, // Reduced from 10
  },
  filterTrigger: {
    width: 40, // Reduced from 46
    height: 40, // Reduced from 46
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  headingTextWrapper: {
    flex: 1,
  },

  filterDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80", // Success green dot to show it's interactive
    borderWidth: 1.5,
    borderColor: "#1E3A8A", // Match background color to make it "pop"
  },
  listContainer: {
    flexGrow: 1,
  },
});
