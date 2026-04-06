import React from "react";
import CustomText from "./CustomText";
import { t } from "@/utils/translationHelper";
import { View } from "react-native";
import { StyleSheet } from "react-native";

interface ShowAddressProps {
  address: string;
  numberOfLines?: number; // Optional prop for controlling text wrapping
  /** Set false when a row icon is shown beside the address (modern list cards). */
  showLeadingPin?: boolean;
  baseFont?: number;
}

const ShowAddress: React.FC<ShowAddressProps> = ({
  address,
  numberOfLines,
  showLeadingPin = true,
  baseFont = 17,
}) => {
  return (
    <View style={styles.container}>
      {showLeadingPin ? (
        <CustomText textAlign="left" baseFont={baseFont} numberOfLines={numberOfLines}>
          📍{" "}
        </CustomText>
      ) : null}
      <CustomText
        textAlign="left"
        baseFont={baseFont}
        numberOfLines={numberOfLines}
        style={{ flex: 1 }}
      >
        {address || t("addressNotFound")}
      </CustomText>
    </View>
  );
};

export default ShowAddress;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 3,
  },
});
