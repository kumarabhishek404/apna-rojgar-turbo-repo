import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconComponent = React.ComponentType<{
  name: any;
  size: number;
  color: string;
}>;

type Props = {
  selected: boolean;
  size: number;
  color: string;
  iconName?: string;
  activeIconName?: string;
  Icon?: IconComponent;
};

/**
 * Attention loop on the second tab icon.
 * Settles when the tab is selected so it does not compete with the active pill.
 */
const WorkTabAttentionIcon = ({
  selected,
  size,
  color,
  iconName = "briefcase-outline",
  activeIconName = "briefcase",
  Icon = Ionicons,
}: Props) => {
  const bounce = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selected) {
      bounce.stopAnimation();
      pulse.stopAnimation();
      bounce.setValue(0);
      pulse.setValue(0);
      return;
    }

    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 320,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1100),
      ]),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 820,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 820,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    bounceLoop.start();
    pulseLoop.start();
    return () => {
      bounceLoop.stop();
      pulseLoop.stop();
    };
  }, [bounce, pulse, selected]);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });
  const rotate = bounce.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: ["0deg", "-10deg", "8deg"],
  });
  const scale = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.16],
  });
  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.7],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.42, 0],
  });

  const box = size + 10;

  return (
    <View style={[styles.wrap, { width: box, height: box }]}>
      {!selected ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              width: size + 4,
              height: size + 4,
              borderRadius: (size + 4) / 2,
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        />
      ) : null}
      <Animated.View
        style={{
          transform: [{ translateY }, { rotate }, { scale }],
        }}
      >
        <Icon
          name={selected ? activeIconName : iconName}
          size={size}
          color={color}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    backgroundColor: "rgba(14, 79, 197, 0.28)",
  },
});

export default WorkTabAttentionIcon;
