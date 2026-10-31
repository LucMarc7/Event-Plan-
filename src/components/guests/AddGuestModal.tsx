// src/components/guests/AddGuestModal.tsx
import Feather from "@expo/vector-icons/Feather";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { createInvitation } from "../../api/invitations";
// ✅ NOUVEAU — interception 402
import { UpgradeModal } from "../../components/subscription/UpgradeModal";
import { useSubscription } from "../../hooks/useSubscription";
import {
  colors,
  fontSize,
  fontWeight,
  iconSize,
  radius,
  shadows,
  spacing,
} from "../../theme/tokens";

const CATEGORIES = [
  { value: "SINGLETON", label: "Célibataire", icon: "user" },
  { value: "COUPLE", label: "Couple", icon: "users" },
] as const;

const FormField = ({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  disabled,
  required,
  inputRef,
  returnKeyType,
  onSubmitEditing,
}: any) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>
      {label}
      {required ? <Text style={{ color: colors.error }}> *</Text> : null}
    </Text>
    <View style={styles.inputWrap}>
      <View style={styles.inputIcon}>
        <Feather name={icon} size={iconSize.sm} color={colors.textMuted} />
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
        editable={!disabled}
        autoCorrect={false}
        returnKeyType={returnKeyType || "next"}
        onSubmitEditing={onSubmitEditing}
        submitBehavior={onSubmitEditing ? "submit" : "blurAndSubmit"}
      />
    </View>
  </View>
);

export const AddGuestModal = ({
  visible,
  eventId,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  eventId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) => {
  const [type, setType] = useState<"SINGLETON" | "COUPLE">("SINGLETON");
  const [name, setName] = useState("");
  const [name2, setName2] = useState("");
  const [place, setPlace] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // ✅ NOUVEAU — Plan + modale d'upgrade
  const { plan: currentPlan } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{
    visible: boolean;
    message?: string;
  }>({ visible: false });

  const nameRef = useRef<TextInput>(null);
  const name2Ref = useRef<TextInput>(null);
  const placeRef = useRef<TextInput>(null);
  const telRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const reset = () => {
    setType("SINGLETON");
    setName("");
    setName2("");
    setPlace("");
    setTel("");
    setEmail("");
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({ type: "error", text1: "Le nom est requis" });
      return;
    }
    if (type === "COUPLE" && !name2.trim()) {
      Toast.show({
        type: "error",
        text1: "Le nom du 2ème invité est requis",
      });
      return;
    }

    setSaving(true);
    try {
      await createInvitation(eventId, {
        first_person: name.trim(),
        second_person: type === "COUPLE" ? name2.trim() : "",
        invitation_type: type,
        place: place.trim(),
        tel: tel.trim(),
        email: email.trim(),
      });
      Toast.show({
        type: "success",
        text1: "Invité ajouté",
        text2: `${name.trim()} a été ajouté à la liste`,
      });
      reset();
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const status = err?.response?.status;
      const body = err?.response?.data || {};

      // ✅ INTERCEPTION UPGRADE
      if (status === 402 && body.need_upgrade) {
        handleClose(); // fermer le modal
        setUpgradeModal({
          visible: true,
          message:
            body.error ||
            "Vous avez atteint la limite d'invités de votre plan.",
        });
        return;
      }

      Toast.show({
        type: "error",
        text1: "Erreur",
        text2:
          body.error ||
          body.detail ||
          body.first_person?.[0] ||
          body.invitation_type?.[0] ||
          "Impossible d'ajouter l'invité",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Ajouter un invité</Text>
                <Text style={styles.subtitle}>
                  Remplissez les informations de l‘invitation
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                hitSlop={12}
              >
                <Feather name="x" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
            >
              <Text style={styles.sectionLabel}>Catégorie</Text>
              <View style={styles.categoriesRow}>
                {CATEGORIES.map((cat) => {
                  const active = type === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      style={[styles.catCard, active && styles.catCardActive]}
                      onPress={() => setType(cat.value as any)}
                      activeOpacity={0.85}
                      disabled={saving}
                    >
                      <View
                        style={[
                          styles.catIcon,
                          {
                            backgroundColor: active
                              ? colors.primary
                              : colors.primarySoft,
                          },
                        ]}
                      >
                        <Feather
                          name={cat.icon as any}
                          size={18}
                          color={active ? "#FFF" : colors.primary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.catLabel,
                          active && {
                            color: colors.primary,
                            fontWeight: fontWeight.bold,
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <FormField
                icon="user"
                label="Prénom et nom"
                value={name}
                onChangeText={setName}
                placeholder="Ex : David Make"
                autoCapitalize="words"
                disabled={saving}
                required
                inputRef={nameRef}
                returnKeyType="next"
                onSubmitEditing={() => name2Ref.current?.focus()}
              />

              {type === "COUPLE" && (
                <FormField
                  icon="users"
                  label="Nom du 2ème invité"
                  value={name2}
                  onChangeText={setName2}
                  placeholder="Ex : Marie Kabila"
                  autoCapitalize="words"
                  disabled={saving}
                  required
                  inputRef={name2Ref}
                  returnKeyType="next"
                  onSubmitEditing={() => placeRef.current?.focus()}
                />
              )}

              <FormField
                icon="grid"
                label="Table / Place"
                value={place}
                onChangeText={setPlace}
                placeholder="Ex : Table 5"
                disabled={saving}
                inputRef={placeRef}
                returnKeyType="next"
                onSubmitEditing={() => telRef.current?.focus()}
              />

              <FormField
                icon="phone"
                label="Téléphone"
                value={tel}
                onChangeText={setTel}
                placeholder="+243 81 23 45 67"
                keyboardType="phone-pad"
                disabled={saving}
                inputRef={telRef}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />

              <FormField
                icon="mail"
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="invite@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={saving}
                inputRef={emailRef}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              <TouchableOpacity
                style={[styles.submitBtn, saving && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Feather name="plus" size={18} color="#FFF" />
                    <Text style={styles.submitText}>Ajouter l‘invité</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ✅ NOUVEAU — Modale d'upgrade (hors du Modal principal) */}
      <UpgradeModal
        visible={upgradeModal.visible}
        onClose={() => setUpgradeModal({ visible: false })}
        message={upgradeModal.message}
        featureName="Ajouter un invité"
        currentPlan={currentPlan}
        recommendedPlan="standard"
      />
    </>
  );
};

const styles = StyleSheet.create({
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
  scroll: { flexShrink: 1 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  subtitle: {
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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
  categoriesRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  catCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  catCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft + "50",
  },
  catIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  catLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  fieldGroup: { marginBottom: spacing.md },
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
  submitBtn: {
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
  submitText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});

export default AddGuestModal;
