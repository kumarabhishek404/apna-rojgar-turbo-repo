import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import React, { useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import CustomText from "./CustomText";
import { t } from "@/utils/translationHelper";
import { getDynamicWorkerType } from "@/utils/i18n";

const HIDDEN_KEYS = new Set(["role"]);

type Chip = {
  id: string;
  filterKey: string;
  skill?: string;
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow: string;
  value: string;
};

const iconForKey = (key: string): keyof typeof Ionicons.glyphMap => {
  switch (key) {
    case "distance":
      return "location-outline";
    case "skills":
      return "construct-outline";
    case "duration":
      return "time-outline";
    case "serviceStartIn":
      return "calendar-outline";
    case "type":
      return "grid-outline";
    case "rating":
      return "star-outline";
    case "completedServices":
      return "checkmark-done-outline";
    default:
      return "funnel-outline";
  }
};

const labelForKey = (key: string) => {
  if (key === "skills") return t("skill");
  if (key === "serviceStartIn") return t("serviceStartIn") || t(key);
  return t(key);
};

const formatValue = (key: string, value: unknown): string => {
  if (key === "rating") return String(value);
  if (key === "role") {
    if (value === "WORKER") return t("roleTagLabour");
    if (value === "MEDIATOR") return t("roleTagContractor");
    return t("roleTagEmployer");
  }
  return t(String(value));
};

const buildChips = (appliedFilters: Record<string, any> = {}): Chip[] => {
  const chips: Chip[] = [];

  Object.entries(appliedFilters).forEach(([key, value]) => {
    if (HIDDEN_KEYS.has(key)) return;
    if (value == null || value === "" || value === 0) return;

    if (key === "skills" || key === "skill") {
      const skills = Array.isArray(value) ? value : [value];
      skills.forEach((skill: string) => {
        if (!skill) return;
        chips.push({
          id: `${key}:${skill}`,
          filterKey: key,
          skill,
          icon: iconForKey("skills"),
          eyebrow: labelForKey("skills"),
          value: getDynamicWorkerType(skill, 1),
        });
      });
      return;
    }

    chips.push({
      id: key,
      filterKey: key,
      icon: iconForKey(key),
      eyebrow: labelForKey(key),
      value: formatValue(key, value),
    });
  });

  return chips;
};

const AppliedFilters = ({
  appliedFilters,
  setAppliedFilters,
  fetchUsers,
}: any) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [scrollX, setScrollX] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const chips = useMemo(() => buildChips(appliedFilters), [appliedFilters]);

  const updateScrollHints = (
    offsetX: number,
    contentWidth: number,
    viewWidth: number,
  ) => {
    setShowLeftArrow(offsetX > 8);
    setShowRightArrow(offsetX + viewWidth < contentWidth - 8);
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setScrollX(contentOffset.x);
    updateScrollHints(
      contentOffset.x,
      contentSize.width,
      layoutMeasurement.width,
    );
  };

  const scrollByFilter = (direction: "left" | "right") => {
    const next =
      direction === "left"
        ? scrollX - Math.max(containerWidth * 0.7, 120)
        : scrollX + Math.max(containerWidth * 0.7, 120);
    scrollViewRef.current?.scrollTo({ x: next, animated: true });
  };

  const commitFilters = (next: Record<string, any>) => {
    setAppliedFilters(next);
    fetchUsers?.(next);
  };

  const removeChip = (chip: Chip) => {
    const next = { ...appliedFilters };

    if (chip.filterKey === "skills" && chip.skill) {
      const remaining = (next.skills || []).filter(
        (item: string) => item !== chip.skill,
      );
      if (remaining.length) next.skills = remaining;
      else delete next.skills;
    } else if (chip.filterKey === "skill") {
      delete next.skill;
    } else {
      delete next[chip.filterKey];
    }

    commitFilters(next);
  };

  const clearAll = () => {
    const next = { ...appliedFilters };
    chips.forEach((chip) => {
      delete next[chip.filterKey];
    });
    commitFilters(next);
  };

  if (!chips.length) return null;

  return (
    <View style={styles.wrapper}>
      {showLeftArrow ? (
        <TouchableOpacity
          onPress={() => scrollByFilter("left")}
          style={styles.arrowButton}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={16} color={Colors.primary} />
        </TouchableOpacity>
      ) : null}

      <ScrollView
        horizontal
        ref={scrollViewRef}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onLayout={(event) =>
          setContainerWidth(event.nativeEvent.layout.width)
        }
        onContentSizeChange={(width) =>
          updateScrollHints(scrollX, width, containerWidth)
        }
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollContainer}
      >
        {chips.map((chip) => (
          <View key={chip.id} style={styles.chip}>
            <View style={styles.chipIcon}>
              <Ionicons name={chip.icon} size={13} color={Colors.primary} />
            </View>
            <View style={styles.chipCopy}>
              <CustomText
                baseFont={10}
                fontWeight="700"
                color="rgba(34, 64, 154, 0.58)"
                textAlign="left"
                numberOfLines={1}
                style={styles.eyebrow}
              >
                {chip.eyebrow}
              </CustomText>
              <CustomText
                baseFont={13}
                fontWeight="700"
                color={Colors.heading}
                textAlign="left"
                numberOfLines={1}
              >
                {chip.value}
              </CustomText>
            </View>
            <TouchableOpacity
              onPress={() => removeChip(chip)}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel={`${t("clear")} ${chip.eyebrow}`}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="close" size={13} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {showRightArrow ? (
        <TouchableOpacity
          onPress={() => scrollByFilter("right")}
          style={styles.arrowButton}
          accessibilityRole="button"
        >
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      ) : null}

      {chips.length > 1 ? (
        <TouchableOpacity
          onPress={clearAll}
          style={styles.clearAll}
          accessibilityRole="button"
          accessibilityLabel={t("clear")}
        >
          <CustomText baseFont={12} fontWeight="700" color={Colors.primary}>
            {t("clear")}
          </CustomText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
    paddingRight: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.14)",
    shadowColor: "#0a162e",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    maxWidth: 220,
  },
  chipIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34, 64, 154, 0.08)",
  },
  chipCopy: {
    flexShrink: 1,
    minWidth: 0,
    gap: 1,
  },
  eyebrow: {
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  closeButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34, 64, 154, 0.08)",
  },
  arrowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "rgba(34, 64, 154, 0.12)",
  },
  clearAll: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});

export default AppliedFilters;
