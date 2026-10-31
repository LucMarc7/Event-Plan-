// app/(main)/guests/themes/index.tsx
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ThemeThumbnail from "../../../../src/components/theme/ThemeThumbnail";
import { EmptyState } from "../../../../src/components/ui";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing,
} from "../../../../src/theme/tokens";

interface ThemeRow {
  id: string;
  name: string;
  eventId: string;
  updatedAt: number;
  blocksCount: number;
  pagesCount: number;
  isApplied: boolean;
  raw: any;
}

export default function ThemesListScreen() {
  const router = useRouter();
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadThemes = useCallback(async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const themeKeys = allKeys.filter((k) => k.startsWith("themes_"));
      if (themeKeys.length === 0) {
        setThemes([]);
        return;
      }

      const rows: ThemeRow[] = [];
      for (const key of themeKeys) {
        const eventId = key.replace("themes_", "");
        const raw = await AsyncStorage.getItem(key);
        if (!raw) continue;

        try {
          const arr = JSON.parse(raw);
          const currentId = await AsyncStorage.getItem(
            `current_theme_${eventId}`,
          );

          for (const t of arr) {
            rows.push({
              id: t.id,
              name: t.name || "Sans nom",
              eventId,
              updatedAt: t.updatedAt || t.createdAt || 0,
              blocksCount: t.blocks?.length || 0,
              pagesCount: t.pages?.length || 0,
              isApplied: t.id === currentId,
              raw: t,
            });
          }
        } catch (e) {
          console.error("Erreur parsing thème:", key, e);
        }
      }

      rows.sort((a, b) => b.updatedAt - a.updatedAt);
      setThemes(rows);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadThemes();
    }, [loadThemes]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadThemes();
  };

  const handleOpen = (row: ThemeRow) => {
    router.push({
      pathname: "/(main)/guests/themes/[eventId]/[themeId]",
      params: { eventId: row.eventId, themeId: row.id },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Mes thèmes</Text>
          <Text style={styles.subtitle}>
            {themes.length} thème{themes.length > 1 ? "s" : ""} personnalisé
            {themes.length > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {themes.length === 0 ? (
        <EmptyState
          icon="layers"
          title="Aucun thème créé"
          message="Créez votre premier thème depuis la page d'un événement pour personnaliser vos invitations."
        />
      ) : (
        <FlatList
          data={themes}
          keyExtractor={(item) => `${item.eventId}_${item.id}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleOpen(item)}
              activeOpacity={0.9}
            >
              {/* Thumbnail à gauche */}
              <View style={styles.thumbWrapper}>
                <ThemeThumbnail theme={item.raw} width={80} height={100} />
              </View>

              {/* Contenu */}
              <View style={styles.content}>
                <View style={styles.titleRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.isApplied && (
                    <View style={styles.activeBadge}>
                      <Feather
                        name="check-circle"
                        size={10}
                        color={colors.textInverse}
                      />
                      <Text style={styles.activeBadgeText}>Actif</Text>
                    </View>
                  )}
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Feather name="file" size={11} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      {item.pagesCount} page{item.pagesCount > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Feather name="square" size={11} color={colors.textMuted} />
                    <Text style={styles.metaText}>
                      {item.blocksCount} élément
                      {item.blocksCount > 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Feather name="clock" size={11} color={colors.textMuted} />
                  <Text style={styles.metaText}>
                    {new Date(item.updatedAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>

              <Feather
                name="chevron-right"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        />
      )}
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
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  listContent: { padding: spacing.base },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  thumbWrapper: {
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  content: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 6,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flexShrink: 1,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  activeBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textInverse,
    fontWeight: fontWeight.bold,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: 3,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
});
