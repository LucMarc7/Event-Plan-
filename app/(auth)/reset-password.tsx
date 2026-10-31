// app/(auth)/reset-password.tsx
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { resetPassword } from "../../src/api/auth";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    radius,
    shadows,
    spacing,
} from "../../src/theme/tokens";

type ScreenState = "form" | "success" | "error";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ uid?: string; token?: string }>();

  const uid = (params.uid || "").toString().trim();
  const token = (params.token || "").toString().trim();

  const [state, setState] = useState<ScreenState>("form");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const contentOpacity = useRef(new Animated.Value(0)).current;

  // ─── Sécurité : si uid ou token manquant → état erreur ───
  useEffect(() => {
    if (!uid || !token) {
      setState("error");
      setErrorMsg("Lien invalide ou incomplet.");
    }
  }, [uid, token]);

  // ─── Animation d'entrée ───
  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 400,
      delay: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  // ─── Soumission ───
  const handleSubmit = async () => {
    setErrorMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(uid, token, {
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setState("success");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const body = err?.response?.data || {};
      const msg =
        (Array.isArray(body.non_field_errors) && body.non_field_errors[0]) ||
        (Array.isArray(body.new_password) && body.new_password[0]) ||
        (Array.isArray(body.confirm_password) && body.confirm_password[0]) ||
        body.detail ||
        body.error ||
        "Ce lien est invalide ou a expiré.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDU : SUCCÈS
  // ═══════════════════════════════════════════════════════════
  if (state === "success") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Animated.View
            style={[styles.successCard, { opacity: contentOpacity }]}
          >
            <View style={styles.successIconCircle}>
              <Feather name="check" size={38} color="#FFF" />
            </View>
            <Text style={styles.successTitle}>Mot de passe modifié</Text>
            <Text style={styles.successMessage}>
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez
              maintenant vous connecter à Event Plan.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.replace("/(auth)/login")}
              activeOpacity={0.85}
            >
              <Feather name="log-in" size={18} color="#FFF" />
              <Text style={styles.primaryText}>Se connecter</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDU : ERREUR
  // ═══════════════════════════════════════════════════════════
  if (state === "error") {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Animated.View
            style={[styles.successCard, { opacity: contentOpacity }]}
          >
            <View
              style={[
                styles.successIconCircle,
                { backgroundColor: colors.error },
              ]}
            >
              <Feather name="alert-circle" size={38} color="#FFF" />
            </View>
            <Text style={[styles.successTitle, { color: colors.error }]}>
              Lien invalide
            </Text>
            <Text style={styles.successMessage}>
              {errorMsg || "Ce lien est invalide ou a expiré."}
              {"\n\n"}
              Retournez dans l‘application Event Plan et cliquez à nouveau sur «
              Mot de passe oublié ? » pour recevoir un nouveau lien.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.replace("/(auth)/login")}
              activeOpacity={0.85}
            >
              <Feather name="arrow-left" size={18} color="#FFF" />
              <Text style={styles.primaryText}>Retour à la connexion</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDU : FORMULAIRE
  // ═══════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerBtn} />
        <Text style={styles.headerTitle}>Réinitialisation</Text>
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
              <Feather name="key" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>Nouveau mot de passe</Text>
            <Text style={styles.brandSubtitle}>
              Choisissez un mot de passe sécurisé pour votre compte
            </Text>
          </Animated.View>

          {/* CARD */}
          <Animated.View style={[styles.card, { opacity: contentOpacity }]}>
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Nouveau mot de passe */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <View style={styles.inputWrap}>
                <View style={styles.inputIcon}>
                  <Feather
                    name="lock"
                    size={iconSize.sm}
                    color={colors.textMuted}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => setShowPwd((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={10}
                >
                  <Feather
                    name={showPwd ? "eye-off" : "eye"}
                    size={iconSize.sm}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Minimum 8 caractères</Text>
            </View>

            {/* Confirmation */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={styles.inputWrap}>
                <View style={styles.inputIcon}>
                  <Feather
                    name="lock"
                    size={iconSize.sm}
                    color={colors.textMuted}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPwd2}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  onPress={() => setShowPwd2((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={10}
                >
                  <Feather
                    name={showPwd2 ? "eye-off" : "eye"}
                    size={iconSize.sm}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bouton */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#FFF" />
                  <Text style={styles.primaryText}>
                    Réinitialiser mon mot de passe
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* INFO */}
          <Animated.View style={[styles.infoBox, { opacity: contentOpacity }]}>
            <Feather name="shield" size={16} color={colors.success} />
            <Text style={styles.infoText}>
              Une fois validé, votre ancien mot de passe ne fonctionnera plus.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    padding: spacing.lg,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg,
  },
  headerBtn: { width: 40, height: 40 },
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
    paddingHorizontal: spacing.base,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
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
    paddingRight: spacing.sm,
  },
  inputIcon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    paddingVertical: 0,
    height: "100%",
  },
  eyeBtn: {
    paddingHorizontal: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    marginTop: spacing.sm,
    ...shadows.md,
  },
  primaryText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
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

  successCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...shadows.lg,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  successMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
});
