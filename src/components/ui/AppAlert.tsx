// src/components/ui/AppAlert.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import {
    ActivityIndicator,
    Modal,
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
    lineHeight,
    radius,
    shadows,
    spacing,
} from "../../theme/tokens";

export type AppAlertVariant = "info" | "success" | "warning" | "danger";

export interface AppAlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
  loading?: boolean;
}

export interface AppAlertConfig {
  title: string;
  message?: string;
  variant?: AppAlertVariant;
  buttons?: AppAlertButton[];
}

interface AppAlertProps {
  visible: boolean;
  config: AppAlertConfig | null;
  onClose: () => void;
}

const VARIANT_STYLES: Record<
  AppAlertVariant,
  {
    icon: string;
    iconColor: string;
    bg: string;
    buttonColor: string;
  }
> = {
  info: {
    icon: "information-circle",
    iconColor: colors.primary,
    bg: colors.primarySoft,
    buttonColor: colors.primary,
  },
  success: {
    icon: "checkmark-circle",
    iconColor: colors.success,
    bg: colors.successSoft,
    buttonColor: colors.success,
  },
  warning: {
    icon: "alert-circle",
    iconColor: colors.warning,
    bg: colors.warningSoft,
    buttonColor: colors.warning,
  },
  danger: {
    icon: "alert-circle",
    iconColor: colors.error,
    bg: colors.errorSoft,
    buttonColor: colors.error,
  },
};

export const AppAlert: React.FC<AppAlertProps> = ({
  visible,
  config,
  onClose,
}) => {
  if (!config) return null;

  const variant = config.variant || "info";
  const v = VARIANT_STYLES[variant];
  const buttons =
    config.buttons && config.buttons.length > 0
      ? config.buttons
      : [{ text: "OK", style: "default" as const }];

  const handleButtonPress = (btn: AppAlertButton) => {
    // Ferme d'abord pour éviter les glitchs
    onClose();
    // Puis déclenche le callback si présent
    if (btn.onPress) {
      // Petit delay pour laisser le Modal se fermer proprement
      setTimeout(() => btn.onPress?.(), 150);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* ICON */}
          <View style={[styles.iconCircle, { backgroundColor: v.bg }]}>
            <Ionicons name={v.icon as any} size={30} color={v.iconColor} />
          </View>

          {/* TITLE */}
          <Text style={styles.title}>{config.title}</Text>

          {/* MESSAGE */}
          {config.message ? (
            <Text style={styles.message}>{config.message}</Text>
          ) : null}

          {/* BUTTONS */}
          <View
            style={[
              styles.buttons,
              buttons.length === 1 && styles.buttonsSingle,
            ]}
          >
            {buttons.map((btn, idx) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.button,
                    buttons.length === 1 && styles.buttonSingle,
                    isCancel && styles.buttonCancel,
                    isDestructive && styles.buttonDestructive,
                    !isCancel &&
                      !isDestructive && {
                        backgroundColor: v.buttonColor,
                      },
                    btn.loading && { opacity: 0.6 },
                  ]}
                  onPress={() => !btn.loading && handleButtonPress(btn)}
                  disabled={btn.loading}
                  activeOpacity={0.85}
                >
                  {btn.loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && styles.buttonTextCancel,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...shadows.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: lineHeight.sm,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  buttons: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  buttonsSingle: {
    flexDirection: "column",
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonSingle: {
    flex: 0,
    width: "100%",
  },
  buttonCancel: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  buttonDestructive: {
    backgroundColor: colors.error,
  },
  buttonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: "#FFF",
  },
  buttonTextCancel: {
    color: colors.textSecondary,
  },
});

export default AppAlert;
