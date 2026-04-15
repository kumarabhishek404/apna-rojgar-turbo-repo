import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { router } from "expo-router";
import GradientWrapper from "@/components/commons/GradientWrapper";
import Colors from "@/constants/Colors";
import { t } from "@/utils/translationHelper";
import AllTopWorkers from "../topWorkers";

import HeaderAction from "@/components/commons/IconGroupButtons";

const EmployerSearchScreen = () => {
  const ClickAddService = () =>
    router.push({ pathname: "/screens/addService" });

  const ClickMyAllServices = () =>
    router.push({
      pathname: "/screens/service",
      params: { title: "titleMyAllServicesAndBookings", type: "myServices" },
    });

  const buttons = {
    label: t("addNewWork"),
    onPress: ClickAddService,
  };
  return (
    <View style={{ flex: 1, backgroundColor: Colors.primary }}>
      {/* Top Buttons */}
      <View style={styles.header}>
        <HeaderAction buttons={buttons} />
      </View>

      {/* ⭐ IMPORTANT: No ScrollView here */}
      <GradientWrapper>
        <View style={styles.container}>
          <View style={{ flex: 1 }}>
            <AllTopWorkers />
          </View>
        </View>
      </GradientWrapper>
    </View>
  );
};

export default EmployerSearchScreen;

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingBottom: 4, // Minimal padding
  },
  container: {
    flex: 1, // Changed from flexGrow to flex to keep it contained
    // Remove minHeight: "100%" to prevent unnecessary stretching
  },
});
