// src/components/profile/modals/SessionsModal.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { getSessions, revokeSession, UserSession } from "../../../api/sessions";
import { useAppAlert } from "../../../hooks/useAppAlert";
import {
  colors,
  fontSize,
  fontWeight,
  iconSize,
  radius,
  spacing,
} from "../../../theme/tokens";
import { ModalWrapper } from "./ModalWrapper";

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

// Icône selon le type d'appareil
const iconForSession = (session: UserSession): string => {
  const os = (session.os_name || "").toLowerCase();
  if (os.includes("ios") || os.includes("android"))
    return "phone-portrait-outline";
  if (os.includes("mac") || os.includes("windows") || os.includes("linux"))
    return "laptop-outline";
  if (session.source === "mobile") return "phone-portrait-outline";
  return "globe-outline";
};

// Nom lisible de l'appareil (device_model propre, sinon device_brand, sinon fallback)
const deviceLabel = (session: UserSession): string => {
  const model = (session.device_model || "").trim();
  const brand = (session.device_brand || "").trim();

  // Un device_model "propre" ne contient pas de "/" ni de ":" (bug expo-device Android)
  const isCleanModel =
    model && !model.includes("/") && !model.includes(":") && model.length < 40;

  if (isCleanModel) return model;
  if (brand && !brand.includes("/") && !brand.includes(":")) {
    // Capitaliser : "samsung" → "Samsung"
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  }
  return session.source === "web" ? "Navigateur web" : "Appareil mobile";
};

// Localisation : "Kinshasa, Congo (DRC)" ou fallback
const locationLabel = (session: UserSession): string => {
  const parts = [session.city, session.country].filter(Boolean);
  if (parts.length === 0) return "Localisation inconnue";
  return parts.join(", ");
};

