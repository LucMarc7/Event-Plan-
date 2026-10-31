// src/components/ui/Badge.tsx
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    radius
} from "../../theme/tokens";

type Variant = "primary" | "success" | "warning" | "error" | "neutral";

interface Props {
  count?: number;
  label?: string;
  variant?: Variant;
  dot?: boolean;
  style?: ViewStyle;
}

const VARIANT_MAP: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: colors.primary, text: colors.textInverse },
  success: { bg: colors.success, text: colors.textInverse },
  warning: { bg: colors.warning, text: colors.textInverse },
  error: { bg: colors.error, text: colors.textInverse },
  neutral: { bg: colors.surfaceAlt, text: colors.textSecondary },
};

export const Badge: React.FC<Props> = ({
  count,
  label,
  variant = "error",
  dot = false,
  style,
}) => {
  const v = VARIANT_MAP[variant];

  if (dot) {
    return <View style={[styles.dot, { backgroundColor: v.bg }, style]} />;
  }

  const text =
    label ?? (count !== undefined ? (count > 99 ? "99+" : String(count)) : "");

  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.text }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    paddingHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default Badge;
