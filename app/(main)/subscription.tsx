// app/(main)/subscription.tsx
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
    initiatePayment,
    PlanId,
    PLANS,
    pollPaymentStatus,
    Telecom,
    TELECOMS
} from "../../src/api/payments";
import { getProfile } from "../../src/api/profile";
import { useAuthStore } from "../../src/stores/auth.store";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    radius,
    shadows,
    spacing,
} from "../../src/theme/tokens";

type Step = "plans" | "checkout" | "pending" | "result";

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();

  const [step, setStep] = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);

  // Checkout
  const [phone, setPhone] = useState("");
  const [telecom, setTelecom] = useState<Telecom>("OM");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Paiement
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState(
    "En attente de confirmation sur votre téléphone…",
  );
  const [polling, setPolling] = useState(false);
  const [result, setResult] = useState<{
    status: "success" | "failed" | "timeout";
    message: string;
  } | null>(null);

  const pollingCancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ─── Détection premium ───
  const profile = user?.profile || {};
  const isPremium =
    profile?.can_create_unlimited_events === true ||
    user?.can_create_unlimited_events === true;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // ─── Sélection d'un plan ───
  const handleSelectPlan = (planId: PlanId) => {
    Haptics.selectionAsync();
    setSelectedPlan(planId);
    setStep("checkout");
  };

  // ─── Validation téléphone ───
  const validatePhone = (value: string): boolean => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length < 9) {
      setPhoneError("Numéro invalide (9 chiffres minimum).");
      return false;
    }
    setPhoneError(null);
    return true;
  };

  // ─── Initier le paiement ───
  const handleCheckout = async () => {
    if (!selectedPlan) return;
    if (!validatePhone(phone)) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await initiatePayment({
        plan_id: selectedPlan,
        phone: phone.replace(/\s/g, ""),
        telecom,
      });

      setSessionId(res.session_id);
      setPendingMessage(
        res.message || "En attente de confirmation sur votre téléphone…",
      );
      setStep("pending");
      startPolling(res.session_id);
    } catch (err: any) {
      const body = err?.response?.data || {};
      const msg =
        body.error || body.detail || "Impossible d'initier le paiement.";
      Toast.show({ type: "error", text1: "Erreur", text2: msg });
    }
  };

  // ─── Polling ───
  const startPolling = (sid: string) => {
    setPolling(true);
    pollingCancelRef.current = { cancelled: false };

    pollPaymentStatus(sid, {
      intervalMs: 3000,
      timeoutMs: 5 * 60 * 1000,
      onUpdate: (s) => {
        if (s.status === "pending") {
          setPendingMessage("Toujours en attente de confirmation…");
        }
      },
    })
      .then(async (status) => {
        if (pollingCancelRef.current.cancelled) return;
        setPolling(false);

        if (status.status === "success") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Rafraîchit le user pour récupérer le nouveau statut premium
          try {
            const fresh = await getProfile();
            if (fresh) setUser(fresh);
          } catch {}

          setResult({
            status: "success",
            message:
              "Votre abonnement est maintenant actif. Profitez de toutes les fonctionnalités !",
          });
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setResult({
            status: "failed",
            message:
              "Le paiement a échoué ou a été annulé. Aucun montant n'a été débité.",
          });
        }
        setStep("result");
      })
      .catch((err) => {
        if (pollingCancelRef.current.cancelled) return;
        setPolling(false);
        setResult({
          status: "timeout",
          message:
            "Nous n'avons pas reçu la confirmation. Vérifiez votre téléphone ou réessayez dans quelques minutes.",
        });
        setStep("result");
      });
  };

  // ─── Annulation ───
  const handleCancelPolling = () => {
    pollingCancelRef.current.cancelled = true;
    setPolling(false);
    setStep("checkout");
  };

  // ─── Retour à la liste ───
  const handleBackToPlans = () => {
    setResult(null);
    setSessionId(null);
    setSelectedPlan(null);
    setStep("plans");
  };

  // ─── Fermeture ───
  const handleClose = () => {
    pollingCancelRef.current.cancelled = true;
    router.back();
  };

  // ─── Plan courant pour l'affichage ───
  const currentPlan = PLANS.find((p) => p.id === selectedPlan);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Abonnement</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {step === "plans"
              ? "Choisissez votre plan"
              : step === "checkout"
                ? "Finalisez le paiement"
                : step === "pending"
                  ? "En attente de confirmation"
                  : "Résultat du paiement"}
          </Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {/* CONTENU */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* ═══════════════ ÉTAPE 1 : PLANS ═══════════════ */}
        {step === "plans" ? (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + spacing.xxl },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Bannière Premium actif */}
            {isPremium ? (
              <View style={styles.premiumBanner}>
                <View style={styles.premiumBannerIcon}>
                  <Feather name="check-circle" size={22} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.premiumBannerTitle}>
                    Abonnement actif
                  </Text>
                  <Text style={styles.premiumBannerText}>
                    Vous avez accès à toutes les fonctionnalités premium
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.introCard}>
                <Feather name="zap" size={20} color={colors.warning} />
                <Text style={styles.introText}>
                  Choisissez un plan pour débloquer les fonctionnalités
                  illimitées.
                </Text>
              </View>
            )}

            {/* Plans */}
            {PLANS.map((plan) => {
              const active = plan.popular;
              return (
                <View
                  key={plan.id}
                  style={[
                    styles.planCard,
                    { borderColor: plan.color + "30" },
                    active && {
                      borderColor: plan.color,
                      borderWidth: 2,
                    },
                  ]}
                >
                  {active ? (
                    <View
                      style={[
                        styles.popularBadge,
                        { backgroundColor: plan.color },
                      ]}
                    >
                      <Text style={styles.popularText}>⭐ Populaire</Text>
                    </View>
                  ) : null}

                  <View style={styles.planHeader}>
                    <View
                      style={[
                        styles.planIcon,
                        { backgroundColor: plan.color + "15" },
                      ]}
                    >
                      <Feather
                        name={plan.icon as any}
                        size={22}
                        color={plan.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planName, { color: plan.color }]}>
                        {plan.name}
                      </Text>
                      <Text style={styles.planDescription}>
                        {plan.description}
                      </Text>
                    </View>
                    <View style={styles.planRight}>
                      <Text style={[styles.planPrice, { color: plan.color }]}>
                        ${plan.price}
                      </Text>
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                  </View>

                  <View style={styles.features}>
                    {plan.features.map((f, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Feather
                          name="check-circle"
                          size={16}
                          color={plan.color}
                        />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[styles.chooseBtn, { backgroundColor: plan.color }]}
                    onPress={() => handleSelectPlan(plan.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.chooseBtnText}>
                      Choisir {plan.name}
                    </Text>
                    <Feather name="arrow-right" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Note */}
            <View style={styles.noteRow}>
              <Feather name="lock" size={12} color={colors.textMuted} />
              <Text style={styles.noteText}>
                Paiement sécurisé via SerdiPay. Annulation à tout moment.
              </Text>
            </View>
          </ScrollView>
        ) : null}

        {/* ═══════════════ ÉTAPE 2 : CHECKOUT ═══════════════ */}
        {step === "checkout" && currentPlan ? (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + spacing.xxl },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Récap plan */}
              <View
                style={[
                  styles.summaryCard,
                  { borderColor: currentPlan.color + "30" },
                ]}
              >
                <View
                  style={[
                    styles.summaryIcon,
                    { backgroundColor: currentPlan.color + "15" },
                  ]}
                >
                  <Feather
                    name={currentPlan.icon as any}
                    size={22}
                    color={currentPlan.color}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.summaryPlanName,
                      { color: currentPlan.color },
                    ]}
                  >
                    Plan {currentPlan.name}
                  </Text>
                  <Text style={styles.summaryPlanDesc}>
                    {currentPlan.description}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={[styles.summaryPrice, { color: currentPlan.color }]}
                  >
                    ${currentPlan.price}
                  </Text>
                  <Text style={styles.summaryPeriod}>{currentPlan.period}</Text>
                </View>
              </View>

              {/* Opérateur */}
              <Text style={styles.sectionLabel}>Opérateur mobile</Text>
              <View style={styles.telecomGrid}>
                {TELECOMS.map((t) => {
                  const active = telecom === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[
                        styles.telecomCard,
                        active && {
                          borderColor: t.color,
                          borderWidth: 2,
                          backgroundColor: t.color + "10",
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setTelecom(t.id);
                      }}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.telecomDot,
                          { backgroundColor: t.color },
                        ]}
                      >
                        <Text style={styles.telecomDotText}>{t.short}</Text>
                      </View>
                      <Text
                        style={[
                          styles.telecomName,
                          active && { color: t.color, fontWeight: "700" },
                        ]}
                        numberOfLines={1}
                      >
                        {t.name}
                      </Text>
                      {active ? (
                        <View
                          style={[
                            styles.telecomCheck,
                            { backgroundColor: t.color },
                          ]}
                        >
                          <Feather name="check" size={10} color="#FFF" />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Téléphone */}
              <Text style={styles.sectionLabel}>Numéro de téléphone</Text>
              <View
                style={[
                  styles.phoneInput,
                  phoneError && { borderColor: colors.error },
                ]}
              >
                <View style={styles.phoneIcon}>
                  <Feather
                    name="phone"
                    size={iconSize.sm}
                    color={phoneError ? colors.error : colors.textMuted}
                  />
                </View>
                <TextInput
                  style={styles.phoneText}
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    if (phoneError) setPhoneError(null);
                  }}
                  placeholder="+243 81 23 45 67"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />
              </View>
              {phoneError ? (
                <Text style={styles.errorHint}>{phoneError}</Text>
              ) : (
                <Text style={styles.hint}>
                  Un message USSD sera envoyé sur ce numéro pour confirmation.
                </Text>
              )}

              {/* Bouton */}
              <TouchableOpacity
                style={[styles.payBtn, { backgroundColor: currentPlan.color }]}
                onPress={handleCheckout}
                activeOpacity={0.85}
              >
                <Feather name="lock" size={16} color="#FFF" />
                <Text style={styles.payBtnText}>
                  Payer ${currentPlan.price}
                </Text>
              </TouchableOpacity>

              {/* Retour */}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setStep("plans")}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryBtnText}>Changer de plan</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        ) : null}
      </Animated.View>

      {/* ═══════════════ MODAL PENDING ═══════════════ */}
      <Modal
        visible={step === "pending"}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCancelPolling}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIconCircle,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>

            <Text style={styles.modalTitle}>En attente de confirmation</Text>
            <Text style={styles.modalMessage}>{pendingMessage}</Text>

            <View style={styles.pendingSteps}>
              <View style={styles.pendingStep}>
                <View style={styles.pendingStepNum}>
                  <Text style={styles.pendingStepNumText}>1</Text>
                </View>
                <Text style={styles.pendingStepText}>
                  Regardez votre téléphone
                </Text>
              </View>
              <View style={styles.pendingStep}>
                <View style={styles.pendingStepNum}>
                  <Text style={styles.pendingStepNumText}>2</Text>
                </View>
                <Text style={styles.pendingStepText}>
                  Validez le paiement avec votre code
                </Text>
              </View>
              <View style={styles.pendingStep}>
                <View style={styles.pendingStepNum}>
                  <Text style={styles.pendingStepNumText}>3</Text>
                </View>
                <Text style={styles.pendingStepText}>
                  Revenez sur cette page
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancelPolling}
              activeOpacity={0.85}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══════════════ MODAL RÉSULTAT ═══════════════ */}
      <Modal
        visible={step === "result"}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleBackToPlans}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {result?.status === "success" ? (
              <>
                <View
                  style={[
                    styles.modalIconCircle,
                    { backgroundColor: colors.successSoft },
                  ]}
                >
                  <Feather
                    name="check-circle"
                    size={38}
                    color={colors.success}
                  />
                </View>
                <Text style={styles.modalTitle}>Paiement réussi</Text>
                <Text style={styles.modalMessage}>{result.message}</Text>

                <TouchableOpacity
                  style={[
                    styles.modalPrimaryBtn,
                    { backgroundColor: colors.success },
                  ]}
                  onPress={handleClose}
                  activeOpacity={0.85}
                >
                  <Feather name="check" size={16} color="#FFF" />
                  <Text style={styles.modalPrimaryBtnText}>C'est parti !</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.modalIconCircle,
                    { backgroundColor: colors.errorSoft },
                  ]}
                >
                  <Feather name="alert-circle" size={38} color={colors.error} />
                </View>
                <Text style={styles.modalTitle}>
                  {result?.status === "timeout"
                    ? "Confirmation en retard"
                    : "Paiement échoué"}
                </Text>
                <Text style={styles.modalMessage}>{result?.message}</Text>

                <TouchableOpacity
                  style={[
                    styles.modalPrimaryBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleBackToPlans}
                  activeOpacity={0.85}
                >
                  <Feather name="refresh-cw" size={16} color="#FFF" />
                  <Text style={styles.modalPrimaryBtnText}>Réessayer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSecondaryBtn}
                  onPress={handleClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalSecondaryBtnText}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
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
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center",
  },

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // ─── Premium banner ───
  premiumBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.success + "30",
    marginBottom: spacing.lg,
  },
  premiumBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  premiumBannerTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  premiumBannerText: {
    fontSize: fontSize.xs,
    color: colors.success,
    marginTop: 2,
  },

  // ─── Intro ───
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  introText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.warning,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },

  // ─── Plan card ───
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    ...shadows.sm,
  },
  popularBadge: {
    position: "absolute",
    top: -1,
    right: -1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: radius.md,
    borderTopRightRadius: radius.xl,
  },
  popularText: {
    color: "#FFF",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  planName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
  },
  planDescription: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  planRight: { alignItems: "flex-end" },
  planPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
  },
  planPeriod: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
  features: {
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  chooseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  chooseBtnText: {
    color: "#FFF",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  noteText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },

  // ─── Checkout ───
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryPlanName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  summaryPlanDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
  },
  summaryPeriod: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  telecomGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  telecomCard: {
    flexBasis: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  telecomDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  telecomDotText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
  },
  telecomName: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  telecomCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },

  phoneInput: {
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
  phoneIcon: { marginRight: spacing.sm },
  phoneText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    paddingVertical: 0,
    height: "100%",
  },
  errorHint: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
    paddingHorizontal: spacing.sm,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  payBtnText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  secondaryBtn: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  secondaryBtnText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },

  // ─── Modales ───
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...shadows.lg,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  modalMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },

  pendingSteps: {
    width: "100%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pendingStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  pendingStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  pendingStepNumText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "800",
  },
  pendingStepText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  cancelBtn: {
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },

  modalPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    width: "100%",
    ...shadows.md,
  },
  modalPrimaryBtnText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  modalSecondaryBtn: {
    width: "100%",
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  modalSecondaryBtnText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
});
