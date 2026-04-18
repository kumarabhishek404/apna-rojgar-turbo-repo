import React, { useMemo, useState } from "react";
import {
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
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import {
  applyServiceBrowse,
  filterServicesBySearch,
  type ServiceSortId,
} from "@/utils/listingBrowse";

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
}: any) => {
  const [isAddFilters, setIsAddFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceSort, setServiceSort] = useState<ServiceSortId>("nearest");
  const { role } = APP_CONTEXT.useApp();
  const userDetails = useAtomValue(Atoms.UserAtom);
  const loggedInUserLocation =
    userDetails?.geoLocation ?? userDetails?.location ?? null;

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
    [],
  );

  const displayedData = useMemo(() => {
    let rows = [...safeServicesData];
    rows = filterServicesBySearch(rows, searchQuery);
    return applyServiceBrowse(rows, serviceSort, loggedInUserLocation);
  }, [safeServicesData, searchQuery, serviceSort, loggedInUserLocation]);

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
            <ListingSearchToolbar
              variant="onDark"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onPressFilter={() => setIsAddFilters(true)}
              placeholderKey="searchListPlaceholderServices"
            />

            <ScrollableSortTabs
              variant="onDark"
              tabs={sortTabs}
              selectedId={serviceSort}
              onSelect={(id) => setServiceSort(id as ServiceSortId)}
            />

            {displayedData.length > 0 ? (
              <View style={styles.contentCard}>
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
              </View>
            ) : (
              <EmptyDataPlaceholder
                title={
                  safeServicesData.length > 0
                    ? "noSearchMatches"
                    : "service"
                }
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
    paddingTop: 10,
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
