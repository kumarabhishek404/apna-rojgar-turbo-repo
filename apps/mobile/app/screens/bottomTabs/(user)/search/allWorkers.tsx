import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  Dimensions,
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
import { Ionicons } from "@expo/vector-icons";

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
                  baseFont={14}
                  color={Colors?.white}
                  style={styles.subHeading}
                >
                  {t("workersListSubHeading")}
                </CustomText>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsAddFilters(true)}
                style={styles.filterTrigger}
              >
                <Ionicons name="options-outline" size={20} color={Colors.white} />
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
    paddingTop: 2,
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  subHeading: {
    opacity: 0.98,
    lineHeight: 19,
  },
  filterTrigger: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
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
