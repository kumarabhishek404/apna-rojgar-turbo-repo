import Colors from "@/constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { t, tBi } from "@/utils/translationHelper";
import { useSetAtom } from "jotai";
import Atoms from "@/app/AtomStore";
import { WORKERTYPES } from "@/constants";
import CustomText from "@/components/commons/CustomText";
import { getDynamicWorkerType } from "@/utils/i18n";

const DISTANCE = [
  { label: "within_5km", value: "within_5km" },
  { label: "within_10km", value: "within_10km" },
  { label: "within_25km", value: "within_25km" },
  { label: "within_50km", value: "within_50km" },
  { label: "within_100km", value: "within_100km" },
  { label: "more_than_100km", value: "more_than_100km" },
  { label: "anywhere", value: "anywhere" },
];

const DURATION = [
  { label: "less_5_days", value: "less_5_days" },
  { label: "less_15_days", value: "less_15_days" },
  { label: "less_one_month", value: "less_one_month" },
  { label: "more_one_month", value: "more_one_month" },
  { label: "any_duration", value: "any_duration" },
];

const SERVICE_STARTS_IN = [
  { label: "within_one_month", value: "within_one_month" },
  { label: "within_six_months", value: "within_six_months" },
  { label: "within_one_year", value: "within_one_year" },
  { label: "more_than_one_year", value: "more_than_one_year" },
  { label: "anytime", value: "anytime" },
];

const FiltersServices = ({ filterVisible, setFilterVisible, onApply }: any) => {
  const setDrawerState: any = useSetAtom(Atoms?.BottomDrawerAtom);
  const [skillSearch, setSkillSearch] = useState("");
  const {
    control,
    handleSubmit,
    reset,
    watch,
  } = useForm({
    defaultValues: {
      distance: "",
      duration: "",
      serviceStartIn: "",
      skills: [],
    },
  });

  const [selectedWorkers, setSelectedWorkers] = useState([]);

  const handleApply = (data: any) => {
    reset();
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
    onChange: (value: string[]) => void,
  ) => {
    if (currentSkills.includes(skill)) {
      onChange(currentSkills.filter((item) => item !== skill));
      return;
    }

    onChange([...currentSkills, skill]);
  };

  const skills = WORKERTYPES.map((item) => item.value);
  const skillQuery = skillSearch.trim().toLowerCase();
  const filteredSkills = skills.filter((skill) => {
    if (!skillQuery) return true;
    return getDynamicWorkerType(skill, 1).toLowerCase().includes(skillQuery);
  });

  const activeFilterCount = [
    !!watch("distance"),
    !!watch("duration"),
    !!watch("serviceStartIn"),
    Array.isArray(watch("skills")) && watch("skills").length > 0,
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
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.choiceChip, selected && styles.choiceChipSelected]}
    >
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
            {tBi("filtersServices")}
          </CustomText>
        </View>
        <CustomText
          baseFont={18}
          fontWeight="800"
          color={Colors.heading}
          textAlign="left"
          style={styles.heroTitle}
        >
          {tBi("searchServicesTitle")}
        </CustomText>
        <CustomText baseFont={13} color={Colors.subHeading} textAlign="left">
          {tBi("serviceFilterHelp")}
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
            title: tBi("distance_of_service"),
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
        name="duration"
        render={({ field: { onChange, value } }) =>
          renderSection({
            icon: (
              <MaterialCommunityIcons
                name="calendar-range"
                size={20}
                color={Colors.primary}
              />
            ),
            title: tBi("duration_of_service"),
            subtitle: tBi("filterDurationHelp"),
            children: (
              <View style={styles.choiceWrap}>
                {DURATION.map((option) =>
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
        name="serviceStartIn"
        render={({ field: { onChange, value } }) =>
          renderSection({
            icon: (
              <Ionicons
                name="play-circle-outline"
                size={20}
                color={Colors.primary}
              />
            ),
            title: tBi("service_will_start_in"),
            subtitle: tBi("filterStartHelp"),
            children: (
              <View style={styles.choiceWrap}>
                {SERVICE_STARTS_IN.map((option) =>
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
                  {filteredSkills.map((skill) => {
                    const selectedSkills = value as string[];
                    return (
                    renderChoiceChip({
                      label: getDynamicWorkerType(skill, 1),
                      selected: selectedSkills.includes(skill),
                      onPress: () => toggleSkill(skill, selectedSkills, onChange),
                    })
                  );
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
        title: "filtersServices",
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
          setDrawerState((prev: any) => ({ ...prev, visible: false }));
          setFilterVisible(false);
        },
      });
    }
    return () => {
      setDrawerState((prev: any) => ({ ...prev, visible: false }));
    };
  }, [filterVisible]);

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

export default FiltersServices;
