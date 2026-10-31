// app/(controller)/index.tsx
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Modal,
  Pressable,
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
  clearControllerSession,
  controllerInvitations,
  getControllerSession,
} from "../../src/api/controles";
import { Button, Card, EmptyState } from "../../src/components/ui";
import {
  colors,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  shadows,
  spacing,
} from "../../src/theme/tokens";

type Guest = {
  id: string;
  first_person: string;
  second_person?: string;
  place?: string;
  invitation_type?: string;
  used: boolean;
  code_invit?: string;
};

type ControllerSession = {
  user: { id: number; username: string; name: string };
  event: { id: string; name: string; event_code: string; date?: string };
};

// ═══════════════════════════════════════════════════════════════
// LOGOUT DIALOG
// ═══════════════════════════════════════════════════════════════
const LogoutDialog = ({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <Pressable style={dialogStyles.overlay} onPress={onClose}>
      <Pressable
        style={dialogStyles.content}
        onPress={(e) => e.stopPropagation()}
      >
        <View
          style={[
            dialogStyles.iconCircle,
            { backgroundColor: colors.errorSoft },
          ]}
        >
          <Feather name="log-out" size={30} color={colors.error} />
        </View>
        <Text style={dialogStyles.title}>Se déconnecter</Text>
        <Text style={dialogStyles.message}>
          Voulez-vous vraiment vous déconnecter ? Vous devrez ressaisir vos
          identifiants la prochaine fois.
        </Text>
        <View style={dialogStyles.buttons}>
          <TouchableOpacity
            style={dialogStyles.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={dialogStyles.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={dialogStyles.confirmBtn}
            onPress={onConfirm}
            activeOpacity={0.85}
          >
            <Feather name="log-out" size={16} color="#FFF" />
            <Text style={dialogStyles.confirmText}>Déconnecter</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

export default function ControllerHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [session, setSession] = useState<ControllerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

  // ✅ Verrous (useRef) — ne provoquent PAS de re-render
  const routerRef = useRef(router);
  const sessionRef = useRef<ControllerSession | null>(null);
  const isLoadingRef = useRef(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // ─── Guard : vérifier la session contrôleur (une seule fois) ───
  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      const sess = await getControllerSession();
      if (cancelled) return;
      if (!sess) {
        router.replace("/(controller)/login");
        return;
      }
      sessionRef.current = sess as ControllerSession;
      setSession(sess as ControllerSession);
      setChecking(false);
    };
    verify();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Charge les invitations (initial, une seule fois après check) ───
  useEffect(() => {
    if (checking) return;
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    let cancelled = false;
    const fetchInvitations = async () => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      try {
        const data = await controllerInvitations();
        if (cancelled) return;
        setGuests(Array.isArray(data?.invitations) ? data.invitations : []);
      } catch (err: any) {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 401) {
          await clearControllerSession();
          routerRef.current.replace("/(controller)/login");
          return;
        }
        setError("Impossible de charger les invités.");
      } finally {
        isLoadingRef.current = false;
        if (!cancelled) setLoading(false);
      }
    };

    fetchInvitations();
    return () => {
      cancelled = true;
    };
  }, [checking]);

  // ✅ Silent refresh — avec verrou anti-concurrent
  const silentRefresh = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    try {
      const data = await controllerInvitations();
      setGuests(Array.isArray(data?.invitations) ? data.invitations : []);
    } catch {
      // silencieux
    } finally {
      isLoadingRef.current = false;
    }
  }, []);

  // ✅ useFocusEffect avec dépendances strictement stables
  useFocusEffect(
    useCallback(() => {
      // Petit délai pour éviter le double-fire du focus initial
      const t = setTimeout(() => {
        silentRefresh();
      }, 100);

      const onBackPress = () => {
        routerRef.current.replace("/choose");
        return true;
      };
      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => {
        clearTimeout(t);
        sub.remove();
      };
    }, [silentRefresh]),
  );

  // ─── Handlers ───
  const handleBackToChoose = () => {
    router.replace("/choose");
  };

  const handleOpenLogout = () => setLogoutDialogVisible(true);

  const handleConfirmLogout = async () => {
    setLogoutDialogVisible(false);
    await clearControllerSession();
    router.replace("/(controller)/login");
  };

  const handleOpenCamera = () => {
    router.push("/(main)/camera");
  };

  if (checking || loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement des invités…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scanned = guests.filter((g) => g.used).length;
  const pending = guests.length - scanned;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.header, { paddingTop: spacing.md }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleBackToChoose}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.eventName} numberOfLines={1}>
            {session?.event?.name || "Événement"}
          </Text>
          <View style={styles.headerMetaRow}>
            <Feather name="hash" size={11} color={colors.textMuted} />
            <Text style={styles.eventCode}>
              {session?.event?.event_code || "—"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.headerBtn, styles.logoutBtn]}
          onPress={handleOpenLogout}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="users"
          iconColor={colors.primary}
          iconBg={colors.primarySoft}
          value={guests.length}
          label="Invités"
        />
        <StatCard
          icon="check-circle"
          iconColor={colors.success}
          iconBg={colors.successSoft}
          value={scanned}
          label="Scannés"
        />
        <StatCard
          icon="clock"
          iconColor={colors.warning}
          iconBg={colors.warningSoft}
          value={pending}
          label="En attente"
        />
      </View>

      {error ? (
        <View style={styles.errorWrapper}>
          <Card variant="outlined" padding="md">
            <View style={styles.errorInner}>
              <Feather name="alert-circle" size={18} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </Card>
        </View>
      ) : (
        <FlatList
          data={guests}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <GuestRow guest={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="inbox"
              title="Aucun invité"
              message="Il n'y a encore aucune invitation enregistrée pour cet événement."
            />
          }
        />
      )}

      <View style={[styles.fabWrapper, { bottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Scanner un QR code"
          icon="camera"
          variant="primary"
          size="lg"
          onPress={handleOpenCamera}
        />
      </View>

      <LogoutDialog
        visible={logoutDialogVisible}
        onClose={() => setLogoutDialogVisible(false)}
        onConfirm={handleConfirmLogout}
      />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════

const StatCard: React.FC<{
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBg: string;
  value: number;
  label: string;
}> = ({ icon, iconColor, iconBg, value, label }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBox, { backgroundColor: iconBg }]}>
      <Feather name={icon} size={16} color={iconColor} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const GuestRow: React.FC<{ guest: Guest }> = ({ guest }) => {
  const isCouple = guest.invitation_type === "COUPLE" || !!guest.second_person;
  const displayName = guest.second_person
    ? `${guest.first_person} & ${guest.second_person}`
    : guest.first_person;

  return (
    <Card variant="outlined" padding="md" style={styles.guestCard}>
      <View style={styles.guestRow}>
        <View
          style={[
            styles.guestAvatar,
            {
              backgroundColor: guest.used
                ? colors.successSoft
                : colors.primarySoft,
            },
          ]}
        >
          <Feather
            name={isCouple ? "users" : "user"}
            size={18}
            color={guest.used ? colors.success : colors.primary}
          />
        </View>

        <View style={styles.guestInfo}>
          <Text style={styles.guestName} numberOfLines={2}>
            {displayName}
          </Text>
          <View style={styles.guestMeta}>
            {guest.place ? (
              <View style={styles.metaItem}>
                <Feather name="map-pin" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>Table {guest.place}</Text>
              </View>
            ) : null}
            {isCouple ? (
              <View style={styles.metaItem}>
                <Feather name="heart" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>Couple</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: guest.used
                ? colors.successSoft
                : colors.warningSoft,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: guest.used ? colors.success : colors.warning,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: guest.used ? colors.success : colors.warning },
            ]}
          >
            {guest.used ? "Scanné" : "Attente"}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: spacing.base,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
  logoutBtn: { backgroundColor: colors.errorSoft },
  headerCenter: { flex: 1, alignItems: "center" },
  eventName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  headerMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  eventCode: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
  },

  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.base,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  guestCard: { marginBottom: spacing.sm },
  guestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  guestInfo: { flex: 1 },
  guestName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  guestMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: 4,
    flexWrap: "wrap",
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },

  errorWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.base,
  },
  errorInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },

  fabWrapper: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
  },
});

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...shadows.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: lineHeight.sm,
    marginBottom: spacing.lg,
  },
  buttons: { flexDirection: "row", gap: spacing.md, width: "100%" },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.error,
    ...shadows.md,
  },
  confirmText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: "#FFF",
  },
});
