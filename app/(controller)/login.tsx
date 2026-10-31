// app/(controller)/login.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  controllerCheckCredentials,
  controllerLogin,
  RateLimitError,
  saveControllerSession,
} from "../../src/api/controles";
import {
  colors,
  fontSize,
  fontWeight,
  iconSize,
  radius,
  shadows,
  spacing,
} from "../../src/theme/tokens";

type Step = 1 | 2;

export default function ControllerLoginScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [eventCode, setEventCode] = useState("");

  const [validatedCredentials, setValidatedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number>(0);

  // ✅ Hauteur dynamique du clavier
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const passwordRef = useRef<TextInput>(null);
  const eventCodeRef = useRef<TextInput>(null);
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // ✅ Listener clavier : plus fiable que KeyboardAvoidingView
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!rateLimitUntil) {
      setRateLimitRemaining(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((rateLimitUntil - Date.now()) / 1000),
      );
      setRateLimitRemaining(remaining);
      if (remaining === 0) {
        setRateLimitUntil(null);
        setError(null);
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [rateLimitUntil]);

  useEffect(() => {
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 400,
      delay: 100,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (rateLimitUntil) return true;
      if (step === 2) {
        setStep(1);
        setValidatedCredentials(null);
        setEventCode("");
        return true;
      }
      router.replace("/choose");
      return true;
    });
    return () => sub.remove();
  }, [step, rateLimitUntil, router]);

  const triggerRateLimit = (retryAfter: number) => {
    setRateLimitUntil(Date.now() + retryAfter * 1000);
  };

  const handleCheckCredentials = async () => {
    setError(null);
    if (rateLimitUntil) return;
    const u = username.trim();

    if (u.length < 3) {
      setError("Le nom d'utilisateur est trop court.");
      return;
    }
    if (password.length < 4) {
      setError("Le mot de passe est trop court.");
      return;
    }

    setLoading(true);
    try {
      await controllerCheckCredentials({ username: u, password });
      setValidatedCredentials({ username: u, password });
      setStep(2);
      setTimeout(() => eventCodeRef.current?.focus(), 400);
    } catch (err: any) {
      if (err instanceof RateLimitError) {
        triggerRateLimit(err.retryAfter);
        setError(err.message);
        return;
      }
      const status = err?.response?.status;
      const body = err?.response?.data || {};
      const msg = body.error || body.detail || "";

      if (status === 401) setError(msg || "Identifiants invalides.");
      else if (status === 403)
        setError(msg || "Ce compte n'est pas un contrôleur.");
      else setError(msg || "Impossible de vérifier vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  const handleFullLogin = async () => {
    setError(null);
    if (rateLimitUntil) return;
    const code = eventCode.trim().toUpperCase();

    if (code.length !== 8) {
      setError("Le code événement doit contenir 8 caractères.");
      return;
    }
    if (!validatedCredentials) {
      setError("Session expirée. Reconnectez-vous.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      const data = await controllerLogin({
        username: validatedCredentials.username,
        password: validatedCredentials.password,
        event_code: code,
      });
      await saveControllerSession(data);
      router.replace("/(controller)");
    } catch (err: any) {
      if (err instanceof RateLimitError) {
        triggerRateLimit(err.retryAfter);
        setError(err.message);
        return;
      }
      const status = err?.response?.status;
      const body = err?.response?.data || {};
      const msg = body.error || body.detail || "";

      if (status === 404) setError(msg || "Code événement invalide.");
      else if (status === 403)
        setError(msg || "Vous n'êtes pas assigné à cet événement.");
      else if (status === 401) {
        setError("Session invalide. Reconnectez-vous.");
        setValidatedCredentials(null);
        setStep(1);
      } else setError(msg || "Impossible de se connecter.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (rateLimitUntil) return;
    setError(null);
    if (step === 2) {
      setStep(1);
      setValidatedCredentials(null);
      setEventCode("");
    } else {
      router.replace("/choose");
    }
  };

  const isRateLimited = !!rateLimitUntil;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          // ✅ Padding bottom = hauteur clavier + marge → ScrollView scrolle
          {
            paddingBottom:
              (keyboardHeight > 0 ? keyboardHeight : 0) + spacing.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.headerBtn, isRateLimited && { opacity: 0.4 }]}
            onPress={handleBack}
            disabled={isRateLimited}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contrôleur</Text>
          <View style={styles.headerBtn} />
        </View>

        {/* BRANDING */}
        <Animated.View style={[styles.brandBlock, { opacity: contentOpacity }]}>
          <View style={styles.brandBadge}>
            <Feather name="shield" size={28} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>Event Plan</Text>
          <Text style={styles.brandSubtitle}>
            Contrôle d'accès aux événements
          </Text>
        </Animated.View>

        {/* STEP INDICATOR */}
        <Animated.View style={[styles.stepsRow, { opacity: contentOpacity }]}>
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                step >= 1 && styles.stepCircleActive,
                validatedCredentials && styles.stepCircleDone,
              ]}
            >
              {validatedCredentials ? (
                <Feather name="check" size={16} color="#FFF" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    step >= 1 && styles.stepNumberActive,
                  ]}
                >
                  1
                </Text>
              )}
            </View>
            <Text
              style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}
            >
              Identifiants
            </Text>
          </View>

          <View
            style={[styles.stepLine, step === 2 && styles.stepLineActive]}
          />

          <View style={styles.stepItem}>
            <View
              style={[styles.stepCircle, step === 2 && styles.stepCircleActive]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  step === 2 && styles.stepNumberActive,
                ]}
              >
                2
              </Text>
            </View>
            <Text
              style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}
            >
              Code événement
            </Text>
          </View>
        </Animated.View>

        {/* CARD */}
        <Animated.View style={[styles.card, { opacity: contentOpacity }]}>
          <Text style={styles.cardTitle}>
            {step === 1 ? "Vos identifiants" : "Code de l'événement"}
          </Text>
          <Text style={styles.cardSubtitle}>
            {step === 1
              ? "Saisissez les accès fournis par l'organisateur"
              : `Connecté en tant que ${
                  validatedCredentials?.username || ""
                }. Entrez le code à 8 caractères.`}
          </Text>

          {isRateLimited ? (
            <View style={styles.rateLimitBox}>
              <View style={styles.rateLimitHeader}>
                <Feather name="clock" size={18} color={colors.warning} />
                <Text style={styles.rateLimitTitle}>Trop de tentatives</Text>
              </View>
              <Text style={styles.rateLimitSub}>
                Réessayez dans{" "}
                <Text style={styles.rateLimitCountdown}>
                  {rateLimitRemaining}s
                </Text>
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nom d'utilisateur</Text>
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
                    value={username}
                    onChangeText={setUsername}
                    placeholder="ctrl_jean_a3f2"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading && !isRateLimited}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIcon}>
                    <Feather
                      name="lock"
                      size={iconSize.sm}
                      color={colors.textMuted}
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
                    editable={!loading && !isRateLimited}
                    returnKeyType="go"
                    onSubmitEditing={handleCheckCredentials}
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
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (loading || isRateLimited) && { opacity: 0.6 },
                ]}
                onPress={handleCheckCredentials}
                disabled={loading || isRateLimited}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.primaryText}>
                      {isRateLimited
                        ? `Attendez ${rateLimitRemaining}s`
                        : "Vérifier"}
                    </Text>
                    <Feather
                      name={isRateLimited ? "clock" : "arrow-right"}
                      size={18}
                      color="#FFF"
                    />
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Code événement</Text>
                <View style={styles.inputWrap}>
                  <View style={styles.inputIcon}>
                    <Feather
                      name="hash"
                      size={iconSize.sm}
                      color={colors.textMuted}
                    />
                  </View>
                  <TextInput
                    ref={eventCodeRef}
                    style={[styles.input, styles.codeInput]}
                    value={eventCode}
                    onChangeText={(t) =>
                      setEventCode(t.replace(/[^A-Za-z0-9]/g, "").toUpperCase())
                    }
                    placeholder="A1B2C3D4"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={8}
                    editable={!loading && !isRateLimited}
                    returnKeyType="go"
                    onSubmitEditing={handleFullLogin}
                  />
                </View>
                <Text style={styles.hint}>
                  8 caractères (lettres et chiffres)
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (loading || isRateLimited || eventCode.length !== 8) && {
                    opacity: 0.6,
                  },
                ]}
                onPress={handleFullLogin}
                disabled={loading || isRateLimited || eventCode.length !== 8}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.primaryText}>
                      {isRateLimited
                        ? `Attendez ${rateLimitRemaining}s`
                        : "Se connecter"}
                    </Text>
                    <Feather
                      name={isRateLimited ? "clock" : "log-in"}
                      size={18}
                      color="#FFF"
                    />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleBack}
                disabled={loading || isRateLimited}
              >
                <Feather
                  name="chevron-left"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.secondaryBtnText}>
                  Modifier les identifiants
                </Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* FOOTER */}
        <Animated.View style={[styles.footer, { opacity: contentOpacity }]}>
          <Feather name="lock" size={12} color={colors.textMuted} />
          <Text style={styles.footerText}>Session sécurisée · 24 h</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
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

  stepsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: { backgroundColor: colors.primary },
  stepCircleDone: { backgroundColor: colors.success },
  stepNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
  },
  stepNumberActive: { color: "#FFF" },
  stepLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  stepLabelActive: { color: colors.primary, fontWeight: fontWeight.bold },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
    marginTop: 15,
  },
  stepLineActive: { backgroundColor: colors.primary },

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

  errorBox: {
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
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.semibold,
  },

  rateLimitBox: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  rateLimitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  rateLimitTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.warning,
  },
  rateLimitSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  rateLimitCountdown: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
    color: colors.warning,
    fontVariant: ["tabular-nums"],
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
  codeInput: { letterSpacing: 3, fontWeight: fontWeight.bold },
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
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  secondaryBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
});
