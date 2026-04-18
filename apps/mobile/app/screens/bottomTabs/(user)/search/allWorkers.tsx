import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
} from "react-native";
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
import { useAtomValue } from "jotai";
import Atoms from "@/app/AtomStore";
import {
  filterUsersBySearch,
  filterUsersBySearchLoose,
  sortContractorList,
  sortWorkerList,
  type ContractorSortId,
  type WorkerSortId,
} from "@/utils/listingBrowse";

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
}: any) => {
  const [isAddFilters, setIsAddFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userDetails = useAtomValue(Atoms.UserAtom);
  const loggedInUserLocation =
    userDetails?.geoLocation ?? userDetails?.location ?? null;

  const browseKind =
    listingRoleType === "mediator" ? "contractors" : "workers";

  const [workerSort, setWorkerSort] = useState<WorkerSortId>("nearest");
  const [contractorSort, setContractorSort] =
    useState<ContractorSortId>("nearest");

  const sortTabs = useMemo(() => {
    const defs =
      browseKind === "contractors" ? CONTRACTOR_TAB_DEFS : WORKER_TAB_DEFS;
    return defs.map((d) => ({ id: d.id, label: t(d.labelKey) }));
  }, [browseKind]);

  const selectedSortId =
    browseKind === "contractors" ? contractorSort : workerSort;

  const setSelectedSortId = (id: string) => {
    if (browseKind === "contractors") {
      setContractorSort(id as ContractorSortId);
    } else {
      setWorkerSort(id as WorkerSortId);
    }
  };

  const displayedData = useMemo(() => {
    const raw = Array.isArray(memoizedData) ? [...memoizedData] : [];
    const q = searchQuery.trim();
    let rows =
      browseKind === "contractors"
        ? filterUsersBySearchLoose(raw, q)
        : filterUsersBySearch(raw, q);

    if (browseKind === "contractors") {
      return sortContractorList(rows, contractorSort, loggedInUserLocation);
    }
    return sortWorkerList(rows, workerSort, loggedInUserLocation);
  }, [
    memoizedData,
    searchQuery,
    browseKind,
    contractorSort,
    workerSort,
    loggedInUserLocation,
  ]);

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

  const placeholderKey =
    browseKind === "contractors"
      ? "searchListPlaceholderContractors"
      : "searchListPlaceholderWorkers";

  return (
    <GradientWrapper>
      {isLoading ? (
        <WorkersLoadingPlaceholder />
      ) : (
        <>
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

            {displayedData.length > 0 ? (
              <View style={styles.contentCard}>
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
