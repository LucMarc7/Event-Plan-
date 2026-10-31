// app/(auth)/forgot-password.tsx
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
import { forgotPassword } from "../../src/api/auth";
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
                Retour à la connexion
              </Text>
              <Feather name="arrow-right" size={16} color="#FFF" />
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
const parseForgotError = (err: any): string => {
  if (!err?.response) return "Connexion internet requise.";

  const status = err.response.status;
  const data = err.response.data;

  if (typeof data === "string" && data.includes("<html")) {
    return `Erreur serveur (${status}). Réessayez plus tard.`;
  }

  if (data && typeof data === "object") {
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.error === "string") return data.error;
    if (typeof data.email?.[0] === "string") return data.email[0];
    if (Array.isArray(data.non_field_errors) && data.non_field_errors[0])
      return data.non_field_errors[0];
  }

  if (status === 429) return "Trop de tentatives. Patientez quelques minutes.";
  if (status === 400) return "Email invalide.";
  if (status >= 500) return `Erreur serveur (${status}). Réessayez.`;

  return `Erreur inattendue (${status}).`;
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

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
    setFieldError(null);
  }, [email]);

  const validate = (): boolean => {
    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError("L'email est requis.");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setFieldError("Format d'email invalide.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setModal({
      visible: true,
      status: "loading",
      title: "Envoi en cours",
      message: "Nous préparons votre lien de réinitialisation…",
    });

    setLoading(true);
    try {
      await forgotPassword(email);

      // ⚠️ Sécurité : message IDENTIQUE qu'un compte existe ou pas
      setModal({
        visible: true,
        status: "success",
        title: "Email envoyé",
        message:
          "Si un compte est associé à cet email, vous recevrez un lien de réinitialisation dans quelques instants. Pensez à vérifier vos spams.",
      });
    } catch (err: any) {
      // Même en cas d'erreur 400/429, on évite d'exposer
      // si l'email existe ou pas — sauf pour les erreurs vraiment
      // techniques (500, réseau).
      const status = err?.response?.status;
      if (status === 500 || !err?.response) {
        setModal({
          visible: true,
          status: "error",
          title: "Erreur",
          message: parseForgotError(err),
        });
      } else {
        // 400 (email invalide) → affiché en champ
        // 429 (rate limit) → modal
        if (status === 400) {
          setModal({ ...modal, visible: false });
          setFieldError(parseForgotError(err));
        } else {
          setModal({
            visible: true,
            status: "error",
            title: "Erreur",
            message: parseForgotError(err),
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mot de passe oublié</Text>
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
          {/* BRANDING */}
          <Animated.View
            style={[styles.brandBlock, { opacity: contentOpacity }]}
          >
            <View style={styles.brandBadge}>
              <Feather name="key" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>Récupération</Text>
            <Text style={styles.brandSubtitle}>
              Entrez votre email pour recevoir un lien sécurisé
            </Text>
          </Animated.View>

          {/* CARD */}
          <Animated.View style={[styles.card, { opacity: contentOpacity }]}>
            <Text style={styles.cardTitle}>Votre email</Text>
            <Text style={styles.cardSubtitle}>
              Nous vous enverrons un lien à usage unique valable 15 minutes.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Adresse email</Text>
              <View
                style={[styles.inputWrap, fieldError && styles.inputWrapError]}
              >
                <View style={styles.inputIcon}>
                  <Feather
                    name="mail"
                    size={iconSize.sm}
                    color={fieldError ? colors.error : colors.textMuted}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="vous@exemple.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />
              </View>
              {fieldError ? (
                <Text style={styles.errorHint}>{fieldError}</Text>
              ) : null}
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
                  <Text style={styles.primaryText}>Envoyer le lien</Text>
                  <Feather name="send" size={16} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* INFO */}
          <Animated.View style={[styles.infoBox, { opacity: contentOpacity }]}>
            <Feather name="shield" size={16} color={colors.success} />
            <Text style={styles.infoText}>
              Par sécurité, nous affichons toujours le même message, que l‘email
              soit associé à un compte ou non.
            </Text>
          </Animated.View>

          {/* FOOTER */}
          <Animated.View style={[styles.footer, { opacity: contentOpacity }]}>
            <Text style={styles.footerText}>Vous vous en souvenez ?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Se connecter</Text>
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
  errorHint: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
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

  footer: { alignItems: "center", marginTop: spacing.xl },
  footerText: { fontSize: fontSize.sm, color: colors.textSecondary },
  footerLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
  },
});
