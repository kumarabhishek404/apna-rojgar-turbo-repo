import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const HeaderAction = ({ buttons }: any) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={buttons?.onPress}
        activeOpacity={0.7}
        style={styles.compactGlassCard}
      >
        <View style={styles.iconWrapper}>
          <Text style={styles.iconPlaceholder}>+</Text>
        </View>

        <Text style={styles.titleText}>{buttons?.label || "Add new work"}</Text>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 8, // Reduced from 12
  },
  compactGlassCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16, // Slightly smaller radius for a tighter look
    paddingVertical: 8, // Thinner padding
    paddingHorizontal: 12,
  },
  iconWrapper: {
    width: 32, // Smaller icon box (was 48)
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlaceholder: {
    color: "#1E3A8A",
    fontSize: 18,
    fontWeight: "bold",
  },
  titleText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15, // Slightly smaller
    fontWeight: "600",
    marginLeft: 12,
  },
  chevron: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 22,
    fontWeight: "300",
  },
});

export default HeaderAction;
