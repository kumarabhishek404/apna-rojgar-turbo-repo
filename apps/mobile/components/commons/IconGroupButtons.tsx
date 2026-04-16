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
    backgroundColor: "#3B5FCF",
    borderColor: "#5A78E3",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 11,
    shadowColor: "#0f2663",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlaceholder: {
    color: "#1E3A8A",
    fontSize: 23,
    fontWeight: "800",
  },
  titleText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 10,
  },
  chevron: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 21,
    fontWeight: "400",
    marginLeft: 6,
  },
});

export default HeaderAction;
