// app/(main)/events/wedding/uploader/[id].tsx
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import api from "../../../../../src/api/client";
import { readEvent } from "../../../../../src/api/events";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../../../../src/theme/tokens";
import { compressImage } from "../../../../../src/utils/imageCompression";

// ═══════════════════════════════════════════════════════════
// ACTION SHEET
// ═══════════════════════════════════════════════════════════
const ActionSheet = ({ visible, onClose, onCamera, onGallery }: any) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[sheetStyles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            sheetStyles.sheet,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.title}>Ajouter une photo</Text>
          <Text style={sheetStyles.subtitle}>
            Choisissez la source de l'image
          </Text>

          <View style={sheetStyles.optionsRow}>
            <TouchableOpacity
              style={sheetStyles.option}
              onPress={() => {
                onClose();
                setTimeout(onCamera, 300);
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  sheetStyles.iconCircle,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Feather name="camera" size={22} color={colors.primary} />
              </View>
              <Text style={sheetStyles.optionText}>Caméra</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={sheetStyles.option}
              onPress={() => {
                onClose();
                setTimeout(onGallery, 300);
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  sheetStyles.iconCircle,
                  { backgroundColor: colors.successSoft },
                ]}
              >
                <Feather name="image" size={22} color={colors.success} />
              </View>
              <Text style={sheetStyles.optionText}>Galerie</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={sheetStyles.option}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <View
                style={[
                  sheetStyles.iconCircle,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Feather name="x" size={22} color={colors.textMuted} />
              </View>
              <Text
                style={[
                  sheetStyles.optionText,
                  { color: colors.textSecondary },
                ]}
              >
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════
const WeddingUploaderScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [image, setImage] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [status, setStatus] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ type: "idle", message: "" });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data: any = await readEvent(String(id));
        setEvent(data);
      } catch (e) {
        console.warn("[UPLOADER] Erreur chargement event:", e);
      } finally {
        setLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    };
    load();
  }, [id]);

  const pickImage = async (fromCamera = false) => {
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!perm.granted) {
        const msg = `Autorisez l'accès à ${fromCamera ? "la caméra" : "la galerie"}.`;
        setStatus({ type: "error", message: msg });
        Alert.alert("Permission requise", msg);
        return;
      }

      const fn = fromCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;
      const result = await fn({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0]);
        setImageError(false);
        setStatus({ type: "idle", message: "" });
      }
    } catch (err) {
      console.error("[UPLOADER] pickImage error:", err);
      setStatus({
        type: "error",
        message: "Impossible de sélectionner l'image",
      });
    }
  };

  // ✅ handleUpload AVEC compression
  const handleUpload = async () => {
    if (!image || !id) {
      const msg = "Image ou événement manquant.";
      setStatus({ type: "error", message: msg });
      Alert.alert("Erreur", msg);
      return;
    }

    setUploading(true);
    setStatus({ type: "loading", message: "Compression et envoi…" });

    try {
      // ✅ ÉTAPE 1 — Compresser l'image localement
      const compressed = await compressImage(image.uri, `event_${id}.jpg`);

      setStatus({ type: "loading", message: "Envoi vers le serveur…" });

      // ✅ ÉTAPE 2 — Envoyer avec clé 'image' (acceptée par le backend)
      const formData = new FormData();
      formData.append("image", {
        uri: compressed.uri,
        name: compressed.name,
        type: compressed.type,
      } as any);

      const response = await api.patch(
        `/events/api/ajout/image/${id}/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        },
      );

      console.log("[UPLOAD] ✅ Success", response.status, response.data);

      setStatus({
        type: "success",
        message: "Image mise à jour avec succès !",
      });
      Toast.show({
        type: "success",
        text1: "Image mise à jour",
        text2: "La nouvelle photo est en ligne",
      });

      setTimeout(() => router.back(), 900);
    } catch (err: any) {
      console.error("[UPLOAD] ❌ Error:", err);
      console.error("[UPLOAD] Response:", err?.response?.data);

      const statusCode = err?.response?.status;
      const body = err?.response?.data || {};

      let message = "Impossible d'uploader l'image";
      if (body?.detail) message = String(body.detail);
      else if (body?.error) message = String(body.error);
      else if (body?.event_image?.[0]) message = String(body.event_image[0]);
      else if (statusCode === 401)
        message = "Session expirée, reconnectez-vous";
      else if (statusCode === 403) message = "Accès refusé";
      else if (statusCode === 404) message = "Événement introuvable";
      else if (statusCode === 413)
        message = body?.error || "Image trop volumineuse";
      else if (statusCode) message = `Erreur ${statusCode}`;
      else if (err?.message === "Network Error")
        message =
          "Le serveur n'a pas répondu. Réessayez avec une image plus légère.";
      else if (err?.message) message = err.message;

      setStatus({ type: "error", message });
      Toast.show({ type: "error", text1: "Échec de l'upload", text2: message });
      Alert.alert("Échec de l'upload", message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Chargement…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasImage = image?.uri || event?.image_url || event?.event_image;
  const displayUri = image?.uri
    ? image.uri
    : event?.image_url
      ? event.image_url.startsWith("/")
        ? "https://klmarc.pythonanywhere.com" + event.image_url
        : event.image_url
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          disabled={uploading}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Image de couverture
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {event?.title || event?.name || "Événement"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerBtn, styles.headerBtnAccent]}
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.7}
          disabled={uploading}
        >
          <Feather name="edit-2" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {status.type !== "idle" ? (
        <View
          style={[
            styles.statusBar,
            {
              backgroundColor:
                status.type === "success"
                  ? colors.successSoft
                  : status.type === "error"
                    ? colors.errorSoft
                    : colors.primarySoft,
            },
          ]}
        >
          {status.type === "loading" ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather
              name={status.type === "success" ? "check-circle" : "alert-circle"}
              size={16}
              color={status.type === "success" ? colors.success : colors.error}
            />
          )}
          <Text
            style={[
              styles.statusText,
              {
                color:
                  status.type === "success"
                    ? colors.success
                    : status.type === "error"
                      ? colors.error
                      : colors.primary,
              },
            ]}
            numberOfLines={3}
          >
            {status.message}
          </Text>
        </View>
      ) : null}

      <Animated.View style={[styles.imageSection, { opacity: fadeAnim }]}>
        {hasImage && displayUri && !imageError ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: displayUri }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
            {image ? (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>Nouvelle image</Text>
              </View>
            ) : null}
            {uploading ? (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.uploadingText}>Envoi en cours…</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.emptyState}
            onPress={() => setSheetVisible(true)}
            activeOpacity={0.85}
            disabled={uploading}
          >
            <View style={styles.emptyIconCircle}>
              <Feather name="image" size={36} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Aucune image</Text>
            <Text style={styles.emptySubtitle}>
              Appuyez pour choisir une image
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <View
        style={[styles.actions, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        {image ? (
          <>
            <TouchableOpacity
              style={[styles.secondaryBtn, uploading && { opacity: 0.5 }]}
              onPress={() => {
                setImage(null);
                setStatus({ type: "idle", message: "" });
              }}
              disabled={uploading}
              activeOpacity={0.85}
            >
              <Feather name="x" size={16} color={colors.textSecondary} />
              <Text style={styles.secondaryBtnText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, uploading && { opacity: 0.7 }]}
              onPress={handleUpload}
              disabled={uploading}
              activeOpacity={0.85}
            >
              {uploading ? (
                <>
                  <ActivityIndicator size="small" color="#FFF" />
                  <Text style={styles.primaryBtnText}>Envoi…</Text>
                </>
              ) : (
                <>
                  <Feather name="upload-cloud" size={16} color="#FFF" />
                  <Text style={styles.primaryBtnText}>Sauvegarder</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.primaryBtn, { flex: 1 }]}
            onPress={() => setSheetVisible(true)}
            activeOpacity={0.85}
            disabled={uploading}
          >
            <Feather name="plus-circle" size={16} color="#FFF" />
            <Text style={styles.primaryBtnText}>Choisir une image</Text>
          </TouchableOpacity>
        )}
      </View>

      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onCamera={() => pickImage(true)}
        onGallery={() => pickImage(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
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
  headerBtnAccent: { backgroundColor: colors.primary },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  statusText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
  },
  imageSection: {
    flex: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  imageWrapper: {
    flex: 1,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.surface,
    ...shadows.lg,
  },
  image: { width: "100%", height: "100%" },
  newBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  newBadgeText: {
    color: "#FFF",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  uploadingText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    flex: 1,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  primaryBtn: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  primaryBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: "#FFF",
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
});

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
  },
  option: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
});

export default WeddingUploaderScreen;
