import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { useAtom } from "jotai";

import Atoms from "@/app/AtomStore";
import Colors from "@/constants/Colors";
import CustomText from "../../../../../components/commons/CustomText";
import { t, tBi } from "@/utils/translationHelper";
import { getDynamicWorkerType } from "@/utils/i18n";
import { WORKERTYPES } from "@/constants";

const SERVICE_COMPLETED = [
  { label: "more_than_10", value: "more_than_10" },
  { label: "more_than_50", value: "more_than_50" },
  { label: "more_than_100", value: "more_than_100" },
  { label: "more_than_500", value: "more_than_500" },
  { label: "zero", value: "zero" },
];

const DISTANCE = [
  { label: "within_5km", value: "within_5km" },
  { label: "within_10km", value: "within_10km" },
  { label: "within_25km", value: "within_25km" },
  { label: "within_50km", value: "within_50km" },
  { label: "within_100km", value: "within_100km" },
  { label: "anywhere", value: "anywhere" },
];

const ROLE_OPTIONS = [
  {
    label: "roleTagLabour",
    value: "WORKER",
    icon: "account-hard-hat-outline",
  },
  {
    label: "roleTagContractor",
    value: "MEDIATOR",
    icon: "account-group-outline",
  },
  {
    label: "roleTagEmployer",
    value: "EMPLOYER",
    icon: "briefcase-outline",
  },
];

