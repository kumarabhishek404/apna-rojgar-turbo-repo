/**
 * Primary floating action — label follows API user role; routes reuse existing flows.
 */
import React, { useMemo } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomText from "@/components/commons/CustomText";
import Colors from "@/constants/Colors";
import { t } from "@/utils/translationHelper";

type ApiRole = "WORKER" | "EMPLOYER" | "MEDIATOR" | string | undefined;

const UnifiedTabFab = ({ role }: { role: ApiRole }) => {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12) + 72;

  const { label, onPress } = useMemo(() => {
    if (role === "EMPLOYER") {
      return {
        label: t("postWork"),
        onPress: () => router.push({ pathname: "/screens/addService" }),
      };
    }
    if (role === "MEDIATOR") {
      return {
        label: t("fabManage"),
        onPress: () => router.push({ pathname: "/(tabs)/second" }),
      };
    }
    return {
      label: t("findWork"),
      onPress: () => router.push({ pathname: "/(tabs)/second" }),
    };
  }, [role]);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom }]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.fabOuter}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <LinearGradient
          colors={["#1D63DA", "#0E4FC5", "#0A3EA0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <MaterialIcons name="add" size={22} color={Colors.white} />
          <CustomText
            color={Colors.white}
            fontWeight="800"
            baseFont={13}
            numberOfLines={1}
            style={styles.fabLabel}
          >
            {label}
          </CustomText>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: undefined,
    zIndex: 40,
  },
  fabOuter: {
    borderRadius: 26,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#0E4FC5",
        shadowOpacity: 0.34,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 8 },
    }),
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 26,
    minHeight: 50,
  },
  fabLabel: { maxWidth: 140 },
});

export default UnifiedTabFab;
