// src/components/ui/Button.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    spacing
} from "../../theme/tokens";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "success";
type Size = "xs" | "sm" | "md" | "lg";

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const VARIANTS: Record<Variant, { bg: string; text: string; border?: string }> =
  {
    primary: { bg: colors.primary, text: colors.textInverse },
    secondary: { bg: colors.primarySoft, text: colors.primary },
    outline: {
      bg: "transparent",
      text: colors.primary,
      border: colors.primary,
    },
    ghost: { bg: "transparent", text: colors.text },
    danger: { bg: colors.error, text: colors.textInverse },
    success: { bg: colors.success, text: colors.textInverse },
  };

// ✅ Tailles RÉDUITES (touch target min 38)
const SIZES: Record<
  Size,
  { height: number; paddingH: number; fontSize: number; iconSize: number }
> = {
  xs: { height: 32, paddingH: spacing.md, fontSize: fontSize.xs, iconSize: 12 },
  sm: {
    height: 38,
    paddingH: spacing.base,
    fontSize: fontSize.sm,
    iconSize: 14,
  },
  md: {
    height: 44,
    paddingH: spacing.lg,
    fontSize: fontSize.base,
    iconSize: 16,
  },
  lg: { height: 50, paddingH: spacing.xl, fontSize: fontSize.md, iconSize: 18 },
};

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}) => {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.btn,
        {
          backgroundColor: v.bg,
          height: s.height,
          paddingHorizontal: s.paddingH,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
          opacity: isDisabled ? 0.55 : 1,
          width: fullWidth ? "100%" : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <Feather
              name={icon}
              size={s.iconSize}
              color={v.text}
              style={{ marginRight: spacing.sm }}
            />
          )}
          <Text
            style={[styles.label, { color: v.text, fontSize: s.fontSize }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {icon && iconPosition === "right" && (
            <Feather
              name={icon}
              size={s.iconSize}
              color={v.text}
              style={{ marginLeft: spacing.sm }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  label: {
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
});

export default Button;
