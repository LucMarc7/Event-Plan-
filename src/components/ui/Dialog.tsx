// src/components/ui/Dialog.tsx
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
import Modal from "./Modal";

type Variant = "danger" | "warning" | "info" | "success";

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  variant?: Variant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const VARIANT: Record<
  Variant,
  {
    icon: keyof typeof Feather.glyphMap;
    color: string;
    bg: string;
    buttonVariant: "danger" | "primary" | "success";
  }
> = {
  danger: {
    icon: "alert-triangle",
    color: colors.error,
    bg: colors.errorSoft,
    buttonVariant: "danger",
  },
  warning: {
    icon: "alert-circle",
    color: colors.warning,
    bg: colors.warningSoft,
    buttonVariant: "primary",
  },
  info: {
    icon: "info",
    color: colors.info,
    bg: colors.infoSoft,
    buttonVariant: "primary",
  },
  success: {
    icon: "check-circle",
    color: colors.success,
    bg: colors.successSoft,
    buttonVariant: "success",
  },
};

export const Dialog: React.FC<Props> = ({
  visible,
  title,
  message,
  variant = "info",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  loading,
}) => {
  const v = VARIANT[variant];

  return (
    <Modal visible={visible} onClose={onCancel}>
      <View style={styles.container}>
        <View style={[styles.iconCircle, { backgroundColor: v.bg }]}>
          <Feather name={v.icon} size={iconSize.lg} color={v.color} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {message && <Text style={styles.message}>{message}</Text>}

        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button
              title={cancelLabel}
              variant="ghost"
              size="md"
              onPress={onCancel}
              disabled={loading}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={confirmLabel}
              variant={v.buttonVariant}
              size="md"
              onPress={onConfirm}
              loading={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: fontSize.base * 1.5,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
    marginTop: spacing.md,
  },
});

export default Dialog;
