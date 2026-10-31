// src/components/ui/ProgressBar.tsx
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors, radius } from "../../theme/tokens";

interface Props {
  progress: number; // 0 → 1
  height?: number;
  color?: string;
  trackColor?: string;
}

export const ProgressBar: React.FC<Props> = ({
  progress,
  height = 6,
  color = colors.primary,
  trackColor = colors.borderLight,
}) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: clamped,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [clamped]);

  const width = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor }]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: "100%",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
  },
});

export default ProgressBar;
