// src/components/theme/TextToolbar.tsx
// Barre d'outils pour le style de texte : gras, italique, souligné, taille, couleur

import { Feather } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
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
    shadows,
    spacing,
} from "../../theme/tokens";
import { FONT_SIZES, TEXT_COLORS } from "./themeConstants";

interface Props {
  block: any;
  onUpdateStyle: (id: string, patch: any) => void;
  showFontSizePalette: boolean;
  showColorPalette: boolean;
  onToggleFontSizePalette: () => void;
  onToggleColorPalette: () => void;
  onClose: () => void;
}

const TextStyleButton: React.FC<{
  label: string;
  onPress: () => void;
  active?: boolean;
  textStyle?: any;
}> = ({ label, onPress, active, textStyle }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[styles.textStyleBtn, active && styles.textStyleBtnActive]}
  >
    <Text
      style={[
        styles.textStyleLabel,
        textStyle,
        active && styles.textStyleLabelActive,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const TextToolbar: React.FC<Props> = ({
  block,
  onUpdateStyle,
  showFontSizePalette,
  showColorPalette,
  onToggleFontSizePalette,
  onToggleColorPalette,
  onClose,
}) => {
  if (!block || block.type !== "text") return null;

  const setStyle = (patch: any) => onUpdateStyle(block.id, patch);
  const currentStyle = block.style || {};

  return (
    <View style={styles.container}>
      {/* Barre principale */}
      <View style={styles.toolbar}>
        <TextStyleButton
          label="R"
          textStyle={{ fontWeight: "300" }}
          active={currentStyle.fontWeight === "300"}
          onPress={() =>
            setStyle({
              fontWeight: "300",
              fontStyle: "normal",
              textDecorationLine: "none",
            })
          }
        />
        <TextStyleButton
          label="B"
          textStyle={{ fontWeight: "900" }}
          active={currentStyle.fontWeight === "900"}
          onPress={() =>
            setStyle({
              fontWeight: currentStyle.fontWeight === "900" ? "normal" : "900",
            })
          }
        />
        <TextStyleButton
          label="I"
          textStyle={{ fontStyle: "italic" }}
          active={currentStyle.fontStyle === "italic"}
          onPress={() =>
            setStyle({
              fontStyle:
                currentStyle.fontStyle === "italic" ? "normal" : "italic",
            })
          }
        />
        <TextStyleButton
          label="U"
          textStyle={{ textDecorationLine: "underline" }}
          active={currentStyle.textDecorationLine === "underline"}
          onPress={() =>
            setStyle({
              textDecorationLine:
                currentStyle.textDecorationLine === "underline"
                  ? "none"
                  : "underline",
            })
          }
        />

        {/* Séparateur */}
        <View style={styles.divider} />

        {/* Taille de police */}
        <TouchableOpacity
          style={[styles.sizeBtn, showFontSizePalette && styles.sizeBtnActive]}
          onPress={onToggleFontSizePalette}
        >
          <Text style={styles.sizeBtnText}>{currentStyle.fontSize || 28}</Text>
        </TouchableOpacity>

        {/* Couleur */}
        <TouchableOpacity
          style={[styles.colorBtn, showColorPalette && styles.colorBtnActive]}
          onPress={onToggleColorPalette}
        >
          <View
            style={[
              styles.colorCircle,
              { backgroundColor: currentStyle.color || colors.text },
            ]}
          />
          <Feather name="chevron-down" size={12} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Fermer */}
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Feather name="x" size={iconSize.sm} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Palette de tailles */}
      {showFontSizePalette && (
        <View style={styles.paletteRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paletteContent}
          >
            {FONT_SIZES.map((size) => {
              const active = currentStyle.fontSize === size;
              return (
                <TouchableOpacity
                  key={size}
                  style={[styles.optionBtn, active && styles.optionBtnActive]}
                  onPress={() => {
                    setStyle({ fontSize: size });
                    onToggleFontSizePalette();
                  }}
                >
                  <Text
                    style={[
                      styles.optionBtnText,
                      active && styles.optionBtnTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Palette de couleurs */}
      {showColorPalette && (
        <View style={styles.paletteRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paletteContent}
          >
            {TEXT_COLORS.map((color) => {
              const active = currentStyle.color === color;
              return (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    active && styles.colorOptionActive,
                  ]}
                  onPress={() => {
                    setStyle({ color });
                    onToggleColorPalette();
                  }}
                />
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.lg,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  textStyleBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  textStyleBtnActive: { backgroundColor: colors.primarySoft },
  textStyleLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  textStyleLabelActive: { color: colors.primary },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  sizeBtn: {
    minWidth: 44,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  sizeBtnActive: { backgroundColor: colors.primarySoft },
  sizeBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  colorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  colorBtnActive: { backgroundColor: colors.primarySoft },
  colorCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  paletteRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingVertical: spacing.sm,
  },
  paletteContent: {
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  optionBtn: {
    minWidth: 42,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  optionBtnActive: { backgroundColor: colors.primary },
  optionBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  optionBtnTextActive: { color: colors.textInverse },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
  },
  colorOptionActive: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
});

export default TextToolbar;
