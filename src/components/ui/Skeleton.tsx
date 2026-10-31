// src/components/ui/Skeleton.tsx
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius } from "../../theme/tokens";

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: "rect" | "circle" | "text";
}

export const Skeleton: React.FC<Props> = ({
  width = "100%",
  height = 20,
  borderRadius = radius.sm,
  style,
  variant = "rect",
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  const finalHeight =
    variant === "circle"
      ? typeof width === "number"
        ? width
        : height
      : height;
  const finalWidth =
    variant === "circle" ? (typeof width === "number" ? width : height) : width;
  const finalRadius = variant === "circle" ? finalHeight / 2 : borderRadius;

  return (
    <View
      style={[
        styles.container,
        {
          width: finalWidth as any,
          height: finalHeight,
          borderRadius: finalRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.65)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
});

export default Skeleton;
