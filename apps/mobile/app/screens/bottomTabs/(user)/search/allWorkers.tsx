import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import ListingsVerticalWorkers from "@/components/commons/ListingsVerticalWorkers";
import EmptyDataPlaceholder from "@/components/commons/EmptyDataPlaceholder";
import { WORKERTYPES } from "@/constants";
import Colors from "@/constants/Colors";
import { router } from "expo-router";
import FiltersWorkers from "./filterWorkers";
import CustomText from "@/components/commons/CustomText";
import { t } from "@/utils/translationHelper";
import WorkersLoadingPlaceholder from "@/components/commons/LoadingPlaceholders/ListingVerticalWorkerPlaceholder";
import GradientWrapper from "@/components/commons/GradientWrapper";

const AllWorkers = ({
  isLoading,
  isRefetching,
  isFetchingNextPage,
  refreshing,
  memoizedData,
  onRefresh,
  loadMore,
  totalData = 0,
}: any) => {
  const [isAddFilters, setIsAddFilters] = useState(false);

  const onSearchWorkers = (data: any) => {
    setIsAddFilters(false);
    const searchCategory = {
      distance: data?.distance,
      completedServices: data?.completedServices,
      rating: data?.rating,
      skills: data?.skills,
      role: data?.role,
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

  return (
    <GradientWrapper>
      {isLoading ? (
        <WorkersLoadingPlaceholder />
      ) : (
        <>
          <View style={styles.container}>
            <View style={styles.headerRow}>
              <View style={styles.headingContainer}>
                <CustomText
                  baseFont={30}
                  fontWeight="800"
                  color={Colors?.white}
                  textAlign="left"
                  numberOfLines={1}
                  style={styles.heading}
                >
                  👷 {t("allWorkers")}
                </CustomText>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsAddFilters(true)}
                style={styles.filterTrigger}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CustomText
                  baseFont={17}
                  fontWeight="900"
                  color="#F2F6FF"
                  textAlign="center"
                  numberOfLines={1}
                  style={styles.filterText}
                >
                  {t("filter")}
                </CustomText>
              </TouchableOpacity>
            </View>
            {Array.isArray(memoizedData) && memoizedData.length > 0 ? (
              <View style={styles.contentCard}>
                <View style={styles.listFill}>
                  <ListingsVerticalWorkers
                    availableInterest={WORKERTYPES}
                    listings={memoizedData || []}
                    loadMore={loadMore}
                    type={"worker"}
                    isFetchingNextPage={isFetchingNextPage}
                    refreshControl={
                      <RefreshControl
                        refreshing={!isRefetching && refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors?.primary}
                        colors={[Colors.primary]}
                      />
                    }
                  />
                </View>
              </View>
            ) : (
              <EmptyDataPlaceholder title="worker" type="gradient" />
            )}
          </View>
        </>
      )}

      <FiltersWorkers
        filterVisible={isAddFilters}
        setFilterVisible={setIsAddFilters}
        onApply={onSearchWorkers}
      />
    </GradientWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 8,
    paddingTop: 4,
  },
  headingContainer: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 2,
    gap: 12,
  },
  heading: {
    opacity: 0.98,
    lineHeight: 34,
    letterSpacing: 0.2,
  },
  filterTrigger: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 2,
  },
  filterText: {
    color: "#F2F6FF",
    letterSpacing: 0.5,
    lineHeight: 20,
    textShadowColor: "rgba(8, 28, 92, 0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  contentCard: {
    flex: 1,
  },
  listFill: {
    flex: 1,
    minHeight: 0,
  },
});

export default AllWorkers;
