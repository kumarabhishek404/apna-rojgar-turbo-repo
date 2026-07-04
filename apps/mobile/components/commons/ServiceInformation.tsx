import Colors from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import { t } from "@/utils/translationHelper";

interface ServiceInformationProps {
  information: any;
  style?: any;
}

const ServiceInformation = ({
  information,
  style,
}: ServiceInformationProps) => {
  const serviceStats = [
    {
      value: information?.byService?.total || 0,
      label: t("totalServices"),
      icon: "list-circle-outline" as const,
      tone: "#EEF4FF",
    },
    {
      value: information?.byService?.completed || 0,
      label: t("completed"),
      icon: "checkmark-done-circle-outline" as const,
      tone: "#EAF8F0",
    },
    {
      value: information?.byService?.pending || 0,
      label: t("pending"),
      icon: "time-outline" as const,
      tone: "#FFF7E8",
    },
    {
      value: information?.byService?.cancelled || 0,
      label: t("cancelled"),
      icon: "close-circle-outline" as const,
      tone: "#FEEEEE",
    },
  ];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <CustomHeading
          textAlign="left"
          color={Colors?.heading}
          baseFont={22}
          style={styles.title}
        >
          {t("serviceInformation")}
        </CustomHeading>
        <CustomText
          textAlign="left"
          color={Colors?.tertieryButton}
          baseFont={15}
          style={styles.subtitle}
        >
          {t("servicesWhichProvidedByYou")}
        </CustomText>
      </View>

      <View style={styles.statGrid}>
        {serviceStats.map((item) => (
          <View key={item.label} style={styles.statCard}>
            <View style={[styles.iconBadge, { backgroundColor: item.tone }]}>
              <Ionicons name={item.icon} size={18} color={Colors.primary} />
            </View>
            <CustomHeading
              baseFont={24}
              color={Colors.primary}
              style={styles.statValue}
            >
              {item.value}
            </CustomHeading>
            <CustomText
              baseFont={13}
              color={Colors.heading}
              textAlign="center"
              style={styles.statLabel}
            >
              {item.label}
            </CustomText>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ServiceInformation;

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    gap: 4,
  },
  title: {
    lineHeight: 28,
  },
  subtitle: {
    lineHeight: 21,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "48.5%",
    minHeight: 112,
    borderRadius: 18,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#E4EAF5",
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    lineHeight: 30,
  },
  statLabel: {
    lineHeight: 18,
  },
});
