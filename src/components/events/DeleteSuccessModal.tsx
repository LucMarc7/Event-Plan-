// src/components/events/DeleteSuccessModal.tsx
import { Feather } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing,
} from "../../theme/tokens";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export const DeleteSuccessModal = ({
  visible,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: Props) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onPrimary}
  >
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Feather name="trash-2" size={30} color="#FFF" />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.infoBox}>
          <Feather name="info" size={14} color={colors.primary} />
          <Text style={styles.infoText}>
            Récupérable pendant 48h depuis l'écran Corbeille
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onPrimary}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryText}>{primaryLabel}</Text>
          <Feather name="arrow-right" size={16} color="#FFF" />
        </TouchableOpacity>

        {secondaryLabel && onSecondary ? (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={onSecondary}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryText}>{secondaryLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...shadows.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    width: "100%",
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    width: "100%",
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  primaryText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  secondaryText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
});
