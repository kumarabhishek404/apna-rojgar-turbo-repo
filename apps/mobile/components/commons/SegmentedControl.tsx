import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Colors from "@/constants/Colors";
import CustomText from "@/components/commons/CustomText";

const TRACK = "rgba(34, 64, 154, 0.11)";
const INSET = 4;

export type SegmentedControlSegment = {
  label: string;
  sublabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel?: string;
};

type Props = {
  segments: SegmentedControlSegment[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: ViewStyle;
  testID?: string;
};

/**
 * iOS-style segmented control: soft lavender track, sliding white pill with shadow.
 * Use app-wide for secondary filters / tab switches.
 */
const SegmentedControl = ({
  segments,
  selectedIndex,
  onChange,
  style,
  testID,
}: Props) => {
  const count = Math.max(1, segments.length);
  const [trackW, setTrackW] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const prevThumbW = useRef(0);

  const thumbW =
    trackW > 0 ? (trackW - INSET * 2) / count : 0;

  useEffect(() => {
    if (thumbW <= 0) return;
    const target = selectedIndex * thumbW;
    if (prevThumbW.current !== thumbW) {
      prevThumbW.current = thumbW;
      translateX.setValue(target);
      return;
    }
    Animated.spring(translateX, {
      toValue: target,
      useNativeDriver: true,
      tension: 320,
      friction: 28,
    }).start();
  }, [selectedIndex, thumbW, translateX]);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackW(e.nativeEvent.layout.width);
  };

  const hasSublabel = segments.some((s) => !!s.sublabel);

  return (
    <View
      style={[styles.wrap, style]}
      onLayout={onTrackLayout}
      testID={testID}
    >
      <View style={[styles.track, hasSublabel && styles.trackTall]}>
        {thumbW > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumb,
              {
                width: thumbW,
                transform: [{ translateX }],
              },
            ]}
          />
        ) : null}
        <View style={styles.row} pointerEvents="box-none">
          {segments.map((seg, i) => {
            const selected = selectedIndex === i;
            const a11y = seg.accessibilityLabel || seg.label;
            return (
              <Pressable
                key={`seg-${i}-${seg.label}`}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={a11y}
                onPress={() => onChange(i)}
                style={styles.cell}
              >
                {seg.icon ? (
                  <View style={styles.iconRow}>
                    <Ionicons
                      name={seg.icon}
                      size={15}
                      color={
                        selected
                          ? Colors.primary
                          : "rgba(34, 64, 154, 0.5)"
                      }
                    />
                    <CustomText
                      fontWeight={selected ? "800" : "600"}
                      baseFont={hasSublabel ? 11 : 13}
                      numberOfLines={2}
                      color={
                        selected
                          ? Colors.primary
                          : "rgba(34, 64, 154, 0.55)"
                      }
                      textAlign="center"
                      style={styles.labelWithIcon}
                    >
                      {seg.label}
                    </CustomText>
                  </View>
                ) : (
                  <CustomText
                    fontWeight={selected ? "800" : "600"}
                    baseFont={hasSublabel ? 12 : 14}
                    numberOfLines={2}
                    color={
                      selected
                        ? Colors.primary
                        : "rgba(34, 64, 154, 0.55)"
                    }
                    textAlign="center"
                  >
                    {seg.label}
                  </CustomText>
                )}
                {seg.sublabel ? (
                  <CustomText
                    baseFont={9}
                    numberOfLines={2}
                    textAlign="center"
                    color={
                      selected
                        ? "rgba(34, 64, 154, 0.72)"
                        : "rgba(34, 64, 154, 0.42)"
                    }
                    style={styles.sublabel}
                  >
                    {seg.sublabel}
                  </CustomText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  track: {
    position: "relative",
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: TRACK,
    padding: INSET,
    overflow: "hidden",
  },
  trackTall: {
    minHeight: 58,
    paddingVertical: INSET,
  },
  thumb: {
    position: "absolute",
    left: INSET,
    top: INSET,
    bottom: INSET,
    borderRadius: 999,
    backgroundColor: Colors.white,
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    zIndex: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    zIndex: 1,
  },
  cell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  sublabel: {
    marginTop: 2,
    lineHeight: 12,
    paddingHorizontal: 2,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  labelWithIcon: {
    flexShrink: 1,
  },
});

export default SegmentedControl;
