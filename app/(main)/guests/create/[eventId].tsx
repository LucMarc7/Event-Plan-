import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { createGuest } from "../../../../src/api/invitations";
import {
  showToasts_error,
  showToasts_success,
} from "../../../../src/components/Alerts/alerts";
// ✅ NOUVEAU — interception 402
import { UpgradeModal } from "../../../../src/components/subscription/UpgradeModal";
import { useSubscription } from "../../../../src/hooks/useSubscription";

const COLORS = {
  bg: "#E5E7EB",
  card: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  label: "#374151",
  border: "#D1D5DB",
  borderFocus: "#9CA3AF",
  pillActiveBg: "#FFFFFF",
  lime: "#D9F99D",
  limeText: "#111827",
  grayBtn: "#F3F4F6",
  grayBtnText: "#374151",
  success: "#22C55E",
};

const CreateGuest = ({ id }: { id: string }) => {
  const { width } = useWindowDimensions();
  const textInputWidth = width < 360 ? wp(82) : wp(78);

  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [name2, setName2] = useState("");
  const [place, setPlace] = useState("");
  const [tele, setTele] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ✅ NOUVEAU — Plan + modale upgrade
  const { plan: currentPlan } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{
    visible: boolean;
    message?: string;
  }>({ visible: false });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onSubmit = useCallback(async () => {
    setLoading(true);
    const fullData = {
      invitation_type: type,
      first_person: name,
      second_person: name2,
      email: email,
      tel: tele,
      place: place,
      event_id: id,
    };
    try {
      await createGuest(fullData, id);
      showToasts_success("Invitation créée avec succès");
      routerRef.current.push({
        pathname: "/guests/[eventId]",
        params: { eventId: id },
      });
    } catch (error: any) {
      const status = error?.response?.status;
      const body = error?.response?.data || {};

      // ✅ INTERCEPTION UPGRADE
      if (status === 402 && body.need_upgrade) {
        setUpgradeModal({
          visible: true,
          message:
            body.error ||
            "Vous avez atteint la limite d'invités de votre plan.",
        });
        return;
      }

      if (error.message === "Network Error") {
        showToasts_error("Erreur lors de la création de l'invitation");
      } else {
        showToasts_error("Une erreur est survenue, veuillez réessayer");
      }
    } finally {
      setLoading(false);
    }
  }, [type, name, name2, email, tele, place, id]);

  const inputStyle = (field: string) => [
    styles.input,
    { width: textInputWidth },
    focusedField === field && styles.inputFocused,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      <View style={styles.topBar}>
        <Pressable
          style={styles.backBtn}
          onPress={() => routerRef.current.back()}
        >
          <Ionicons name="chevron-back" size={hp(2.6)} color={COLORS.text} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? hp(4) : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.card,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.stepLabel}>Nouvel invité</Text>
                <View style={styles.progressBar} />
                <Text style={styles.title}>Ajouter un invité</Text>
                <Text style={styles.subtitle}>
                  Créez une nouvelle invitation pour votre événement
                </Text>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nom de l'invité principal</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={inputStyle("name")}
                  placeholder="Prénom et nom (ex: David Make)"
                  placeholderTextColor={COLORS.textSecondary}
                  cursorColor={COLORS.text}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nom de l'invité 2 (optionnel)</Text>
                <TextInput
                  value={name2}
                  onChangeText={setName2}
                  style={inputStyle("name2")}
                  placeholder="Prénom et nom"
                  placeholderTextColor={COLORS.textSecondary}
                  cursorColor={COLORS.text}
                  autoCapitalize="words"
                  onFocus={() => setFocusedField("name2")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Catégorie</Text>
                <View style={styles.pillRow}>
                  {["COUPLE", "SINGLETON"].map((cat) => {
                    const active = type === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.pill, active && styles.pillActive]}
                        onPress={() => setType(cat)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={active ? "checkmark-circle" : "ellipse-outline"}
                          size={hp(2.2)}
                          color={active ? COLORS.success : COLORS.border}
                        />
                        <Text
                          style={[
                            styles.pillText,
                            active && styles.pillTextActive,
                          ]}
                        >
                          {cat === "COUPLE" ? "Couple" : "Célibataire"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Téléphone</Text>
                <TextInput
                  value={tele}
                  onChangeText={setTele}
                  style={inputStyle("tele")}
                  placeholder="Numéro de téléphone"
                  placeholderTextColor={COLORS.textSecondary}
                  cursorColor={COLORS.text}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedField("tele")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Adresse email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={inputStyle("email")}
                  placeholder="email@exemple.com"
                  placeholderTextColor={COLORS.textSecondary}
                  cursorColor={COLORS.text}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Table / Emplacement</Text>
                <TextInput
                  value={place}
                  onChangeText={setPlace}
                  style={inputStyle("place")}
                  placeholder="Ex: Table Genèse, VIP 1..."
                  placeholderTextColor={COLORS.textSecondary}
                  cursorColor={COLORS.text}
                  onFocus={() => setFocusedField("place")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => routerRef.current.back()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnSecondaryText}>Retour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btnPrimary,
                    (!name.trim() || !type || loading) &&
                      styles.btnPrimaryDisabled,
                  ]}
                  onPress={onSubmit}
                  disabled={!name.trim() || !type || loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.limeText} size="small" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Créer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* ✅ NOUVEAU — Modale d'upgrade */}
      <UpgradeModal
        visible={upgradeModal.visible}
        onClose={() => setUpgradeModal({ visible: false })}
        message={upgradeModal.message}
        featureName="Ajouter un invité"
        currentPlan={currentPlan}
        recommendedPlan="standard"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: { paddingTop: hp(5), paddingHorizontal: wp(5), paddingBottom: hp(1) },
  backBtn: {
    width: hp(4.2),
    height: hp(4.2),
    borderRadius: hp(1.2),
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(4),
    paddingBottom: hp(6),
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    paddingVertical: hp(4),
    paddingHorizontal: wp(6),
    width: "100%",
    maxWidth: 520,
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 5,
  },
  cardHeader: { marginBottom: hp(2.5) },
  stepLabel: {
    fontSize: hp(1.5),
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: hp(1),
  },
  progressBar: {
    width: wp(12),
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.lime,
    marginBottom: hp(2),
  },
  title: {
    fontSize: hp(2.6),
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: -0.4,
    marginBottom: hp(0.8),
  },
  subtitle: {
    fontSize: hp(1.6),
    color: COLORS.textSecondary,
    lineHeight: hp(2.4),
  },
  fieldGroup: { marginBottom: hp(2.2) },
  label: {
    fontSize: hp(1.5),
    fontWeight: "600",
    color: COLORS.label,
    marginBottom: hp(0.9),
  },
  input: {
    height: hp(5.8),
    fontSize: hp(1.85),
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: wp(4),
    backgroundColor: COLORS.card,
  },
  inputFocused: { borderColor: COLORS.borderFocus },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: wp(2.5) },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.5),
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3.5),
    backgroundColor: COLORS.card,
  },
  pillActive: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.pillActiveBg,
  },
  pillText: { fontSize: hp(1.7), fontWeight: "500", color: COLORS.label },
  pillTextActive: { fontWeight: "700", color: COLORS.text },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: wp(2.5),
    marginTop: hp(2),
  },
  btnSecondary: {
    backgroundColor: COLORS.grayBtn,
    borderRadius: 12,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
  },
  btnSecondaryText: {
    fontSize: hp(1.7),
    fontWeight: "600",
    color: COLORS.grayBtnText,
  },
  btnPrimary: {
    backgroundColor: COLORS.lime,
    borderRadius: 12,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    shadowColor: "rgba(0,0,0,0.06)",
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  btnPrimaryDisabled: { opacity: 0.45 },
  btnPrimaryText: {
    fontSize: hp(1.7),
    fontWeight: "700",
    color: COLORS.limeText,
  },
});

export default CreateGuest;
