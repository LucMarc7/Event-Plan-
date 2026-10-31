// src/components/theme/Header.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
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

interface Props {
  onBack: () => void;
  title: string;
  subtitle?: string;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  saving?: boolean;
  undoDisabled?: boolean;
  redoDisabled?: boolean;
}

const Header: React.FC<Props> = ({
  onBack,
  title,
  subtitle,
  onUndo,
  onRedo,
  onSave,
  saving,
  undoDisabled,
  redoDisabled,
}) => {
  return (
    <View style={styles.header}>
      {/* Gauche */}
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8}>
        <Feather name="arrow-left" size={iconSize.md} color={colors.text} />
      </TouchableOpacity>

      {/* Centre */}
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {/* Droite */}
      <View style={styles.actions}>
        {onUndo || onRedo ? (
          <View style={styles.undoRedoGroup}>
            <TouchableOpacity
              onPress={onUndo}
              disabled={undoDisabled}
              style={[styles.iconBtn, undoDisabled && styles.iconBtnDisabled]}
              hitSlop={6}
            >
              <Feather
                name="corner-up-left"
                size={iconSize.sm}
                color={undoDisabled ? colors.textMuted : colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRedo}
              disabled={redoDisabled}
              style={[styles.iconBtn, redoDisabled && styles.iconBtnDisabled]}
              hitSlop={6}
            >
              <Feather
                name="corner-up-right"
                size={iconSize.sm}
                color={redoDisabled ? colors.textMuted : colors.text}
              />
            </TouchableOpacity>
          </View>
        ) : null}

        {saving ? (
          <View style={styles.saveBtn}>
            <ActivityIndicator size="small" color={colors.textInverse} />
          </View>
        ) : onSave ? (
          <TouchableOpacity onPress={onSave} style={styles.saveBtn}>
            <Feather
              name="save"
              size={iconSize.sm}
              color={colors.textInverse}
            />
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  titleBlock: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  undoRedoGroup: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: 2,
    gap: 2,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtnDisabled: {
    opacity: 0.4,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  saveBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
});

export default Header;
