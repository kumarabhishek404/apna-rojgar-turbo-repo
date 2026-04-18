import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
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
import APP_CONTEXT from "@/app/context/locale";
import GradientWrapper from "@/components/commons/GradientWrapper";

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
  const safeServicesData = useMemo(
    () =>
      (Array.isArray(memoizedData) ? memoizedData : []).filter(
        (item: any) => item && typeof item === "object" && (item.type || item.subType),
      ),
    [memoizedData],
  );

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
                  <CustomText
                    baseFont={30}
                    fontWeight="800"
                    color={Colors?.white}
                    textAlign="left"
                    numberOfLines={1}
                    style={styles.heading}
                  >
                    🚀 {t("allServices")}
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
            </View>

            {safeServicesData.length > 0 ? (
              <View style={styles.contentCard}>
                <View style={styles.listFill}>
                  <ListingsVerticalServices
                    listings={safeServicesData}
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
    marginBottom: 10,
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
    opacity: 0.98,
    lineHeight: 34,
    letterSpacing: 0.2,
    paddingLeft: 2,
  },
  countBadge: {
    lineHeight: 18,
  },
  pullHint: {
    lineHeight: 18,
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

export default AllServices;
