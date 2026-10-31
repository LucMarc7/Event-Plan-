// src/components/theme/PropertiesModal.tsx
// Panneau de propriétés d'un bloc (texte / image / QR)

import { Feather } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
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
import { Button, Modal } from "../ui";
import { COLOR_PALETTE, FONT_SIZES } from "./themeConstants";

interface Props {
  visible: boolean;
  onClose: () => void;
  block: any;
  onUpdate: (id: string, patch: any, saveToHistory?: boolean) => void;
  onRemove: (id: string) => void;
  canvasW: number;
  canvasH: number;
}

const PropertiesModal: React.FC<Props> = ({
  visible,
  onClose,
  block,
  onUpdate,
  onRemove,
  canvasW,
  canvasH,
}) => {
  if (!block) return null;

  const setStyle = (patch: any) =>
    onUpdate(block.id, { style: { ...(block.style || {}), ...patch } });

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      animationType="slide"
    >
      <ScrollView
        style={{ maxHeight: 500 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Feather
                name={
                  block.type === "text"
                    ? "type"
                    : block.type === "image"
                      ? "image"
                      : "grid"
                }
                size={iconSize.sm}
                color={colors.primary}
              />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {block.type === "text"
                  ? "Bloc texte"
                  : block.type === "image"
                    ? "Bloc image"
                    : "Bloc QR"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {Math.round(block.width)} × {Math.round(block.height)}
              </Text>
            </View>
          </View>
        </View>

        {/* Propriétés selon le type */}
        {block.type === "text" && (
          <>
            {/* Texte */}
            <Text style={styles.label}>Contenu</Text>
            <TextInput
              value={block.text}
              onChangeText={(t) => onUpdate(block.id, { text: t })}
              style={styles.input}
              multiline
              placeholder="Votre texte…"
              placeholderTextColor={colors.textMuted}
            />

            {/* Taille de police */}
            <Text style={styles.label}>Taille</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
            >
              {FONT_SIZES.map((size) => {
                const active = block.style?.fontSize === size;
                return (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeChip, active && styles.sizeChipActive]}
                    onPress={() => setStyle({ fontSize: size })}
                  >
                    <Text
                      style={[
                        styles.sizeChipText,
                        active && styles.sizeChipTextActive,
                      ]}
                    >
                      {size}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Couleur */}
            <Text style={styles.label}>Couleur</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
            >
              {COLOR_PALETTE.map((color) => {
                const active = block.style?.color === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color },
                      active && styles.colorCircleActive,
                    ]}
                    onPress={() => setStyle({ color })}
                  />
                );
              })}
            </ScrollView>

            {/* Alignement */}
            <Text style={styles.label}>Alignement</Text>
            <View style={styles.alignRow}>
              {(["left", "center", "right"] as const).map((align) => {
                const active = block.style?.align === align;
                const icons: Record<string, any> = {
                  left: "align-left",
                  center: "align-center",
                  right: "align-right",
                };
                return (
                  <TouchableOpacity
                    key={align}
                    style={[styles.alignBtn, active && styles.alignBtnActive]}
                    onPress={() => setStyle({ align })}
                  >
                    <Feather
                      name={icons[align]}
                      size={iconSize.sm}
                      color={active ? colors.primary : colors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Styles rapides */}
            <Text style={styles.label}>Style</Text>
            <View style={styles.alignRow}>
              <TouchableOpacity
                style={[
                  styles.styleBtn,
                  block.style?.fontWeight === "900" && styles.styleBtnActive,
                ]}
                onPress={() =>
                  setStyle({
                    fontWeight:
                      block.style?.fontWeight === "900" ? "normal" : "900",
                  })
                }
              >
                <Text
                  style={[
                    styles.styleBtnText,
                    { fontWeight: "900" },
                    block.style?.fontWeight === "900" &&
                      styles.styleBtnTextActive,
                  ]}
                >
                  B
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.styleBtn,
                  block.style?.fontStyle === "italic" && styles.styleBtnActive,
                ]}
                onPress={() =>
                  setStyle({
                    fontStyle:
                      block.style?.fontStyle === "italic" ? "normal" : "italic",
                  })
                }
              >
                <Text
                  style={[
                    styles.styleBtnText,
                    { fontStyle: "italic" },
                    block.style?.fontStyle === "italic" &&
                      styles.styleBtnTextActive,
                  ]}
                >
                  I
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.styleBtn,
                  block.style?.textDecorationLine === "underline" &&
                    styles.styleBtnActive,
                ]}
                onPress={() =>
                  setStyle({
                    textDecorationLine:
                      block.style?.textDecorationLine === "underline"
                        ? "none"
                        : "underline",
                  })
                }
              >
                <Text
                  style={[
                    styles.styleBtnText,
                    { textDecorationLine: "underline" },
                    block.style?.textDecorationLine === "underline" &&
                      styles.styleBtnTextActive,
                  ]}
                >
                  U
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {block.type === "qr" && (
          <>
            <Text style={styles.label}>Valeur du QR</Text>
            <TextInput
              value={block.value}
              onChangeText={(v) => onUpdate(block.id, { value: v })}
              style={styles.input}
              placeholder="{{code_invitation}}"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              Utilisez {"{{code_invitation}}"} ou {"{{nom_invite}}"} pour
              insérer des valeurs dynamiques.
            </Text>
          </>
        )}

        {block.type === "image" && (
          <>
            <Text style={styles.label}>Dimensions</Text>
            <View style={styles.dimensionsRow}>
              <View style={styles.dimensionsItem}>
                <Text style={styles.dimensionsLabel}>Largeur</Text>
                <Text style={styles.dimensionsValue}>
                  {Math.round(block.width)} px
                </Text>
              </View>
              <View style={styles.dimensionsItem}>
                <Text style={styles.dimensionsLabel}>Hauteur</Text>
                <Text style={styles.dimensionsValue}>
                  {Math.round(block.height)} px
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Rotation */}
        <Text style={styles.label}>Rotation</Text>
        <View style={styles.rotationRow}>
          <TouchableOpacity
            style={styles.rotationBtn}
            onPress={() =>
              onUpdate(block.id, {
                rotation: ((block.rotation || 0) - 15 + 360) % 360,
              })
            }
          >
            <Feather name="rotate-ccw" size={16} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.rotationValue}>
            {Math.round(block.rotation || 0)}°
          </Text>
          <TouchableOpacity
            style={styles.rotationBtn}
            onPress={() =>
              onUpdate(block.id, {
                rotation: ((block.rotation || 0) + 15) % 360,
              })
            }
          >
            <Feather name="rotate-cw" size={16} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rotationResetBtn}
            onPress={() => onUpdate(block.id, { rotation: 0 })}
          >
            <Text style={styles.rotationResetText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <View style={{ flex: 1 }}>
            <Button
              title="Supprimer"
              variant="outline"
              size="md"
              icon="trash-2"
              onPress={() => {
                onRemove(block.id);
                onClose();
              }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Terminé"
              variant="primary"
              size="md"
              icon="check"
              onPress={onClose}
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.base },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.base,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.text,
    minHeight: 60,
    textAlignVertical: "top",
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: fontSize.xs * 1.5,
  },
  optionRow: { gap: spacing.sm, paddingVertical: 4 },
  sizeChip: {
    minWidth: 42,
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  sizeChipActive: { backgroundColor: colors.primary },
  sizeChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  sizeChipTextActive: { color: colors.textInverse },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
  },
  colorCircleActive: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  alignRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  alignBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  alignBtnActive: { backgroundColor: colors.primarySoft },
  styleBtn: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  styleBtnActive: { backgroundColor: colors.primarySoft },
  styleBtnText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  styleBtnTextActive: { color: colors.primary },
  dimensionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dimensionsItem: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  dimensionsLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
  dimensionsValue: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: fontWeight.bold,
    marginTop: 4,
  },
  rotationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rotationBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  rotationValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
    minWidth: 48,
    textAlign: "center",
  },
  rotationResetBtn: {
    marginLeft: "auto",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rotationResetText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
});

export default PropertiesModal;
