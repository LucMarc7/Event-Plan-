// src/components/ui/EmptyState.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    radius,
    spacing,
} from "../../theme/tokens";
import Button from "./Button";

interface Props {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({
  icon = "inbox",
  title,
  message,
  actionLabel,
  onAction,
}) => (
  <View style={styles.container}>
    <View style={styles.iconCircle}>
      <Feather name={icon} size={iconSize.xxl} color={colors.textMuted} />
    </View>
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    {actionLabel && onAction ? (
      <View style={styles.action}>
        <Button
          title={actionLabel}
          size="sm"
          fullWidth={false}
          onPress={onAction}
        />
      </View>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.xxl,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: fontSize.sm * 1.5,
  },
  action: { marginTop: spacing.lg },
});

export default EmptyState;
