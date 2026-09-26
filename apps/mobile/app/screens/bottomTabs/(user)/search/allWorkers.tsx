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
import ListingFilterBar from "@/components/commons/ListingFilterBar";
import ScrollableSortTabs from "@/components/commons/ScrollableSortTabs";
import {
  filterListingsByCity,
  filterUsersBySkill,
  sortContractorList,
  sortWorkerList,
  type ContractorSortId,
  type WorkerSortId,
} from "@/utils/listingBrowse";
import { officialListingSkills } from "@/utils/officialListingSkills";
import i18n from "@/utils/i18n";
import APP_CONTEXT from "@/app/context/locale";
import Atoms from "@/app/AtomStore";
import USER from "@/app/api/user";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";

const WORKER_TAB_DEFS: { id: WorkerSortId; labelKey: string }[] = [
  { id: "nearest", labelKey: "sortTabNearest" },
  { id: "trusted_profiles", labelKey: "sortTabTopRated" },
];

const CONTRACTOR_TAB_DEFS: { id: ContractorSortId; labelKey: string }[] = [
  { id: "nearest", labelKey: "sortTabNearest" },
  { id: "larger_team", labelKey: "sortTabLargerTeam" },
  { id: "trusted_profiles", labelKey: "sortTabTopRated" },
];

const AllWorkers = ({
  isLoading,
  isRefetching,
  isFetching = false,
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
  selectedCity = "",
  onSelectCity,
  selectedSkill = "",
  onSelectSkill,
}: any) => {
  APP_CONTEXT.useApp();
  const userDetails = useAtomValue(Atoms?.UserAtom);
  const [isAddFilters, setIsAddFilters] = useState(false);
  const [city, setCity] = useState<string>(selectedCity);
  const [skill, setSkill] = useState<string>(selectedSkill);

  const browseKind = listingRoleType === "mediator" ? "contractors" : "workers";
  const enforcedRole = browseKind === "contractors" ? "MEDIATOR" : "WORKER";

  // Each dropdown is scoped by the other selection so every option it offers
  // still returns results.
  const { data: cities = [], isLoading: loadingCities } = useQuery({
    queryKey: ["userCities", enforcedRole, skill],
    queryFn: () => USER.fetchUserCities(enforcedRole, skill),
    staleTime: 5 * 60 * 1000,
  });

  const { data: skillCounts = [], isLoading: loadingSkills } = useQuery({
    queryKey: ["userSkills", enforcedRole, city],
    queryFn: () => USER.fetchUserSkills(enforcedRole, city),
    staleTime: 5 * 60 * 1000,
  });
  const skills = useMemo(
    () => officialListingSkills(skillCounts),
    [skillCounts],
  );

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

  React.useEffect(() => {
    setCity(selectedCity);
  }, [selectedCity]);

  React.useEffect(() => {
    setSkill(selectedSkill);
  }, [selectedSkill]);

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

  const handleSelectCity = (nextCity: string) => {
    setCity(nextCity);
    if (typeof onSelectCity === "function") {
      onSelectCity(nextCity);
    }
  };

  const handleSelectSkill = (nextSkill: string) => {
    setSkill(nextSkill);
    if (typeof onSelectSkill === "function") {
      onSelectSkill(nextSkill);
    }
  };

  const displayedData = useMemo(() => {
    const raw = Array.isArray(memoizedData) ? [...memoizedData] : [];
    let rows = filterUsersBySkill(filterListingsByCity(raw, city), skill);
    const userLoc = userDetails?.geoLocation ?? userDetails?.location ?? null;
    rows =
      browseKind === "contractors"
        ? sortContractorList(rows, selectedSortId as ContractorSortId, userLoc)
        : sortWorkerList(rows, selectedSortId as WorkerSortId, userLoc);
    return rows;
  }, [
    memoizedData,
    city,
    skill,
    browseKind,
    selectedSortId,
    userDetails?.geoLocation,
    userDetails?.location,
  ]);
  const hasListContent =
    displayedData.length > 0 ||
    (Array.isArray(memoizedData) && memoizedData.length > 0);
  const shouldShowListLoader = isLoading && !hasListContent;
  const showPeopleList = hasListContent;

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

  const isContractors = browseKind === "contractors";
  const cityTitleKey = isContractors
    ? "selectCityForContractors"
    : "selectCityForWorkers";
  const skillTitleKey = isContractors
    ? "selectSkillForContractors"
    : "selectSkillForWorkers";

  return (
    <GradientWrapper>
      <View style={styles.container}>
        <ListingFilterBar
          variant="onDark"
          cities={cities}
          selectedCity={city}
          onSelectCity={handleSelectCity}
          skills={skills}
          selectedSkill={skill}
          onSelectSkill={handleSelectSkill}
          onPressFilter={() => setIsAddFilters(true)}
          isLoading={loadingCities}
          skillsLoading={loadingSkills}
          titleKey={cityTitleKey}
          skillTitleKey={skillTitleKey}
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
          ) : showPeopleList ? (
            <View
              style={[
                styles.listFill,
                isFetching && !isFetchingNextPage && styles.listRefreshing,
              ]}
            >
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
                selectedSortId === "trusted_profiles"
                  ? "noTrustedProfiles"
                  : Array.isArray(memoizedData) && memoizedData.length > 0
                    ? "noSearchMatches"
                    : browseKind === "contractors"
                      ? "contractor"
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
  listRefreshing: {
    opacity: 0.92,
  },
});

export default AllWorkers;
