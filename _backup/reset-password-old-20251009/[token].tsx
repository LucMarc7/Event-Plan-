// app/(auth)/reset-password/[uid]/[token].tsx
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resetPassword } from "../../../src/api/auth";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    radius,
    shadows,
    spacing,
} from "../../../src/theme/tokens";

const HEADER_HEIGHT = 60;

// ═══════════════════════════════════════════════════════════════
// RESULT MODAL
// ═══════════════════════════════════════════════════════════════
type ModalStatus = "loading" | "success" | "error";

const ResultModal = ({
  visible,
  status,
  title,
  message,
  onSuccess,
}: {
  visible: boolean;
  status: ModalStatus;
  title: string;
  message: string;
  onSuccess?: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, status]);

  const variantColor =
    status === "success"
      ? colors.success
      : status === "error"
        ? colors.error
        : colors.primary;

  const variantBg =
    status === "success"
      ? colors.successSoft
      : status === "error"
        ? colors.errorSoft
        : colors.primarySoft;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={modalStyles.overlay}>
        <Animated.View
          style={[
            modalStyles.card,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <View
            style={[modalStyles.iconCircle, { backgroundColor: variantBg }]}
          >
            {status === "loading" ? (
              <ActivityIndicator size="large" color={variantColor} />
            ) : status === "success" ? (
              <Feather name="check-circle" size={38} color={variantColor} />
            ) : (
              <Feather name="alert-circle" size={38} color={variantColor} />
            )}
          </View>

          <Text style={modalStyles.title}>{title}</Text>
          <Text style={modalStyles.message}>{message}</Text>

          {status === "success" && onSuccess ? (
            <TouchableOpacity
              style={modalStyles.successBtn}
              onPress={onSuccess}
              activeOpacity={0.85}
            >
              <Text style={modalStyles.successBtnText}>
                Se connecter maintenant
              </Text>
              <Feather name="log-in" size={16} color="#FFF" />
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    ...shadows.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  successBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    width: "100%",
    ...shadows.md,
  },
  successBtnText: {
    color: "#FFF",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});

// ═══════════════════════════════════════════════════════════════
// PARSING ERREURS
// ═══════════════════════════════════════════════════════════════
const parseResetError = (err: any): string => {
  if (!err?.response) return "Connexion internet requise.";

  const status = err.response.status;
  const data = err.response.data;

  if (typeof data === "string" && data.includes("<html")) {
    return `Erreur serveur (${status}). Réessayez plus tard.`;
  }

  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.error === "string") return data.error;
    if (typeof data.new_password?.[0] === "string") return data.new_password[0];
    if (typeof data.confirm_password?.[0] === "string")
      return data.confirm_password[0];
    if (typeof data.token?.[0] === "string") return data.token[0];
    if (Array.isArray(data.non_field_errors) && data.non_field_errors[0])
      return data.non_field_errors[0];
  }

  if (status === 400) return "Lien invalide ou expiré. Refaites la demande.";
  if (status === 404) return "Lien introuvable. Vérifiez le lien reçu.";
  if (status === 410) return "Lien expiré. Refaites la demande.";
  if (status >= 500) return `Erreur serveur (${status}). Réessayez.`;

  return `Erreur inattendue (${status}).`;
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ uid: string; token: string }>();
  const uid = String(params?.uid || "");
  const token = String(params?.token || "");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const [modal, setModal] = useState<{
    visible: boolean;
    status: ModalStatus;
    title: string;
    message: string;
  }>({
    visible: false,
    status: "loading",
    title: "",
    message: "",
  });

  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 400,
      delay: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    setFieldErrors({});
  }, [password, confirm]);

  const strength = useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthLabel =
    ["Très faible", "Faible", "Moyen", "Bon", "Fort", "Excellent"][strength] ||
    "";

  const strengthColor =
    strength <= 1
      ? colors.error
      : strength <= 3
        ? colors.warning
        : colors.success;

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (!uid || !token) {
      errors.global = "Lien invalide. Le uid ou le token est manquant.";
    }
    if (password.length < 8) {
      errors.password = "8 caractères minimum.";
    } else if (!/[A-Z]/.test(password) || !/\d/.test(password)) {
      errors.password = "1 majuscule et 1 chiffre minimum.";
    }
    if (!confirm) {
      errors.confirm = "Confirmez votre mot de passe.";
    } else if (password !== confirm) {
      errors.confirm = "Les mots de passe ne correspondent pas.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setModal({
      visible: true,
      status: "loading",
      title: "Réinitialisation",
      message: "Application du nouveau mot de passe…",
    });

    setLoading(true);
    try {
      await resetPassword(uid, token, {
        new_password: password,
        confirm_password: confirm,
      });

      setModal({
        visible: true,
        status: "success",
        title: "Mot de passe modifié",
        message:
          "Votre nouveau mot de passe a été enregistré. Connectez-vous dès maintenant.",
      });
    } catch (err: any) {
      setModal({
        visible: true,
        status: "error",
        title: "Échec",
        message: parseResetError(err),
      });

      setTimeout(() => {
        setModal((m) => ({ ...m, visible: false }));
      }, 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.replace("/(auth)/login")}
          activeOpacity={0.7}
        >
          <Feather name="x" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau mot de passe</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? insets.top + HEADER_HEIGHT : 0
        }
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[styles.brandBlock, { opacity: contentOpacity }]}
          >
            <View style={styles.brandBadge}>
              <Feather name="lock" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>Nouveau mot de passe</Text>
            <Text style={styles.brandSubtitle}>
              Choisissez un mot de passe sécurisé pour protéger votre compte
            </Text>
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: contentOpacity }]}>
            {fieldErrors.global ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorBannerText}>{fieldErrors.global}</Text>
              </View>
            ) : null}

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <View
                style={[
                  styles.inputWrap,
                  fieldErrors.password && styles.inputWrapError,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Feather
                    name="lock"
                    size={iconSize.sm}
                    color={
                      fieldErrors.password ? colors.error : colors.textMuted
                    }
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={10}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={iconSize.sm}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.password ? (
                <Text style={styles.errorHint}>{fieldErrors.password}</Text>
              ) : null}
            </View>

            {/* Strength */}
            {password ? (
              <View style={styles.strengthWrap}>
                <View style={styles.barsRow}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.bar,
                        {
                          backgroundColor:
                            i < strength ? strengthColor : colors.borderLight,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                  {strengthLabel}
                </Text>
              </View>
            ) : null}

            {/* Confirm */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View
                style={[
                  styles.inputWrap,
                  fieldErrors.confirm && styles.inputWrapError,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Feather
                    name="lock"
                    size={iconSize.sm}
                    color={
                      fieldErrors.confirm ? colors.error : colors.textMuted
                    }
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm((v) => !v)}
                  style={styles.eyeBtn}
                  hitSlop={10}
                >
                  <Feather
                    name={showConfirm ? "eye-off" : "eye"}
                    size={iconSize.sm}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.confirm ? (
                <Text style={styles.errorHint}>{fieldErrors.confirm}</Text>
              ) : null}
            </View>

            {/* Rules */}
            <View style={styles.rulesCard}>
              <Text style={styles.rulesTitle}>
                Le mot de passe doit contenir :
              </Text>
              {[
                { ok: password.length >= 8, txt: "Au moins 8 caractères" },
                { ok: /[A-Z]/.test(password), txt: "Une majuscule" },
                { ok: /[a-z]/.test(password), txt: "Une minuscule" },
                { ok: /\d/.test(password), txt: "Un chiffre" },
                {
                  ok: /[^A-Za-z0-9]/.test(password),
                  txt: "Un caractère spécial",
                },
              ].map((r, i) => (
                <View key={i} style={styles.ruleRow}>
                  <Feather
                    name={r.ok ? "check-circle" : "circle"}
                    size={16}
                    color={r.ok ? colors.success : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.ruleText,
                      { color: r.ok ? colors.text : colors.textMuted },
                    ]}
                  >
                    {r.txt}
                  </Text>
                </View>
              ))}
            </View>

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
                  <Text style={styles.primaryText}>
                    Enregistrer le mot de passe
                  </Text>
                  <Feather name="check" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ResultModal
        visible={modal.visible}
        status={modal.status}
        title={modal.title}
        message={modal.message}
        onSuccess={() => {
          setModal((m) => ({ ...m, visible: false }));
          router.replace("/(auth)/login");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  kav: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg,
    height: HEADER_HEIGHT,
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
  inputWrapError: { borderColor: colors.error },
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
  errorHint: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },

  strengthWrap: { marginBottom: spacing.base },
  barsRow: { flexDirection: "row", gap: 4, marginBottom: spacing.xs },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textAlign: "right",
  },

  rulesCard: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  rulesTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  ruleText: { fontSize: fontSize.sm },

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
});
