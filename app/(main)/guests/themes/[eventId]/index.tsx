// app/(main)/guests/themes/[eventId]/index.tsx
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UpgradeModal } from "../../../../../src/components/subscription/UpgradeModal";
import {
  THEME_TEMPLATES,
  ThemeTemplate,
  buildThemeFromTemplate,
} from "../../../../../src/components/theme/templates";
import ThemeThumbnail from "../../../../../src/components/theme/ThemeThumbnail";
import { EmptyState } from "../../../../../src/components/ui";
import { useSubscription } from "../../../../../src/hooks/useSubscription";
import { useThemeStorage } from "../../../../../src/hooks/useThemeStorage";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../../../../src/theme/tokens";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_W * 0.72;
const PREVIEW_HEIGHT = CARD_WIDTH * 1.25;
const TEMPLATE_CARD_W = SCREEN_W * 0.45;
const TEMPLATE_PREVIEW_H = TEMPLATE_CARD_W * 1.4;
const SPACING = 14;

export default function EventThemesScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const storage = useThemeStorage();

  const [themes, setThemes] = useState<any[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { plan: currentPlan, limits } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{
    visible: boolean;
    message?: string;
  }>({ visible: false });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        setLoading(true);
        try {
          const list = await storage.listThemes(String(eventId));
          const current = await storage.getCurrentThemeId(String(eventId));
          if (!cancelled) {
            setThemes(list);
            setCurrentId(current);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      run();
      return () => {
        cancelled = true;
      };
    }, [eventId]),
  );

  // ✅ Ouvre la galerie des templates (bouton "Nouveau thème")
  const openTemplatePicker = () => {
    const maxThemes = limits?.max_themes_per_event;
    if (
      maxThemes !== null &&
      maxThemes !== undefined &&
      themes.length >= maxThemes
    ) {
      setUpgradeModal({
        visible: true,
        message:
          `Votre plan ${currentPlan} autorise ${maxThemes} thème${maxThemes > 1 ? "s" : ""} ` +
          `par événement. Passez à un plan supérieur pour créer davantage de thèmes.`,
      });
      return;
    }
    // Au lieu d'une modale, on scroll vers la section des templates
    // (ou on garde le comportement : la grille de templates est maintenant visible en haut)
  };

  // ✅ Applique un template en un tap
  const handleTemplateSelected = (tpl: ThemeTemplate) => {
    const maxThemes = limits?.max_themes_per_event;
    if (
      maxThemes !== null &&
      maxThemes !== undefined &&
      themes.length >= maxThemes
    ) {
      setUpgradeModal({
        visible: true,
        message:
          `Votre plan ${currentPlan} autorise ${maxThemes} thème${maxThemes > 1 ? "s" : ""} ` +
          `par événement. Passez à un plan supérieur pour créer davantage de thèmes.`,
      });
      return;
    }

    const canvasW = 595;
    const canvasH = 842;
    const theme = buildThemeFromTemplate(
      tpl,
      String(eventId),
      canvasW,
      canvasH,
    );

    router.push({
      pathname: "/(main)/guests/themes/[eventId]/customize",
      params: {
        eventId: String(eventId),
        themeData: JSON.stringify(theme),
        isEditing: "false",
      },
    });
  };

  const handleOpen = (themeId: string) => {
    router.push({
      pathname: "/(main)/guests/themes/[eventId]/[themeId]",
      params: { eventId: String(eventId), themeId },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const maxThemes = limits?.max_themes_per_event;
  const limitLabel =
    maxThemes === null || maxThemes === undefined
      ? `${themes.length} thème${themes.length > 1 ? "s" : ""}`
      : `${themes.length}/${maxThemes} thème${maxThemes > 1 ? "s" : ""}`;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Thèmes</Text>
          <Text style={styles.subtitle}>
            {limitLabel} ·{" "}
            {themes.length === 0
              ? "aucun pour l'instant"
              : "glissez pour parcourir"}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openTemplatePicker}>
          <Feather name="plus" size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ NOUVEAU — Section "Modèles prêts à l'emploi" (scroll horizontal) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Modèles prêts à l'emploi</Text>
            <Text style={styles.sectionSubtitle}>
              {THEME_TEMPLATES.length} modèles · tape pour personnaliser
            </Text>
          </View>
          <FlatList
            data={THEME_TEMPLATES}
            keyExtractor={(t) => t.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: SPACING, paddingRight: spacing.base }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.templateCard}
                onPress={() => handleTemplateSelected(item)}
                activeOpacity={0.9}
              >
                <View style={styles.templatePreviewWrapper}>
                  <Image
                    source={item.previewImage}
                    style={styles.templatePreviewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.templateOverlay}>
                    <Text style={styles.templateOverlayText}>{item.name}</Text>
                  </View>
                </View>
                <Text style={styles.templateName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.templateDesc} numberOfLines={1}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Section "Mes thèmes" (existante) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes thèmes</Text>
            <Text style={styles.sectionSubtitle}>
              {themes.length === 0
                ? "Aucun"
                : `${themes.length} enregistré${themes.length > 1 ? "s" : ""}`}
            </Text>
          </View>

          {themes.length === 0 ? (
            <View style={styles.emptyWrapper}>
              <EmptyState
                icon="layers"
                title="Aucun thème créé"
                message="Choisis un modèle ci-dessus pour commencer."
              />
            </View>
          ) : (
            <FlatList
              data={themes}
              keyExtractor={(item: any) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToAlignment="center"
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + SPACING}
              contentContainerStyle={styles.carouselContent}
              renderItem={({ item }) => {
                const isActive = item.id === currentId;
                return (
                  <TouchableOpacity
                    style={[styles.card, isActive && styles.cardActive]}
                    onPress={() => handleOpen(item.id)}
                    activeOpacity={0.9}
                  >
                    {isActive && (
                      <View style={styles.appliedBadge}>
                        <Feather
                          name="check-circle"
                          size={11}
                          color={colors.textInverse}
                        />
                        <Text style={styles.appliedBadgeText}>Actif</Text>
                      </View>
                    )}
                    <View style={styles.previewWrapper}>
                      <ThemeThumbnail
                        theme={item}
                        width={CARD_WIDTH - 24}
                        height={PREVIEW_HEIGHT - 24}
                      />
                    </View>
                    <View style={styles.cardFooter}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.cardMeta}>
                          <Feather
                            name="file"
                            size={10}
                            color={colors.textMuted}
                          />
                          <Text style={styles.cardMetaText}>
                            {item.pages?.length || 1} page
                            {(item.pages?.length || 1) > 1 ? "s" : ""}
                          </Text>
                          <Text style={styles.cardMetaDot}>·</Text>
                          <Text style={styles.cardMetaText}>
                            {item.blocks?.length || 0} élément
                            {(item.blocks?.length || 0) > 1 ? "s" : ""}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.cardArrow}>
                        <Feather
                          name="chevron-right"
                          size={16}
                          color={colors.primary}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Modale d'upgrade */}
      <UpgradeModal
        visible={upgradeModal.visible}
        onClose={() => setUpgradeModal({ visible: false })}
        message={upgradeModal.message}
        featureName="Créer un thème"
        currentPlan={currentPlan}
        recommendedPlan="premium"
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
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  scrollContent: { paddingBottom: spacing.xl },
  section: { marginTop: spacing.lg },
  sectionHeader: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Template cards
  templateCard: {
    width: TEMPLATE_CARD_W,
  },
  templatePreviewWrapper: {
    width: TEMPLATE_CARD_W,
    height: TEMPLATE_PREVIEW_H,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  templatePreviewImage: {
    width: "100%",
    height: "100%",
  },
  templateOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  templateOverlayText: {
    color: "#FFF",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  templateName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  templateDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Existing theme cards
  emptyWrapper: { paddingVertical: spacing.lg },
  carouselContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: SPACING,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.md,
  },
  cardActive: { borderColor: colors.primary, borderWidth: 2 },
  appliedBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
  appliedBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textInverse,
    fontWeight: fontWeight.bold,
  },
  previewWrapper: {
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  cardName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    marginBottom: 4,
  },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  cardMetaDot: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginHorizontal: 2,
  },
  cardArrow: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
});
