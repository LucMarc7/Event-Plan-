// app/(auth)/verify-email.tsx
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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
import { resendVerificationCode, verifyEmail } from "../../src/api/auth";
import { STORAGE_KEYS } from "../../src/api/endpoints";
import { useAuthStore } from "../../src/stores/auth.store";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing
} from "../../src/theme/tokens";

const RESEND_COOLDOWN = 60; // secondes
const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email || "").toString().trim().toLowerCase();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resend
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const codeInputRef = useRef<TextInput>(null);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // ─── Animation d'entrée ───
  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 400,
      delay: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  // ─── Auto-focus du champ code ───
  useEffect(() => {
    const t = setTimeout(() => codeInputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  // ─── Timer du renvoi ───
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // ─── Sécurité : si pas d'email, retour login ───
  useEffect(() => {
    if (!email) {
      router.replace("/(auth)/login");
    }
  }, [email]);

  // ─── Effacer l'erreur dès que l'utilisateur retape ───
  useEffect(() => {
    setError(null);
  }, [code]);

  // ═══════════════════════════════════════════════════════════
  // VÉRIFICATION
  // ═══════════════════════════════════════════════════════════
  const handleVerify = async () => {
    if (code.length !== CODE_LENGTH) {
      setError(`Entrez les ${CODE_LENGTH} chiffres du code.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await verifyEmail(email, code);

      // Persister les tokens + user
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, res.access);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, res.refresh);
      await SecureStore.setItemAsync(
        STORAGE_KEYS.AUTH_USER,
        JSON.stringify(res.user),
      );

      // Mettre à jour le store
      try {
        useAuthStore.getState().setUser(res.user);
        useAuthStore.getState().setToken(res.access);
      } catch (e) {
        console.warn("[verify-email] Impossible de mettre à jour le store:", e);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMsg("Compte vérifié ! Redirection…");

      setTimeout(() => {
        router.replace("/(auth)/choose-plan");
      }, 700);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Impossible de vérifier le code. Réessayez.";
      setError(msg);
      setCode("");
      codeInputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENVOI DU CODE
  // ═══════════════════════════════════════════════════════════
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await resendVerificationCode(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessMsg("Un nouveau code vous a été envoyé.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      // Même message neutre qu'en succès (anti-énumération)
      setSuccessMsg("Un nouveau code vous a été envoyé.");
      setCooldown(RESEND_COOLDOWN);
    } finally {
      setResending(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.replace("/(auth)/login")}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vérification</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* BRANDING */}
          <Animated.View
            style={[styles.brandBlock, { opacity: contentOpacity }]}
          >
            <View style={styles.brandBadge}>
              <Feather name="mail" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>Vérifiez votre email</Text>
            <Text style={styles.brandSubtitle}>
              Nous avons envoyé un code à 6 chiffres à
            </Text>
            <Text style={styles.emailText} numberOfLines={1}>
              {email}
            </Text>
          </Animated.View>

          {/* CARD */}
          <Animated.View style={[styles.card, { opacity: contentOpacity }]}>
            <Text style={styles.cardTitle}>Code de vérification</Text>
            <Text style={styles.cardSubtitle}>
              Saisissez le code reçu par email pour activer votre compte
            </Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBanner}>
                <Feather name="check-circle" size={16} color={colors.success} />
                <Text style={styles.successBannerText}>{successMsg}</Text>
              </View>
            ) : null}

            {/* INPUT CODE */}
            <View style={styles.codeWrap}>
              <TextInput
                ref={codeInputRef}
                style={styles.codeInput}
                value={code}
                onChangeText={(t) =>
                  setCode(t.replace(/\D/g, "").slice(0, CODE_LENGTH))
                }
                keyboardType="number-pad"
                maxLength={CODE_LENGTH}
                editable={!loading && !successMsg}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                caretHidden={false}
                selectionColor={colors.primary}
              />
            </View>

            <Text style={styles.hint}>Le code est valable 15 minutes.</Text>

            {/* BOUTON VÉRIFIER */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                (loading || code.length !== CODE_LENGTH) && { opacity: 0.5 },
              ]}
              onPress={handleVerify}
              disabled={loading || code.length !== CODE_LENGTH}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.primaryText}>Vérifier</Text>
                  <Feather name="check" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>

            {/* RENVOI */}
            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Vous n'avez rien reçu ?</Text>
              <TouchableOpacity
                onPress={handleResend}
                disabled={cooldown > 0 || resending}
                activeOpacity={0.7}
              >
                {resending ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text
                    style={[
                      styles.resendLink,
                      cooldown > 0 && { color: colors.textMuted },
                    ]}
                  >
                    {cooldown > 0
                      ? `Renvoyer dans ${cooldown}s`
                      : "Renvoyer le code"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* INFO */}
          <Animated.View style={[styles.infoBox, { opacity: contentOpacity }]}>
            <Feather name="shield" size={16} color={colors.success} />
            <Text style={styles.infoText}>
              Vérifiez aussi vos spams. Le code peut prendre quelques instants à
              arriver.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: colors.bg,
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
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexGrow: 1,
  },

  brandBlock: { alignItems: "center", marginBottom: spacing.xl },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  brandSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  emailText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
    textAlign: "center",
    paddingHorizontal: spacing.base,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorBannerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.semibold,
  },

  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  successBannerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.semibold,
  },

  codeWrap: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  codeInput: {
    fontSize: 32,
    letterSpacing: 12,
    textAlign: "center",
    color: colors.text,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: fontWeight.extrabold,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.lg,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    ...shadows.md,
  },
  primaryText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },

  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.base,
  },
  resendText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    marginLeft: spacing.xs,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.success,
    lineHeight: 16,
    fontWeight: fontWeight.medium,
  },
});
