import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { t } from "@/utils/translationHelper";
import TextInputComponent from "../inputs/TextInputWithIcon";
import { WORKERTYPES } from "@/constants";
import { useMutation } from "@tanstack/react-query";
import USER from "@/app/api/user";
import { useAtom, useSetAtom } from "jotai";
import Atoms from "@/app/AtomStore";
import TOAST from "@/app/hooks/toast";
import Loader from "./Loaders/Loader";
import PaperDropdown from "../inputs/Dropdown";
import CustomSegmentedButton from "@/app/screens/bottomTabs/(user)/bookingsAndRequests/customTabs";
import { getDynamicWorkerType } from "@/utils/i18n";
import { translateWorkerTypes } from "@/constants/functions";
import CustomText from "./CustomText";

type ServiceRequirement = {
  name?: string;
  count?: number;
  payPerDay?: number;
};

const AddSkillDrawer = ({
  isDrawerVisible,
  setIsDrawerVisible,
  filteredSkills,
  serviceRequirements,
}: {
  isDrawerVisible: boolean;
  setIsDrawerVisible: (visible: boolean) => void;
  filteredSkills?: Array<{ label: string; value: string }>;
  serviceRequirements?: ServiceRequirement[];
}) => {
  const setDrawerState: any = useSetAtom(Atoms?.BottomDrawerAtom);
  const [skillWithPrice, setSkillWithPrice] = useState<any>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useAtom(Atoms?.UserAtom);
  const [role, setRole] = useState("worker");
  const isApplyGuided = Boolean(serviceRequirements?.length);

  const TABS: any = [
    { value: "worker", label: "worker" },
    { value: "mediator", label: "mediator" },
  ];

  const mutationAddSkills = useMutation({
    mutationKey: ["addSkills"],
    mutationFn: (skill: any) => USER?.updateSkills({ skill: skill }),
    onSuccess: (response) => {
      let user = response?.data;
      setUserDetails({
        ...userDetails,
        skills: user?.skills,
      });
      TOAST?.success(
        isApplyGuided
          ? t("addSkillApplySuccessReapply")
          : t("skillsAddedSuccessfully"),
      );
      // console.log("Response while adding new skills in a worker - ", response);
    },
    onError: (err) => {
      console.error("error while adding new skills in a worker ", err);
    },
  });

  const handleSkillSelection = (skill: string) => {
    setSelectedSkill(skill);
  };

  const handlePriceChange = (price: string) => {
    setSkillWithPrice({
      skill: selectedSkill,
      pricePerDay: parseInt(price, 10),
    });
  };

  const onAddSkills = async () => {
    try {
      const payload =
        role === "worker" ? skillWithPrice : { skill: selectedSkill };
      await mutationAddSkills.mutateAsync(payload, {
        onSuccess: () => {
          setDrawerState({ visible: false });
          setIsDrawerVisible(false);
          setSelectedSkill(null);
          setSkillWithPrice(null);
        },
        onError: (err) => {
          console.error("Error adding skill:", err);
        },
      });
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const renderPriceInput = () => {
    return (
      <View style={styles.priceInputContainer}>
        <TextInputComponent
          label="enterPricePerDay"
          name="pricePerDay"
          placeholder={t("enterPricePerDay")}
          type="number"
          style={styles.priceInput}
          value={skillWithPrice?.pricePerDay}
          maxLength={4}
          onChangeText={(price: string) => handlePriceChange(price)}
          icon={
            <FontAwesome
              name="rupee"
              size={26}
              color={Colors.secondary}
              style={{ paddingVertical: 10, paddingRight: 10 }}
            />
          }
        />
      </View>
    );
  };

  const onCatChanged = (category: string) => {
    setRole(category);
    setSelectedSkill(null);
    setSkillWithPrice(null);
  };

  const renderRequiredSkills = () => {
    if (!isApplyGuided) return null;

    return (
      <View style={styles.guidedSection}>
        <CustomText baseFont={14} color="#4B5563" textAlign="left" style={styles.guidedMessage}>
          {t("addSkillApplyGuidedMessage")}
        </CustomText>

        <CustomText
          baseFont={13}
          fontWeight="700"
          color={Colors.heading}
          textAlign="left"
          style={styles.requiredLabel}
        >
          {t("addSkillApplyRequiredSkills")}
        </CustomText>

        <View style={styles.requiredSkillsWrap}>
          {serviceRequirements?.map((requirement, index) => (
            <View key={`${requirement?.name}-${index}`} style={styles.requiredSkillChip}>
              <CustomText baseFont={13} fontWeight="700" color={Colors.primary} textAlign="left">
                {requirement?.count
                  ? `${requirement.count} ${getDynamicWorkerType(requirement.name, requirement.count)}`
                  : getDynamicWorkerType(requirement?.name || "", 1)}
              </CustomText>
              {requirement?.payPerDay ? (
                <CustomText baseFont={11} color={Colors.secondary} textAlign="left">
                  ₹{requirement.payPerDay}/{t("days")}
                </CustomText>
              ) : null}
            </View>
          ))}
        </View>

        <CustomText baseFont={13} color="#0E4FC5" fontWeight="600" textAlign="left" style={styles.reapplyHint}>
          {t("addSkillApplyReapplyHint")}
        </CustomText>
      </View>
    );
  };

  useEffect(() => {
    if (isDrawerVisible) {
      setDrawerState({
        visible: true,
        title: isApplyGuided
          ? "addSkillApplyGuidedTitle"
          : "addAtLeastOneSkillApplyServices",
        content: () => (
          <View style={{ paddingVertical: 10 }}>
            {renderRequiredSkills()}
            <CustomSegmentedButton
              buttons={TABS}
              selectedTab={role}
              onValueChange={onCatChanged}
            />
            <PaperDropdown
              name="addSkill"
              label="selectSkill"
              selectedValue={
                selectedSkill ? getDynamicWorkerType(selectedSkill, 1) : ""
              }
              onSelect={(skill: string) => handleSkillSelection(skill)}
              searchEnabled
              placeholder={
                isApplyGuided
                  ? t("addSkillApplySelectFromRequired")
                  : t("searchAndSelectSkills")
              }
              options={
                filteredSkills?.length
                  ? filteredSkills
                  : translateWorkerTypes(WORKERTYPES)
              }
              icon={
                <MaterialCommunityIcons
                  style={styles.icon}
                  color="black"
                  name="hammer-sickle"
                  size={30}
                />
              }
            />
            {selectedSkill && role === "worker" && renderPriceInput()}
          </View>
        ),
        primaryButton: {
          title: "addSkill",
          action: onAddSkills,
          disabled:
            role === "worker"
              ? !skillWithPrice || !skillWithPrice?.pricePerDay
              : !selectedSkill,
        },
        secondaryButton: {
          title: "cancel",
          action: () => {
            setIsDrawerVisible(false);
            setSelectedSkill(null);
            setSkillWithPrice(null);
            setDrawerState({ visible: false });
          },
        },
      });
    }
  }, [
    isDrawerVisible,
    role,
    selectedSkill,
    skillWithPrice,
    filteredSkills,
    serviceRequirements,
    isApplyGuided,
  ]);

  return <Loader loading={mutationAddSkills?.isPending} />; // Component does not return UI directly
};

export default AddSkillDrawer;

const styles = StyleSheet.create({
  container: {},
  skillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  icon: {
    marginRight: 10,
    color: Colors.secondary,
  },
  priceInputContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  priceInput: {},
  guidedSection: {
    marginBottom: 16,
    gap: 10,
  },
  guidedMessage: {
    lineHeight: 21,
  },
  requiredLabel: {
    marginTop: 4,
  },
  requiredSkillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  requiredSkillChip: {
    backgroundColor: "#EEF4FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(14, 79, 197, 0.18)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 2,
  },
  reapplyHint: {
    marginTop: 4,
    lineHeight: 19,
  },
});
