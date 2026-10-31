// src/components/profile/modals/ChangePasswordModal.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import {
  colors,
  fontSize,
  fontWeight,
  iconSize,
  radius,
  spacing,
} from "../../../../src/theme/tokens";
import { ModalWrapper, styles as mStyles } from "./ModalWrapper";

import { changePassword } from "../../../../src/api/auth";

// ═══════════════════════════════════════════════════════════════
// ✅ PasswordField déplacé HORS du composant (fix clavier qui se ferme)
// ═══════════════════════════════════════════════════════════════
const PasswordField = ({
  label,
  value,
  onChange,
  visible: v,
  onToggle,
  error,
}: any) => (
  <View style={mStyles.inputGroup}>
    <Text style={mStyles.label}>{label}</Text>
    <View style={s.inputWrap}>
      <TextInput
        style={[s.input, error && mStyles.inputError]}
        value={value}
        onChangeText={onChange}
        secureTextEntry={!v}
        placeholder="••••••••"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity onPress={onToggle} style={s.eye} hitSlop={10}>
        <Ionicons
          name={v ? "eye-off-outline" : "eye-outline"}
          size={iconSize.md}
          color={colors.textMuted}
        />
      </TouchableOpacity>
    </View>
    {error ? <Text style={mStyles.errorText}>{error}</Text> : null}
  </View>
);

export const ChangePasswordModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const strength = useMemo(() => {
    let s = 0;
    if (next.length >= 8) s++;
    if (/[A-Z]/.test(next)) s++;
    if (/[a-z]/.test(next)) s++;
    if (/\d/.test(next)) s++;
    if (/[^A-Za-z0-9]/.test(next)) s++;
    return s;
  }, [next]);

  const strengthLabel = [
    "Très faible",
    "Faible",
    "Moyen",
    "Bon",
    "Fort",
    "Excellent",
  ][strength];
  const strengthColor =
    strength <= 1
      ? colors.error
      : strength <= 3
        ? colors.warning
        : colors.success;

  const validate = () => {
    const e: any = {};
    if (!current) e.current = "Requis";
    if (!next) e.next = "Requis";
    else if (next.length < 8) e.next = "8 caractères minimum";
    else if (!/[A-Z]/.test(next) || !/\d/.test(next))
      e.next = "1 majuscule et 1 chiffre minimum";
    if (next !== confirm) e.confirm = "Les mots de passe ne correspondent pas";
    if (next && next === current)
      e.next = "Doit être différent du mot de passe actuel";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await changePassword({
        old_password: current,
        new_password: next,
        confirm_password: confirm,
      });
      if (res?.success) {
        Toast.show({
          type: "success",
          text1: "Mot de passe modifié",
          text2: "Utilisez le nouveau à la prochaine connexion",
        });
        setCurrent("");
        setNext("");
        setConfirm("");
        setErrors({});
        onClose();
      } else {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: res?.message || "Échec de la modification",
        });
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: e?.response?.data?.error || "Une erreur est survenue",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Changer le mot de passe"
      subtitle="Sécurisez votre compte"
    >
      <PasswordField
        label="Mot de passe actuel"
        value={current}
        onChange={setCurrent}
        visible={showCurrent}
        onToggle={() => setShowCurrent((v) => !v)}
        error={errors.current}
      />
      <PasswordField
        label="Nouveau mot de passe"
        value={next}
        onChange={setNext}
        visible={showNext}
        onToggle={() => setShowNext((v) => !v)}
        error={errors.next}
      />

      {next ? (
        <View style={s.strengthWrap}>
          <View style={s.barsRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  s.bar,
                  {
                    backgroundColor:
                      i < strength ? strengthColor : colors.borderLight,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[s.strengthLabel, { color: strengthColor }]}>
            {strengthLabel}
          </Text>
        </View>
      ) : null}

      <PasswordField
        label="Confirmer le nouveau mot de passe"
        value={confirm}
        onChange={setConfirm}
        visible={showConfirm}
        onToggle={() => setShowConfirm((v) => !v)}
        error={errors.confirm}
      />

      <View style={s.rulesCard}>
        <Text style={s.rulesTitle}>Le mot de passe doit contenir :</Text>
        {[
          { ok: next.length >= 8, txt: "Au moins 8 caractères" },
          { ok: /[A-Z]/.test(next), txt: "Une majuscule" },
          { ok: /[a-z]/.test(next), txt: "Une minuscule" },
          { ok: /\d/.test(next), txt: "Un chiffre" },
          { ok: /[^A-Za-z0-9]/.test(next), txt: "Un caractère spécial" },
        ].map((r, i) => (
          <View key={i} style={s.ruleRow}>
            <Ionicons
              name={r.ok ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={r.ok ? colors.success : colors.textMuted}
            />
            <Text
              style={[
                s.ruleText,
                { color: r.ok ? colors.text : colors.textMuted },
              ]}
            >
              {r.txt}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[mStyles.saveBtn, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={mStyles.saveText}>Changer le mot de passe</Text>
        )}
      </TouchableOpacity>
    </ModalWrapper>
  );
};

const s = StyleSheet.create({
  inputWrap: { position: "relative" },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingRight: 48,
    fontSize: fontSize.base,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  eye: {
    position: "absolute",
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  strengthWrap: { marginTop: -spacing.sm, marginBottom: spacing.md },
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
});
