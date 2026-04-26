import Colors from "@/constants/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { t } from "@/utils/translationHelper";
import { useSetAtom } from "jotai";
import Atoms from "@/app/AtomStore";
import CustomText from "@/components/commons/CustomText";
import SERVICE from "@/app/api/services";
import { useQuery } from "@tanstack/react-query";

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
  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      distance: "",
      duration: "",
      serviceStartIn: "",
      type: "",
    },
  });
  const { data: categoryRes } = useQuery({
    queryKey: ["serviceCategoriesForFilter"],
    queryFn: () => SERVICE.fetchServiceCategories(),
    retry: false,
  });
  const serviceCategories = Array.isArray(categoryRes?.data)
    ? categoryRes.data.filter((item: any) => item?.type)
    : [];

  const handleApply = (data: any) => {
    reset();
    setFilterVisible(false);
    onApply(data);
  };

  const handleClear = () => {
    reset();
    setFilterVisible(false);
  };

  const activeFilterCount = [
    !!watch("distance"),
    !!watch("duration"),
    !!watch("serviceStartIn"),
    !!watch("type"),
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
    key,
    label,
    selected,
    onPress,
  }: {
    key: string;
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      key={key}
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
            {t("filtersServices")}
          </CustomText>
        </View>
        <CustomText
          baseFont={18}
          fontWeight="800"
          color={Colors.heading}
          textAlign="left"
          style={styles.heroTitle}
        >
          {t("searchServicesTitle")}
        </CustomText>
        <CustomText baseFont={13} color={Colors.subHeading} textAlign="left">
          {t("serviceFilterHelp")}
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
            title: t("distance_of_service"),
            subtitle: t("filterDistanceHelp"),
            children: (
              <View style={styles.choiceWrap}>
                {DISTANCE.map((option, index) =>
                  renderChoiceChip({
                    key: `distance-${index}`,
                    label: t(option.label),
                    selected: value === option.value,
                    onPress: () =>
                      onChange(value === option.value ? "" : option.value),
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
            title: t("duration_of_service"),
            subtitle: t("filterDurationHelp"),
            children: (
              <View style={styles.choiceWrap}>
                {DURATION.map((option, index) =>
                  renderChoiceChip({
                    key: `duration-${index}`,
                    label: t(option.label),
                    selected: value === option.value,
                    onPress: () =>
                      onChange(value === option.value ? "" : option.value),
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
            title: t("service_will_start_in"),
            subtitle: t("filterStartHelp"),
            children: (
              <View style={styles.choiceWrap}>
                {SERVICE_STARTS_IN.map((option, index) =>
                  renderChoiceChip({
                    key: `serviceStartIn-${index}`,
                    label: t(option.label),
                    selected: value === option.value,
                    onPress: () =>
                      onChange(value === option.value ? "" : option.value),
                  }),
                )}
              </View>
            ),
          })
        }
      />

      <Controller
        control={control}
        name="type"
        render={({ field: { onChange, value } }) =>
          renderSection({
            icon: (
              <Ionicons name="grid-outline" size={20} color={Colors.primary} />
            ),
            title: t("serviceType"),
            subtitle: t("descriptionServices"),
            children: (
              <View style={styles.choiceWrap}>
                {serviceCategories.map((item: any, index: number) =>
                  renderChoiceChip({
                    key: `type-${index}`,
                    label:
                      t(item.type) !== item.type
                        ? t(item.type)
                        : item.type.replace(/([a-z])([A-Z])/g, "$1 $2"),
                    selected: value === item.type,
                    onPress: () =>
                      onChange(value === item.type ? "" : item.type),
                  }),
                )}
                {serviceCategories.length === 0 ? (
                  <CustomText
                    baseFont={13}
                    color={Colors.subHeading}
                    textAlign="left"
                  >
                    {t("noOptionsAvailable")}
                  </CustomText>
                ) : null}
              </View>
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
});

export default FiltersServices;
