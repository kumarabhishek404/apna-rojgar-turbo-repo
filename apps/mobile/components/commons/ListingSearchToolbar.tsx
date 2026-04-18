import React from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import CustomText from "@/components/commons/CustomText";
import { t } from "@/utils/translationHelper";

export type ListingSearchToolbarVariant = "default" | "onDark";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  onPressFilter: () => void;
  placeholderKey: string;
  style?: ViewStyle;
  /** Use on blue / gradient headers: high-contrast filter control and search field tuning. */
  variant?: ListingSearchToolbarVariant;
};

const ListingSearchToolbar = ({
  value,
  onChangeText,
  onPressFilter,
  placeholderKey,
  style,
  variant = "default",
}: Props) => {
  const dark = variant === "onDark";

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.searchShell, dark && styles.searchShellOnDark]}>
        <Ionicons
          name="search-outline"
          size={20}
          color={
            dark ? "rgba(34, 64, 154, 0.42)" : "rgba(34, 64, 154, 0.45)"
          }
          style={styles.searchIcon}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={t(placeholderKey)}
          placeholderTextColor={
            dark ? "rgba(44, 44, 44, 0.42)" : "rgba(90, 90, 90, 0.55)"
          }
          style={[styles.input, dark && styles.inputOnDark]}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>
      <TouchableOpacity
        onPress={onPressFilter}
        style={[styles.filterBtn, dark && styles.filterBtnOnDark]}
        accessibilityRole="button"
        accessibilityLabel={t("filter")}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="options-outline"
          size={20}
          color={dark ? Colors.white : Colors.primary}
        />
        <CustomText
          fontWeight="700"
          baseFont={15}
          color={dark ? Colors.white : Colors.primary}
          style={dark ? styles.filterLabelOnDark : undefined}
        >
          {t("filter")}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  searchShell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 46,
    shadowColor: "#0a162e",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchShellOnDark: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
  inputOnDark: {
    color: "#1c1d26",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  filterBtnOnDark: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  filterLabelOnDark: {
    letterSpacing: 0.2,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default ListingSearchToolbar;
