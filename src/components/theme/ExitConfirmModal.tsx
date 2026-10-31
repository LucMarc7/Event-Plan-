// src/components/theme/ExitConfirmModal.tsx
// Modal de confirmation de sortie d'un thème non sauvegardé

import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  colors,
  fontSize,
  fontWeight,
  iconSize,
  radius,
  spacing,
} from "../../theme/tokens";
import { Modal } from "../ui";

interface Props {
  visible: boolean;
  onQuitWithoutSaving: () => void;
  onSaveAndClose: () => void;
  onContinueEditing: () => void;
}

const ExitConfirmModal: React.FC<Props> = ({
  visible,
  onQuitWithoutSaving,
  onSaveAndClose,
  onContinueEditing,
}) => (
  <Modal
    visible={visible}
    onClose={onContinueEditing}
    position="center"
    animationType="fade"
  >
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Feather
          name="alert-triangle"
          size={iconSize.xl}
          color={colors.warning}
        />
      </View>

      <Text style={styles.title}>Modifications non enregistrées</Text>
      <Text style={styles.message}>
        Que voulez-vous faire de vos modifications avant de quitter ?
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnSave]}
          onPress={onSaveAndClose}
          activeOpacity={0.85}
        >
          <Feather name="save" size={16} color={colors.textInverse} />
          <Text style={styles.btnText}>Sauvegarder et quitter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnQuit]}
          onPress={onQuitWithoutSaving}
          activeOpacity={0.85}
        >
          <Feather name="trash-2" size={16} color={colors.error} />
          <Text style={[styles.btnText, { color: colors.error }]}>
            Quitter sans sauvegarder
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnContinue]}
          onPress={onContinueEditing}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: colors.textSecondary }]}>
            Continuer l’édition
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.warningSoft,
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
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: fontSize.sm * 1.5,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  actions: { width: "100%", gap: spacing.sm },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.md,
  },
  btnSave: { backgroundColor: colors.primary },
  btnQuit: {
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.error,
  },
  btnContinue: { backgroundColor: colors.surfaceAlt },
  btnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
});

export default ExitConfirmModal;
