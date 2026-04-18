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
    marginTop: 4,
  },
  compactGlassCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(78, 112, 219, 0.95)",
    borderColor: "rgba(255, 255, 255, 0.26)",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#0f2663",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f2663",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconPlaceholder: {
    color: "#1E3A8A",
    fontSize: 24,
    fontWeight: "800",
  },
  titleText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 12,
    letterSpacing: 0.15,
  },
  chevron: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 23,
    fontWeight: "400",
    marginLeft: 8,
  },
});

export default HeaderAction;
