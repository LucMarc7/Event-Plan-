// app/(main)/controllers/[eventId]/[userId].tsx
import { Feather } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
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
import {
    ControllerHistoryEntry,
    ControllerReportResponse,
    getControllerReport,
} from "../../../../src/api/controllers";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing,
} from "../../../../src/theme/tokens";

// ─── Helpers ────────────────────────────────────────────────────
const fmtDateTime = (iso: string | null): string => {
  if (!iso) return "—";
  const d = dayjs(iso);
  if (!d.isValid()) return "—";
  return d.format("DD MMM · HH:mm");
};

const fmtDay = (iso: string): string => {
  const d = dayjs(iso);
  if (!d.isValid()) return iso;
  return d.format("DD MMM");
};

export default function ControllerDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { eventId, userId } = useLocalSearchParams<{
    eventId: string;
    userId: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ControllerReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId || !userId) return;
    try {
      setError(null);
      const res = await getControllerReport(String(eventId), Number(userId));
      setData(res);
    } catch (err: any) {
      setError(
        err?.response?.data?.error || "Impossible de charger le rapport.",
      );
    }
  }, [eventId, userId]);

  useEffect(() => {
    (async () => {
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ─── Max du graphe pour normaliser les barres ───
  const maxDay = useMemo(() => {
    if (!data?.by_day?.length) return 1;
    return Math.max(...data.by_day.map((d) => d.count), 1);
  }, [data]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement du rapport…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rapport</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.center}>
          <Feather name="alert-circle" size={40} color={colors.error} />
          <Text style={styles.errorTitle}>Impossible de charger</Text>
          {error ? <Text style={styles.errorSub}>{error}</Text> : null}
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { controller, stats, by_day, history } = data;
  const initials = (controller.name || "?").charAt(0).toUpperCase();

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
          <Text style={styles.headerTitle} numberOfLines={1}>
            Rapport détaillé
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {data.event.name}
          </Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ─── IDENTITÉ ─── */}
        <View style={styles.identityCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{controller.name}</Text>
            <Text style={styles.username}>@{controller.username}</Text>
            <View
              style={[
                styles.statusBadge,
                controller.is_active
                  ? styles.activeBadge
                  : styles.inactiveBadge,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: controller.is_active
                      ? colors.success
                      : colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: controller.is_active
                      ? colors.success
                      : colors.textMuted,
                  },
                ]}
              >
                {controller.is_active ? "Actif" : "Désactivé"}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── STATS PRINCIPALES ─── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
            <View
              style={[styles.statIcon, { backgroundColor: colors.primarySoft }]}
            >
              <Feather name="camera" size={18} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>{stats.total_scans}</Text>
            <Text style={styles.statLabel}>Scans totaux</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: "#8B5CF6" }]}>
            <View style={[styles.statIcon, { backgroundColor: "#F5F3FF" }]}>
              <Feather name="users" size={18} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{stats.invitations_scanned}</Text>
            <Text style={styles.statLabel}>Invitations</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: colors.success }]}>
            <View
              style={[styles.statIcon, { backgroundColor: colors.successSoft }]}
            >
              <Feather name="tag" size={18} color={colors.success} />
            </View>
            <Text style={styles.statValue}>{stats.tickets_scanned}</Text>
            <Text style={styles.statLabel}>Tickets</Text>
          </View>
        </View>

        {/* ─── INFO PÉRIODE ─── */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionLabel}>Période d‘activité</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Feather name="play-circle" size={14} color={colors.success} />
            </View>
            <Text style={styles.infoLabel}>Premier scan</Text>
            <Text style={styles.infoValue}>
              {fmtDateTime(stats.first_scan_at)}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Feather name="pause-circle" size={14} color={colors.warning} />
            </View>
            <Text style={styles.infoLabel}>Dernier scan</Text>
            <Text style={styles.infoValue}>
              {fmtDateTime(stats.last_scan_at)}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Feather name="wifi" size={14} color={colors.primary} />
            </View>
            <Text style={styles.infoLabel}>IP uniques</Text>
            <Text style={styles.infoValue}>
              {stats.unique_ips.length || "—"}
            </Text>
          </View>
        </View>

        {/* ─── GRAPHE PAR JOUR ─── */}
        {by_day.length > 0 ? (
          <View style={styles.chartCard}>
            <Text style={styles.sectionLabel}>Activité par jour</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartScroll}
            >
              {by_day.map((d) => {
                const h = Math.max((d.count / maxDay) * 100, 6);
                return (
                  <View key={d.date} style={styles.chartColumn}>
                    <Text style={styles.chartCount}>{d.count}</Text>
                    <View style={styles.chartBarTrack}>
                      <View
                        style={[styles.chartBarFill, { height: `${h}%` }]}
                      />
                    </View>
                    <Text style={styles.chartLabel} numberOfLines={1}>
                      {fmtDay(d.date)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* ─── HISTORIQUE ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Historique complet ({history.length})
          </Text>

          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Feather name="inbox" size={32} color={colors.textMuted} />
              <Text style={styles.emptyHistoryText}>
                Aucun scan enregistré pour l‘instant.
              </Text>
            </View>
          ) : (
            history.map((entry, idx) => (
              <HistoryRow
                key={`${entry.type}-${entry.log_id}-${idx}`}
                entry={entry}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// LIGNE D'HISTORIQUE
// ═══════════════════════════════════════════════════════════════
const HistoryRow: React.FC<{ entry: ControllerHistoryEntry }> = ({ entry }) => {
  const isInvitation = entry.type === "invitation";

  const primaryLabel = isInvitation
    ? entry.guest_name
      ? entry.second_person
        ? `${entry.guest_name} & ${entry.second_person}`
        : entry.guest_name
      : "Invité"
    : entry.buyer_name || "Acheteur";

  const secondaryLabel = isInvitation
    ? entry.place
      ? `Table ${entry.place}`
      : entry.invitation_type === "COUPLE"
        ? "Couple"
        : "Invitation"
    : entry.category_name || "Ticket";

  const accent = isInvitation ? "#8B5CF6" : colors.success;
  const bgAccent = isInvitation ? "#F5F3FF" : colors.successSoft;

  return (
    <View style={styles.historyRow}>
      <View style={[styles.historyIcon, { backgroundColor: bgAccent }]}>
        <Feather
          name={isInvitation ? "users" : "tag"}
          size={14}
          color={accent}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyName} numberOfLines={1}>
          {primaryLabel}
        </Text>
        <Text style={styles.historyDetail} numberOfLines={1}>
          {secondaryLabel}
        </Text>
        <View style={styles.historyMetaRow}>
          <Feather name="clock" size={10} color={colors.textMuted} />
          <Text style={styles.historyMeta}>
            {fmtDateTime(entry.validated_at)}
          </Text>
          {entry.device?.label ? (
            <>
              <Text style={styles.historyMetaSep}>·</Text>
              <Text style={styles.historyMeta}>{entry.device.label}</Text>
            </>
          ) : null}
        </View>
      </View>
      {entry.ip_address ? (
        <View style={styles.ipPill}>
          <Text style={styles.ipText} numberOfLines={1}>
            {entry.ip_address}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: { color: colors.textSecondary, fontSize: fontSize.sm },
  errorTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  errorSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  retryText: {
    color: "#FFF",
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
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

  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  // Identité
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  avatarBox: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.primary,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  username: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  activeBadge: { backgroundColor: colors.successSoft },
  inactiveBadge: { backgroundColor: colors.surfaceAlt },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderLeftWidth: 3,
    ...shadows.sm,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  // Info période
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoIconBox: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.bold,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 40,
  },

  // Chart
  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  chartScroll: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chartColumn: {
    width: 48,
    alignItems: "center",
    marginRight: spacing.sm,
  },
  chartCount: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 4,
    fontVariant: ["tabular-nums"],
  },
  chartBarTrack: {
    width: 28,
    height: 100,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  chartBarFill: {
    width: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    minHeight: 6,
  },
  chartLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    marginTop: 4,
  },

  // Historique
  section: { marginBottom: spacing.lg },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
  },
  emptyHistoryText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  historyName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  historyDetail: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  historyMeta: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  historyMetaSep: {
    fontSize: 10,
    color: colors.textMuted,
  },
  ipPill: {
    maxWidth: 100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
  },
  ipText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
});
