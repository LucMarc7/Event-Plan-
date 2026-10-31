// app/(auth)/login.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { useAuth } from "../../src/hooks/useAuth";
import {
  colors,
  fontSize,
  fontWeight,
  iconSize,
  radius,
  shadows,
  spacing,
} from "../../src/theme/tokens";

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
}: {
  visible: boolean;
  status: ModalStatus;
  title: string;
  message: string;
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
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
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
  },
});

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const parseLoginError = (err: any): string => {
  if (!err?.response) return "Connexion internet requise.";

  const status = err.response.status;
  const data = err.response.data;

  if (typeof data === "string" && data.includes("<html")) {
    return `Erreur serveur (${status}). Réessayez plus tard.`;
  }

  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.error === "string") return data.error;
    if (typeof data.message === "string") return data.message;
    if (Array.isArray(data.non_field_errors) && data.non_field_errors[0])
      return data.non_field_errors[0];
  }

  if (status === 401) return "Identifiants incorrects.";
  if (status === 400) return "Requête invalide. Vérifiez vos informations.";
  if (status >= 500) return `Erreur serveur (${status}). Réessayez.`;

  return `Erreur inattendue (${status}).`;
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
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

  const passwordRef = useRef<TextInput>(null);
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
    setFormError(null);
    setFieldErrors({});
  }, [username, password]);

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};
    if (username.trim().length < 3)
      errors.username = "Le nom d'utilisateur est trop court.";
    if (password.length < 6)
      errors.password = "Le mot de passe doit faire au moins 6 caractères.";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError("Veuillez corriger les champs en rouge.");
      return false;
    }
    return true;
  };

  // ═══════════════════════════════════════════════════════════
  // ✅ SUBMIT MODIFIÉ — détecte compte non vérifié (403 email_not_verified)
  // ═══════════════════════════════════════════════════════════
  const handleSubmit = async () => {
    if (!validate()) return;

    setModal({
      visible: true,
      status: "loading",
      title: "Connexion en cours",
      message: "Vérification de vos identifiants…",
    });

    setLoading(true);
    try {
      await login({ username: username.trim(), password });

      setModal({
        visible: true,
        status: "success",
        title: "Bienvenue !",
        message: "Connexion réussie. Redirection…",
      });

      setTimeout(() => {
        setModal((m) => ({ ...m, visible: false }));
        router.replace("/(main)/home");
      }, 900);
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      // ✅ Cas spécial : compte existant mais non vérifié
      if (
        status === 403 &&
        data &&
        (data.code === "email_not_verified" || data.detail?.includes("vérifié"))
      ) {
        setModal((m) => ({ ...m, visible: false }));
        router.replace({
          pathname: "/(auth)/verify-email",
          params: { email: data?.email || username.trim() },
        });
        return;
      }

      const msg = parseLoginError(err);
      setModal({
        visible: true,
        status: "error",
        title: "Échec de la connexion",
        message: msg,
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
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connexion</Text>
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
          automaticallyAdjustKeyboardInsets
        >
          <Animated.View
            style={[styles.brandBlock, { opacity: contentOpacity }]}
          >
            <View style={styles.brandBadge}>
              <Feather name="calendar" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>Event Plan</Text>
            <Text style={styles.brandSubtitle}>
              Gérez vos événements en toute simplicité
            </Text>
          </Animated.View>

          <Animated.View style={[styles.card, { opacity: contentOpacity }]}>
            <Text style={styles.cardTitle}>Identifiants</Text>
            <Text style={styles.cardSubtitle}>
              Entrez vos accès pour rejoindre votre espace
            </Text>

            {formError ? (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom d'utilisateur</Text>
              <View
                style={[
                  styles.inputWrap,
                  fieldErrors.username && styles.inputWrapError,
                ]}
              >
                <View style={styles.inputIcon}>
                  <Feather
                    name="user"
                    size={iconSize.sm}
                    color={
                      fieldErrors.username ? colors.error : colors.textMuted
                    }
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="votre_nom"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              </View>
              {fieldErrors.username ? (
                <Text style={styles.errorHint}>{fieldErrors.username}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
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
                  ref={passwordRef}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
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

            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

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
                  <Text style={styles.primaryText}>Se connecter</Text>
                  <Feather name="log-in" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.footer, { opacity: contentOpacity }]}>
            <Text style={styles.footerText}>
              Vous n'avez pas encore de compte ?
            </Text>
            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
              <Text style={styles.footerLink}>Créer un compte</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ResultModal
        visible={modal.visible}
        status={modal.status}
        title={modal.title}
        message={modal.message}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
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
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
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

  forgotBtn: {
    alignSelf: "flex-end",
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  forgotText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
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

  footer: { alignItems: "center", marginTop: spacing.xl },
  footerText: { fontSize: fontSize.sm, color: colors.textSecondary },
  footerLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },
});