// Date relative : "À l'instant", "Il y a 5 min", "Hier", "12 oct. 2026"
const formatLastActivity = (iso: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export const SessionsModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<number | null>(null);
  const { showAlert, AlertHost } = useAppAlert();

  // ─── Chargement ───
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSessions();
      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || "Impossible de charger les sessions.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadSessions();
    }
  }, [visible, loadSessions]);

  // ─── Déconnexion d'une session ───
  const handleDisconnect = (session: UserSession) => {
    if (session.is_current) return;
    showAlert({
      title: "Déconnecter cet appareil ?",
      message: `Voulez-vous vraiment déconnecter "${deviceLabel(session)}" ?`,
      variant: "warning",
      buttons: [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnecter",
          style: "destructive",
          onPress: async () => {
            setRevoking(session.id);
            try {
              await revokeSession(session.id);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setSessions((prev) => prev.filter((x) => x.id !== session.id));
              Toast.show({
                type: "success",
                text1: "Appareil déconnecté",
              });
            } catch (err: any) {
              Toast.show({
                type: "error",
                text1: "Erreur",
                text2:
                  err?.response?.data?.detail || "Impossible de déconnecter.",
              });
            } finally {
              setRevoking(null);
            }
          },
        },
      ],
    });
  };

  // ─── Déconnexion de toutes les autres ───
  const handleDisconnectAll = () => {
    const others = sessions.filter((x) => !x.is_current && x.is_active);
    if (others.length === 0) return;

    showAlert({
      title: "Déconnecter tous les autres appareils ?",
      message:
        "Vous resterez connecté uniquement sur cet appareil. Les autres devront se reconnecter.",
      variant: "danger",
      buttons: [
        { text: "Annuler", style: "cancel" },
        {
          text: "Tout déconnecter",
          style: "destructive",
          onPress: async () => {
            try {
              const results = await Promise.allSettled(
                others.map((s) => revokeSession(s.id)),
              );
              const failed = results.filter(
                (r) => r.status === "rejected",
              ).length;
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setSessions((prev) => prev.filter((x) => x.is_current));
              Toast.show({
                type: "success",
                text1: "Appareils déconnectés",
                text2: failed
                  ? `${failed} échec(s)`
                  : `${others.length} appareil(s)`,
              });
            } catch (err: any) {
              Toast.show({
                type: "error",
                text1: "Erreur",
                text2: "Certaines déconnexions ont échoué.",
              });
            }
          },
        },
      ],
    });
  };

  const othersActive = sessions.filter(
    (x) => !x.is_current && x.is_active,
  ).length;

  // ═══════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════
  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Sessions actives"
      subtitle={
        loading
          ? "Chargement…"
          : `${sessions.length} appareil${
              sessions.length > 1 ? "s" : ""
            } connecté${sessions.length > 1 ? "s" : ""}`
      }
    >
      {/* Loading */}
      {loading && sessions.length === 0 ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Chargement des sessions…</Text>
        </View>
      ) : null}

      {/* Erreur */}
      {error && !loading ? (
        <View style={s.errorBox}>
          <Ionicons
            name="alert-circle-outline"
            size={18}
            color={colors.error}
          />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadSessions} style={s.retryBtn}>
            <Text style={s.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Vide */}
      {!loading && !error && sessions.length === 0 ? (
        <View style={s.center}>
          <Ionicons
            name="phone-portrait-outline"
            size={40}
            color={colors.textMuted}
          />
          <Text style={s.emptyText}>Aucune session active</Text>
        </View>
      ) : null}

      {/* Liste */}
      {sessions.length > 0 ? (
        <View style={s.list}>
          {sessions.map((sess) => (
            <View
              key={sess.id}
              style={[s.item, sess.is_current && s.itemCurrent]}
            >
              <View
                style={[
                  s.iconBox,
                  {
                    backgroundColor: sess.is_current
                      ? colors.successSoft
                      : colors.primarySoft,
                  },
                ]}
              >
                <Ionicons
                  name={iconForSession(sess) as any}
                  size={iconSize.md}
                  color={sess.is_current ? colors.success : colors.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                {/* Nom de l'appareil + badge "cet appareil" */}
                <View style={s.titleRow}>
                  <Text style={s.device} numberOfLines={1}>
                    {deviceLabel(sess)}
                  </Text>
                  {sess.is_current ? (
                    <View style={s.currentBadge}>
                      <View style={s.currentDot} />
                      <Text style={s.currentText}>Cet appareil</Text>
                    </View>
                  ) : null}
                </View>

                {/* Localisation */}
                <View style={s.metaRow}>
                  <Ionicons
                    name="location-outline"
                    size={12}
                    color={colors.textMuted}
                  />
                  <Text style={s.meta} numberOfLines={1}>
                    {locationLabel(sess)}
                  </Text>
                </View>

                {/* Dernière activité */}
                <View style={s.metaRow}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={colors.textMuted}
                  />
                  <Text style={s.meta} numberOfLines={1}>
                    {formatLastActivity(sess.last_activity)}
                  </Text>
                </View>
              </View>

              {/* Bouton déconnexion */}
              {!sess.is_current ? (
                <TouchableOpacity
                  style={s.disconnectBtn}
                  onPress={() => handleDisconnect(sess)}
                  disabled={revoking === sess.id}
                >
                  {revoking === sess.id ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <Ionicons
                      name="close-circle-outline"
                      size={iconSize.md}
                      color={colors.error}
                    />
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* Bouton tout déconnecter */}
      {othersActive > 0 ? (
        <TouchableOpacity
          style={s.disconnectAllBtn}
          onPress={handleDisconnectAll}
        >
          <Ionicons
            name="log-out-outline"
            size={iconSize.md}
            color={colors.error}
          />
          <Text style={s.disconnectAllText}>
            Déconnecter tous les autres appareils
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Info */}
      <View style={s.infoBox}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={colors.textMuted}
        />
        <Text style={s.infoText}>
          Si vous voyez un appareil que vous ne reconnaissez pas, déconnectez-le
          immédiatement et changez votre mot de passe.
        </Text>
      </View>

      {AlertHost}
    </ModalWrapper>
  );
};

// ═══════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  center: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.semibold,
  },
  retryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.error,
    borderRadius: radius.sm,
  },
  retryText: {
    fontSize: fontSize.xs,
    color: "#FFF",
    fontWeight: fontWeight.bold,
  },

  list: { gap: spacing.sm },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  itemCurrent: {
    borderColor: colors.successSoft,
    backgroundColor: colors.successSoft + "30",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  device: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flexShrink: 1,
  },
  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  currentText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  disconnectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  disconnectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.errorSoft,
    backgroundColor: colors.surface,
  },
  disconnectAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
