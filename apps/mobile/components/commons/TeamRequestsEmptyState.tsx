import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/Colors";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import ButtonComp from "../inputs/Button";
import { t } from "@/utils/translationHelper";

type Props = {
  tab: "RECEIVED" | "SENT";
  refreshControl?: React.ReactElement<typeof RefreshControl>;
};

const TeamRequestsEmptyState = ({ tab, refreshControl }: Props) => {
  const isReceived = tab === "RECEIVED";

  const title = isReceived
    ? t("teamRequestsEmptyReceivedTitle")
    : t("teamRequestsEmptySentTitle");

  const subtitle = isReceived
    ? t("teamRequestsEmptyReceivedSubtitle")
    : t("teamRequestsEmptySentSubtitle");

  const steps = isReceived
    ? [
        t("teamRequestsEmptyReceivedStep1"),
        t("teamRequestsEmptyReceivedStep2"),
        t("teamRequestsEmptyReceivedStep3"),
      ]
    : [
        t("teamRequestsEmptySentStep1"),
        t("teamRequestsEmptySentStep2"),
        t("teamRequestsEmptySentStep3"),
      ];

  const ctaTitle = isReceived
    ? t("teamRequestsBrowseTeamCta")
    : t("teamRequestsFindWorkersCta");

  const onCtaPress = () => {
    if (isReceived) {
      router.push({ pathname: "/(tabs)/third" });
      return;
    }
    router.push({ pathname: "/(tabs)/second" });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={isReceived ? "mail-open-outline" : "paper-plane-outline"}
            size={36}
            color={Colors.primary}
          />
        </View>

        <CustomHeading textAlign="center" baseFont={18} color={Colors.black}>
          {title}
        </CustomHeading>

        <CustomText
          textAlign="center"
          baseFont={14}
          color={Colors.subHeading}
          style={styles.subtitle}
        >
          {subtitle}
        </CustomText>

        <View style={styles.stepsBox}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <CustomText baseFont={12} fontWeight="700" color={Colors.primary}>
                  {index + 1}
                </CustomText>
              </View>
              <CustomText
                textAlign="left"
                baseFont={14}
                style={styles.stepText}
                color={Colors.text}
              >
                {step}
              </CustomText>
            </View>
          ))}
        </View>

        <ButtonComp
          isPrimary
          title={ctaTitle}
          onPress={onCtaPress}
          style={styles.ctaButton}
          textStyle={styles.ctaButtonText}
          icon={
            <Ionicons
              name={isReceived ? "people-outline" : "search-outline"}
              size={18}
              color={Colors.white}
              style={{ marginRight: 8 }}
            />
          }
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 4,
    paddingBottom: 24,
    justifyContent: "center",
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.1)",
    alignItems: "center",
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.fourth,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  subtitle: {
    lineHeight: 22,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  stepsBox: {
    width: "100%",
    marginTop: 18,
    gap: 10,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.fourth,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepText: {
    flex: 1,
    lineHeight: 21,
  },
  ctaButton: {
    marginTop: 20,
    width: "100%",
    minHeight: 48,
    borderRadius: 12,
    paddingVertical: 12,
  },
  ctaButtonText: {
    fontSize: 15,
  },
});

export default TeamRequestsEmptyState;
