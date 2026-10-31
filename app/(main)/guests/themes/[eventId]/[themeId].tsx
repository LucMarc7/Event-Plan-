// app/(main)/guests/themes/[eventId]/[themeId].tsx
// Détail d'un thème : aperçu, appliquer, modifier, supprimer

import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getFontFamily } from "../../../../../src/components/theme/helpers";
import { Button, Dialog } from "../../../../../src/components/ui";
import { useThemeStorage } from "../../../../../src/hooks/useThemeStorage";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing,
} from "../../../../../src/theme/tokens";

export default function ThemeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId: string; themeId: string }>();
  const { eventId, themeId } = params;
  const storage = useThemeStorage();

  const [theme, setTheme] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [applying, setApplying] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ─── Charger le thème ───
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const raw = await AsyncStorage.getItem(`themes_${eventId}`);
        if (raw) {
          const arr = JSON.parse(raw);
          const found = arr.find((t: any) => t.id === themeId);
          setTheme(found || null);
        }
        const current = await AsyncStorage.getItem(`current_theme_${eventId}`);
        setCurrentThemeId(current);
      } finally {
        setIsLoading(false);
      }
    };
    if (eventId && themeId) load();
  }, [eventId, themeId]);

  const isActive = currentThemeId === themeId;

  // ─── Appliquer ───
  const handleApply = async () => {
    setApplying(true);
    try {
      await storage.applyTheme(eventId, themeId);
      setCurrentThemeId(themeId);
    } finally {
      setApplying(false);
    }
  };

  // ─── Modifier ───
  const handleEdit = () => {
    router.push({
      pathname: "/(main)/guests/themes/[eventId]/customize",
      params: { eventId, themeId, isEditing: "true" },
    });
  };

  // ─── Supprimer ───
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const ok = await storage.deleteTheme(eventId, themeId);
    setDeleting(false);
    setShowDeleteDialog(false);
    if (ok) router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!theme) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <Text style={styles.errorText}>Thème introuvable</Text>
        <View style={{ marginTop: spacing.base }}>
          <Button
            title="Retour"
            variant="ghost"
            size="md"
            onPress={() => router.back()}
            fullWidth={false}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Aperçu miniature ───
  const canvasW = theme.canvas?.width || 800;
  const canvasH = theme.canvas?.height || 1200;
  const previewW = 260;
  const previewH = (canvasH / canvasW) * previewW;
  const scale = previewW / canvasW;
  const page = theme.pages?.[0];
  const blocksOnPage = (theme.blocks || []).filter(
    (b: any) => (b.pageIndex ?? 0) === 0,
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {theme.name || "Sans nom"}
          </Text>
          <Text style={styles.subtitle}>
            {theme.blocks?.length || 0} élément(s) · {theme.pages?.length || 0}{" "}
            page(s)
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Badge actif */}
        {isActive && (
          <View style={styles.activeBanner}>
            <Feather name="check-circle" size={16} color={colors.success} />
            <Text style={styles.activeBannerText}>
              Ce thème est actuellement utilisé
            </Text>
          </View>
        )}

        {/* Aperçu */}
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
            {/* Image de fond */}
            {page?.background?.type === "image" && page.background.value && (
              <Image
                source={{ uri: page.background.value }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            )}

            {/* Blocs */}
            {blocksOnPage.map((b: any) => {
              const left =
                (b.xPercent !== undefined ? b.xPercent / 100 : b.x / canvasW) *
                previewW;
              const top =
                (b.yPercent !== undefined ? b.yPercent / 100 : b.y / canvasH) *
                previewH;
              const w =
                (b.widthPercent !== undefined
                  ? b.widthPercent / 100
                  : b.width / canvasW) * previewW;
              const h =
                (b.heightPercent !== undefined
                  ? b.heightPercent / 100
                  : b.height / canvasH) * previewH;

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
                        fontSize: (b.style?.fontSize || 18) * scale,
                        color: b.style?.color || colors.text,
                        textAlign: b.style?.align || "left",
                        fontWeight: b.style?.fontWeight || "normal",
                        fontFamily: getFontFamily(b.style?.fontFamily),
                      }}
                      numberOfLines={3}
                    >
                      {b.text || "Texte"}
                    </Text>
                  )}
                  {b.type === "image" && b.src && (
                    <Image
                      source={{ uri: b.src }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  )}
                  {b.type === "qr" && (
                    <View style={styles.previewQr}>
                      <Feather name="grid" size={12} color={colors.textMuted} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actions}>
          {!isActive && (
            <Button
              title={applying ? "Application…" : "Appliquer ce thème"}
              icon="check-circle"
              variant="primary"
              size="lg"
              loading={applying}
              onPress={handleApply}
            />
          )}
          <Button
            title="Modifier le thème"
            icon="edit-2"
            variant="secondary"
            size="lg"
            onPress={handleEdit}
          />
          <Button
            title="Supprimer"
            icon="trash-2"
            variant="outline"
            size="md"
            onPress={() => setShowDeleteDialog(true)}
          />
        </View>
      </ScrollView>

      {/* Dialog de suppression */}
      <Dialog
        visible={showDeleteDialog}
        title="Supprimer le thème ?"
        message="Cette action est irréversible. Le thème sera retiré de tous les appareils synchronisés."
        variant="danger"
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    gap: spacing.base,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  content: { padding: spacing.base },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  activeBannerText: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  previewWrapper: { alignItems: "center", marginBottom: spacing.lg },
  previewCanvas: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
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
  actions: { gap: spacing.sm },
});
