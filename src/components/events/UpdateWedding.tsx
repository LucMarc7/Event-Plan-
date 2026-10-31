// src/components/events/UpdateWedding.tsx
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
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

// ⚠️ Adapte selon ton fichier API
import { readEvent, updateEvent } from "../../api/events";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing,
} from "../../theme/tokens";

const UpdateWedding = ({ id }: { id: string }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [mari, setMari] = useState("");
  const [femme, setFemme] = useState("");
  const [date, setDate] = useState(new Date());
  const [heureDebut, setHeureDebut] = useState(new Date());
  const [heureFin, setHeureFin] = useState(new Date());
  const [salle, setSalle] = useState("");
  const [ville, setVille] = useState("");
  const [commune, setCommune] = useState("");
  const [avenue, setAvenue] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");

  const [showDate, setShowDate] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const d = await readEvent(id);
        setName(d?.name || d?.title || "");
        setMari(d?.mari || "");
        setFemme(d?.femme || "");
        setSalle(d?.salle || "");
        setVille(d?.ville || "");
        setCommune(d?.commune || "");
        setAvenue(d?.avenue || "");
        setReference(d?.reference || "");
        setDescription(d?.description || "");
        if (d?.date) setDate(new Date(d.date));
        if (d?.heure_debut)
          setHeureDebut(dayjs(`2000-01-01T${d.heure_debut}`).toDate());
        if (d?.heure_fin)
          setHeureFin(dayjs(`2000-01-01T${d.heure_fin}`).toDate());
      } catch {
        Toast.show({ type: "error", text1: "Erreur de chargement" });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Toast.show({ type: "error", text1: "Le nom est requis" });
      return;
    }
    setSaving(true);
    try {
      await updateEvent(
        {
          name: name.trim(),
          mari: mari.trim(),
          femme: femme.trim(),
          date: dayjs(date).format("YYYY-MM-DD"),
          heure_debut: dayjs(heureDebut).format("HH:mm"),
          heure_fin: dayjs(heureFin).format("HH:mm"),
          salle: salle.trim(),
          ville: ville.trim(),
          commune: commune.trim(),
          avenue: avenue.trim(),
          reference: reference.trim(),
          description: description.trim(),
        },
        id,
      );
      Toast.show({ type: "success", text1: "Événement mis à jour" });
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier l'événement</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Infos générales */}
          <Text style={styles.sectionLabel}>Informations générales</Text>
          <View style={styles.card}>
            <Field
              icon="type"
              label="Nom de l'événement"
              value={name}
              onChangeText={setName}
              placeholder="Ex : Mariage de..."
            />
            <Divider />
            <Field
              icon="user"
              label="Nom du marié"
              value={mari}
              onChangeText={setMari}
              placeholder="Ex : Jules M'biye"
            />
            <Divider />
            <Field
              icon="user"
              label="Nom de la mariée"
              value={femme}
              onChangeText={setFemme}
              placeholder="Ex : Joëlle Bamua"
            />
          </View>

          {/* Date & heure */}
          <Text style={styles.sectionLabel}>Date et heure</Text>
          <View style={styles.card}>
            <TouchableRow
              icon="calendar"
              label="Date"
              value={dayjs(date).format("DD MMM YYYY")}
              onPress={() => setShowDate(true)}
            />
            <Divider />
            <TouchableRow
              icon="clock"
              label="Heure de début"
              value={dayjs(heureDebut).format("HH:mm")}
              onPress={() => setShowStart(true)}
            />
            <Divider />
            <TouchableRow
              icon="clock"
              label="Heure de fin"
              value={dayjs(heureFin).format("HH:mm")}
              onPress={() => setShowEnd(true)}
            />
          </View>

          {/* Lieu */}
          <Text style={styles.sectionLabel}>Lieu</Text>
          <View style={styles.card}>
            <Field
              icon="home"
              label="Salle"
              value={salle}
              onChangeText={setSalle}
              placeholder="Ex : Salle Royale"
            />
            <Divider />
            <Field
              icon="map-pin"
              label="Ville"
              value={ville}
              onChangeText={setVille}
              placeholder="Ex : Kinshasa"
            />
            <Divider />
            <Field
              icon="map"
              label="Commune"
              value={commune}
              onChangeText={setCommune}
              placeholder="Ex : Gombe"
            />
            <Divider />
            <Field
              icon="navigation"
              label="Avenue"
              value={avenue}
              onChangeText={setAvenue}
              placeholder="Ex : Avenue de la Paix"
            />
            <Divider />
            <Field
              icon="bookmark"
              label="Référence"
              value={reference}
              onChangeText={setReference}
              placeholder="Ex : En face de..."
            />
          </View>

          {/* Description */}
          <Text style={styles.sectionLabel}>Description</Text>
          <View style={styles.card}>
            <View style={{ padding: spacing.md }}>
              <TextInput
                style={styles.textarea}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez votre événement…"
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
                maxLength={400}
              />
              <Text style={styles.counter}>{description.length}/400</Text>
            </View>
          </View>

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
                <Text style={styles.submitText}>Enregistrer</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        {/* Pickers */}
        {showDate && (
          <DateTimePicker
            value={date}
            mode="date"
            onChange={(_, d) => {
              setShowDate(false);
              if (d) setDate(d);
            }}
          />
        )}
        {showStart && (
          <DateTimePicker
            value={heureDebut}
            mode="time"
            is24Hour
            onChange={(_, d) => {
              setShowStart(false);
              if (d) setHeureDebut(d);
            }}
          />
        )}
        {showEnd && (
          <DateTimePicker
            value={heureFin}
            mode="time"
            is24Hour
            onChange={(_, d) => {
              setShowEnd(false);
              if (d) setHeureFin(d);
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Sous-composants ───
const Field = ({ icon, label, value, onChangeText, placeholder }: any) => (
  <View style={styles.fieldRow}>
    <View style={styles.fieldIcon}>
      <Feather name={icon} size={16} color={colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  </View>
);

const TouchableRow = ({ icon, label, value, onPress }: any) => (
  <TouchableOpacity
    style={styles.fieldRow}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.fieldIcon}>
      <Feather name={icon} size={16} color={colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
    <Feather name="chevron-right" size={18} color={colors.textMuted} />
  </TouchableOpacity>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 78 },
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
    backgroundColor: colors.primarySoft,
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
  fieldValue: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  textarea: {
    minHeight: 100,
    fontSize: fontSize.base,
    color: colors.text,
  },
  counter: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: spacing.xs,
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

export default UpdateWedding;
