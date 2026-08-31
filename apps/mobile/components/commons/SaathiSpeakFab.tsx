import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import CustomText from "@/components/commons/CustomText";
import { t } from "@/utils/translationHelper";
import Colors from "@/constants/Colors";

type Props = {
  bottomOffset: number;
};

export default function SaathiSpeakFab({ bottomOffset }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const hintOpacity = useRef(new Animated.Value(1)).current;
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const hide = setTimeout(() => {
      Animated.timing(hintOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShowHint(false);
      });
    }, 3000);
    return () => clearTimeout(hide);
  }, [hintOpacity]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.22],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0],
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: bottomOffset }]}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => router.push("/screens/rojgarSaathi")}
        accessibilityRole="button"
        accessibilityLabel={`${t("saathiFabTitle")}. ${t("saathiFabHint")}`}
        style={styles.hit}
      >
        {showHint ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.labelCard, { opacity: hintOpacity }]}
          >
            <CustomText
              baseFont={13}
              fontWeight="800"
              color="#14532D"
              textAlign="right"
              numberOfLines={1}
            >
              {t("saathiFabTitle")}
            </CustomText>
            <CustomText
              baseFont={11}
              fontWeight="600"
              color="#3F6B4A"
              textAlign="right"
              numberOfLines={1}
            >
              {t("saathiFabHint")}
            </CustomText>
          </Animated.View>
        ) : null}
        <View style={styles.micStack}>
          <Animated.View
            style={[
              styles.pulseRing,
              { opacity: ringOpacity, transform: [{ scale: ringScale }] },
            ]}
          />
          <LinearGradient
            colors={["#22C55E", "#15803D"]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.micCircle}
          >
            <Ionicons name="mic" size={26} color={Colors.white} />
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 12,
    right: 14,
    alignItems: "flex-end",
    zIndex: 40,
    elevation: 20,
  },
  hit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  micStack: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#22C55E",
  },
  micCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#15803D",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  labelCard: {
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    maxWidth: 180,
  },
});
