// app/(main)/events/conference/create.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { SafeAreaView } from "react-native-safe-area-context";
import { createEvent } from "../../../../src/api/events";
import TicketBillingStep, {
  BillingMode,
  TicketCategory,
} from "../../../../src/components/events/TicketBillingStep";
import { UpgradeModal } from "../../../../src/components/subscription/UpgradeModal";
import { useSubscription } from "../../../../src/hooks/useSubscription";

type FormData = {
  name: string;
  theme_conference: string;
  description: string;
  salle: string;
  ville: string;
  avenue: string;
  commune: string;
  reference: string;
};

const THEME = {
  bg: "#F2F2F7",
  card: "#FFFFFF",
  primary: "#1C1C1E",
  accent: "#2563EB",
  success: "#34C759",
  danger: "#FF3B30",
  text: "#1C1C1E",
  textSecondary: "#8E8E93",
  border: "#E5E5EA",
  inputBg: "#F2F2F7",
  placeholder: "#C7C7CC",
};

type PickerType = "date" | "startTime" | "endTime" | null;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CalendarModal = ({
  visible,
  currentDate,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  currentDate: Date;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
}) => {
  const [viewDate, setViewDate] = useState(new Date(currentDate));
  const [selectedDate, setSelectedDate] = useState(new Date(currentDate));
  const [mode, setMode] = useState<"calendar" | "year">("calendar");

  useEffect(() => {
    if (visible) {
      setViewDate(new Date(currentDate));
      setSelectedDate(new Date(currentDate));
      setMode("calendar");
    }
  }, [visible, currentDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const selectDay = (day: number) =>
    setSelectedDate(new Date(year, month, day));

  const isSelected = (day: number) =>
    selectedDate.getDate() === day &&
    selectedDate.getMonth() === month &&
    selectedDate.getFullYear() === year;

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={calStyles.overlay}>
        <View style={calStyles.card}>
          {mode === "calendar" ? (
            <>
              <View style={calStyles.header}>
                <TouchableOpacity onPress={prevMonth} activeOpacity={0.7}>
                  <Ionicons
                    name="chevron-back"
                    size={hp(2.4)}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMode("year")}
                  activeOpacity={0.7}
                >
                  <Text style={calStyles.title}>
                    {MONTH_NAMES[month]} {year}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={nextMonth} activeOpacity={0.7}>
                  <Ionicons
                    name="chevron-forward"
                    size={hp(2.4)}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              <View style={calStyles.weekRow}>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <Text key={d} style={calStyles.weekDay}>
                    {d}
                  </Text>
                ))}
              </View>
              <View style={calStyles.daysGrid}>
                {days.map((day, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      calStyles.dayCell,
                      day && isSelected(day) && calStyles.dayCellSelected,
                    ]}
                    onPress={() => day && selectDay(day)}
                    activeOpacity={day ? 0.7 : 1}
                    disabled={!day}
                  >
                    {day ? (
                      <Text
                        style={[
                          calStyles.dayText,
                          isSelected(day) && calStyles.dayTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text style={calStyles.yearHeader}>Choisir l‘année</Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={calStyles.yearGrid}
              >
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[
                      calStyles.yearCell,
                      y === year && calStyles.yearCellSelected,
                    ]}
                    onPress={() => {
                      setViewDate(new Date(y, month, 1));
                      setMode("calendar");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        calStyles.yearText,
                        y === year && calStyles.yearTextSelected,
                      ]}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
          <View style={calStyles.footer}>
            <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
              <Text style={calStyles.cancel}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={calStyles.confirmBtn}
              onPress={() => onConfirm(new Date(selectedDate))}
              activeOpacity={0.85}
            >
              <Text style={calStyles.confirmText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const TimeModal = ({
  visible,
  title,
  currentDate,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  currentDate: Date;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
}) => {
  const [hour, setHour] = useState(currentDate.getHours());
  const [minute, setMinute] = useState(currentDate.getMinutes());

  useEffect(() => {
    if (visible) {
      setHour(currentDate.getHours());
      setMinute(currentDate.getMinutes());
    }
  }, [visible, currentDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleConfirm = () => {
    const d = new Date(currentDate);
    d.setHours(hour);
    d.setMinutes(minute);
    onConfirm(d);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={calStyles.overlay}>
        <View style={[calStyles.card, { paddingVertical: hp(3) }]}>
          <Text style={calStyles.timeTitle}>{title}</Text>
          <View style={calStyles.timeRow}>
            <ScrollView
              style={calStyles.timeColumn}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: hp(1) }}
            >
              {hours.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[
                    calStyles.timeItem,
                    hour === h && calStyles.timeItemActive,
                  ]}
                  onPress={() => setHour(h)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      calStyles.timeItemText,
                      hour === h && calStyles.timeItemTextActive,
                    ]}
                  >
                    {h.toString().padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={calStyles.timeColon}>:</Text>
            <ScrollView
              style={calStyles.timeColumn}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: hp(1) }}
            >
              {minutes.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    calStyles.timeItem,
                    minute === m && calStyles.timeItemActive,
                  ]}
                  onPress={() => setMinute(m)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      calStyles.timeItemText,
                      minute === m && calStyles.timeItemTextActive,
                    ]}
                  >
                    {m.toString().padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={calStyles.footer}>
            <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
              <Text style={calStyles.cancel}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={calStyles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={calStyles.confirmText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const CreateConference = () => {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [heure_debut, setHeureDebut] = useState(new Date());
  const [heure_fin, setHeureFin] = useState(new Date());
  const [activePicker, setActivePicker] = useState<PickerType>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [inputTouched, setInputTouched] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // ✅ Billetterie
  const [billingMode, setBillingMode] = useState<BillingMode>("free");
  const [categories, setCategories] = useState<TicketCategory[]>([
    {
      id: `cat-${Date.now()}`,
      name: "Ticket Standard",
      price: "0",
      quantity_total: "0",
      commission_rate: "10",
    },
  ]);
  const [freeQuantity, setFreeQuantity] = useState("0");

  const { plan: currentPlan } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{
    visible: boolean;
    message?: string;
  }>({ visible: false });

  const [resultModal, setResultModal] = useState<{
    visible: boolean;
    status: "loading" | "success" | "error";
    message: string;
    eventName?: string;
    eventCode?: string;
  }>({ visible: false, status: "loading", message: "" });

  const routerRef = useRef(router);
  routerRef.current = router;

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    let finalDescription = data.description ? data.description.trim() : "";
    if (finalDescription.length > 255)
      finalDescription = finalDescription.substring(0, 255);

    const locationParts = [
      data.salle?.trim(),
      data.ville?.trim(),
      data.commune?.trim(),
      data.avenue?.trim(),
      data.reference?.trim(),
    ].filter(Boolean);
    const location = locationParts.join(", ");

    // ✅ Construire les catégories + total_access
    let categoriesPayload: any[] = [];
    let totalAccess = 0;

    if (billingMode === "free") {
      const qty = parseInt(freeQuantity) || 0;
      totalAccess = qty;
      categoriesPayload = [
        {
          name: "Entrée gratuite",
          price: 0,
          quantity_total: qty,
          commission_rate: 0,
        },
      ];
    } else {
      totalAccess = categories.reduce(
        (sum, c) => sum + (parseInt(c.quantity_total) || 0),
        0,
      );
      categoriesPayload = categories.map((c) => ({
        name: c.name.trim() || "Standard",
        price: parseFloat(c.price) || 0,
        quantity_total: parseInt(c.quantity_total) || 0,
        commission_rate: parseFloat(c.commission_rate) || 10,
      }));
    }

    const formData = new FormData();
    formData.append("title", data.name.trim());
    formData.append("date", dayjs(date).format("YYYY-MM-DD"));
    formData.append("event_category", "Conference");
    formData.append("total_access", String(totalAccess));
    formData.append("location", location || "Non renseigné");
    formData.append("description", finalDescription);
    formData.append("heure_debut", dayjs(heure_debut).format("HH:mm"));
    formData.append("heure_fin", dayjs(heure_fin).format("HH:mm"));
    formData.append("theme_conference", data.theme_conference?.trim() || "");
    formData.append("salle", data.salle?.trim() || "");
    formData.append("ville", data.ville?.trim() || "");
    formData.append("commune", data.commune?.trim() || "");
    formData.append("avenue", data.avenue?.trim() || "");
    formData.append("reference", data.reference?.trim() || "");
    formData.append("categories", JSON.stringify(categoriesPayload));

    setResultModal({
      visible: true,
      status: "loading",
      message: "Création de votre conférence…",
      eventName: data.name.trim(),
    });

    try {
      setLoading(true);
      const createdEvent: any = await createEvent(formData);
      const newId =
        createdEvent?.id ||
        createdEvent?.uuid ||
        createdEvent?.event_id ||
        null;
      const code =
        createdEvent?.event_code ||
        createdEvent?.code_event ||
        createdEvent?.code ||
        "—";

      setCreatedEventId(newId);
      setResultModal({
        visible: true,
        status: "success",
        message: "Votre conférence a été créée avec succès.",
        eventName: data.name.trim(),
        eventCode: String(code),
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const body = err?.response?.data || {};

      if (status === 402 && body.need_upgrade) {
        setResultModal((r) => ({ ...r, visible: false }));
        setUpgradeModal({
          visible: true,
          message:
            body.error ||
            "Vous avez atteint la limite d'événements de votre plan.",
        });
        return;
      }

      const serverMessage =
        body.message ||
        body.error ||
        body.detail ||
        `Erreur ${status || "réseau"}`;
      setResultModal({
        visible: true,
        status: "error",
        message: String(serverMessage),
        eventName: data.name.trim(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToThemes = () => {
    if (!createdEventId) {
      setResultModal((r) => ({ ...r, visible: false }));
      routerRef.current.replace("/(main)/home");
      return;
    }
    setResultModal((r) => ({ ...r, visible: false }));
    routerRef.current.replace({
      pathname: "/(main)/guests/themes/[eventId]",
      params: { eventId: String(createdEventId) },
    });
  };

  const handleCloseSuccess = () => {
    setResultModal((r) => ({ ...r, visible: false }));
    routerRef.current.replace("/(main)/home");
  };

  const handleRetry = () => {
    setResultModal((r) => ({ ...r, visible: false }));
    setStep(5);
  };

  const openPicker = (type: PickerType) => setActivePicker(type);
  const cancelPicker = () => setActivePicker(null);
  const handleDateConfirm = (d: Date) => {
    setDate(d);
    setActivePicker(null);
  };
  const handleStartConfirm = (d: Date) => {
    setHeureDebut(d);
    setActivePicker(null);
  };
  const handleEndConfirm = (d: Date) => {
    setHeureFin(d);
    setActivePicker(null);
  };

  const validateStep = async () => {
    if (step === 1) {
      const v = getValues();
      if (!v.name) return false;
    }
    if (step === 2) {
      const v = getValues();
      if (!v.salle) return false;
    }
    if (step === 3) {
      const v = getValues();
      if (!v.ville || !v.commune || !v.avenue) return false;
    }
    if (step === 4) {
      if (billingMode === "free") {
        if (!freeQuantity || parseInt(freeQuantity) <= 0) return false;
      } else {
        for (const c of categories) {
          if (!c.name.trim()) return false;
          if (!c.quantity_total || parseInt(c.quantity_total) <= 0)
            return false;
        }
      }
    }
    return true;
  };

  const nextStep = async () => {
    const ok = await validateStep();
    if (!ok) return;
    setStep((s) => s + 1);
  };
  const prevStep = () => setStep((s) => (s > 1 ? s - 1 : s));
  const totalSteps = 5;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => routerRef.current.back()}
          >
            <Ionicons name="chevron-back" size={hp(2.8)} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer une conférence</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${(step / totalSteps) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Étape {step}{" "}
            <Text style={styles.progressTotal}>sur {totalSteps}</Text>
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* ÉTAPE 1 : thème */}
            {step === 1 && (
              <>
                <View style={styles.stepHeader}>
                  <View
                    style={[
                      styles.stepIconCircle,
                      { backgroundColor: "#DBEAFE" },
                    ]}
                  >
                    <Ionicons name="mic" size={hp(2.6)} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.stepTitle}>Le thème</Text>
                    <Text style={styles.stepSubtitle}>
                      De quoi parle votre conférence ?
                    </Text>
                  </View>
                </View>

                <Controller
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Nom de l‘événement</Text>
                      <TextInput
                        placeholder="Ex: Conférence Tech Africa 2026"
                        style={[
                          styles.input,
                          (errors.name || (inputTouched.name && !value)) &&
                            styles.inputError,
                        ]}
                        onBlur={() => {
                          setInputTouched((p) => ({ ...p, name: true }));
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        placeholderTextColor={THEME.placeholder}
                      />
                    </View>
                  )}
                  name="name"
                />
                {errors.name && (
                  <Text style={styles.errorText}>
                    Ce champ est obligatoire.
                  </Text>
                )}

                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Sous-titre / Thème</Text>
                      <TextInput
                        placeholder="Ex: L‘IA au service du développement"
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholderTextColor={THEME.placeholder}
                      />
                    </View>
                  )}
                  name="theme_conference"
                />

                <TouchableOpacity style={styles.primaryBtn} onPress={nextStep}>
                  <Text style={styles.primaryBtnText}>Continuer</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={hp(2.2)}
                    color="#fff"
                    style={{ marginLeft: wp(2) }}
                  />
                </TouchableOpacity>
              </>
            )}

            {/* ÉTAPE 2 : date & salle */}
            {step === 2 && (
              <>
                <View style={styles.stepHeader}>
                  <View
                    style={[
                      styles.stepIconCircle,
                      { backgroundColor: "#FEF3C7" },
                    ]}
                  >
                    <Ionicons name="calendar" size={hp(2.6)} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={styles.stepTitle}>Date & Salle</Text>
                    <Text style={styles.stepSubtitle}>
                      Quand et où se déroule la conférence ?
                    </Text>
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>Date de l‘événement</Text>
                  <TouchableOpacity
                    onPress={() => openPicker("date")}
                    style={styles.dateInput}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={hp(2.2)}
                      color={THEME.accent}
                      style={{ marginRight: wp(2) }}
                    />
                    <Text style={styles.dateText}>
                      {date.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={hp(2)}
                      color={THEME.textSecondary}
                      style={{ marginLeft: "auto" }}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: wp(2) }}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Heure de début</Text>
                      <TouchableOpacity
                        onPress={() => openPicker("startTime")}
                        style={styles.dateInput}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="time-outline"
                          size={hp(2.2)}
                          color={THEME.accent}
                          style={{ marginRight: wp(2) }}
                        />
                        <Text style={styles.dateText}>
                          {heure_debut.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={{ flex: 1, marginLeft: wp(2) }}>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Heure de fin</Text>
                      <TouchableOpacity
                        onPress={() => openPicker("endTime")}
                        style={styles.dateInput}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="time-outline"
                          size={hp(2.2)}
                          color={THEME.accent}
                          style={{ marginRight: wp(2) }}
                        />
                        <Text style={styles.dateText}>
                          {heure_fin.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Controller
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Salle / Auditorium</Text>
                      <TextInput
                        placeholder="Ex: Palais du Peuple"
                        style={[
                          styles.input,
                          (errors.salle || (inputTouched.salle && !value)) &&
                            styles.inputError,
                        ]}
                        onBlur={() => {
                          setInputTouched((p) => ({ ...p, salle: true }));
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        placeholderTextColor={THEME.placeholder}
                      />
                    </View>
                  )}
                  name="salle"
                />
                {errors.salle && (
                  <Text style={styles.errorText}>
                    Ce champ est obligatoire.
                  </Text>
                )}

                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={prevStep}
                  >
                    <Text style={styles.secondaryBtnText}>Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={nextStep}
                  >
                    <Text style={styles.primaryBtnText}>Continuer</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={hp(2.2)}
                      color="#fff"
                      style={{ marginLeft: wp(2) }}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ÉTAPE 3 : adresse */}
            {step === 3 && (
              <>
                <View style={styles.stepHeader}>
                  <View
                    style={[
                      styles.stepIconCircle,
                      { backgroundColor: "#DBEAFE" },
                    ]}
                  >
                    <Ionicons name="location" size={hp(2.6)} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.stepTitle}>Adresse</Text>
                    <Text style={styles.stepSubtitle}>
                      Localisation précise du lieu
                    </Text>
                  </View>
                </View>

                <Controller
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Ville</Text>
                      <TextInput
                        placeholder="Ex: Kinshasa"
                        style={[
                          styles.input,
                          (errors.ville || (inputTouched.ville && !value)) &&
                            styles.inputError,
                        ]}
                        onBlur={() => {
                          setInputTouched((p) => ({ ...p, ville: true }));
                          onBlur();
                        }}
                        onChangeText={onChange}
                        value={value}
                        placeholderTextColor={THEME.placeholder}
                      />
                    </View>
                  )}
                  name="ville"
                />
                {errors.ville && (
                  <Text style={styles.errorText}>
                    Ce champ est obligatoire.
                  </Text>
                )}

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: wp(2) }}>
                    <Controller
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <Text style={styles.inputLabel}>Commune</Text>
                          <TextInput
                            placeholder="Ex: Gombe"
                            style={[
                              styles.input,
                              (errors.commune ||
                                (inputTouched.commune && !value)) &&
                                styles.inputError,
                            ]}
                            onBlur={() => {
                              setInputTouched((p) => ({ ...p, commune: true }));
                              onBlur();
                            }}
                            onChangeText={onChange}
                            value={value}
                            placeholderTextColor={THEME.placeholder}
                          />
                        </View>
                      )}
                      name="commune"
                    />
                    {errors.commune && (
                      <Text style={styles.errorText}>Obligatoire.</Text>
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: wp(2) }}>
                    <Controller
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <View style={styles.inputWrapper}>
                          <Text style={styles.inputLabel}>Avenue</Text>
                          <TextInput
                            placeholder="Ex: Blvd du 30 Juin"
                            style={[
                              styles.input,
                              (errors.avenue ||
                                (inputTouched.avenue && !value)) &&
                                styles.inputError,
                            ]}
                            onBlur={() => {
                              setInputTouched((p) => ({ ...p, avenue: true }));
                              onBlur();
                            }}
                            onChangeText={onChange}
                            value={value}
                            placeholderTextColor={THEME.placeholder}
                          />
                        </View>
                      )}
                      name="avenue"
                    />
                    {errors.avenue && (
                      <Text style={styles.errorText}>Obligatoire.</Text>
                    )}
                  </View>
                </View>

                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={prevStep}
                  >
                    <Text style={styles.secondaryBtnText}>Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={nextStep}
                  >
                    <Text style={styles.primaryBtnText}>Continuer</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={hp(2.2)}
                      color="#fff"
                      style={{ marginLeft: wp(2) }}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ÉTAPE 4 : BILLETTERIE */}
            {step === 4 && (
              <>
                <View style={styles.stepHeader}>
                  <View
                    style={[
                      styles.stepIconCircle,
                      { backgroundColor: "#FEF3C7" },
                    ]}
                  >
                    <Ionicons name="ticket" size={hp(2.6)} color="#F59E0B" />
                  </View>
                  <View>
                    <Text style={styles.stepTitle}>Billetterie</Text>
                    <Text style={styles.stepSubtitle}>Gratuit ou payant ?</Text>
                  </View>
                </View>

                <TicketBillingStep
                  mode={billingMode}
                  onModeChange={setBillingMode}
                  categories={categories}
                  onCategoriesChange={setCategories}
                  freeQuantity={freeQuantity}
                  onFreeQuantityChange={setFreeQuantity}
                  accent={THEME.accent}
                  placeholderColor={THEME.placeholder}
                />

                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={prevStep}
                  >
                    <Text style={styles.secondaryBtnText}>Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={nextStep}
                  >
                    <Text style={styles.primaryBtnText}>Continuer</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={hp(2.2)}
                      color="#fff"
                      style={{ marginLeft: wp(2) }}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ÉTAPE 5 : détails */}
            {step === 5 && (
              <>
                <View style={styles.stepHeader}>
                  <View
                    style={[
                      styles.stepIconCircle,
                      { backgroundColor: "#D1FAE5" },
                    ]}
                  >
                    <Ionicons name="create" size={hp(2.6)} color="#10B981" />
                  </View>
                  <View>
                    <Text style={styles.stepTitle}>Détails</Text>
                    <Text style={styles.stepSubtitle}>
                      Informations complémentaires
                    </Text>
                  </View>
                </View>

                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Référence</Text>
                      <TextInput
                        placeholder="N° et/ou Référence du lieu"
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholderTextColor={THEME.placeholder}
                      />
                    </View>
                  )}
                  name="reference"
                />

                <Controller
                  control={control}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputLabel}>Description</Text>
                      <TextInput
                        placeholder="Décrivez votre conférence pour les participants..."
                        style={styles.textArea}
                        editable
                        multiline
                        numberOfLines={4}
                        maxLength={255}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholderTextColor={THEME.placeholder}
                        textAlignVertical="top"
                      />
                      <Text style={styles.charCount}>
                        {(value || "").length}/255
                      </Text>
                    </View>
                  )}
                  name="description"
                />

                <View style={styles.navRow}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={prevStep}
                  >
                    <Text style={styles.secondaryBtnText}>Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                    disabled={loading}
                  >
                    <Text style={styles.primaryBtnText}>
                      {loading ? "Création..." : "Créer l'event"}
                    </Text>
                    {!loading && (
                      <Ionicons
                        name="checkmark"
                        size={hp(2.2)}
                        color="#fff"
                        style={{ marginLeft: wp(2) }}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        <CalendarModal
          visible={activePicker === "date"}
          currentDate={date}
          onConfirm={handleDateConfirm}
          onCancel={cancelPicker}
        />
        <TimeModal
          visible={activePicker === "startTime"}
          title="Heure de début"
          currentDate={heure_debut}
          onConfirm={handleStartConfirm}
          onCancel={cancelPicker}
        />
        <TimeModal
          visible={activePicker === "endTime"}
          title="Heure de fin"
          currentDate={heure_fin}
          onConfirm={handleEndConfirm}
          onCancel={cancelPicker}
        />

        <Modal
          visible={resultModal.visible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => {
            if (resultModal.status === "success") handleCloseSuccess();
            else if (resultModal.status === "error") handleRetry();
          }}
        >
          <View style={styles.resultOverlay}>
            <View style={styles.resultCard}>
              <View
                style={[
                  styles.resultIcon,
                  {
                    backgroundColor:
                      resultModal.status === "success"
                        ? "#D1FAE5"
                        : resultModal.status === "error"
                          ? "#FEE2E2"
                          : "#DBEAFE",
                  },
                ]}
              >
                {resultModal.status === "loading" ? (
                  <ActivityIndicator color="#2563EB" size="large" />
                ) : resultModal.status === "success" ? (
                  <Ionicons name="checkmark" size={hp(4.2)} color="#10B981" />
                ) : (
                  <Ionicons name="close" size={hp(4.2)} color="#EF4444" />
                )}
              </View>

              <Text style={styles.resultTitle}>
                {resultModal.status === "loading"
                  ? "Création en cours"
                  : resultModal.status === "success"
                    ? "Conférence créée !"
                    : "Échec de la création"}
              </Text>

              <Text style={styles.resultMessage}>{resultModal.message}</Text>

              {resultModal.status === "success" ? (
                <View style={styles.resultDetails}>
                  <View style={styles.resultDetailRow}>
                    <Text style={styles.resultDetailLabel}>Conférence</Text>
                    <Text style={styles.resultDetailValue} numberOfLines={1}>
                      {resultModal.eventName}
                    </Text>
                  </View>
                  <View style={styles.resultDivider} />
                  <View style={styles.resultDetailRow}>
                    <Text style={styles.resultDetailLabel}>Code</Text>
                    <Text
                      style={[
                        styles.resultDetailValue,
                        { letterSpacing: 2, fontWeight: "800" },
                      ]}
                    >
                      {resultModal.eventCode}
                    </Text>
                  </View>
                </View>
              ) : null}

              {resultModal.status === "loading" ? null : resultModal.status ===
                "success" ? (
                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    style={styles.resultBtnSecondary}
                    onPress={handleCloseSuccess}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.resultBtnSecondaryText}>Plus tard</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resultBtnPrimary}
                    onPress={handleGoToThemes}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="color-palette" size={18} color="#FFF" />
                    <Text style={styles.resultBtnPrimaryText}>
                      Créer les invitations
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    style={styles.resultBtnPrimaryFull}
                    onPress={handleRetry}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="refresh" size={18} color="#FFF" />
                    <Text style={styles.resultBtnPrimaryText}>Réessayer</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <UpgradeModal
          visible={upgradeModal.visible}
          onClose={() => setUpgradeModal({ visible: false })}
          message={upgradeModal.message}
          featureName="Créer un événement"
          currentPlan={currentPlan}
          recommendedPlan="standard"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    paddingBottom: hp(1.5),
    backgroundColor: THEME.bg,
  },
  backBtn: {
    width: hp(4.2),
    height: hp(4.2),
    borderRadius: hp(2.1),
    backgroundColor: THEME.card,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: hp(2.4),
    fontWeight: "800",
    color: THEME.text,
    letterSpacing: 0.3,
  },
  progressContainer: {
    paddingHorizontal: wp(4),
    paddingBottom: hp(2),
    backgroundColor: THEME.bg,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "#E5E5EA",
    borderRadius: 2,
    marginBottom: hp(1),
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: THEME.accent,
    borderRadius: 2,
  },
  progressText: {
    fontSize: hp(1.6),
    color: THEME.textSecondary,
    fontWeight: "600",
  },
  progressTotal: { color: "#C7C7CC", fontWeight: "400" },
  scrollContent: { paddingHorizontal: wp(4), paddingBottom: hp(4) },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 24,
    padding: wp(5),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(3),
  },
  stepIconCircle: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3),
  },
  stepTitle: { fontSize: hp(2.2), fontWeight: "800", color: THEME.text },
  stepSubtitle: {
    fontSize: hp(1.7),
    color: THEME.textSecondary,
    marginTop: hp(0.2),
  },
  inputWrapper: { marginBottom: hp(1.8) },
  inputLabel: {
    fontSize: hp(1.6),
    fontWeight: "600",
    color: THEME.text,
    marginBottom: hp(0.6),
    marginLeft: wp(1),
  },
  input: {
    height: hp(6.2),
    backgroundColor: THEME.inputBg,
    borderRadius: 14,
    paddingHorizontal: wp(4),
    fontSize: hp(1.9),
    color: THEME.text,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputError: { borderColor: THEME.danger, backgroundColor: "#FFF5F5" },
  rowInputs: { flexDirection: "row" },
  dateInput: {
    height: hp(6.2),
    backgroundColor: THEME.inputBg,
    borderRadius: 14,
    paddingHorizontal: wp(4),
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  dateText: { color: THEME.text, fontSize: hp(1.9), fontWeight: "600" },
  textArea: {
    height: hp(14),
    backgroundColor: THEME.inputBg,
    borderRadius: 14,
    paddingHorizontal: wp(4),
    paddingTop: hp(1.5),
    fontSize: hp(1.9),
    color: THEME.text,
    borderWidth: 1.5,
    borderColor: "transparent",
    lineHeight: hp(2.6),
  },
  charCount: {
    textAlign: "right",
    fontSize: hp(1.4),
    color: THEME.textSecondary,
    marginTop: hp(0.5),
    marginRight: wp(1),
  },
  errorText: {
    color: THEME.danger,
    fontSize: hp(1.5),
    marginTop: hp(0.3),
    marginLeft: wp(1),
    fontWeight: "500",
  },
  primaryBtn: {
    flexDirection: "row",
    backgroundColor: THEME.accent,
    borderRadius: 16,
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(6),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginTop: hp(1),
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: hp(2) },
  secondaryBtn: {
    backgroundColor: THEME.inputBg,
    borderRadius: 16,
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(6),
    alignItems: "center",
    justifyContent: "center",
    marginRight: wp(2),
  },
  secondaryBtnText: { color: THEME.text, fontWeight: "700", fontSize: hp(2) },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: hp(2),
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(6),
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: wp(6),
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 40,
    elevation: 12,
  },
  resultIcon: {
    width: hp(9),
    height: hp(9),
    borderRadius: hp(4.5),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(2.5),
  },
  resultTitle: {
    fontSize: hp(2.6),
    fontWeight: "800",
    color: THEME.text,
    marginBottom: hp(1),
    textAlign: "center",
  },
  resultMessage: {
    fontSize: hp(1.9),
    color: THEME.textSecondary,
    textAlign: "center",
    lineHeight: hp(2.7),
    paddingHorizontal: wp(2),
    marginBottom: hp(2.5),
  },
  resultDetails: {
    width: "100%",
    backgroundColor: THEME.inputBg,
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(3),
  },
  resultDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: wp(3),
  },
  resultDetailLabel: {
    fontSize: hp(1.6),
    color: THEME.textSecondary,
    fontWeight: "600",
  },
  resultDetailValue: {
    fontSize: hp(1.8),
    color: THEME.text,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
  resultDivider: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: hp(1.2),
  },
  resultButtons: { flexDirection: "row", gap: wp(3), width: "100%" },
  resultBtnSecondary: {
    flex: 1,
    paddingVertical: hp(1.8),
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.inputBg,
  },
  resultBtnSecondaryText: {
    color: THEME.text,
    fontWeight: "700",
    fontSize: hp(1.9),
  },
  resultBtnPrimary: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
    paddingVertical: hp(1.8),
    borderRadius: 16,
    backgroundColor: THEME.accent,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  resultBtnPrimaryFull: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
    paddingVertical: hp(1.8),
    borderRadius: 16,
    backgroundColor: THEME.accent,
    shadowColor: THEME.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  resultBtnPrimaryText: { color: "#FFF", fontWeight: "700", fontSize: hp(1.9) },
});

const calStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(240, 244, 248, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: wp(5),
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: wp(5),
    width: wp(88),
    maxWidth: 400,
    shadowColor: "rgba(0,0,0,0.08)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: hp(2.5),
  },
  title: { fontSize: hp(2.1), fontWeight: "700", color: "#111827" },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp(1.5),
    paddingHorizontal: wp(1),
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: hp(1.5),
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(0.6),
  },
  dayCellSelected: {
    backgroundColor: "#111827",
    borderRadius: hp(2.2),
    width: hp(4.4),
    height: hp(4.4),
    alignSelf: "center",
  },
  dayText: { fontSize: hp(1.85), fontWeight: "600", color: "#374151" },
  dayTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: wp(3),
    marginTop: hp(2.5),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cancel: {
    fontSize: hp(1.8),
    fontWeight: "600",
    color: "#6B7280",
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
  },
  confirmBtn: {
    backgroundColor: "#1E3A5F",
    borderRadius: 12,
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(5),
  },
  confirmText: { fontSize: hp(1.7), fontWeight: "700", color: "#FFFFFF" },
  yearHeader: {
    fontSize: hp(2.1),
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: hp(2),
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: wp(3),
    paddingVertical: hp(1),
  },
  yearCell: {
    width: wp(18),
    height: hp(5),
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  yearCellSelected: { backgroundColor: "#111827" },
  yearText: { fontSize: hp(1.7), fontWeight: "600", color: "#374151" },
  yearTextSelected: { color: "#FFFFFF", fontWeight: "700" },
  timeTitle: {
    fontSize: hp(2.1),
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: hp(2.5),
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: hp(28),
    gap: wp(4),
  },
  timeColumn: { width: wp(18), height: hp(28) },
  timeItem: {
    height: hp(5.5),
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginVertical: hp(0.3),
  },
  timeItemActive: { backgroundColor: "#111827" },
  timeItemText: { fontSize: hp(2), fontWeight: "600", color: "#6B7280" },
  timeItemTextActive: { color: "#FFFFFF", fontWeight: "700" },
  timeColon: {
    fontSize: hp(2.4),
    fontWeight: "700",
    color: "#111827",
    marginBottom: hp(0.5),
  },
});

export default CreateConference;
