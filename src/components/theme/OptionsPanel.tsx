// src/components/theme/OptionsPanel.tsx
// Panneau des options générales du thème

import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React from "react";
import {
    ActivityIndicator,
    Image,
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
    radius,
    spacing
} from "../../theme/tokens";
import { Button, Modal } from "../ui";
import { getFontFamily } from "./helpers";
import { PRESET_BACKGROUND_COLORS } from "./themeConstants";

interface Props {
  visible: boolean;
  onClose: () => void;
  theme: any;
  activePage: number;
  canvasW: number;
  canvasH: number;
  onUpdateTheme: (patch: any) => void;
  onAddTextBlock: (text?: string) => void;
  onAddImageBlock: () => void;
  onAddQrBlock: () => void;
  onExportToPDF: () => void;
  exporting: boolean;
  assetImages: any[];
  onAddPresetImage?: () => void;
  onRemovePresetImage?: (index: number) => void;
}

const OptionsPanel: React.FC<Props> = ({
  visible,
  onClose,
  theme,
  activePage,
  canvasW,
  canvasH,
  onUpdateTheme,
  onAddTextBlock,
  onAddImageBlock,
  onAddQrBlock,
  onExportToPDF,
  exporting,
  assetImages,
  onAddPresetImage,
  onRemovePresetImage,
}) => {
  const page = theme.pages[activePage];
  const blocksOnPage = theme.blocks.filter(
    (b: any) => (b.pageIndex ?? 0) === activePage,
  );

  // Aperçu miniature
  const PREVIEW_SCALE = 0.28;
  const previewW = canvasW * PREVIEW_SCALE;
  const previewH = canvasH * PREVIEW_SCALE;

  const handlePickBackgroundImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: true,
    });
    if (res.canceled) return;
    const uri = res.assets[0]?.uri;
    if (!uri) return;

    const newPages = [...theme.pages];
    newPages[activePage] = {
      ...newPages[activePage],
      background: { type: "image", value: uri },
      bgTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
    };
    onUpdateTheme({ pages: newPages });
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      animationType="slide"
      title="Options générales"
      showCloseButton
    >
      <ScrollView
        style={{ maxHeight: 560 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Aperçu ─── */}
        <Text style={styles.sectionTitle}>Aperçu</Text>
        <View style={styles.previewWrapper}>
          <View
            style={[
              styles.previewCanvas,
              {
                width: previewW,
                height: previewH,
                backgroundColor:
                  page?.background?.type === "color"
                    ? page.background.value
                    : "#FFFFFF",
              },
            ]}
          >
            {/* Background image */}
            {page?.background?.type === "image" && page.background.value && (
              <Image
                source={{ uri: page.background.value }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            )}

            {/* Blocs */}
            {blocksOnPage.map((b: any) => {
              const left = (b.x / canvasW) * previewW;
              const top = (b.y / canvasH) * previewH;
              const w = (b.width / canvasW) * previewW;
              const h = (b.height / canvasH) * previewH;

              return (
                <View
                  key={b.id}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width: w,
                    height: h,
                    transform: [{ rotate: `${b.rotation || 0}deg` }],
                    overflow: "hidden",
                  }}
                >
                  {b.type === "text" && (
                    <Text
                      style={{
                        fontSize: (b.style?.fontSize || 18) * PREVIEW_SCALE,
                        color: b.style?.color || colors.text,
                        textAlign: b.style?.align || "left",
                        fontWeight: b.style?.fontWeight || "normal",
                        fontFamily: getFontFamily(b.style?.fontFamily),
                      }}
                      numberOfLines={2}
                    >
                      {b.text || "Texte"}
                    </Text>
                  )}
                  {b.type === "image" &&
                    (b.assetModule ? (
                      <Image
                        source={b.assetModule}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : b.src ? (
                      <Image
                        source={{ uri: b.src }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : null)}
                  {b.type === "qr" && (
                    <View style={styles.previewQr}>
                      <Feather name="grid" size={10} color={colors.textMuted} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Export PDF */}
        {exporting ? (
          <View style={styles.exportingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.exportingText}>Génération du PDF…</Text>
          </View>
        ) : (
          <Button
            title="Exporter en PDF"
            icon="download"
            variant="primary"
            size="md"
            onPress={onExportToPDF}
          />
        )}

        {/* ─── Nom du thème ─── */}
        <Text style={styles.sectionTitle}>Nom du thème</Text>
        <TextInput
          value={theme.name}
          onChangeText={(name) => onUpdateTheme({ name })}
          style={styles.input}
          placeholder="Nouveau thème"
          placeholderTextColor={colors.textMuted}
        />

        {/* ─── Fond ─── */}
        <Text style={styles.sectionTitle}>Couleur de fond</Text>
        <View style={styles.colorsRow}>
          {PRESET_BACKGROUND_COLORS.map((c) => {
            const active =
              page?.background?.type === "color" && page.background.value === c;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  active && styles.colorSwatchActive,
                ]}
                onPress={() => {
                  const newPages = [...theme.pages];
                  newPages[activePage] = {
                    ...newPages[activePage],
                    background: { type: "color", value: c },
                    bgTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
                  };
                  onUpdateTheme({ pages: newPages });
                }}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.backgroundImageBtn}
          onPress={handlePickBackgroundImage}
          activeOpacity={0.85}
        >
          <Feather name="image" size={16} color={colors.primary} />
          <Text style={styles.backgroundImageText}>
            Importer une image de fond
          </Text>
        </TouchableOpacity>

        {/* ─── Images prédéfinies ─── */}
        {assetImages && assetImages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Images prédéfinies</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.assetsRow}
            >
              {assetImages.map((img, index) => (
                <View key={index} style={styles.assetItem}>
                  <TouchableOpacity
                    onPress={() => {
                      const newPages = [...theme.pages];
                      newPages[activePage] = {
                        ...newPages[activePage],
                        background: {
                          type: img.assetModule ? "asset" : "image",
                          value: img.uri || undefined,
                          assetModule: img.assetModule,
                        },
                        bgTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
                      };
                      onUpdateTheme({ pages: newPages });
                    }}
                  >
                    <Image
                      source={img.assetModule || { uri: img.uri }}
                      style={styles.assetThumb}
                    />
                  </TouchableOpacity>
                  {onRemovePresetImage && img.uri && (
                    <TouchableOpacity
                      style={styles.assetDelete}
                      onPress={() => onRemovePresetImage(index)}
                    >
                      <Feather name="x" size={12} color={colors.textInverse} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {onAddPresetImage && (
                <TouchableOpacity
                  style={styles.assetAdd}
                  onPress={onAddPresetImage}
                >
                  <Feather name="plus" size={20} color={colors.primary} />
                </TouchableOpacity>
              )}
            </ScrollView>
          </>
        )}

        {/* ─── Ajouter un élément ─── */}
        <Text style={styles.sectionTitle}>Ajouter un élément</Text>
        <View style={styles.addRow}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              onAddTextBlock("Invité");
              onClose();
            }}
          >
            <Feather name="type" size={20} color={colors.primary} />
            <Text style={styles.addBtnText}>Texte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              onAddImageBlock();
              onClose();
            }}
          >
            <Feather name="image" size={20} color={colors.primary} />
            <Text style={styles.addBtnText}>Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              onAddQrBlock();
              onClose();
            }}
          >
            <Feather name="grid" size={20} color={colors.primary} />
            <Text style={styles.addBtnText}>QR Code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.xl },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  previewWrapper: {
    alignItems: "center",
    marginVertical: spacing.sm,
  },
  previewCanvas: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
    position: "relative",
  },
  previewQr: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  exportingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  exportingText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: fontSize.base,
    color: colors.text,
  },
  colorsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  colorSwatchActive: {
    borderColor: colors.primary,
    borderWidth: 3,
  },
  backgroundImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 48,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
  backgroundImageText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  assetsRow: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  assetItem: { position: "relative" },
  assetThumb: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assetDelete: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
  assetAdd: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  addBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
  },
  addBtnText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});

export default OptionsPanel;
