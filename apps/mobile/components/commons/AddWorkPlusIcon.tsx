import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

type Props = {
  size?: number;
};

const AddWorkPlusIcon = ({ size = 72 }: Props) => (
  <LinearGradient
    colors={["#6CB8FF", "#3D7AE8", Colors.primary]}
    locations={[0, 0.45, 1]}
    start={{ x: 0.5, y: 0 }}
    end={{ x: 0.5, y: 1 }}
    style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
  >
    <Ionicons name="add" size={Math.round(size * 0.54)} color={Colors.white} />
  </LinearGradient>
);

/** Plus icon tucked into bottom-right — ~20% clipped on right & bottom edges. */
const AddWorkPlusIconSlot = () => {
  const size = 112;
  const clipOffset = 24;

  return (
    <View style={styles.iconSlot}>
      <View
        style={{
          marginRight: -clipOffset,
          marginBottom: -clipOffset,
        }}
      >
        <AddWorkPlusIcon size={size} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  iconSlot: {
    width: 102,
    height: 118,
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
});

export default AddWorkPlusIcon;
export { AddWorkPlusIconSlot };
