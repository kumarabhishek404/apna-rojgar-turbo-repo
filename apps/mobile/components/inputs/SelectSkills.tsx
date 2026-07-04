import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomHeading from "../commons/CustomHeading";
import Colors from "@/constants/Colors";
import { t } from "@/utils/translationHelper";
import ModalComponent from "../commons/Modal";
import TextInputComponent from "./TextInputWithIcon";
import { Controller, useForm } from "react-hook-form";
import TOAST from "@/app/hooks/toast";
import { getDynamicWorkerType } from "@/utils/i18n";

const { height } = Dimensions.get("window");

interface SkillsSelectorProps {
  isPricePerDayNeeded: boolean;
  selectedInterests: Array<any>;
  setSelectedInterests: any;
  availableOptions: Array<any>;
}

const flattenSkills = (options: any[]) =>
  options.map((type) => ({
    label: type.label,
    value: type.value,
    skills: type?.subTypes?.flatMap((subType: any) => subType.workerTypes),
  }));

const SkillsSelector = ({
  isPricePerDayNeeded,
  selectedInterests,
  setSelectedInterests,
  availableOptions,
}: SkillsSelectorProps) => {
  const [pricePopupVisible, setPricePopupVisible] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContainerHeight, setSelectedContainerHeight] = useState(0);
  const flattenedOptions = flattenSkills(availableOptions);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredOptions = flattenedOptions
    .map((item) => {
      const categoryLabel = t(item.label).toLowerCase();
      const skills = (item?.skills || [])
        .filter(
          (skill: any) =>
            !selectedInterests?.find((sel) => sel?.skill === skill?.value),
        )
        .filter((skill: any) => {
          if (!normalizedSearch) return true;
          const translatedSkill = getDynamicWorkerType(
            skill.label,
            1,
          ).toLowerCase();
          const value = String(skill.value || "").toLowerCase();
          return (
            translatedSkill.includes(normalizedSearch) ||
            value.includes(normalizedSearch) ||
            categoryLabel.includes(normalizedSearch)
          );
        });

      return { ...item, skills };
    })
    .filter((item) => item.skills.length > 0);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors: priceErrors },
  } = useForm({ defaultValues: { pricePerDay: "" } });

  const handleSelect = (skill: any) => {
    if (selectedInterests.length >= 5) {
      TOAST?.error(t("skillLimitReached"));
      return;
    }
    if (isPricePerDayNeeded) {
      setSelectedSkill(skill);
      setIsEditMode(false);
      setPricePopupVisible(true);
    } else {
      setSelectedInterests([
        ...selectedInterests,
        { skill: skill.value, pricePerDay: null },
      ]);
    }
  };

  const handleAddSkill = (data: any) => {
    const newSkill = {
      skill: selectedSkill?.value,
      pricePerDay: isPricePerDayNeeded ? data.pricePerDay : null,
    };

    const updatedInterests = isEditMode
      ? selectedInterests.map((item) =>
          item.skill === selectedSkill.value ? newSkill : item,
        )
      : [...selectedInterests, newSkill];

    setSelectedInterests(updatedInterests);
    reset({ pricePerDay: "" });
    setPricePopupVisible(false);
  };

  const handleRemove = (skill: any) =>
    setSelectedInterests(
      selectedInterests.filter((item: any) => item.skill !== skill),
    );

  const handleEdit = (skill: any) => {
    const existingSkill = selectedInterests.find(
      (item) => item.skill === skill,
    );
    setSelectedSkill({
      value: existingSkill?.skill,
      label: existingSkill?.skill,
    });
    if (isPricePerDayNeeded) {
      setIsEditMode(true);
      reset({ pricePerDay: existingSkill?.pricePerDay || "" });
      setPricePopupVisible(true);
    }
  };

  const modalContent = () => (
    <View style={{ paddingVertical: 20 }}>
      <Controller
        control={control}
        name="pricePerDay"
        rules={{ required: t("priceIsRequired") }}
        render={({ field: { onChange, value } }) => (
          <TextInputComponent
            name="pricePerDay"
            label="pricePerDay"
            type="number"
            maxLength={4}
            placeholder={t("enterPricePerDay")}
            value={value}
            errors={priceErrors}
            textStyles={{ fontSize: 16 }}
            onChangeText={onChange}
          />
        )}
      />
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <View style={styles.headerRow}>
        <View>
          <CustomHeading textAlign="left" color={Colors?.inputLabel}>
            {t("selectAnySkills")}
          </CustomHeading>
          <CustomHeading
            textAlign="left"
            baseFont={13}
            color={Colors.secondary}
            fontWeight="500"
          >
            {selectedInterests.length}/5 {t("selected")}
          </CustomHeading>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color={Colors.primary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("searchAndSelectSkills")}
          placeholderTextColor="#8A97AD"
          style={styles.searchInput}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#8A97AD" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View
        style={styles.selectedContainer}
        onLayout={(event) =>
          setSelectedContainerHeight(event.nativeEvent.layout.height)
        }
      >
        {selectedInterests.length > 0 ? (
          selectedInterests.map((interest: any, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.selectedItem}
              onPress={() => handleEdit(interest.skill)}
              activeOpacity={0.85}
            >
              <CustomHeading
                color={Colors?.white}
                baseFont={13}
                style={styles.selectedText}
              >
                {getDynamicWorkerType(interest.skill, 1)}
                {isPricePerDayNeeded && interest.pricePerDay
                  ? ` • ₹${interest.pricePerDay}/${t("perDay")}`
                  : ""}
              </CustomHeading>
              <TouchableOpacity onPress={() => handleRemove(interest.skill)}>
                <Ionicons name="close-circle" size={20} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptySelectedBox}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#8A97AD"
            />
            <CustomHeading
              baseFont={13}
              color="#8A97AD"
              fontWeight="600"
              textAlign="left"
            >
              {t("noSkillsSelected")}
            </CustomHeading>
          </View>
        )}
      </View>

      <ScrollView
        style={{
          ...styles.scrollContainer,
          maxHeight: Math.max(height * 0.62 - selectedContainerHeight, 220),
        }}
        contentContainerStyle={styles.skillContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {filteredOptions.length > 0 ? (
          filteredOptions.map((item, idx) => (
            <View style={styles.skillBox} key={idx}>
              <CustomHeading
                textAlign="left"
                baseFont={18}
                color={Colors?.inputLabel}
              >
                {t(item.label)}
              </CustomHeading>
              <View style={styles.interestsContainer}>
                {item?.skills?.map((skill: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.interestItem}
                    onPress={() => handleSelect(skill)}
                  >
                    <CustomHeading baseFont={14} color={Colors.primary}>
                      + {getDynamicWorkerType(skill.label, 1)}
                    </CustomHeading>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noResultBox}>
            <Ionicons name="search-outline" size={24} color="#8A97AD" />
            <CustomHeading baseFont={14} color="#8A97AD">
              {t("noSkillsFound")}
            </CustomHeading>
          </View>
        )}
      </ScrollView>

      {/* Modal for price per day */}
      {isPricePerDayNeeded && (
        <ModalComponent
          visible={pricePopupVisible}
          content={modalContent}
          transparent={true}
          animationType="slide"
          title={`${
            isEditMode ? t("editPriceForSkill") : t("enterPriceForSkill")
          } (${
            selectedSkill?.label &&
            getDynamicWorkerType(selectedSkill?.label, 1)
          })`}
          onClose={() => {
            setPricePopupVisible(false);
            reset({ pricePerDay: "" });
          }}
          primaryButton={{
            title: isEditMode ? t("updateSkillPrice") : t("addSkillPrice"),
            action: handleSubmit(handleAddSkill),
          }}
          secondaryButton={{
            title: t("cancel"),
            action: () => {
              setPricePopupVisible(false);
              reset({ pricePerDay: "" });
            },
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    minHeight: 0,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchBox: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#DDE6F5",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    color: Colors.heading,
    fontSize: 15,
    fontWeight: "600",
  },
  selectedContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#DDE6F5",
    backgroundColor: "#F8FAFF",
    width: "100%",
    minHeight: 70,
    padding: 8,
    borderRadius: 16,
    gap: 8,
  },
  scrollContainer: {
    flex: 1,
    paddingTop: 4,
  },
  skillContainer: {
    paddingBottom: 150,
  },
  skillBox: {
    marginBottom: 18,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 9,
  },
  interestItem: {
    backgroundColor: Colors?.white,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E4EAF5",
    shadowColor: "#0F2E6E",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  selectedItem: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectedText: {
    maxWidth: 210,
  },
  emptySelectedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
  },
  noResultBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 8,
  },
});

export default SkillsSelector;
