// app/(auth)/register.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
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
  checkUsernameAvailability,
  getUsernameSuggestion,
  sign_up,
} from "../../src/api/auth";
import {
  colors,
  fontSize,
  fontWeight,
  iconSize,
  radius,
  shadows,
  spacing,
} from "../../src/theme/tokens";

const STEPS = ["Identité", "Compte", "Sécurité"] as const;
const USERNAME_CHECK_DEBOUNCE = 500;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const cleanUsername = (s: string): string =>
  (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .trim();

const generateLocalSuggestion = (firstName: string): string => {
  const base = cleanUsername(firstName) || "User";
  const num = Math.floor(1 + Math.random() * 9999);
  return `${base}${num}`;
};

const isValidEmail = (email: string): boolean =>
  /^\S+@\S+\.\S+$/.test(email.trim());

const parseRegisterError = (err: any): string => {
  if (!err?.response) {
    return "Connexion internet requise. Vérifiez votre réseau.";
  }

  const status = err.response.status;
  const data = err.response.data;

  if (typeof data === "string" && data.includes("<html")) {
    return `Erreur serveur (${status}). Réessayez plus tard ou contactez le support.`;
  }

  if (data && typeof data === "object") {
    if (Array.isArray(data.email) && data.email[0])
      return `Email : ${data.email[0]}`;
    if (Array.isArray(data.username) && data.username[0])
      return `Nom d'utilisateur : ${data.username[0]}`;
    if (Array.isArray(data.password) && data.password[0])
      return `Mot de passe : ${data.password[0]}`;
    if (Array.isArray(data.password2) && data.password2[0])
      return `Confirmation : ${data.password2[0]}`;
    if (Array.isArray(data.first_name) && data.first_name[0])
      return `Prénom : ${data.first_name[0]}`;
    if (Array.isArray(data.last_name) && data.last_name[0])
      return `Nom : ${data.last_name[0]}`;

    if (data.userprofile && typeof data.userprofile === "object") {
      for (const key of Object.keys(data.userprofile)) {
        const v = data.userprofile[key];
        if (Array.isArray(v) && v[0]) return `${key} : ${v[0]}`;
      }
    }

    if (typeof data.detail === "string") return data.detail;
    if (typeof data.error === "string") return data.error;
    if (typeof data.message === "string") return data.message;
    if (Array.isArray(data.non_field_errors) && data.non_field_errors[0])
      return data.non_field_errors[0];
  }

  if (status === 400) return "Données invalides. Vérifiez vos informations.";
  if (status === 409) return "Ce compte existe déjà.";
  if (status >= 500) return `Erreur serveur (${status}). Réessayez plus tard.`;

  return `Erreur inattendue (${status}).`;
};

// ═══════════════════════════════════════════════════════════════
// RESULT MODAL
// ═══════════════════════════════════════════════════════════════
type ModalStatus = "loading" | "success" | "error";

const ResultModal = ({
  visible,
  status,
  title,
  message,
  primaryLabel,
  onPrimary,
}: any) => {
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

          {status !== "loading" && primaryLabel && onPrimary ? (
            <TouchableOpacity
              style={[
                modalStyles.primaryBtn,
                { backgroundColor: variantColor },
              ]}
              onPress={onPrimary}
              activeOpacity={0.85}
            >
              <Text style={modalStyles.primaryBtnText}>{primaryLabel}</Text>
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
  primaryBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    width: "100%",
    alignItems: "center",
    ...shadows.sm,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});

// ═══════════════════════════════════════════════════════════════
// FIELD
// ═══════════════════════════════════════════════════════════════
const Field = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  secure,
  showSecure,
  onToggleSecure,
  disabled,
  hint,
  error,
  returnKeyType,
  onSubmitEditing,
  inputRef,
}: any) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrap, error && styles.inputWrapError]}>
      <View style={styles.inputIcon}>
        <Feather
          name={icon}
          size={iconSize.sm}
          color={error ? colors.error : colors.textMuted}
        />
      </View>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secure && !showSecure}
        editable={!disabled}
        autoCorrect={false}
        returnKeyType={returnKeyType || "next"}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={false}
      />
      {secure && onToggleSecure ? (
        <TouchableOpacity
          onPress={onToggleSecure}
          style={styles.eyeBtn}
          hitSlop={10}
        >
          <Feather
            name={showSecure ? "eye-off" : "eye"}
            size={iconSize.sm}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      ) : null}
    </View>
    {hint && !error ? <Text style={styles.hint}>{hint}</Text> : null}
    {error ? <Text style={styles.errorHint}>{error}</Text> : null}
  </View>
);

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const lastNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const countryRef = useRef<TextInput>(null);
  const password2Ref = useRef<TextInput>(null);

  const [suggestedUsername, setSuggestedUsername] = useState("");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    state: "idle" | "valid" | "invalid" | "checking";
    message: string;
    suggestion?: string;
  }>({ state: "idle", message: "" });

  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const [modal, setModal] = useState<any>({
    visible: false,
    status: "loading",
    title: "",
    message: "",
    primaryLabel: "",
    onPrimary: null,
  });

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

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

  const loadSuggestion = useCallback(async () => {
    setLoadingSuggestion(true);
    try {
      const suggestion = await getUsernameSuggestion(firstName, lastName);
      if (suggestion) {
        setSuggestedUsername(suggestion);
      } else {
        setSuggestedUsername(generateLocalSuggestion(firstName));
      }
    } catch {
      setSuggestedUsername(generateLocalSuggestion(firstName));
    } finally {
      setLoadingSuggestion(false);
    }
  }, [firstName, lastName]);

  useEffect(() => {
    if (step === 1 && !suggestedUsername && !loadingSuggestion) {
      loadSuggestion();
    }
  }, [step, suggestedUsername, loadingSuggestion, loadSuggestion]);

  useEffect(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
      checkTimeoutRef.current = null;
    }

    const clean = username.trim();

    if (!clean) {
      setUsernameStatus({ state: "idle", message: "" });
      setCheckingUsername(false);
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus({
        state: "idle",
        message: "3 caractères minimum",
      });
      setCheckingUsername(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameStatus({
        state: "invalid",
        message: "Lettres, chiffres et _ uniquement",
      });
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    setUsernameStatus({ state: "checking", message: "Vérification…" });

    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(clean);
        if (result.available) {
          setUsernameStatus({
            state: "valid",
            message: "Nom d'utilisateur disponible",
          });
        } else {
          setUsernameStatus({
            state: "invalid",
            message: result.reason || "Ce nom d'utilisateur est déjà pris.",
            suggestion: result.suggestion,
          });
        }
      } catch {
        setUsernameStatus({ state: "idle", message: "" });
      } finally {
        setCheckingUsername(false);
      }
    }, USERNAME_CHECK_DEBOUNCE);

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [username]);

  useEffect(() => {
    setFormError(null);
  }, [firstName, lastName, username, email, country, password, password2]);

  useEffect(() => {
    if (formError) {
      const t = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [formError]);

  const validateStep = (stepIndex: number): boolean => {
    const errors: { [key: string]: string } = {};
    if (stepIndex === 0) {
      if (firstName.trim().length < 2)
        errors.firstName = "Le prénom est requis (2 caractères min).";
      if (lastName.trim().length < 2)
        errors.lastName = "Le nom est requis (2 caractères min).";
    } else if (stepIndex === 1) {
      if (username.trim().length < 3)
        errors.username = "Le nom d'utilisateur est requis (3 caractères min).";
      if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
        errors.username = "Seuls les lettres, chiffres et _ sont autorisés.";
      if (usernameStatus.state === "invalid")
        errors.username = usernameStatus.message;
      if (!email.trim()) errors.email = "L'email est requis.";
      else if (!isValidEmail(email))
        errors.email = "Format d'email invalide (ex: nom@domaine.com).";
      if (country.trim().length < 2) errors.country = "Le pays est requis.";
    } else if (stepIndex === 2) {
      if (password.length < 8) errors.password = "8 caractères minimum.";
      if (password !== password2)
        errors.password2 = "Les mots de passe ne correspondent pas.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError("Veuillez corriger les champs en rouge.");
      return false;
    }
    return true;
  };

  const isStepValid = useMemo(() => {
    return (stepIndex: number): boolean => {
      if (stepIndex === 0)
        return firstName.trim().length >= 2 && lastName.trim().length >= 2;
      if (stepIndex === 1)
        return (
          username.trim().length >= 3 &&
          /^[a-zA-Z0-9_]+$/.test(username.trim()) &&
          usernameStatus.state === "valid" &&
          isValidEmail(email) &&
          country.trim().length >= 2
        );
      if (stepIndex === 2)
        return (
          password.length >= 8 && password === password2 && password2.length > 0
        );
      return false;
    };
  }, [
    firstName,
    lastName,
    username,
    usernameStatus,
    email,
    country,
    password,
    password2,
  ]);

  const goNext = () => {
    if (!validateStep(step)) return;
    setFieldErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const goBack = () => {
    if (step === 0) router.back();
    else {
      setFieldErrors({});
      setFormError(null);
      setStep((s) => Math.max(s - 1, 0));
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  // ═══════════════════════════════════════════════════════════
  // ✅ SUBMIT MODIFIÉ — redirige vers /(auth)/verify-email
  // ═══════════════════════════════════════════════════════════
  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    if (usernameStatus.state !== "valid") {
      setFormError("Veuillez valider votre nom d'utilisateur.");
      return;
    }

    const cleanUser = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCountry = country.trim();

    setModal({
      visible: true,
      status: "loading",
      title: "Création du compte",
      message: "Nous préparons votre espace…",
      primaryLabel: "",
      onPrimary: null,
    });
    setLoading(true);

    try {
      // Le backend crée le compte INACTIF et envoie un code à 6 chiffres
      const res = await sign_up({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: cleanUser,
        email: cleanEmail,
        password,
        password2,
        userprofile: {
          country: cleanCountry,
          city: "Non renseigné",
          address: "Non renseigné",
        },
      });

      setModal((m: any) => ({ ...m, visible: false }));

      // ✅ Redirection immédiate vers l'écran de vérification email
      const emailForVerify = res?.email || cleanEmail;
      router.replace({
        pathname: "/(auth)/verify-email",
        params: { email: emailForVerify },
      });
    } catch (err: any) {
      const msg = parseRegisterError(err);
      setModal({
        visible: true,
        status: "error",
        title: "Échec de l'inscription",
        message: msg,
        primaryLabel: "Réessayer",
        onPrimary: () => {
          setModal((m: any) => ({ ...m, visible: false }));
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const renderUsernameIndicator = () => {
    if (usernameStatus.state === "idle") return null;

    const isChecking = usernameStatus.state === "checking";
    const isValid = usernameStatus.state === "valid";
    const isInvalid = usernameStatus.state === "invalid";

    const color = isValid
      ? colors.success
      : isInvalid
        ? colors.error
        : colors.textMuted;

    const bg = isValid
      ? colors.successSoft
      : isInvalid
        ? colors.errorSoft
        : colors.surfaceAlt;

    return (
      <View style={[styles.usernameIndicator, { backgroundColor: bg }]}>
        {isChecking ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <Feather
            name={isValid ? "check-circle" : "alert-circle"}
            size={14}
            color={color}
          />
        )}
        <Text style={[styles.usernameIndicatorText, { color }]}>
          {usernameStatus.message}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={goBack}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un compte</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              (keyboardHeight > 0 ? keyboardHeight : 0) + spacing.xxl,
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        <View style={styles.brandBlock}>
          <View style={styles.brandBadge}>
            <Feather name="user-plus" size={26} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>Rejoignez Event Plan</Text>
          <Text style={styles.brandSubtitle}>
            Créez votre compte en quelques étapes
          </Text>
        </View>

        <View style={styles.stepper}>
          {STEPS.map((label, i) => {
            const valid = isStepValid(i);
            const isCurrent = i === step;
            const isDone = i < step;
            const showGreen = isDone || (isCurrent && valid);
            const showBlue = isCurrent && !valid;

            return (
              <View key={label} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    showGreen && styles.stepCircleDone,
                    showBlue && styles.stepCircleActive,
                  ]}
                >
                  {showGreen ? (
                    <Feather name="check" size={14} color="#FFF" />
                  ) : (
                    <Text
                      style={[styles.stepNum, showBlue && styles.stepNumActive]}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    showGreen && styles.stepLabelDone,
                    showBlue && styles.stepLabelActive,
                  ]}
                >
                  {label}
                </Text>
                {i < STEPS.length - 1 ? (
                  <View
                    style={[styles.stepLine, isDone && styles.stepLineDone]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          {formError ? (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorBannerText}>{formError}</Text>
            </View>
          ) : null}

          {step === 0 && (
            <>
              <Text style={styles.sectionTitle}>Informations personnelles</Text>
              <Text style={styles.sectionSubtitle}>
                Comment souhaitez-vous être appelé ?
              </Text>

              <Field
                label="Prénom"
                icon="user"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Votre prénom"
                autoCapitalize="words"
                disabled={loading}
                error={fieldErrors.firstName}
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
              />
              <Field
                label="Nom"
                icon="users"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Votre nom"
                autoCapitalize="words"
                disabled={loading}
                error={fieldErrors.lastName}
                inputRef={lastNameRef}
                returnKeyType="done"
                onSubmitEditing={goNext}
              />
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.sectionTitle}>Informations du compte</Text>
              <Text style={styles.sectionSubtitle}>
                Choisissez votre identifiant et votre email
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nom d‘utilisateur</Text>
                <View
                  style={[
                    styles.inputWrap,
                    fieldErrors.username && styles.inputWrapError,
                    usernameStatus.state === "valid" && styles.inputWrapValid,
                  ]}
                >
                  <View style={styles.inputIcon}>
                    <Text style={styles.atPrefix}>@</Text>
                  </View>
                  <TextInput
                    ref={usernameRef}
                    style={styles.input}
                    value={username}
                    onChangeText={(t: string) =>
                      setUsername(t.replace(/\s/g, ""))
                    }
                    placeholder="Luc10"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                  {checkingUsername ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : usernameStatus.state === "valid" ? (
                    <Feather
                      name="check-circle"
                      size={18}
                      color={colors.success}
                    />
                  ) : null}
                </View>
                {fieldErrors.username ? (
                  <Text style={styles.errorHint}>{fieldErrors.username}</Text>
                ) : (
                  <Text style={styles.hint}>
                    Ce nom vous servira à vous connecter
                  </Text>
                )}
              </View>

              {renderUsernameIndicator()}

              {suggestedUsername &&
              !username &&
              !fieldErrors.username &&
              !checkingUsername ? (
                <View style={styles.suggestionBox}>
                  <View style={styles.suggestionLeft}>
                    <Feather name="zap" size={14} color={colors.primary} />
                    <Text style={styles.suggestionLabel}>
                      Suggéré pour vous :{" "}
                      <Text style={styles.suggestionValue}>
                        @{suggestedUsername}
                      </Text>
                    </Text>
                  </View>
                  <View style={styles.suggestionActions}>
                    <TouchableOpacity
                      onPress={loadSuggestion}
                      style={styles.suggestionIconBtn}
                      hitSlop={8}
                      disabled={loadingSuggestion}
                    >
                      {loadingSuggestion ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.textSecondary}
                        />
                      ) : (
                        <Feather
                          name="refresh-cw"
                          size={14}
                          color={colors.textSecondary}
                        />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setUsername(suggestedUsername)}
                      style={styles.suggestionUseBtn}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.suggestionUseText}>Utiliser</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {usernameStatus.suggestion &&
              usernameStatus.state === "invalid" ? (
                <View style={styles.altSuggestionBox}>
                  <View style={styles.suggestionLeft}>
                    <Feather name="info" size={14} color={colors.warning} />
                    <Text style={styles.altSuggestionLabel}>
                      Essayez :{" "}
                      <Text style={styles.altSuggestionValue}>
                        @{usernameStatus.suggestion}
                      </Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setUsername(usernameStatus.suggestion!)}
                    style={styles.altSuggestionUseBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.suggestionUseText}>Utiliser</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <Field
                label="Email"
                icon="mail"
                value={email}
                onChangeText={setEmail}
                placeholder="vous@exemple.com"
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={loading}
                error={fieldErrors.email}
                inputRef={emailRef}
                returnKeyType="next"
                onSubmitEditing={() => countryRef.current?.focus()}
              />

              <Field
                label="Pays"
                icon="globe"
                value={country}
                onChangeText={setCountry}
                placeholder="Ex : RDC"
                autoCapitalize="words"
                disabled={loading}
                error={fieldErrors.country}
                inputRef={countryRef}
                returnKeyType="done"
                onSubmitEditing={goNext}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Sécurité</Text>
              <Text style={styles.sectionSubtitle}>
                Choisissez un mot de passe robuste
              </Text>

              <Field
                label="Mot de passe"
                icon="lock"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secure
                showSecure={showPassword}
                onToggleSecure={() => setShowPassword((v) => !v)}
                disabled={loading}
                hint="8 caractères minimum"
                error={fieldErrors.password}
                returnKeyType="next"
                onSubmitEditing={() => password2Ref.current?.focus()}
              />
              <Field
                label="Confirmer le mot de passe"
                icon="lock"
                value={password2}
                onChangeText={setPassword2}
                placeholder="••••••••"
                secure
                showSecure={showPassword2}
                onToggleSecure={() => setShowPassword2((v) => !v)}
                disabled={loading}
                error={fieldErrors.password2}
                inputRef={password2Ref}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <View style={styles.recapBox}>
                <View style={styles.recapIconCircle}>
                  <Feather name="at-sign" size={18} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recapLabel}>
                    Vous vous connecterez avec
                  </Text>
                  <Text style={styles.recapValue}>{username}</Text>
                  <Text style={styles.recapEmail}>{email}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.actions}>
          {step > 0 ? (
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={goBack}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Feather name="chevron-left" size={16} color={colors.text} />
              <Text style={styles.ghostText}>Précédent</Text>
            </TouchableOpacity>
          ) : null}

          {step < STEPS.length - 1 ? (
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                step > 0 && { flex: 1 },
                step === 1 &&
                  usernameStatus.state !== "valid" && { opacity: 0.5 },
              ]}
              onPress={goNext}
              disabled={step === 1 && usernameStatus.state !== "valid"}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryText}>Continuer</Text>
              <Feather name="arrow-right" size={18} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                loading && { opacity: 0.6 },
                { flex: 1 },
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={styles.primaryText}>Créer mon compte</Text>
                  <Feather name="check" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Vous avez déjà un compte ?</Text>
          <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.footerLink}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ResultModal
        visible={modal.visible}
        status={modal.status}
        title={modal.title}
        message={modal.message}
        primaryLabel={modal.primaryLabel}
        onPrimary={modal.onPrimary || undefined}
      />
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

  scrollView: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
  },

  stepper: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  stepItem: { alignItems: "center", flex: 1, position: "relative" },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  stepCircleActive: { backgroundColor: colors.primary },
  stepCircleDone: { backgroundColor: colors.success },
  stepNum: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
  },
  stepNumActive: { color: "#FFF" },
  stepLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  stepLabelActive: { color: colors.primary, fontWeight: fontWeight.bold },
  stepLabelDone: { color: colors.success, fontWeight: fontWeight.bold },
  stepLine: {
    position: "absolute",
    top: 15,
    left: "50%",
    right: "-50%",
    height: 2,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  stepLineDone: { backgroundColor: colors.success },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  sectionSubtitle: {
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

  usernameIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: -spacing.xs,
    marginBottom: spacing.base,
  },
  usernameIndicatorText: {
    flex: 1,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  suggestionBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  suggestionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  suggestionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  suggestionValue: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  suggestionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  suggestionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionUseBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  suggestionUseText: {
    fontSize: fontSize.xs,
    color: "#FFF",
    fontWeight: fontWeight.bold,
  },

  altSuggestionBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  altSuggestionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  altSuggestionValue: {
    color: colors.warning,
    fontWeight: fontWeight.bold,
  },
  altSuggestionUseBtn: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.warning,
  },

  recapBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginTop: spacing.base,
    borderWidth: 1,
    borderColor: colors.success + "30",
  },
  recapIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  recapLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  recapValue: {
    fontSize: fontSize.base,
    color: colors.success,
    fontWeight: fontWeight.extrabold,
    marginTop: 2,
  },
  recapEmail: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
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
    gap: spacing.sm,
  },
  inputWrapError: { borderColor: colors.error },
  inputWrapValid: { borderColor: colors.success },
  inputIcon: { justifyContent: "center", alignItems: "center" },
  atPrefix: {
    fontSize: fontSize.base,
    color: colors.textMuted,
    fontWeight: fontWeight.bold,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    paddingVertical: 0,
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
  errorHint: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
  },

  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    ...shadows.md,
  },
  primaryText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  ghostBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghostText: {
    color: colors.text,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
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
