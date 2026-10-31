// src/components/ui/Chip.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    radius,
    spacing,
} from "../../theme/tokens";

type Variant = "default" | "success" | "warning" | "error" | "info" | "primary";
type Size = "sm" | "md";

interface Props {
  label: string;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Feather.glyphMap;
  selected?: boolean;
  onPress?: () => void;
  onClose?: () => void;
}

const VARIANT_MAP: Record<
  Variant,
  { bg: string; text: string; border: string }
> = {
  default: {
    bg: colors.surfaceAlt,
    text: colors.textSecondary,
    border: colors.border,
  },
  primary: {
    bg: colors.primarySoft,
    text: colors.primary,
    border: colors.primary,
  },
  success: {
    bg: colors.successSoft,
    text: colors.success,
    border: colors.success,
  },
  warning: {
    bg: colors.warningSoft,
    text: colors.warning,
    border: colors.warning,
  },
  error: { bg: colors.errorSoft, text: colors.error, border: colors.error },
  info: { bg: colors.infoSoft, text: colors.info, border: colors.info },
};

export const Chip: React.FC<Props> = ({
  label,
  variant = "default",
  size = "md",
  icon,
  selected = false,
  onPress,
  onClose,
}) => {
  const v = VARIANT_MAP[variant];
  const isSmall = size === "sm";
  const paddingH = isSmall ? spacing.sm : spacing.md;
  const height = isSmall ? 24 : 30;
  const iconSizeValue = isSmall ? iconSize.xs : iconSize.sm;
  const textSize = isSmall ? fontSize.xs : fontSize.sm;

  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? v.border : v.bg,
          borderColor: v.border,
          paddingHorizontal: paddingH,
          height,
        },
      ]}
    >
      {icon && (
        <Feather
          name={icon}
          size={iconSizeValue}
          color={selected ? colors.textInverse : v.text}
          style={{ marginRight: spacing.xs }}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            color: selected ? colors.textInverse : v.text,
            fontSize: textSize,
          },
        ]}
      >
        {label}
      </Text>
      {onClose && (
        <Pressable
          onPress={onClose}
          style={{ marginLeft: spacing.xs }}
          hitSlop={6}
        >
          <Feather
            name="x"
            size={iconSizeValue}
            color={selected ? colors.textInverse : v.text}
          />
        </Pressable>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  label: {
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.2,
  },
});

export default Chip;
