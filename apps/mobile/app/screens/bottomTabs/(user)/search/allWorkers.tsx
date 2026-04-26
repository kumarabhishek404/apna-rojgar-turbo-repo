import React, { useMemo, useState } from "react";
import { View, StyleSheet, RefreshControl } from "react-native";
import ListingsVerticalWorkers from "@/components/commons/ListingsVerticalWorkers";
import EmptyDataPlaceholder from "@/components/commons/EmptyDataPlaceholder";
import { WORKERTYPES } from "@/constants";
import Colors from "@/constants/Colors";
import { router } from "expo-router";
import FiltersWorkers from "./filterWorkers";
import { t } from "@/utils/translationHelper";
import WorkersLoadingPlaceholder from "@/components/commons/LoadingPlaceholders/ListingVerticalWorkerPlaceholder";
import GradientWrapper from "@/components/commons/GradientWrapper";
import ListingSearchToolbar from "@/components/commons/ListingSearchToolbar";
import ScrollableSortTabs from "@/components/commons/ScrollableSortTabs";
import {
  filterUsersBySearch,
  filterUsersBySearchLoose,
  type ContractorSortId,
  type WorkerSortId,
} from "@/utils/listingBrowse";
import i18n from "@/utils/i18n";
import APP_CONTEXT from "@/app/context/locale";

const WORKER_TAB_DEFS: { id: WorkerSortId; labelKey: string }[] = [
  { id: "nearest", labelKey: "sortTabNearest" },
  { id: "top_rated", labelKey: "sortTabTopRated" },
];

const CONTRACTOR_TAB_DEFS: { id: ContractorSortId; labelKey: string }[] = [
  { id: "nearest", labelKey: "sortTabNearest" },
  { id: "larger_team", labelKey: "sortTabLargerTeam" },
  { id: "top_rated", labelKey: "sortTabTopRated" },
];

const AllWorkers = ({
  isLoading,
  isRefetching,
  isFetchingNextPage,
  refreshing,
  memoizedData,
  onRefresh,
  loadMore,
  totalData = 0,
  sectionTitleKey = "allWorkers",
  listingRoleType = "worker",
  selectedSort = "nearest",
  onSelectSort,
}: any) => {
  APP_CONTEXT.useApp();
  const [isAddFilters, setIsAddFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const browseKind = listingRoleType === "mediator" ? "contractors" : "workers";
  const enforcedRole = browseKind === "contractors" ? "MEDIATOR" : "WORKER";

  const [workerSort, setWorkerSort] = useState<WorkerSortId>("nearest");
  const [contractorSort, setContractorSort] =
    useState<ContractorSortId>("nearest");

  React.useEffect(() => {
    if (browseKind === "contractors") {
      setContractorSort(selectedSort as ContractorSortId);
    } else {
      setWorkerSort(selectedSort as WorkerSortId);
    }
  }, [browseKind, selectedSort]);

  const sortTabs = useMemo(() => {
    const defs =
      browseKind === "contractors" ? CONTRACTOR_TAB_DEFS : WORKER_TAB_DEFS;
    return defs.map((d) => ({ id: d.id, label: t(d.labelKey) }));
  }, [browseKind, i18n?.locale]);

  const selectedSortId =
    browseKind === "contractors" ? contractorSort : workerSort;

  const setSelectedSortId = (id: string) => {
    if (browseKind === "contractors") {
      setContractorSort(id as ContractorSortId);
    } else {
      setWorkerSort(id as WorkerSortId);
    }
    if (typeof onSelectSort === "function") {
      onSelectSort(id);
    }
  };

  const displayedData = useMemo(() => {
    const raw = Array.isArray(memoizedData) ? [...memoizedData] : [];
    const q = searchQuery.trim();
    let rows =
      browseKind === "contractors"
        ? filterUsersBySearchLoose(raw, q)
        : filterUsersBySearch(raw, q);
    return rows;
  }, [
    memoizedData,
    searchQuery,
    browseKind,
  ]);
  const hasFetchedData =
    Array.isArray(memoizedData) && memoizedData.length > 0;
  const shouldShowListLoader = isLoading && !hasFetchedData;

  const onSearchWorkers = (data: any) => {
    setIsAddFilters(false);
    const searchCategory = {
      distance: data?.distance,
      completedServices: data?.completedServices,
      rating: data?.rating,
      skills: data?.skills,
      role: enforcedRole,
    };

    router?.push({
      pathname: "/screens/users",
      params: {
        title: browseKind === "contractors" ? "contractors" : "allWorkers",
        type: "all",
        searchCategory: JSON.stringify(searchCategory),
      },
    });
  };

  const placeholderKey =
    browseKind === "contractors"
      ? "searchListPlaceholderContractors"
      : "searchListPlaceholderWorkers";

  return (
    <GradientWrapper>
      <View style={styles.container}>
        <ListingSearchToolbar
          variant="onDark"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onPressFilter={() => setIsAddFilters(true)}
          placeholderKey={placeholderKey}
        />

        <ScrollableSortTabs
          variant="onDark"
          tabs={sortTabs}
          selectedId={selectedSortId}
          onSelect={setSelectedSortId}
        />

        <View style={styles.contentCard}>
          {shouldShowListLoader ? (
            <WorkersLoadingPlaceholder />
          ) : displayedData.length > 0 ? (
            <View style={styles.listFill}>
              <ListingsVerticalWorkers
                availableInterest={WORKERTYPES}
                listings={displayedData || []}
                loadMore={loadMore}
                type={listingRoleType}
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
          ) : (
            <EmptyDataPlaceholder
              title={
                Array.isArray(memoizedData) && memoizedData.length > 0
                  ? "noSearchMatches"
                  : "worker"
              }
              type="gradient"
            />
          )}
        </View>
      </View>

      <FiltersWorkers
        filterVisible={isAddFilters}
        setFilterVisible={setIsAddFilters}
        onApply={onSearchWorkers}
        forcedRole={enforcedRole}
      />
    </GradientWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 8,
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

export default AllWorkers;
