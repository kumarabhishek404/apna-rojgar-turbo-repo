import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import Colors from "@/constants/Colors";
import CustomText from "@/components/commons/CustomText";

export type SortTabItem = {
  id: string;
  label: string;
};

export type ScrollableSortTabsVariant = "default" | "onDark";

type Props = {
  tabs: SortTabItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  style?: ViewStyle;
  /** onDark: frosted track + light inactive labels for blue gradient headers. */
  variant?: ScrollableSortTabsVariant;
};

/** Approximate min width per label + padding; used to decide scroll vs full-width row. */
const MIN_TAB_WIDTH = 80;
const TAB_GAP = 8;
/** Parent horizontal padding (allWorkers ~20, margin). */
const SCREEN_INSET = 28;

function useShouldFillWidth(tabCount: number) {
  const { width } = useWindowDimensions();
  return useMemo(() => {
    if (tabCount <= 0) return false;
    const available = width - SCREEN_INSET;
    const needed =
      tabCount * MIN_TAB_WIDTH + Math.max(0, tabCount - 1) * TAB_GAP;
    return needed <= available;
  }, [width, tabCount]);
}

/**
 * Sort tabs: scrolls when many tabs; when they fit, uses full width with flex
 * and a wider selected tab.
 */
const ScrollableSortTabs = ({
  tabs,
  selectedId,
  onSelect,
  style,
  variant = "default",
}: Props) => {
  const dark = variant === "onDark";
  const fill = useShouldFillWidth(tabs.length);

  const trackStyle = [styles.track, dark && styles.trackOnDark, style];

  const renderChip = (tab: SortTabItem, idx: number, layout: "scroll" | "fill") => {
    const active = tab.id === selectedId;
    const isFill = layout === "fill";

    return (
      <Pressable
        key={tab.id}
        onPress={() => onSelect(tab.id)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        style={[
          styles.chip,
          dark && styles.chipOnDark,
          isFill && styles.chipFill,
          isFill && { flex: active ? 1.48 : 1 },
          isFill && idx > 0 && styles.chipFillGap,
          active && (dark ? styles.chipActiveOnDark : styles.chipActive),
          active && isFill && styles.chipActiveWide,
          layout === "scroll" &&
            idx < tabs.length - 1 &&
            styles.chipSpacing,
        ]}
      >
        <CustomText
          fontWeight={active ? "800" : "600"}
          baseFont={13}
          numberOfLines={1}
          textAlign="center"
          color={
            active
              ? Colors.primary
              : dark
                ? "rgba(255, 255, 255, 0.92)"
                : "rgba(34, 64, 154, 0.62)"
          }
          style={dark && !active ? styles.inactiveLabelOnDark : undefined}
        >
          {tab.label}
        </CustomText>
      </Pressable>
    );
  };

  if (fill) {
    return (
      <View style={trackStyle}>
        <View style={styles.fillRow}>{tabs.map((t, i) => renderChip(t, i, "fill"))}</View>
      </View>
    );
  }

  return (
    <View style={trackStyle}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollInner}
        keyboardShouldPersistTaps="handled"
      >
        {tabs.map((tab, idx) => renderChip(tab, idx, "scroll"))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    backgroundColor: "rgba(34, 64, 154, 0.11)",
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  trackOnDark: {
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.26)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  fillRow: {
    flexDirection: "row",
    alignItems: "stretch",
    width: "100%",
  },
  chipFillGap: {
    marginLeft: TAB_GAP,
  },
  scrollInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 2,
    minHeight: 36,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: 280,
  },
  chipFill: {
    flex: 1,
    minWidth: 0,
    maxWidth: undefined,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipOnDark: {
    paddingVertical: 6,
  },
  chipSpacing: {
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: Colors.white,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chipActiveOnDark: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0a162e",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  chipActiveWide: {
    paddingHorizontal: 14,
    minHeight: 36,
  },
  inactiveLabelOnDark: {
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default ScrollableSortTabs;
