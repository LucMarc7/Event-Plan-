// src/components/profile/modals/AccountDetailsModal.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { updateProfile } from "../../../../src/api/profile";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../../../../src/theme/tokens";
import { ModalWrapper, styles as mStyles } from "./ModalWrapper";

const PROFILE_CACHE_KEY = "userProfileCache";

const GENDERS = ["Homme", "Femme", "Autre", "Ne pas préciser"];

// ═══════════════════════════════════════════════════════════════
// ✅ Field déplacé HORS du composant (fix clavier qui se ferme)
// ═══════════════════════════════════════════════════════════════
const Field = ({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  autoCapitalize,
  error,
  multiline,
  maxLength,
}: any) => (
  <View style={mStyles.inputGroup}>
    <Text style={mStyles.label}>{label}</Text>
    <TextInput
      style={[
        mStyles.input,
        error && mStyles.inputError,
        multiline && {
          height: 96,
          paddingTop: spacing.md,
          textAlignVertical: "top",
        },
      ]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      multiline={multiline}
      maxLength={maxLength}
    />
    {error ? <Text style={mStyles.errorText}>{error}</Text> : null}
  </View>
);

export const AccountDetailsModal = ({
  visible,
  onClose,
  user,
  onUpdate,
}: {
  visible: boolean;
  onClose: () => void;
  user: any;
  onUpdate: (u: any) => void;
}) => {
  const p = user?.profile || {};
  const [firstName, setFirstName] = useState(p.first_name || "");
  const [lastName, setLastName] = useState(p.last_name || "");
  const [email, setEmail] = useState(p.email || "");
  const [phone, setPhone] = useState(p.phone || "");
  const [birthdate, setBirthdate] = useState(p.birthdate || "");
  const [gender, setGender] = useState(p.gender || "");
  const [country, setCountry] = useState(p.country || "");
  const [city, setCity] = useState(p.city || "");
  const [profession, setProfession] = useState(p.profession || "");
  const [bio, setBio] = useState(p.bio || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const e: any = {};
    if (!firstName.trim()) e.firstName = "Requis";
    if (!lastName.trim()) e.lastName = "Requis";
    if (!email.trim()) e.email = "Requis";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Email invalide";
    if (phone && !/^[+]?[\d\s()-]{6,20}$/.test(phone))
      e.phone = "Numéro invalide";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        birthdate,
        gender,
        country,
        city,
        profession,
        bio,
      };
      const res = await updateProfile(payload);
      if (res.success) {
        const updated = {
          ...user,
          profile: { ...user.profile, ...payload },
        };
        onUpdate(updated);
        await AsyncStorage.setItem(
          PROFILE_CACHE_KEY,
          JSON.stringify({ data: updated, timestamp: Date.now() }),
        );
        Toast.show({ type: "success", text1: "Profil mis à jour" });
        onClose();
      } else {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: res.message || "Échec",
        });
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Erreur réseau" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Détails du compte"
      subtitle="Vos informations personnelles"
    >
      {/* Aperçu avatar */}
      <View style={s.avatarPreview}>
        {p.profile_image ? (
          <Image source={{ uri: p.profile_image }} style={s.avatarImg} />
        ) : (
          <View style={[s.avatarImg, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.avatarName}>
            {firstName} {lastName}
          </Text>
          <Text style={s.avatarHint}>
            Gérez votre photo depuis l écran principal
          </Text>
        </View>
      </View>

      {/* Identité */}
      <Text style={mStyles.label}>Identité</Text>
      <Field
        label="Prénom"
        value={firstName}
        onChange={setFirstName}
        placeholder="Votre prénom"
        error={errors.firstName}
      />
      <Field
        label="Nom"
        value={lastName}
        onChange={setLastName}
        placeholder="Votre nom"
        error={errors.lastName}
      />

      {/* Genre */}
      <View style={mStyles.inputGroup}>
        <Text style={mStyles.label}>Genre</Text>
        <View style={s.chipsRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g)}
              style={[s.chip, gender === g && s.chipActive]}
            >
              <Text style={[s.chipText, gender === g && s.chipTextActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Field
        label="Date de naissance"
        value={birthdate}
        onChange={setBirthdate}
        placeholder="AAAA-MM-JJ"
        keyboardType="numbers-and-punctuation"
      />

      {/* Contact */}
      <Text style={[mStyles.label, { marginTop: spacing.md }]}>Contact</Text>
      <Field
        label="Email"
        value={email}
        onChange={setEmail}
        placeholder="votre@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />
      <Field
        label="Téléphone"
        value={phone}
        onChange={setPhone}
        placeholder="+243 81 23 45 67"
        keyboardType="phone-pad"
        error={errors.phone}
      />

      {/* Localisation */}
      <Text style={[mStyles.label, { marginTop: spacing.md }]}>
        Localisation
      </Text>
      <Field
        label="Pays"
        value={country}
        onChange={setCountry}
        placeholder="Ex: RD Congo"
      />
      <Field
        label="Ville"
        value={city}
        onChange={setCity}
        placeholder="Ex: Kinshasa"
      />

      {/* Pro */}
      <Text style={[mStyles.label, { marginTop: spacing.md }]}>
        Professionnel
      </Text>
      <Field
        label="Profession"
        value={profession}
        onChange={setProfession}
        placeholder="Ex: Chef de projet"
      />
      <Field
        label="Bio"
        value={bio}
        onChange={setBio}
        placeholder="Parlez-nous de vous en quelques mots…"
        multiline
        maxLength={200}
      />
      <Text style={mStyles.help}>{bio.length}/200 caractères</Text>

      <TouchableOpacity
        style={[mStyles.saveBtn, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={mStyles.saveText}>Enregistrer</Text>
        )}
      </TouchableOpacity>
    </ModalWrapper>
  );
};

const s = StyleSheet.create({
  avatarPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  avatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  avatarHint: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  chipTextActive: { color: colors.primary, fontWeight: fontWeight.bold },
});
