import React, { useMemo, useState } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  RefreshControl,
} from "react-native";
import EmptyDataPlaceholder from "@/components/commons/EmptyDataPlaceholder";
import ListingsVerticalServices from "@/components/commons/ListingsVerticalServices";
import { router } from "expo-router";
import Colors from "@/constants/Colors";
import FiltersServices from "./filterServices";
import { t } from "@/utils/translationHelper";
import ListingsServicesPlaceholder from "@/components/commons/LoadingPlaceholders/ListingServicePlaceholder";
import APP_CONTEXT from "@/app/context/locale";
import GradientWrapper from "@/components/commons/GradientWrapper";
import ListingSearchToolbar from "@/components/commons/ListingSearchToolbar";
import ScrollableSortTabs from "@/components/commons/ScrollableSortTabs";
import CustomText from "@/components/commons/CustomText";
import { Ionicons } from "@expo/vector-icons";
import {
  filterServicesBySearch,
  type ServiceSortId,
} from "@/utils/listingBrowse";
import i18n from "@/utils/i18n";

const SERVICE_TAB_DEFS: { id: ServiceSortId; labelKey: string }[] = [
  { id: "nearest", labelKey: "sortTabNearest" },
  { id: "latest", labelKey: "sortTabLatest" },
  { id: "more_salary", labelKey: "sortTabMoreSalary" },
  { id: "food_available", labelKey: "sortTabFoodAvailable" },
  { id: "living_available", labelKey: "sortTabLivingAvailable" },
  { id: "esi_pf", labelKey: "sortTabEsiPf" },
];

const AllServices = ({
  isLoading,
  isRefetching,
  isFetchingNextPage,
  refreshing,
  memoizedData,
  onRefresh,
  loadMore,
  totalData = 0,
  headingTitleKey = "allServices",
  selectedSort = "nearest",
  onSelectSort,
  activeCategoryType,
  onClearCategoryFilter,
}: any) => {
  const [isAddFilters, setIsAddFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceSort, setServiceSort] = useState<ServiceSortId>(selectedSort);
  const { role } = APP_CONTEXT.useApp();

  const safeServicesData = useMemo(
    () =>
      (Array.isArray(memoizedData) ? memoizedData : []).filter(
        (item: any) =>
          item && typeof item === "object" && (item.type || item.subType),
      ),
    [memoizedData],
  );

  const sortTabs = useMemo(
    () => SERVICE_TAB_DEFS.map((d) => ({ id: d.id, label: t(d.labelKey) })),
    [i18n?.locale],
  );

  React.useEffect(() => {
    setServiceSort(selectedSort);
  }, [selectedSort]);

  const displayedData = useMemo(() => {
    return filterServicesBySearch([...safeServicesData], searchQuery);
  }, [safeServicesData, searchQuery]);
  const hasFetchedData =
    Array.isArray(safeServicesData) && safeServicesData.length > 0;
  const shouldShowListLoader = isLoading && !hasFetchedData;

  const handleSelectSort = (id: ServiceSortId) => {
    setServiceSort(id);
    if (typeof onSelectSort === "function") {
      onSelectSort(id);
    }
  };

  const onSearchService = (data: any) => {
    setIsAddFilters(false);
    const searchCategory = {
      type: data?.type,
      distance: data?.distance,
      duration: data?.duration,
      serviceStartIn: data?.serviceStartIn,
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
      <View
        style={[styles.container, role !== "WORKER" && { paddingBottom: 24 }]}
      >
        <ListingSearchToolbar
          variant="onDark"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onPressFilter={() => setIsAddFilters(true)}
          showFilterButton={!activeCategoryType}
          placeholderKey="searchListPlaceholderServices"
        />
        <View style={[styles.filterRow, activeCategoryType && { marginBottom: 10 }]}>
          {activeCategoryType ? (
            <View style={styles.activeCategoryContainer}>
              <View style={styles.activeCategoryChip}>
                <CustomText
                  baseFont={13}
                  color="#0E2F8C"
                  fontWeight="700"
                  textAlign="left"
                  numberOfLines={1}
                  style={{ flex: 1 }}
                >
                  {t(activeCategoryType) !== activeCategoryType
                    ? t(activeCategoryType)
                    : activeCategoryType.replace(/([a-z])([A-Z])/g, "$1 $2")}
                </CustomText>
                <TouchableOpacity
                  onPress={() =>
                    typeof onClearCategoryFilter === "function"
                      ? onClearCategoryFilter()
                      : null
                  }
                  activeOpacity={0.8}
                  style={styles.clearChipButton}
                >
                  <Ionicons name="close" size={16} color="#0E4FC5" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {activeCategoryType ? (
            <TouchableOpacity
              onPress={() => setIsAddFilters(true)}
              style={styles.filterActionBtn}
              activeOpacity={0.85}
            >
              <Ionicons name="options-outline" size={18} color={Colors.white} />
              <CustomText baseFont={13} fontWeight="700" color={Colors.white}>
                {t("filter")}
              </CustomText>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollableSortTabs
          variant="onDark"
          tabs={sortTabs}
          selectedId={serviceSort}
          onSelect={(id) => handleSelectSort(id as ServiceSortId)}
        />

        <View style={styles.contentCard}>
          {shouldShowListLoader ? (
            <ListingsServicesPlaceholder />
          ) : displayedData.length > 0 ? (
            <View style={styles.listFill}>
              <ListingsVerticalServices
                listings={displayedData}
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
          ) : (
            <EmptyDataPlaceholder
              title={
                safeServicesData.length > 0 ? "noSearchMatches" : "service"
              }
              type="gradient"
              buttonTitle="refresh"
              onPress={onRefresh}
            />
          )}
        </View>
      </View>

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
    paddingTop: 10,
  },
  contentCard: {
    flex: 1,
  },
  activeCategoryContainer: {
    flex: 1,
    gap: 6,
    marginRight: 10,
  },
  activeCategoryChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(14,79,197,0.25)",
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 8,
  },
  clearChipButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(14,79,197,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  filterActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  listFill: {
    flex: 1,
    minHeight: 0,
  },
});

export default AllServices;
