import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import EmptyDataPlaceholder from "@/components/commons/EmptyDataPlaceholder";
import ListingsVerticalServices from "@/components/commons/ListingsVerticalServices";
import { router } from "expo-router";
import Colors from "@/constants/Colors";
import FiltersServices from "./filterServices";
import CustomText from "@/components/commons/CustomText";
import { t } from "@/utils/translationHelper";
import ListingsServicesPlaceholder from "@/components/commons/LoadingPlaceholders/ListingServicePlaceholder";
import AnimatedGradientWrapper from "@/components/commons/AnimatedGradientWrapper";
import APP_CONTEXT from "@/app/context/locale";
import GradientWrapper from "@/components/commons/GradientWrapper";
import { Ionicons } from "@expo/vector-icons";

const AllServices = ({
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
  const { role } = APP_CONTEXT.useApp();

  const onSearchService = (data: any) => {
    setIsAddFilters(false);
    const searchCategory = {
      distance: data?.distance,
      duration: data?.duration,
      serviceStartIn: data?.serviceStartIn,
      skills: data?.skills,
    };

    router?.push({
      pathname: "/screens/service",
      params: {
        title: "allServices",
        type: "all",
        searchCategory: JSON.stringify(searchCategory),
      },
    });
  };

  return (
    <GradientWrapper>
      {isLoading ? (
        <ListingsServicesPlaceholder />
      ) : (
        <>
          <View
            style={[
              styles.container,
              role !== "WORKER" && { paddingBottom: 24 },
            ]}
          >
            <View style={styles.headingContainer}>
              <View style={styles.headerRow}>
                <View style={styles.headerTextWrap}>
                  {role === "WORKER" && (
                    <CustomText
                      baseFont={28}
                      fontWeight="800"
                      color={Colors?.white}
                      style={styles.heading}
                    >
                      {t("allServices")}
                    </CustomText>
                  )}
                  <CustomText
                    baseFont={14}
                    color={Colors?.white}
                    style={styles.subHeading}
                  >
                    {t("allServicesSubHeading")}
                  </CustomText>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setIsAddFilters(true)}
                  style={styles.filterTrigger}
                >
                  <Ionicons
                    name="options-outline"
                    size={20}
                    color={Colors.white}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {Array.isArray(memoizedData) && memoizedData.length > 0 ? (
              <View style={styles.contentCard}>
                <View style={styles.listFill}>
                  <ListingsVerticalServices
                    listings={memoizedData || []}
                    loadMore={loadMore}
                    isFetchingNextPage={isFetchingNextPage}
                    refreshControl={
                      <RefreshControl
                        refreshing={!isRefetching && refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                      />
                    }
                  />
                </View>
              </View>
            ) : (
              <EmptyDataPlaceholder
                title="service"
                type="gradient"
                buttonTitle="refresh"
                onPress={onRefresh}
              />
            )}
          </View>
        </>
      )}

      <FiltersServices
        filterVisible={isAddFilters}
        setFilterVisible={setIsAddFilters}
        onApply={onSearchService}
      />
    </GradientWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  headingContainer: {
    marginBottom: 8,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  heading: {
    paddingLeft: 5,
  },
  subHeading: {
    opacity: 0.98,
    lineHeight: 20,
  },
  countBadge: {
    lineHeight: 18,
  },
  pullHint: {
    lineHeight: 18,
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

export default AllServices;
