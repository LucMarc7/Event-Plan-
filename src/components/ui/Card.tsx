// src/components/ui/Card.tsx
import React from "react";
import {
    StyleSheet,
    TouchableOpacity,
    View,
    ViewProps,
    ViewStyle,
} from "react-native";
import { colors, radius, shadows, spacing } from "../../theme/tokens";

interface Props extends ViewProps {
  padding?: "none" | "sm" | "md" | "lg";
  elevation?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "soft" | "ghost";
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
}

const PADDING: Record<string, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.base,
  lg: spacing.lg,
};

const VARIANTS: Record<string, ViewStyle> = {
  default: {},
  outlined: { borderWidth: 1, borderColor: colors.border },
  soft: { backgroundColor: colors.surfaceAlt },
  ghost: { backgroundColor: "transparent", shadowOpacity: 0, elevation: 0 },
};

export const Card: React.FC<Props> = ({
  children,
  padding = "md",
  elevation = "sm",
  variant = "default",
  onPress,
  style,
  ...rest
}) => {
  const content = (
    <View
      {...rest}
      style={[
        styles.card,
        { padding: PADDING[padding] },
        VARIANTS[variant],
        elevation !== "none" && shadows[elevation],
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
});

export default Card;
