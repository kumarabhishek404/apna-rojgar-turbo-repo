import Colors from "@/constants/Colors";
import { isUserVerified } from "@/utils/userVerification";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import CustomText from "./CustomText";
import { t } from "@/utils/translationHelper";

type Props = {
  user?: { verification?: string | null } | null;
  verification?: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  tone?: "brand" | "onDark";
};

const SIZE = {
  sm: { box: 14, icon: 8, font: 9 },
  md: { box: 18, icon: 11, font: 10 },
  lg: { box: 22, icon: 13, font: 11 },
};

const VerifiedBadge = ({
  user,
  verification,
  size = "md",
  showLabel = false,
  tone = "brand",
}: Props) => {
  if (!isUserVerified(user || verification)) return null;

  const scale = SIZE[size];
  const onDark = tone === "onDark";

  return (
    <View style={styles.wrap} accessibilityLabel={t("verifiedUser")}>
      <View
        style={[
          styles.mark,
          {
            width: scale.box,
            height: scale.box,
            borderRadius: scale.box / 2,
            backgroundColor: onDark ? Colors.white : Colors.primary,
            shadowColor: Colors.primary,
          },
        ]}
      >
        <Ionicons
          name="checkmark"
          size={scale.icon}
          color={onDark ? Colors.primary : Colors.white}
        />
      </View>
      {showLabel ? (
        <CustomText
          baseFont={scale.font}
          fontWeight="800"
          color={onDark ? Colors.white : Colors.primary}
          style={styles.label}
        >
          {t("verified")}
        </CustomText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  mark: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});

export default VerifiedBadge;
