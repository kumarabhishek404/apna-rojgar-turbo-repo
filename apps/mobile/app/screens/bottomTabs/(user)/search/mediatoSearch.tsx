import SERVICE from "@/app/api/services";
import USER from "@/app/api/user";
import PULL_TO_REFRESH from "@/app/hooks/usePullToRefresh";
import TabSwitcher from "@/components/inputs/Tabs";
import HeaderAction from "@/components/commons/IconGroupButtons";
import Colors from "@/constants/Colors";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import AllServices from "./allServices";
import AllWorkers from "./allWorkers";
import { t } from "@/utils/translationHelper";

const MediatorSearch = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const tabContentOpacity = useRef(new Animated.Value(1)).current;
  const TABS = [
    {
      label: "workers",
      // description: "descriptionWorkers",
    },
    {
      label: "services",
      // description: "descriptionServices",
    },
  ];

  const {
    data: response,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [selectedTab === 0 ? "allWorkers" : "allServices", selectedTab],
    queryFn: ({ pageParam }) =>
      selectedTab === 0
        ? USER?.fetchAllUsers({
            pageParam,
          })
        : SERVICE?.fetchAllServices({
            pageParam,
            status: "ACTIVE",
          }),
    initialPageParam: 1,
    retry: false,
    getNextPageParam: (lastPage: any, pages) => {
      if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
        return lastPage?.pagination?.page + 1;
      }
      return undefined;
    },
  });

  useEffect(() => {
    Speech.stop();
    return () => {
      Speech.stop();
    };
  }, [selectedTab]);

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const totalData = response?.pages?.[0]?.pagination?.total ?? 0;

  const mergedData = useMemo(
    () => response?.pages?.flatMap((page: any) => page.data || []) || [],
    [response],
  );

  const memoizedData = useMemo(() => {
    const unique = Object.values(
      (mergedData || []).reduce((acc: any, item: any) => {
        if (!item?._id) return acc;
        acc[item._id] = item;
        return acc;
      }, {}) || {},
    );
    return unique;
  }, [mergedData]);

  const handleTabSwitch = (nextTab: number) => {
    if (nextTab === selectedTab) {
      return;
    }

    Animated.timing(tabContentOpacity, {
      toValue: 0.55,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setSelectedTab(nextTab);
      Animated.timing(tabContentOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  };

  const { refreshing, onRefresh } = PULL_TO_REFRESH.usePullToRefresh(
    async () => {
      await refetch();
    },
  );

  const buttons = {
    label: t("addNewWork"),
    onPress: () => router.push({ pathname: "/screens/addService" }),
  };

  return (
    <View style={{ paddingTop: 2, backgroundColor: Colors?.primary }}>
      <View style={styles.header}>
        <HeaderAction buttons={buttons} />
      </View>
      <TabSwitcher
        tabs={TABS}
        actvieTab={selectedTab}
        setActiveTab={handleTabSwitch}
      />

      <View style={styles.container}>
        <Animated.View style={{ flex: 1, opacity: tabContentOpacity }}>
          {selectedTab === 0 && (
            <AllWorkers
              isLoading={isLoading}
              isRefetching={isRefetching}
              isFetchingNextPage={isFetchingNextPage}
              refreshing={refreshing}
              memoizedData={memoizedData}
              onRefresh={onRefresh}
              totalData={totalData}
              loadMore={loadMore}
            />
          )}
          {selectedTab === 1 && (
            <AllServices
              isLoading={isLoading}
              isRefetching={isRefetching}
              isFetchingNextPage={isFetchingNextPage}
              refreshing={refreshing}
              memoizedData={memoizedData}
              onRefresh={onRefresh}
              totalData={totalData}
              loadMore={loadMore}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
};

export default MediatorSearch;

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 2,
  },
  container: {
    flexGrow: 1,
    justifyContent: "space-between",
    minHeight: "100%",
  },
  shadowBox: {
    shadowColor: "#000", // Subtle black shadow
    shadowOffset: { width: 0, height: 4 }, // Shadow position
    shadowOpacity: 0.1, // Light shadow for elegance
    shadowRadius: 6, // Smooth blur effect
    elevation: 4, // Works for Android
  },
});
