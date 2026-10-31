// src/components/guests/UpdateGuest.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

// ⚠️ Adapte les imports selon tes fichiers API/design existants
import { readInvitation, updateGuest } from "../../api/invitations";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing,
} from "../../theme/tokens";

const CATEGORIES = [
  { value: "SINGLETON", label: "Célibataire", icon: "user" },
  { value: "COUPLE", label: "Couple", icon: "users" },
] as const;

const UpdateGuest = ({ id }: { id: string }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<string>("SINGLETON");
  const [name, setName] = useState("");
  const [name2, setName2] = useState("");
  const [place, setPlace] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await readInvitation(id);
        setName(data?.first_person || "");
        setName2(data?.second_person || "");
        setTel(data?.tel || "");
        setEmail(data?.email || "");
        setPlace(data?.place || "");
        setType(data?.invitation_type || "SINGLETON");
      } catch (e) {
        setError("Impossible de charger l'invitation.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({ type: "error", text1: "Le nom est requis" });
      return;
    }
    if (type === "COUPLE" && !name2.trim()) {
      Toast.show({
        type: "error",
        text1: "Le nom du 2ème invité est requis pour un couple",
      });
      return;
    }

    setSaving(true);
    try {
      await updateGuest(
        {
          invitation_type: type,
          first_person: name.trim(),
          second_person: name2.trim(),
          email: email.trim(),
          tel: tel.trim(),
          place: place.trim(),
        },
        id,
      );
      Toast.show({ type: "success", text1: "Invitation mise à jour" });
      router.back();
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Échec",
        text2: e?.response?.data?.error || "Erreur lors de la mise à jour",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier l'invitation</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <View style={styles.intro}>
            <Feather name="info" size={16} color={colors.primary} />
            <Text style={styles.introText}>
              Enregistrez les invités avec leur prénom suivi du nom (ex : David
              Make).
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Catégorie */}
          <Text style={styles.sectionLabel}>Catégorie</Text>
          <View style={styles.categoriesRow}>
            {CATEGORIES.map((cat) => {
              const active = type === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.catCard, active && styles.catCardActive]}
                  onPress={() => setType(cat.value)}
                  activeOpacity={0.85}
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
                      active && { color: colors.primary, fontWeight: "700" },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Identité */}
          <Text style={styles.sectionLabel}>Identité</Text>
          <View style={styles.card}>
            <Field
              icon="user"
              label="Nom de l'invité (1)"
              value={name}
              onChangeText={setName}
              placeholder="Ex : David Make"
            />
            <View style={styles.divider} />
            <Field
              icon="users"
              label="Nom de l'invité (2)"
              value={name2}
              onChangeText={setName2}
              placeholder={
                type === "COUPLE" ? "Requis pour un couple" : "Optionnel"
              }
              disabled={type !== "COUPLE"}
            />
          </View>

          {/* Contact */}
          <Text style={styles.sectionLabel}>Contact</Text>
          <View style={styles.card}>
            <Field
              icon="phone"
              label="Téléphone"
              value={tel}
              onChangeText={setTel}
              placeholder="+243 81 23 45 67"
              keyboardType="phone-pad"
            />
            <View style={styles.divider} />
            <Field
              icon="mail"
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="invite@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Place */}
          <Text style={styles.sectionLabel}>Emplacement</Text>
          <View style={styles.card}>
            <Field
              icon="map-pin"
              label="Table / Place"
              value={place}
              onChangeText={setPlace}
              placeholder="Ex : Table 5"
            />
          </View>

          {/* Submit */}
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
                <Feather name="check" size={18} color="#FFF" />
                <Text style={styles.submitText}>
                  Enregistrer les modifications
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Field réutilisable ───
const Field = ({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  disabled,
}: any) => (
  <View style={styles.fieldRow}>
    <View
      style={[
        styles.fieldIcon,
        { backgroundColor: disabled ? colors.surfaceAlt : colors.primarySoft },
      ]}
    >
      <Feather
        name={icon}
        size={16}
        color={disabled ? colors.textMuted : colors.primary}
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, disabled && { color: colors.textMuted }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={!disabled}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: { color: colors.textSecondary, fontSize: fontSize.sm },

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
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },

  scroll: { padding: spacing.lg, paddingTop: 0 },

  intro: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  introText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.errorSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.error,
    fontWeight: fontWeight.semibold,
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

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 78,
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  fieldIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  fieldInput: {
    fontSize: fontSize.base,
    color: colors.text,
    paddingVertical: 0,
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

export default UpdateGuest;
