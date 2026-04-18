import Atoms from "@/app/AtomStore";
import { useAtomValue } from "jotai";
import React from "react";
import { View, StyleSheet } from "react-native";
import CustomHeading from "./CustomHeading";
import CustomText from "./CustomText";
import { t } from "@/utils/translationHelper";
import Colors from "@/constants/Colors";

const StatsCard = () => {
  const userDetails = useAtomValue(Atoms?.UserAtom);

  return (
    <View style={styles.container}>
      <View>
        <CustomHeading baseFont={24}>
          {userDetails?.likedUsers?.length || 0}
        </CustomHeading>
        <CustomText color={Colors?.heading}>{t("savedWorkers")}</CustomText>
      </View>
      <View>
        <CustomHeading baseFont={24}>
          {userDetails?.likedServices?.length || 0}
        </CustomHeading>
        <CustomText color={Colors?.heading}>{t("savedServices")}</CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F4F6FA",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8ECF4",
    padding: 18,
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 12,
  },
});

export default StatsCard;
