// src/components/ui/FAB.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { colors, iconSize, radius, shadows } from "../../theme/tokens";

interface Props {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "danger" | "success";
  position?: "bottom-right" | "bottom-left" | "bottom-center";
  style?: ViewStyle;
}

const SIZES = { sm: 44, md: 52, lg: 60 };

const VARIANTS = {
  primary: colors.primary,
  danger: colors.error,
  success: colors.success,
};

export const FAB: React.FC<Props> = ({
  icon,
  onPress,
  size = "md",
  variant = "primary",
  position = "bottom-right",
  style,
}) => {
  const dim = SIZES[size];
  const positionStyle: ViewStyle =
    position === "bottom-right"
      ? { right: 20 }
      : position === "bottom-left"
        ? { left: 20 }
        : { alignSelf: "center" };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.fab,
        {
          width: dim,
          height: dim,
          borderRadius: radius.lg,
          backgroundColor: VARIANTS[variant],
        },
        positionStyle,
        style,
      ]}
    >
      <Feather name={icon} size={iconSize.md} color={colors.textInverse} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
  },
});

export default FAB;
