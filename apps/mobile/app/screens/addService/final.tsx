import React from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import moment from "moment";
import CustomHeading from "@/components/commons/CustomHeading";
import CustomText from "@/components/commons/CustomText";
import { t } from "@/utils/translationHelper";
import ButtonComp from "@/components/inputs/Button";
import { getDynamicWorkerType } from "@/utils/i18n";

interface FinalScreenProps {
  setStep: any;
  type: string;
  subType: string;
  description: string;
  address: string;
  location: object;
  startDate: Date;
  duration: number;
  requirements: Array<any>;
  facilities: any;
  images: Array<string>;
  handleOnSubmit: any;
  isSubmitting?: boolean;
}

const FinalScreen: React.FC<FinalScreenProps> = ({
  setStep,
  type,
  subType,
  description,
  address,
  location,
  startDate,
  duration,
  requirements,
  facilities,
  images,
  handleOnSubmit,
  isSubmitting = false,
}: FinalScreenProps) => {
  const isValidText = (value?: string) => Boolean(value && value.trim().length > 0);
  const normalizedRequirements = Array.isArray(requirements) ? requirements : [];
  const normalizedImages = Array.isArray(images) ? images : [];
  const hasType = isValidText(type);
  const hasSubType = isValidText(subType);
  const hasDescription = isValidText(description);
  const hasImages = normalizedImages.length > 0;
  const hasRequirements = normalizedRequirements.length > 0;
  const hasAddress = isValidText(address);
  const hasStartDate = Boolean(startDate);
  const hasDuration = Number(duration) > 0;

  const missingRequiredFields: string[] = [];
  if (!hasType) missingRequiredFields.push(t("workType"));
  if (!hasSubType) missingRequiredFields.push(t("workSubType"));
  if (!hasAddress) missingRequiredFields.push(t("address"));
  if (!hasRequirements) missingRequiredFields.push(t("workRequirements"));
  if (!hasStartDate) missingRequiredFields.push(t("startDate"));
  if (!hasDuration) missingRequiredFields.push(t("duration"));

  const missingOptionalFields: string[] = [];
  if (!hasDescription) missingOptionalFields.push(t("workDescription"));
  if (!hasImages) missingOptionalFields.push(t("workImages"));

  const canSubmit = missingRequiredFields.length === 0 && !isSubmitting;
  const requiredCompletedCount = 6 - missingRequiredFields.length;
  const optionalCompletedCount = 2 - missingOptionalFields.length;
  const placeholder = t("notAddedYet");
  const locationText =
    location &&
    typeof location === "object" &&
    Array.isArray((location as any)?.coordinates) &&
    (location as any).coordinates.length === 2
      ? `${(location as any).coordinates[1]}, ${(location as any).coordinates[0]}`
      : placeholder;

  const handleFinish = () => {
    if (!canSubmit) return;
    handleOnSubmit();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ marginBottom: 20 }}>
        <CustomHeading fontWeight="800" baseFont={25}>
          {t("reviewYourWorkPost")}
        </CustomHeading>
        <CustomText color={Colors.subHeading}>
          {t("reviewWorkPostSubtitle")}
        </CustomText>
      </View>
      <View style={styles.statusSummaryCard}>
        <View style={styles.statusSummaryRow}>
          <View style={styles.statusSummaryPill}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#166534" />
            <CustomText textAlign="left" baseFont={12} fontWeight="700" color="#166534">
              {t("reviewRequiredCount", { count: requiredCompletedCount })}
            </CustomText>
          </View>
          <View style={styles.statusSummaryPillInfo}>
            <Ionicons name="sparkles-outline" size={15} color={Colors.primary} />
            <CustomText
              textAlign="left"
              baseFont={12}
              fontWeight="700"
              color={Colors.primary}
            >
              {t("reviewOptionalCount", { count: optionalCompletedCount })}
            </CustomText>
          </View>
        </View>
        <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
          {canSubmit
            ? t("reviewLooksGood")
            : t("reviewCompleteRequired", { count: missingRequiredFields.length })}
        </CustomText>
      </View>
      {missingRequiredFields.length > 0 ? (
        <View style={styles.warningBox}>
          <CustomHeading textAlign="left" baseFont={15} color={Colors.danger}>
            {t("reviewRequiredMissingTitle")}
          </CustomHeading>
          <CustomText textAlign="left" color={Colors.subHeading}>
            {t("reviewPleaseAdd")}: {missingRequiredFields.join(", ")}
          </CustomText>
        </View>
      ) : null}
      {missingOptionalFields.length > 0 ? (
        <View style={styles.tipBox}>
          <CustomHeading textAlign="left" baseFont={15} color={Colors.primary}>
            {t("reviewOptionalTitle")}
          </CustomHeading>
          <CustomText textAlign="left" color={Colors.subHeading}>
            {t("reviewOptionalSubtitle")}: {missingOptionalFields.join(", ")}
          </CustomText>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderTitle}>
            <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
            <CustomHeading textAlign="left" baseFont={16} fontWeight="800">
              {t("reviewBasicDetails")}
            </CustomHeading>
          </View>
        </View>
        <View style={styles.infoRow}>
          <CustomText textAlign="left" color={Colors.subHeading}>
            {t("workType")}
          </CustomText>
          <CustomText textAlign="right" style={styles.infoValue}>
            {isValidText(type) ? t(type) : placeholder}
          </CustomText>
        </View>
        <View style={styles.infoRow}>
          <CustomText textAlign="left" color={Colors.subHeading}>
            {t("workSubType")}
          </CustomText>
          <CustomText textAlign="right" style={styles.infoValue}>
            {isValidText(subType) ? t(subType) : placeholder}
          </CustomText>
        </View>
        <View style={styles.infoRow}>
          <CustomText textAlign="left" color={Colors.subHeading}>
            {t("workDescription")}
          </CustomText>
          <CustomText
            textAlign="right"
            style={[styles.infoValue, !hasDescription && styles.placeholderText]}
          >
            {hasDescription ? description : placeholder}
          </CustomText>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderTitle}>
            <Ionicons name="navigate-outline" size={18} color={Colors.primary} />
            <CustomHeading textAlign="left" baseFont={16} fontWeight="800">
              {t("reviewLocationSchedule")}
            </CustomHeading>
          </View>
        </View>
        <View style={styles.infoRow}>
          <CustomText textAlign="left" color={Colors.subHeading}>
            {t("address")}
          </CustomText>
          <CustomText
            textAlign="right"
            style={[styles.infoValue, !hasAddress && styles.placeholderText]}
          >
            {hasAddress ? address : placeholder}
          </CustomText>
        </View>
        <View style={styles.infoRow}>
          <CustomText textAlign="left" color={Colors.subHeading}>
            {t("startDate")}
          </CustomText>
          <CustomText textAlign="right" style={styles.infoValue}>
            {startDate ? moment(startDate)?.format("Do MMM YYYY") : placeholder}
          </CustomText>
        </View>
        <View style={styles.infoRow}>
          <CustomText textAlign="left" color={Colors.subHeading}>
            {t("duration")}
          </CustomText>
          <CustomText textAlign="right" style={styles.infoValue}>
            {duration ? t("lessThanMultipleDays", { duration }) : placeholder}
          </CustomText>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderTitle}>
            <Ionicons name="gift-outline" size={18} color={Colors.primary} />
            <CustomHeading textAlign="left" baseFont={16} fontWeight="800">
              {t("facilities")}
            </CustomHeading>
          </View>
        </View>
        <View style={styles.facilityGrid}>
          {[
            { key: "travelling", enabled: facilities?.travelling },
            { key: "food", enabled: facilities?.food },
            { key: "living", enabled: facilities?.living },
            { key: "esi_pf", enabled: facilities?.esi_pf },
          ].map((fac) => (
            <View
              key={fac.key}
              style={[
                styles.facilityBadge,
                fac.enabled && styles.facilityBadgeEnabled,
              ]}
            >
              <View style={styles.facilityLabelRow}>
                <Ionicons
                  name={fac.enabled ? "checkmark-circle-outline" : "close-circle-outline"}
                  size={15}
                  color={fac.enabled ? "#047857" : Colors.subHeading}
                />
                <CustomText textAlign="left" baseFont={12} color={Colors.subHeading}>
                  {t(fac.key)}
                </CustomText>
              </View>
              <CustomHeading
                textAlign="left"
                baseFont={13}
                color={fac.enabled ? "#047857" : Colors.subHeading}
              >
                {fac.enabled ? t("included") : t("notIncluded")}
              </CustomHeading>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.requirementSectionHeader}>
          <View style={styles.requirementTitleRow}>
            <Ionicons
              name="people-outline"
              size={20}
              color={Colors.primary}
              style={styles.requirementTitleIcon}
            />
            <CustomHeading textAlign="left" baseFont={17} fontWeight="800">
              {t("workRequirements")}
            </CustomHeading>
          </View>
          {hasRequirements ? (
            <View style={styles.requirementCountPill}>
              <CustomText baseFont={12} fontWeight="700" color={Colors.primary}>
                {normalizedRequirements.length}
              </CustomText>
            </View>
          ) : null}
        </View>
        {hasRequirements ? (
          <View style={styles.requirementList}>
            {normalizedRequirements.map((requirement: any, index: number) => {
              const hasPay = Boolean(
                requirement?.payPerDay != null && Number(requirement?.payPerDay) > 0,
              );
              return (
                <View
                  style={[
                    styles.requirementCard,
                    !hasPay && styles.requirementCardMissingPay,
                  ]}
                  key={`${requirement?.name}-${index}`}
                >
                  <View
                    style={[
                      styles.requirementAccent,
                      hasPay ? styles.requirementAccentOk : styles.requirementAccentWarn,
                    ]}
                  />
                  <View style={styles.requirementCardBody}>
                    <View style={styles.requirementNameRow}>
                      <CustomText
                        baseFont={10}
                        fontWeight="700"
                        color={Colors.subHeading}
                        style={styles.requirementIndex}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </CustomText>
                      <CustomHeading
                        textAlign="left"
                        baseFont={16}
                        fontWeight="800"
                        style={styles.requirementRoleTitle}
                      >
                        {getDynamicWorkerType(
                          requirement?.name,
                          requirement?.count,
                        )}
                      </CustomHeading>
                    </View>
                    <View style={styles.requirementChipsRow}>
                      <View style={styles.metaChip}>
                        <Ionicons
                          name="layers-outline"
                          size={15}
                          color={Colors.primary}
                        />
                        <CustomText
                          textAlign="left"
                          baseFont={12}
                          fontWeight="700"
                          color={Colors.primary}
                        >
                          {t("count")} · {requirement?.count ?? 0}
                        </CustomText>
                      </View>
                      {hasPay ? (
                        <View style={[styles.metaChip, styles.metaChipPayOk]}>
                          <Ionicons
                            name="cash-outline"
                            size={15}
                            color="#047857"
                          />
                          <CustomText
                            textAlign="left"
                            baseFont={12}
                            fontWeight="800"
                            color="#047857"
                          >
                            ₹ {requirement?.payPerDay} {t("perDay")}
                          </CustomText>
                        </View>
                      ) : (
                        <View style={[styles.metaChip, styles.metaChipPayMissing]}>
                          <Ionicons
                            name="alert-circle-outline"
                            size={15}
                            color="#B45309"
                          />
                          <CustomText
                            textAlign="left"
                            baseFont={12}
                            fontWeight="700"
                            color="#B45309"
                          >
                            {t("workRequirementAddPayHint")}
                          </CustomText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[styles.emptyStateBox, styles.emptyStateBoxCenter]}>
            <Ionicons
              name="clipboard-outline"
              size={22}
              color={Colors.subHeading}
            />
            <CustomText
              textAlign="center"
              color={Colors.subHeading}
              style={styles.emptyStateText}
            >
              {placeholder}
            </CustomText>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderTitle}>
            <Ionicons name="images-outline" size={18} color={Colors.primary} />
            <CustomHeading textAlign="left" baseFont={16} fontWeight="800">
              {t("workImages")}
            </CustomHeading>
          </View>
          {hasImages ? (
            <View style={styles.requirementCountPill}>
              <CustomText baseFont={12} fontWeight="700" color={Colors.primary}>
                {normalizedImages.length}
              </CustomText>
            </View>
          ) : null}
        </View>
        {hasImages ? (
          <View style={styles.imageContainer}>
            {normalizedImages.map((imgUri: any, index: number) => (
              <View key={index} style={styles.imagesContainer}>
                <Image source={{ uri: imgUri }} style={styles.uploadedImage} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyStateBox}>
            <CustomText textAlign="left" color={Colors.subHeading}>
              {placeholder}
            </CustomText>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <ButtonComp
          isPrimary={true}
          title={t("back")}
          onPress={() => setStep(7)}
          bgColor={Colors.danger}
          borderColor={Colors.danger}
          style={{ width: "35%" }}
        />
        <ButtonComp
          isPrimary={true}
          title={
            canSubmit
              ? t("submitAllDetails")
              : t("reviewCompleteRequired", { count: missingRequiredFields.length })
          }
          onPress={handleFinish}
          style={{ flex: 1 }}
          disabled={!canSubmit}
          loading={isSubmitting}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
  },
  content: {
    paddingBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    gap: 10,
  },
  section: {
    backgroundColor: Colors?.white,
    borderRadius: 16,
    borderColor: "rgba(14,79,197,0.12)",
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  statusSummaryCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(14,79,197,0.14)",
    backgroundColor: "#F8FAFF",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  statusSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  statusSummaryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "#DCFCE7",
  },
  statusSummaryPillInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: "rgba(14, 79, 197, 0.1)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  sectionHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 10,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "rgba(14,79,197,0.08)",
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    color: Colors.primary,
  },
  placeholderText: {
    color: Colors.subHeading,
    fontStyle: "italic",
  },
  warningBox: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  tipBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "rgba(14,79,197,0.2)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  facilityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  facilityBadge: {
    width: "48%",
    borderRadius: 12,
    backgroundColor: "#F8FAFF",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(14,79,197,0.1)",
    gap: 6,
  },
  facilityBadgeEnabled: {
    backgroundColor: "#ECFDF5",
    borderColor: "#86EFAC",
  },
  facilityLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  requirementSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  requirementTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  requirementTitleIcon: {
    marginTop: 1,
  },
  requirementCountPill: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "rgba(14, 79, 197, 0.1)",
  },
  requirementList: {
    marginTop: 6,
    gap: 10,
  },
  requirementCard: {
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(14,79,197,0.12)",
    backgroundColor: "#F9FBFF",
    minHeight: 64,
  },
  requirementCardMissingPay: {
    backgroundColor: "#FFFBF5",
    borderColor: "rgba(180, 83, 9, 0.25)",
  },
  requirementAccent: {
    width: 4,
    alignSelf: "stretch",
  },
  requirementAccentOk: {
    backgroundColor: "rgba(14, 79, 197, 0.85)",
  },
  requirementAccentWarn: {
    backgroundColor: "#D97706",
  },
  requirementCardBody: {
    flex: 1,
    paddingVertical: 11,
    paddingRight: 12,
    paddingLeft: 10,
  },
  requirementNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementIndex: {
    minWidth: 20,
  },
  requirementRoleTitle: {
    flex: 1,
    textTransform: "capitalize",
  },
  requirementChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "rgba(14, 79, 197, 0.08)",
  },
  metaChipPayOk: {
    backgroundColor: "#D1FAE5",
  },
  metaChipPayMissing: {
    backgroundColor: "#FEF3C7",
  },
  emptyStateBox: {
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(14,79,197,0.1)",
    backgroundColor: "#F8FAFF",
    padding: 12,
  },
  emptyStateBoxCenter: {
    alignItems: "center",
    paddingVertical: 16,
  },
  emptyStateText: {
    marginTop: 6,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 10,
  },
  uploadedImage: {
    width: 88,
    height: 88,
    borderRadius: 10,
  },
  imagesContainer: {
    borderWidth: 1,
    borderColor: "rgba(14,79,197,0.12)",
    borderRadius: 12,
    padding: 4,
    backgroundColor: "#FFFFFF",
  },
});

export default FinalScreen;
