import { AntDesign } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { useAtom } from "jotai";

import Atoms from "@/app/AtomStore";
import Colors from "@/constants/Colors";
import SelectableTags from "../../../../../components/inputs/SingleSelectedTag";
import CustomText from "../../../../../components/commons/CustomText";
import { t } from "@/utils/translationHelper";
import CustomHeading from "@/components/commons/CustomHeading";
import { getDynamicWorkerType } from "@/utils/i18n";

const SERVICE_COMPLETED = [
  { label: "more_than_10", value: "more_than_10" },
  { label: "more_than_50", value: "more_than_50" },
  { label: "more_than_100", value: "more_than_100" },
  { label: "more_than_500", value: "more_than_500" },
  { label: "zero", value: "zero" },
];

const DISTANCE = [
  { label: "within_10km", value: "within_10km" },
  { label: "within_50km", value: "within_50km" },
  { label: "within_100km", value: "within_100km" },
  { label: "anywhere", value: "anywhere" },
];

const FiltersWorkers = ({
  filterVisible,
  setFilterVisible,
  onApply,
  skills,
}: any) => {
  const [drawerAtom, setDrawerState]: any = useAtom(Atoms?.BottomDrawerAtom);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      completedServices: "",
      rating: 0,
      distance: "",
      skills: [],
    },
  });

  const handleApply = (data: any) => {
    setFilterVisible(false);
    onApply(data);
  };

  const handleClear = () => {
    reset();
    setFilterVisible(false);
  };

  // Logic to toggle skills in the array
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

  const filterContent = () => (
    <View style={styles.scrollbarContent}>
      {/* <Controller
        control={control}
        name="completedServices"
        render={({ field: { onChange, value } }) => (
          <SelectableTags
            label={t("number_of_service_completed")}
            options={SERVICE_COMPLETED}
            selectedTag={value}
            setSelectedTag={onChange}
          />
        )}
      /> */}

      {/* <Controller
        control={control}
        name="rating"
        render={({ field: { onChange, value } }) => (
          <View style={styles.section}>
            <CustomHeading style={styles.label} textAlign="left">
              {t("rating_of_worker")}
            </CustomHeading>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => onChange(num)}
                  style={[styles.star, value === num && styles.selectedStar]}
                >
                  <CustomText
                    color={
                      value === num ? Colors?.white : Colors?.inputPlaceholder
                    }
                    fontWeight="600"
                    baseFont={24}
                  >
                    {num}
                  </CustomText>
                  <AntDesign
                    name="star"
                    size={22}
                    color={
                      value === num ? Colors?.white : Colors?.inputPlaceholder
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      /> */}

      {/* Skills Section - Pill Design */}
      <View style={styles.section}>
        <CustomText
          baseFont={22}
          fontWeight="700"
          textAlign="left"
          color={Colors.inputLabel}
          style={styles.label}
        >
          {t("selectSkills")}
        </CustomText>

        <View style={styles.pillContainer}>
          <Controller
            control={control}
            name="skills"
            render={({ field: { onChange, value } }) => (
              <>
                {skills?.map((skill: string) => {
                  const isSelected = value.includes(skill);
                  return (
                    <TouchableOpacity
                      key={skill}
                      activeOpacity={0.8}
                      onPress={() => toggleSkill(skill, value, onChange)}
                      style={[
                        styles.pill,
                        isSelected
                          ? styles.pillSelected
                          : styles.pillUnselected,
                      ]}
                    >
                      {isSelected && (
                        <View style={styles.checkCircle}>
                          <AntDesign
                            name="check"
                            size={10}
                            color={Colors.white}
                          />
                        </View>
                      )}
                      <CustomText
                        baseFont={13}
                        fontWeight={isSelected ? "700" : "600"}
                        color={isSelected ? Colors.white : Colors.primary}
                      >
                        {/* Fallback for missing translations observed in your screenshots */}
                        {getDynamicWorkerType(skill as string, 1)}
                      </CustomText>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          />
        </View>
      </View>

      {/* <Controller
        control={control}
        name="distance"
        render={({ field: { onChange, value } }) => (
          <SelectableTags
            label={t("distance_of_worker")}
            options={DISTANCE}
            selectedTag={value}
            setSelectedTag={onChange}
          />
        )}
      /> */}
    </View>
  );

  useEffect(() => {
    if (filterVisible) {
      setDrawerState({
        visible: true,
        title: "filters",
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
    paddingTop: 10,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  labelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10, // Increased gap for better tap targets
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14, // Squircle-style radius
    borderWidth: 1.5,
  },
  pillUnselected: {
    backgroundColor: Colors.secondaryBackground, // Soft glass
    borderColor: Colors.secondaryBackground,
  },
  pillSelected: {
    backgroundColor: Colors.primary, // Vibrant primary color
    borderColor: "rgba(255, 255, 255, 0.3)",
    // Premium Shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  filterScreen: {
    backgroundColor: Colors?.fourth,
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonContainer: {
    position: "absolute",
    left: 10,
    bottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },

  label: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  star: {
    padding: 8,
    borderWidth: 1,
    borderColor: Colors?.inputPlaceholder,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  selectedStar: {
    backgroundColor: "gold",
    borderWidth: 1,
    borderColor: "gold",
  },
});

export default FiltersWorkers;