const FiltersWorkers = ({
  filterVisible,
  setFilterVisible,
  onApply,
  skills,
}: any) => {
  const [drawerAtom, setDrawerState]: any = useAtom(Atoms?.BottomDrawerAtom);
  const [skillSearch, setSkillSearch] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    watch,
  } = useForm({
    defaultValues: {
      completedServices: "",
      rating: 0,
      distance: "",
      skills: [],
      role: "",
    },
  });

  const handleApply = (data: any) => {
    setFilterVisible(false);
    onApply(data);
  };

  const handleClear = () => {
    reset();
    setFilterVisible(false);
    setSkillSearch("");
  };

  const toggleSkill = (
    skill: string,
    currentSkills: string[],
    onChange: any,
  ) => {
    if (currentSkills.includes(skill)) {
      onChange(currentSkills.filter((s) => s !== skill));
    } else {
      onChange([...currentSkills, skill]);
    }
  };

  const selectedSkills = watch("skills");

  const filteredSkills = useMemo(() => {
    const query = skillSearch.trim().toLowerCase();
    const allSkills = (skills?.length ? skills : WORKERTYPES.map((item) => item.value))
      .filter(Boolean);

    return allSkills.filter((skill: string) => {
      if (!query) return true;
      const label = getDynamicWorkerType(skill, 1).toLowerCase();
      return label.includes(query);
    });
  }, [skillSearch, skills]);

  const activeFilterCount = [
    !!watch("distance"),
    !!watch("role"),
    Array.isArray(selectedSkills) && selectedSkills.length > 0,
  ].filter(Boolean).length;

  const renderSection = ({
    icon,
    title,
    subtitle,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>{icon}</View>
        <View style={styles.sectionTextWrap}>
          <CustomText
            baseFont={17}
            fontWeight="800"
            color={Colors.heading}
            textAlign="left"
          >
            {title}
          </CustomText>
          <CustomText
            baseFont={12}
            color={Colors.subHeading}
            textAlign="left"
            style={styles.sectionSubtitle}
          >
            {subtitle}
          </CustomText>
        </View>
      </View>
      {children}
    </View>
  );

  const renderChoiceChip = ({
    label,
    selected,
    onPress,
    icon,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    icon?: React.ReactNode;
  }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.choiceChip, selected && styles.choiceChipSelected]}
    >
      {icon ? <View style={styles.choiceChipIcon}>{icon}</View> : null}
      <CustomText
        baseFont={13}
        fontWeight={selected ? "800" : "600"}
        color={selected ? Colors.white : Colors.primary}
      >
        {label}
      </CustomText>
    </TouchableOpacity>
  );

  const filterContent = () => (
    <View style={styles.scrollbarContent}>
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Ionicons name="sparkles-outline" size={18} color={Colors.primary} />
          <CustomText baseFont={12} fontWeight="700" color={Colors.primary}>
            {tBi("filtersWorkers")}
          </CustomText>
        </View>
        <CustomText
          baseFont={18}
          fontWeight="800"
          color={Colors.heading}
          textAlign="left"
          style={styles.heroTitle}
        >
          {tBi("searchWorkersTitle")}
        </CustomText>
        <CustomText baseFont={13} color={Colors.subHeading} textAlign="left">
          {tBi("workerFilterHelp")}
        </CustomText>
        {activeFilterCount > 0 ? (
          <View style={styles.activePill}>
            <CustomText baseFont={12} fontWeight="700" color={Colors.white}>
              {t("selected")}: {activeFilterCount}
            </CustomText>
          </View>
        ) : null}
      </View>

      <Controller
        control={control}
        name="role"
        render={({ field: { onChange, value } }) =>
          renderSection({
            icon: (
              <MaterialCommunityIcons
                name="account-switch-outline"
                size={20}
                color={Colors.primary}
              />
            ),
            title: tBi("filterWorkerByRoleTitle"),
            subtitle: tBi("filterWorkerByRoleHint"),
            children: (
              <View style={styles.choiceWrap}>
                {ROLE_OPTIONS.map((option) =>
                  renderChoiceChip({
                    label: t(option.label),
                    selected: value === option.value,
                    onPress: () => onChange(value === option.value ? "" : option.value),
                    icon: (
                      <MaterialCommunityIcons
                        name={option.icon as any}
                        size={16}
                        color={value === option.value ? Colors.white : Colors.primary}
                      />
                    ),
                  }),
                )}
              </View>
            ),
          })
        }
      />

      <Controller
        control={control}
        name="distance"
        render={({ field: { onChange, value } }) =>
          renderSection({
            icon: (
              <Ionicons
                name="location-outline"
                size={20}
                color={Colors.primary}
              />
            ),
            title: tBi("distance"),
            subtitle: tBi("filterDistanceHelp"),
            children: (
              <View style={styles.choiceWrap}>
                {DISTANCE.map((option) =>
                  renderChoiceChip({
                    label: t(option.label),
                    selected: value === option.value,
                    onPress: () => onChange(value === option.value ? "" : option.value),
                  }),
                )}
              </View>
            ),
          })
        }
      />

      <Controller
        control={control}
        name="skills"
        render={({ field: { onChange, value } }) =>
          renderSection({
            icon: (
              <Ionicons
                name="construct-outline"
                size={20}
                color={Colors.primary}
              />
            ),
            title: tBi("selectSkills"),
            subtitle: tBi("filterSkillsHelp"),
            children: (
              <>
                <View style={styles.searchBox}>
                  <Ionicons
                    name="search-outline"
                    size={18}
                    color={Colors.inputPlaceholder}
                  />
                  <TextInput
                    value={skillSearch}
                    onChangeText={setSkillSearch}
                    placeholder={t("searchAndSelectSkills")}
                    placeholderTextColor={Colors.inputPlaceholder}
                    style={styles.searchInput}
                  />
                </View>
                <View style={styles.choiceWrap}>
                  {filteredSkills.map((skill: string) => {
                    const selectedSkills = value as string[];
                    const isSelected = selectedSkills.includes(skill);
                    return renderChoiceChip({
                      label: getDynamicWorkerType(skill, 1),
                      selected: isSelected,
                      onPress: () => toggleSkill(skill, selectedSkills, onChange),
                      icon: isSelected ? (
                        <AntDesign name="check" size={14} color={Colors.white} />
                      ) : undefined,
                    });
                  })}
                  {filteredSkills.length === 0 ? (
                    <CustomText
                      baseFont={13}
                      color={Colors.subHeading}
                      textAlign="left"
                    >
                      {t("noSkillsFound")}
                    </CustomText>
                  ) : null}
                </View>
              </>
            ),
          })
        }
      />
    </View>
  );

  useEffect(() => {
    if (filterVisible) {
      setDrawerState({
        visible: true,
        title: "filtersWorkers",
        content: filterContent,
        primaryButton: {
          title: "apply",
          action: handleSubmit(handleApply),
        },
        secondaryButton: {
          title: "clear",
          action: handleClear,
        },
        onClose: () => {
          // Ensure state is synced
          setFilterVisible(false);
          setDrawerState((prev: any) => ({ ...prev, visible: false }));
        },
      });
    } else {
      // Force hide if filterVisible becomes false from parent
      setDrawerState((prev: any) => ({ ...prev, visible: false }));
    }

    // Cleanup on unmount
    return () => {
      setDrawerState((prev: any) => ({ ...prev, visible: false }));
    };
  }, [filterVisible]); // Only depend on visibility

  return null;
};

const styles = StyleSheet.create({
  scrollbarContent: {
    paddingTop: 4,
    paddingBottom: 40,
    gap: 16,
  },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.08)",
    shadowColor: "#102a6b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.secondaryBackground,
  },
  heroTitle: {
    marginTop: 12,
    marginBottom: 6,
  },
  activePill: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.08)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.secondaryBackground,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionSubtitle: {
    marginTop: 2,
  },
  choiceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  choiceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.secondaryBackground,
    backgroundColor: "#F8FAFF",
  },
  choiceChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  choiceChipIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F9FF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.secondaryBackground,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
});

export default FiltersWorkers;
