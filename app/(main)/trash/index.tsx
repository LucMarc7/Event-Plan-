// app/(main)/trash/index.tsx
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  emptyTrash,
  getTrashEvents,
  hardDeleteEvent,
  restoreEvent,
  TrashEvent,
} from "../../../src/api/events";
import { EmptyState } from "../../../src/components/ui";
import { useAppAlert } from "../../../src/hooks/useAppAlert";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../../src/theme/tokens";

export default function TrashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertHost } = useAppAlert();

  const [events, setEvents] = useState<TrashEvent[]>([]);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [emptying, setEmptying] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getTrashEvents();
      setEvents(res?.events || []);
      setHiddenCount(res?.hidden_count || 0);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de charger la corbeille.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleRestore = (event: TrashEvent) => {
    showAlert({
      title: "Restaurer cet événement ?",
      message: `« ${event.name} » sera restauré et à nouveau visible dans votre liste.`,
      variant: "success",
      buttons: [
        { text: "Annuler", style: "cancel" },
        {
          text: "Restaurer",
          style: "default",
          onPress: async () => {
            setActionLoading(event.id);
            try {
              const res = await restoreEvent(event.id);
              if (res.success) {
                Toast.show({
                  type: "success",
                  text1: "Événement restauré",
                });
                await load();
              } else {
                Toast.show({
                  type: "error",
                  text1: "Restauration impossible",
                  text2: res.message,
                });
              }
            } catch {
              Toast.show({ type: "error", text1: "Erreur réseau" });
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    });
  };

  const handleHardDelete = (event: TrashEvent) => {
    showAlert({
      title: "Supprimer définitivement ?",
      message: `« ${event.name} » sera supprimé de façon IRRÉVERSIBLE. Cette action ne peut pas être annulée.`,
      variant: "danger",
      buttons: [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer définitivement",
          style: "destructive",
          onPress: async () => {
            setActionLoading(event.id);
            try {
              await hardDeleteEvent(event.id);
              Toast.show({
                type: "success",
                text1: "Supprimé définitivement",
              });
              await load();
            } catch {
              Toast.show({ type: "error", text1: "Erreur réseau" });
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    });
  };

  // ✅ NOUVEAU — Vider la corbeille (visibles + cachés)
  const handleEmptyTrash = () => {
    const visible = events.length;
    const hidden = hiddenCount;
    const total = visible + hidden;

    if (total === 0) {
      Toast.show({
        type: "info",
        text1: "Corbeille vide",
        text2: "Aucun événement à supprimer.",
      });
      return;
    }

    const parts: string[] = [];
    if (visible > 0) {
      parts.push(
        `${visible} événement${visible > 1 ? "s" : ""} visible${visible > 1 ? "s" : ""}`,
      );
    }
    if (hidden > 0) {
      parts.push(
        `${hidden} événement${hidden > 1 ? "s" : ""} caché${hidden > 1 ? "s" : ""} (anciennes suppressions)`,
      );
    }

    showAlert({
      title: "Vider la corbeille ?",
      message:
        `${parts.join(" + ")} ${total > 1 ? "seront supprimés" : "sera supprimé"} ` +
        `DÉFINITIVEMENT et IRRÉVERSIBLEMENT.\n\n` +
        `Cette action vide TOUTE la corbeille, y compris les événements encore dans la fenêtre de récupération 48h.`,
      variant: "danger",
      buttons: [
        { text: "Annuler", style: "cancel" },
        {
          text: `Vider (${total})`,
          style: "destructive",
          onPress: async () => {
            setEmptying(true);
            try {
              const res = await emptyTrash();
              Toast.show({
                type: "success",
                text1: "Corbeille vidée",
                text2:
                  res.message || `${res.deleted} événement(s) supprimé(s).`,
              });
              await load();
            } catch {
              Toast.show({ type: "error", text1: "Erreur réseau" });
            } finally {
              setEmptying(false);
            }
          },
        },
      ],
    });
  };

  const formatHoursRemaining = (hours: number): string => {
    if (hours < 1) {
      const mins = Math.round(hours * 60);
      return `${mins} min`;
    }
    if (hours < 24) return `${Math.round(hours)} h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours - days * 24);
    return `${days}j ${remainingHours}h`;
  };

  const renderItem = ({ item }: { item: TrashEvent }) => {
    const isUrgent = item.hours_remaining < 6;
    const isBusy = actionLoading === item.id;

    return (
      <View style={styles.card}>
        <View
          style={[
            styles.timerBadge,
            {
              backgroundColor: isUrgent ? colors.errorSoft : colors.warningSoft,
            },
          ]}
        >
          <Feather
            name="clock"
            size={12}
            color={isUrgent ? colors.error : colors.warning}
          />
          <Text
            style={[
              styles.timerText,
              { color: isUrgent ? colors.error : colors.warning },
            ]}
          >
            {formatHoursRemaining(item.hours_remaining)}
          </Text>
        </View>

        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Feather name="hash" size={11} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.event_code || "—"}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="users" size={11} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {item.guests_created_count} invités
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.restoreBtn, isBusy && { opacity: 0.6 }]}
            onPress={() => handleRestore(item)}
            disabled={isBusy}
            activeOpacity={0.85}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <>
                <Feather name="rotate-ccw" size={14} color={colors.success} />
                <Text style={styles.restoreBtnText}>Restaurer</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, isBusy && { opacity: 0.6 }]}
            onPress={() => handleHardDelete(item)}
            disabled={isBusy}
            activeOpacity={0.85}
          >
            <Feather name="x" size={14} color={colors.error} />
            <Text style={styles.deleteBtnText}>Supprimer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const totalCount = events.length + hiddenCount;
  const showEmptyButton = !loading && totalCount > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Corbeille</Text>
          <Text style={styles.headerSubtitle}>
            {loading
              ? "Chargement…"
              : hiddenCount > 0
                ? `${events.length} visible${events.length > 1 ? "s" : ""} · ${hiddenCount} caché${hiddenCount > 1 ? "s" : ""}`
                : `${events.length} événement${events.length > 1 ? "s" : ""}`}
          </Text>
        </View>
        {showEmptyButton ? (
          <TouchableOpacity
            style={[styles.emptyBtn, emptying && { opacity: 0.6 }]}
            onPress={handleEmptyTrash}
            disabled={emptying}
            activeOpacity={0.7}
          >
            {emptying ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Feather name="trash-2" size={14} color={colors.error} />
                <Text style={styles.emptyBtnText}>Vider</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {/* Info banner */}
      {!loading && events.length > 0 ? (
        <View style={styles.infoBanner}>
          <Feather name="info" size={16} color={colors.primary} />
          <Text style={styles.infoBannerText}>
            Les événements sont conservés 48h puis supprimés définitivement.
          </Text>
        </View>
      ) : null}

      {/* Bandeau cachés */}
      {!loading && hiddenCount > 0 ? (
        <View style={styles.hiddenBanner}>
          <Feather name="eye-off" size={16} color={colors.warning} />
          <Text style={styles.hiddenBannerText}>
            {hiddenCount} événement{hiddenCount > 1 ? "s" : ""} caché
            {hiddenCount > 1 ? "s" : ""} (anciennes suppressions expirées).
            Utilisez « Vider » pour les purger.
          </Text>
        </View>
      ) : null}

      {/* CONTENU */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            icon="trash-2"
            title="Corbeille vide"
            message={
              hiddenCount > 0
                ? `${hiddenCount} événement(s) caché(s) restent à purger. Appuyez sur « Vider ».`
                : "Les événements supprimés apparaîtront ici pendant 48h."
            }
          />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {AlertHost}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.error + "40",
  },
  emptyBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  infoBannerText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    lineHeight: 16,
  },

  hiddenBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  hiddenBannerText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.semibold,
    lineHeight: 16,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  timerText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  cardName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardMeta: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.md,
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
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  restoreBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.success + "40",
  },
  restoreBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.error + "40",
  },
  deleteBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
});
