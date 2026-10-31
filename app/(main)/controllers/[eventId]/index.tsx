// app/(main)/controllers/[eventId]/index.tsx
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  createController,
  deactivateController,
  EventController,
  getControllersReport,
  listControllers,
  updateMaxControllers,
} from "../../../../src/api/controllers";
// ✅ NOUVEAU — Interception 402
import { UpgradeModal } from "../../../../src/components/subscription/UpgradeModal";
import { useSubscription } from "../../../../src/hooks/useSubscription";
import {
  colors,
  fontSize,
  fontWeight,
  iconSize,
  radius,
  shadows,
  spacing,
} from "../../../../src/theme/tokens";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface CreatedCredentials {
  name: string;
  username: string;
  temp_password: string;
  eventName: string;
  eventCode: string;
}

// ─── Helper dates ────────────────────────────────────────────────
const formatRelative = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

export default function ControllersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal création
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal credentials
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(
    null,
  );

  // Modal limite
  const [showLimit, setShowLimit] = useState(false);
  const [limitValue, setLimitValue] = useState("");
  const [savingLimit, setSavingLimit] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  // ✅ NOUVEAU — Plan + modale d'upgrade
  const { plan: currentPlan } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{
    visible: boolean;
    message?: string;
  }>({ visible: false });

  const scrollY = useRef(new Animated.Value(0)).current;

  const fabWidth = scrollY.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [220, 220, 64],
    extrapolate: "clamp",
  });
  const fabTextOpacity = scrollY.interpolate({
    inputRange: [0, 60, 110],
    outputRange: [1, 0.2, 0],
    extrapolate: "clamp",
  });
  const fabTextWidth = scrollY.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [130, 130, 0],
    extrapolate: "clamp",
  });
  const fabTextMargin = scrollY.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [spacing.sm, spacing.sm, 0],
    extrapolate: "clamp",
  });
  const fabPadding = scrollY.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [spacing.base, spacing.base, 0],
    extrapolate: "clamp",
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  // ─── Chargement ───
  const loadAll = useCallback(async () => {
    if (!eventId) return;
    try {
      setError(null);
      const [list, rep] = await Promise.all([
        listControllers(String(eventId)),
        getControllersReport(String(eventId)).catch(() => null),
      ]);
      setData(list);
      setReport(rep);
    } catch (err: any) {
      setError(
        err?.response?.data?.error || "Impossible de charger les contrôleurs.",
      );
    }
  }, [eventId]);

  useEffect(() => {
    (async () => {
      await loadAll();
      setLoading(false);
    })();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadAll();
    setRefreshing(false);
  };

  // ─── Création ───
  const handleCreate = async () => {
    setCreateError(null);
    const name = newName.trim();
    if (name.length < 2) {
      setCreateError("Le nom doit contenir au moins 2 caractères.");
      return;
    }
    setCreating(true);
    try {
      const res = await createController(String(eventId), name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCreate(false);
      setNewName("");
      setCredentials({
        name: res.controller.name,
        username: res.controller.username,
        temp_password: res.controller.temp_password,
        eventName: res.event.name,
        eventCode: res.event.event_code,
      });
      await loadAll();
    } catch (err: any) {
      const status = err?.response?.status;
      const body = err?.response?.data || {};

      // ✅ INTERCEPTION UPGRADE : limite de contrôleurs atteinte
      if (status === 402 && body.need_upgrade) {
        setShowCreate(false);
        setNewName("");
        setUpgradeModal({
          visible: true,
          message:
            body.error ||
            "Vous avez atteint la limite de contrôleurs de votre plan.",
        });
        return;
      }

      setCreateError(
        body.error || body.detail || "Erreur lors de la création.",
      );
    } finally {
      setCreating(false);
    }
  };

  // ─── Désactivation ───
  const handleDeactivate = (ctrl: EventController) => {
    Alert.alert(
      "Désactiver ce contrôleur ?",
      `${ctrl.name} ne pourra plus se connecter ni scanner pour cet événement.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Désactiver",
          style: "destructive",
          onPress: async () => {
            try {
              await deactivateController(String(eventId), ctrl.user_id);
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              await loadAll();
            } catch {
              Alert.alert("Erreur", "Impossible de désactiver.");
            }
          },
        },
      ],
    );
  };

  // ─── Ouverture limite ───
  const openLimitSheet = () => {
    setLimitValue(String(data?.max_controllers ?? 3));
    setLimitError(null);
    setShowLimit(true);
  };

  const handleSaveLimit = async () => {
    setLimitError(null);
    const n = parseInt(limitValue.trim(), 10);
    if (isNaN(n) || n < 1 || n > 50) {
      setLimitError("Entier entre 1 et 50 attendu.");
      return;
    }
    setSavingLimit(true);
    try {
      await updateMaxControllers(String(eventId), n);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowLimit(false);
      await loadAll();
    } catch (err: any) {
      const status = err?.response?.status;
      const body = err?.response?.data || {};

      // ✅ INTERCEPTION UPGRADE : tentative de dépasser la limite du plan
      if (status === 402 && body.need_upgrade) {
        setShowLimit(false);
        setUpgradeModal({
          visible: true,
          message:
            body.error ||
            "Votre plan actuel ne permet pas d'augmenter cette limite.",
        });
        return;
      }

      setLimitError(body.error || "Erreur lors de la mise à jour.");
    } finally {
      setSavingLimit(false);
    }
  };

  // ─── Copier/Partager ───
  const buildCredentialsText = (c: CreatedCredentials) =>
    `Accès contrôleur Event Plan\n\n` +
    `Événement : ${c.eventName}\n` +
    `Code événement : ${c.eventCode}\n\n` +
    `Nom d'utilisateur : ${c.username}\n` +
    `Mot de passe : ${c.temp_password}\n\n` +
    `Connectez-vous via l'app Event Plan → Contrôleur.`;

  const handleCopy = async () => {
    if (!credentials) return;
    await Clipboard.setStringAsync(buildCredentialsText(credentials));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copié", "Les identifiants sont dans le presse-papiers.");
  };

  const handleShare = async () => {
    if (!credentials) return;
    try {
      await Share.share({ message: buildCredentialsText(credentials) });
    } catch {}
  };

  const closeCreateModal = () => {
    if (creating) return;
    setShowCreate(false);
    setNewName("");
    setCreateError(null);
  };

  // ─── Index du rapport par user_id ───
  const reportByUserId = React.useMemo(() => {
    const map: Record<number, any> = {};
    (report?.controllers || []).forEach((c: any) => {
      map[c.user_id] = c;
    });
    return map;
  }, [report]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentCount = data?.current_count ?? 0;
  const maxCount = data?.max_controllers ?? 3;
  const isFull = currentCount >= maxCount;
  const totalScans = report?.summary?.total_validations ?? 0;

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
            Contrôleurs
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {data?.event_name || "—"}
          </Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {/* BANDEAU STATS GLOBAL */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryTile}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Feather name="users" size={14} color={colors.primary} />
          </View>
          <Text style={styles.summaryValue}>
            {currentCount}/{maxCount}
          </Text>
          <Text style={styles.summaryLabel}>Contrôleurs</Text>
        </View>
        <View style={styles.summaryTile}>
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: colors.successSoft },
            ]}
          >
            <Feather name="check-circle" size={14} color={colors.success} />
          </View>
          <Text style={styles.summaryValue}>{totalScans}</Text>
          <Text style={styles.summaryLabel}>Scans totaux</Text>
        </View>
      </View>

      {/* COMPTEUR + BOUTON LIMITE */}
      <View style={styles.counterRow}>
        <Text style={styles.counterText}>
          {currentCount} / {maxCount} contrôleur{maxCount > 1 ? "s" : ""}
        </Text>
        <View
          style={{
            flexDirection: "row",
            gap: spacing.sm,
            alignItems: "center",
          }}
        >
          {isFull ? (
            <View style={styles.badgeFull}>
              <Feather name="info" size={12} color={colors.warning} />
              <Text style={styles.badgeFullText}>Limite atteinte</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.limitBtn}
            onPress={openLimitSheet}
            activeOpacity={0.7}
          >
            <Feather name="sliders" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* LISTE */}
      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 140 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {error ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!error && data?.controllers?.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIcon}>
              <Feather name="users" size={32} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Aucun contrôleur</Text>
            <Text style={styles.emptyText}>
              Ajoutez un contrôleur pour lui permettre de scanner les
              invitations.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => setShowCreate(true)}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={16} color="#FFF" />
              <Text style={styles.emptyBtnText}>Ajouter un contrôleur</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {data?.controllers?.map((ctrl: EventController) => {
          const rep = reportByUserId[ctrl.user_id];
          const totalScansForCtrl = rep?.validations?.total ?? 0;
          const lastAt = rep?.last_validation_at ?? null;

          return (
            <TouchableOpacity
              key={ctrl.id}
              style={styles.card}
              onPress={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: "/(main)/controllers/[eventId]/[userId]",
                  params: {
                    eventId: String(eventId),
                    userId: String(ctrl.user_id),
                  },
                });
              }}
              activeOpacity={0.85}
            >
              <View style={styles.cardAvatar}>
                <Text style={styles.avatarText}>
                  {(ctrl.name || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{ctrl.name}</Text>
                <Text style={styles.cardUsername}>{ctrl.username}</Text>

                <View style={styles.cardMetaRow}>
                  <View style={styles.metaPill}>
                    <Feather name="camera" size={10} color={colors.primary} />
                    <Text style={styles.metaPillText}>
                      {totalScansForCtrl} scans
                    </Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Feather name="clock" size={10} color={colors.textMuted} />
                    <Text style={styles.metaPillText}>
                      {formatRelative(lastAt)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    ctrl.is_active ? styles.activeBadge : styles.inactiveBadge,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: ctrl.is_active
                          ? colors.success
                          : colors.textMuted,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: ctrl.is_active
                          ? colors.success
                          : colors.textMuted,
                      },
                    ]}
                  >
                    {ctrl.is_active ? "Actif" : "Désactivé"}
                  </Text>
                </View>
              </View>

              {ctrl.is_active ? (
                <TouchableOpacity
                  style={styles.kebabBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeactivate(ctrl);
                  }}
                  activeOpacity={0.7}
                  hitSlop={8}
                >
                  <Feather name="user-x" size={16} color={colors.error} />
                </TouchableOpacity>
              ) : (
                <Feather
                  name="chevron-right"
                  size={20}
                  color={colors.textMuted}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FAB */}
      {!isFull && !loading ? (
        <Animated.View
          style={[
            styles.fabContainer,
            { width: fabWidth, bottom: insets.bottom + spacing.lg },
          ]}
        >
          <AnimatedTouchable
            style={[styles.fabButton, { paddingHorizontal: fabPadding }]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowCreate(true);
            }}
            activeOpacity={0.9}
          >
            <Animated.View
              style={[
                styles.fabTextWrap,
                {
                  width: fabTextWidth,
                  opacity: fabTextOpacity,
                  marginRight: fabTextMargin,
                },
              ]}
            >
              <Text style={styles.fabText} numberOfLines={1}>
                Ajouter contrôleur
              </Text>
            </Animated.View>
            <View style={styles.fabCircle}>
              <Feather name="plus" size={16} color={colors.primary} />
            </View>
          </AnimatedTouchable>
        </Animated.View>
      ) : null}

      {/* BOTTOM SHEET CRÉATION */}
      <Modal
        visible={showCreate}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeCreateModal}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeCreateModal}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Nouveau contrôleur</Text>
                <Text style={styles.sheetSubtitle}>
                  Un identifiant unique sera généré automatiquement
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeCreateModal}
                style={styles.closeBtn}
                hitSlop={12}
              >
                <Feather name="x" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={styles.sheetContent}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              showsVerticalScrollIndicator={false}
            >
              {createError ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{createError}</Text>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nom du contrôleur</Text>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIcon}>
                    <Feather
                      name="user"
                      size={iconSize.sm}
                      color={colors.textMuted}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex : Jean Kabasele"
                    placeholderTextColor={colors.textMuted}
                    value={newName}
                    onChangeText={setNewName}
                    editable={!creating}
                    autoFocus
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleCreate}
                  />
                </View>
                <Text style={styles.hint}>
                  Un nom d'utilisateur et un mot de passe temporaire seront
                  générés. Transmettez-les au contrôleur.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, creating && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={creating}
                activeOpacity={0.85}
              >
                {creating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Feather name="plus" size={18} color="#FFF" />
                    <Text style={styles.primaryText}>Créer le contrôleur</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL LIMITE */}
      <Modal
        visible={showLimit}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => !savingLimit && setShowLimit(false)}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => !savingLimit && setShowLimit(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Limite de contrôleurs</Text>
                <Text style={styles.sheetSubtitle}>
                  Nombre maximum pouvant être assignés à cet événement
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => !savingLimit && setShowLimit(false)}
                style={styles.closeBtn}
                hitSlop={12}
              >
                <Feather name="x" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: spacing.xl,
              }}
            >
              {limitError ? (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{limitError}</Text>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nombre maximum (1 à 50)</Text>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIcon}>
                    <Feather
                      name="users"
                      size={iconSize.sm}
                      color={colors.textMuted}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="3"
                    placeholderTextColor={colors.textMuted}
                    value={limitValue}
                    onChangeText={setLimitValue}
                    editable={!savingLimit}
                    keyboardType="number-pad"
                    autoFocus
                    maxLength={2}
                  />
                </View>
                <Text style={styles.hint}>
                  Actuellement : {data?.current_count ?? 0} contrôleur(s)
                  assigné(s). Vous ne pouvez pas descendre en dessous.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, savingLimit && { opacity: 0.6 }]}
                onPress={handleSaveLimit}
                disabled={savingLimit}
                activeOpacity={0.85}
              >
                {savingLimit ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Feather name="check" size={18} color="#FFF" />
                    <Text style={styles.primaryText}>Enregistrer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL CREDENTIALS */}
      <Modal
        visible={!!credentials}
        transparent
        animationType="fade"
        onRequestClose={() => setCredentials(null)}
      >
        <View style={styles.centerOverlay}>
          <View style={styles.credentialsCard}>
            <View style={styles.successIconCircle}>
              <Feather name="check" size={30} color="#FFF" />
            </View>
            <Text style={styles.credentialsTitle}>Contrôleur créé</Text>
            <Text style={styles.credentialsSubtitle}>
              Transmettez ces identifiants à{" "}
              <Text style={{ fontWeight: fontWeight.bold }}>
                {credentials?.name}
              </Text>{" "}
              par un canal sécurisé (WhatsApp, oralement…).
            </Text>

            <View style={styles.warningBanner}>
              <Feather name="alert-triangle" size={16} color={colors.warning} />
              <Text style={styles.warningText}>
                Ce mot de passe ne sera plus jamais affiché.
              </Text>
            </View>

            <View style={styles.credentialsBox}>
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>Événement</Text>
                <Text style={styles.credValue} numberOfLines={1}>
                  {credentials?.eventName}
                </Text>
              </View>
              <View style={styles.credDivider} />
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>Code événement</Text>
                <Text style={[styles.credValue, styles.credMono]}>
                  {credentials?.eventCode}
                </Text>
              </View>
              <View style={styles.credDivider} />
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>Nom d'utilisateur</Text>
                <Text style={[styles.credValue, styles.credMono]}>
                  {credentials?.username}
                </Text>
              </View>
              <View style={styles.credDivider} />
              <View style={styles.credRow}>
                <Text style={styles.credLabel}>Mot de passe</Text>
                <Text style={[styles.credValue, styles.credMono]}>
                  {credentials?.temp_password}
                </Text>
              </View>
            </View>

            <View style={styles.credentialsActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleCopy}
                activeOpacity={0.85}
              >
                <Feather name="copy" size={16} color={colors.primary} />
                <Text style={styles.actionBtnText}>Copier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleShare}
                activeOpacity={0.85}
              >
                <Feather name="share-2" size={16} color={colors.primary} />
                <Text style={styles.actionBtnText}>Partager</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setCredentials(null)}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>J'ai bien noté</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ✅ NOUVEAU — Modale d'upgrade */}
      <UpgradeModal
        visible={upgradeModal.visible}
        onClose={() => setUpgradeModal({ visible: false })}
        message={upgradeModal.message}
        featureName="Ajouter un contrôleur"
        currentPlan={currentPlan}
        recommendedPlan="premium"
      />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: { color: colors.textSecondary, fontSize: fontSize.sm },

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
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center",
  },

  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  summaryTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    ...shadows.sm,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  counterText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  limitBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeFull: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeFullText: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.bold,
  },

  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },

  emptyBox: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    ...shadows.md,
  },
  emptyBtnText: {
    color: "#FFF",
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  cardName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  cardUsername: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardMetaRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: "wrap",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  metaPillText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
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
  kebabBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.errorSoft,
    justifyContent: "center",
    alignItems: "center",
  },

  fabContainer: {
    position: "absolute",
    right: spacing.lg,
  },
  fabButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    ...shadows.lg,
  },
  fabTextWrap: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  fabText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  fabCircle: {
    width: 40,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: "92%",
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  sheetSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  fieldGroup: { marginBottom: spacing.base },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    paddingVertical: 0,
    height: "100%",
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 16,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    ...shadows.md,
  },
  primaryText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },

  centerOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  credentialsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 500,
    alignItems: "center",
    ...shadows.lg,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  credentialsTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  credentialsSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    width: "100%",
  },
  warningText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: "#92400E",
    fontWeight: fontWeight.bold,
  },
  credentialsBox: {
    width: "100%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  credRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  credLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  credValue: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.bold,
    flexShrink: 1,
    textAlign: "right",
  },
  credMono: { letterSpacing: 0.5 },
  credDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  credentialsActions: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
    marginBottom: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  actionBtnText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },
  doneBtn: {
    width: "100%",
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    alignItems: "center",
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  doneBtnText: {
    color: "#FFF",
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
});
