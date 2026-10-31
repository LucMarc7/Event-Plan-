// src/components/theme/IconButton.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    radius,
    spacing,
} from "../../theme/tokens";

interface Props {
  icon?: keyof typeof Feather.glyphMap;
  label?: string;
  onPress?: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  size?: number;
  style?: ViewStyle;
}

const IconButton: React.FC<Props> = ({
  icon,
  label,
  onPress,
  primary,
  danger,
  disabled,
  size = iconSize.sm,
  style,
}) => {
  // Couleurs selon l'état
  const bgColor = primary
    ? colors.primary
    : danger
      ? colors.error
      : colors.surfaceAlt;

  const contentColor = primary || danger ? colors.textInverse : colors.text;
  const finalContentColor = disabled ? colors.textMuted : contentColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.btn,
        { backgroundColor: bgColor },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      {label ? (
        <Text
          style={[styles.label, { color: finalContentColor }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : icon ? (
        <Feather name={icon} size={size} color={finalContentColor} />
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    minWidth: 36,
    height: 36,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
});

export default IconButton;
