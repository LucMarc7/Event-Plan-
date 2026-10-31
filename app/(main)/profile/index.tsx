// app/(main)/profile/index.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import { useAppAlert } from "../../../src/hooks/useAppAlert";
import {
  profileGradients,
  profileStatus
} from "../../../src/theme/profile-tokens";
import {
  colors,
  fontSize,
  fontWeight,
  iconSize,
  lineHeight,
  radius,
  shadows,
  spacing,
} from "../../../src/theme/tokens";

import { log_out } from "../../../src/api/auth";
import { getTrashEvents } from "../../../src/api/events";
import {
  deleteProfileImage,
  getProfile,
  uploadProfileImage,
} from "../../../src/api/profile";
import { useAuthStore } from "../../../src/stores/auth.store";
import {
  getUserAvatarUrl,
  getUserInitials,
} from "../../../src/utils/userAvatar";

import { AccountDetailsModal } from "../../../src/components/profile/modals/AccountDetailsModal";
import { ChangePasswordModal } from "../../../src/components/profile/modals/ChangePasswordModal";
import { HelpContactModal } from "../../../src/components/profile/modals/HelpContactModal";
import { NotificationsModal } from "../../../src/components/profile/modals/NotificationsModal";
import { PrivacyModal } from "../../../src/components/profile/modals/PrivacyModal";
import { SessionsModal } from "../../../src/components/profile/modals/SessionsModal";
import { TermsModal } from "../../../src/components/profile/modals/TermsModal";
import { TwoFactorModal } from "../../../src/components/profile/modals/TwoFactorModal";
import { useProfileStats } from "../../../src/hooks/useProfileStats";

const PROFILE_CACHE_KEY = "userProfileCache";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// ✅ NOUVEAU — Couleur du badge selon le plan
const getPlanColor = (plan?: string): string => {
  const p = String(plan || "")
    .toLowerCase()
    .trim();
  if (p === "vip") return "#7C3AED"; // violet
  if (p === "premium") return "#F59E0B"; // or
  if (p === "standard") return "#4F46E5"; // bleu
  return "#94A3B8"; // free → gris
};

const getPlanLabel = (plan?: string): string => {
  const p = String(plan || "")
    .toLowerCase()
    .trim();
  if (p === "vip") return "VIP";
  if (p === "premium") return "Premium";
  if (p === "standard") return "Standard";
  return "Free";
};

const compressImage = async (uri: string) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 512, height: 512 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  } catch (e) {
    return uri;
  }
};

const getAvatarGradient = (seed: string) => {
  if (!seed) return profileGradients.avatar[0];
  const idx = seed.toUpperCase().charCodeAt(0) % profileGradients.avatar.length;
  return profileGradients.avatar[idx];
};

// ═══════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ═══════════════════════════════════════════════════════════════
const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const OptionItem = ({
  icon,
  label,
  sublabel,
  onPress,
  badge,
  danger,
  isLast,
}: any) => (
  <TouchableOpacity
    style={[styles.optionItem, isLast && styles.optionItemLast]}
    onPress={onPress}
    activeOpacity={0.6}
  >
    <View
      style={[
        styles.optionIconBox,
        { backgroundColor: danger ? colors.errorSoft : colors.primarySoft },
      ]}
    >
      <Ionicons
        name={icon}
        size={iconSize.md}
        color={danger ? colors.error : colors.primary}
      />
    </View>
    <View style={styles.optionText}>
      <Text style={[styles.optionLabel, danger && { color: colors.error }]}>
        {label}
      </Text>
      {sublabel ? <Text style={styles.optionSublabel}>{sublabel}</Text> : null}
    </View>
    {badge ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    ) : null}
    <Ionicons
      name="chevron-forward"
      size={iconSize.sm}
      color={colors.textMuted}
    />
  </TouchableOpacity>
);

const ToggleItem = ({
  icon,
  label,
  sublabel,
  value,
  onValueChange,
  isLast,
}: any) => (
  <View style={[styles.optionItem, isLast && styles.optionItemLast]}>
    <View
      style={[styles.optionIconBox, { backgroundColor: colors.primarySoft }]}
    >
      <Ionicons name={icon} size={iconSize.md} color={colors.primary} />
    </View>
    <View style={styles.optionText}>
      <Text style={styles.optionLabel}>{label}</Text>
      {sublabel ? <Text style={styles.optionSublabel}>{sublabel}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primarySoft }}
      thumbColor={value ? colors.primary : "#FFF"}
      ios_backgroundColor={colors.border}
    />
  </View>
);

const StatBox = ({ value, label, icon }: any) => (
  <View style={styles.statBox}>
    <View style={styles.statIconWrap}>
      <Ionicons name={icon} size={iconSize.sm} color={colors.primary} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ═══════════════════════════════════════════════════════════════
// ACTION SHEET PHOTO
// ═══════════════════════════════════════════════════════════════
const ActionSheet = ({
  visible,
  onClose,
  onCamera,
  onGallery,
  onDelete,
  canDelete,
}: any) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <Pressable style={sheetStyles.overlay} onPress={onClose}>
      <View style={sheetStyles.sheet}>
        <View style={sheetStyles.handle} />
        <Text style={sheetStyles.title}>Photo de profil</Text>

        <TouchableOpacity style={sheetStyles.option} onPress={onCamera}>
          <View
            style={[
              sheetStyles.iconBox,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons name="camera-outline" size={22} color={colors.primary} />
          </View>
          <View style={sheetStyles.optionText}>
            <Text style={sheetStyles.optionLabel}>Prendre une photo</Text>
            <Text style={sheetStyles.optionDesc}>Utiliser la caméra</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={sheetStyles.option} onPress={onGallery}>
          <View
            style={[
              sheetStyles.iconBox,
              { backgroundColor: colors.successSoft },
            ]}
          >
            <Ionicons name="images-outline" size={22} color={colors.success} />
          </View>
          <View style={sheetStyles.optionText}>
            <Text style={sheetStyles.optionLabel}>Choisir dans la galerie</Text>
            <Text style={sheetStyles.optionDesc}>
              Sélectionner une image existante
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {canDelete ? (
          <TouchableOpacity style={sheetStyles.option} onPress={onDelete}>
            <View
              style={[
                sheetStyles.iconBox,
                { backgroundColor: colors.errorSoft },
              ]}
            >
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </View>
            <View style={sheetStyles.optionText}>
              <Text style={[sheetStyles.optionLabel, { color: colors.error }]}>
                Supprimer la photo
              </Text>
              <Text style={sheetStyles.optionDesc}>
                Retirer votre photo actuelle
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={sheetStyles.cancelBtn} onPress={onClose}>
          <Text style={sheetStyles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  </Modal>
);

// ═══════════════════════════════════════════════════════════════
// LOGOUT DIALOG
// ═══════════════════════════════════════════════════════════════
const LogoutDialog = ({ visible, onClose, onConfirm }: any) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={dialogStyles.overlay}>
      <View style={dialogStyles.content}>
        <View
          style={[
            dialogStyles.iconCircle,
            { backgroundColor: colors.errorSoft },
          ]}
        >
          <Ionicons name="log-out-outline" size={32} color={colors.error} />
        </View>
        <Text style={dialogStyles.title}>Déconnexion</Text>
        <Text style={dialogStyles.message}>
          Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
        </Text>
        <View style={dialogStyles.buttons}>
          <TouchableOpacity style={dialogStyles.cancelBtn} onPress={onClose}>
            <Text style={dialogStyles.cancelText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dialogStyles.confirmBtn} onPress={onConfirm}>
            <Text style={dialogStyles.confirmText}>Déconnecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ═══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════
const Profils = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { setUser, user, logout } = useAuthStore();

  const { showAlert, AlertHost } = useAppAlert();

  const [selectImage, setSelectImage] = useState<string | null>(null);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [twoFAModalVisible, setTwoFAModalVisible] = useState(false);
  const [sessionsModalVisible, setSessionsModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);

  const [trashCount, setTrashCount] = useState(0);

  const avatarScale = useRef(new Animated.Value(0)).current;
  const avatarOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  const profile = user?.profile || {};
  const firstName = profile.first_name || "";
  const lastName = profile.last_name || "";
  const email = profile.email || "";

  const username =
    user?.username ||
    profile?.username ||
    (email ? email.split("@")[0] : "") ||
    "";

  const subscription = user?.subscription;

  // ✅ NOUVEAU — Détection robuste du plan
  const currentPlan: string = String(
    profile?.subscription_plan ||
      user?.subscription_plan ||
      subscription?.plan ||
      "free",
  ).toLowerCase();

  const planColor = getPlanColor(currentPlan);
  const planLabel = getPlanLabel(currentPlan);

  const isPremium =
    currentPlan === "premium" ||
    currentPlan === "vip" ||
    profile?.can_create_unlimited_events === true ||
    user?.can_create_unlimited_events === true;

  const {
    events: statsEvents,
    guests: statsGuests,
    controllers: statsControllers,
    refresh: refreshStats,
  } = useProfileStats();

  const loadTrashCount = useCallback(async () => {
    try {
      const res = await getTrashEvents();
      setTrashCount(res?.count || 0);
    } catch {}
  }, []);

  const loadProfile = async (force = false) => {
    try {
      if (!force) {
        const cachedStr = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (Date.now() - cached.timestamp < CACHE_DURATION) {
            setUser(cached.data);
            setInitialLoading(false);
            getProfile()
              .then((fresh) => {
                if (fresh) {
                  setUser(fresh);
                  AsyncStorage.setItem(
                    PROFILE_CACHE_KEY,
                    JSON.stringify({ data: fresh, timestamp: Date.now() }),
                  );
                }
              })
              .catch(() => {});
            return;
          }
        }
      }
      const fresh = await getProfile();
      setUser(fresh);
      await AsyncStorage.setItem(
        PROFILE_CACHE_KEY,
        JSON.stringify({ data: fresh, timestamp: Date.now() }),
      );
    } catch (e) {
      console.warn("Erreur chargement profil:", e);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadProfileRef = useRef(loadProfile);
  useEffect(() => {
    loadProfileRef.current = loadProfile;
  }, [loadProfile]);

  const refreshStatsRef = useRef(refreshStats);
  useEffect(() => {
    refreshStatsRef.current = refreshStats;
  }, [refreshStats]);

  useEffect(() => {
    if (!user?.profile?.id) {
      loadProfile();
    } else {
      setInitialLoading(false);
    }
    Animated.parallel([
      Animated.spring(avatarScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.profile?.id) {
        loadProfileRef.current?.(true).catch(() => {});
        refreshStatsRef.current?.().catch(() => {});
      }
      loadTrashCount();
    }, [user?.profile?.id, loadTrashCount]),
  );

  useEffect(() => {
    const prepare = async () => {
      if (selectImage) return;
      const url = getUserAvatarUrl(user);
      if (!url) {
        setProfileImageUrl(null);
        return;
      }
      try {
        await Image.prefetch(url);
      } catch (e) {}
      setProfileImageUrl(url);
    };
    prepare();
  }, [user?.profile?.profile_image, user, selectImage]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([loadProfile(true), refreshStats(), loadTrashCount()]);
    setRefreshing(false);
  };

  const handleTakePhoto = async () => {
    setPhotoMenuVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert({
        title: "Permission requise",
        message:
          "L'accès à la caméra est nécessaire pour prendre une photo de profil.",
        variant: "warning",
        buttons: [{ text: "Compris", style: "default" }],
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      await processImageUpload(result.assets[0].uri);
    }
  };

  const handlePickFromGallery = async () => {
    setPhotoMenuVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert({
        title: "Permission requise",
        message:
          "L'accès à la galerie est nécessaire pour choisir une photo de profil.",
        variant: "warning",
        buttons: [{ text: "Compris", style: "default" }],
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0].uri) {
      await processImageUpload(result.assets[0].uri);
    }
  };

  const processImageUpload = async (uri: string) => {
    setSelectImage(uri);
    animateAvatarChange();
    setUploading(true);
    const compressedUri = await compressImage(uri);
    const uploadResponse = await uploadProfileImage(compressedUri);
    setUploading(false);

    if (uploadResponse.success) {
      const newUser = {
        ...user,
        profile: {
          ...user.profile,
          profile_image: uploadResponse.image_url,
          avatar: uploadResponse.image_url,
        },
      };
      setUser(newUser);
      await AsyncStorage.setItem(
        PROFILE_CACHE_KEY,
        JSON.stringify({ data: newUser, timestamp: Date.now() }),
      );
      let url = uploadResponse.image_url;
      if (url && url.startsWith("/")) {
        url = "https://klmarc.pythonanywhere.com" + url;
      }
      try {
        await Image.prefetch(url);
      } catch (e) {}
      setProfileImageUrl(url);
      setSelectImage(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: "success", text1: "Photo mise à jour" });
    } else {
      setSelectImage(null);
      Toast.show({ type: "error", text1: "Échec de l'upload" });
    }
  };

  const handleDeletePhoto = async () => {
    setPhotoMenuVisible(false);
    showAlert({
      title: "Supprimer la photo ?",
      message:
        "Voulez-vous vraiment supprimer votre photo de profil ? Cette action est irréversible.",
      variant: "danger",
      buttons: [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setUploading(true);
            const response = await deleteProfileImage();
            setUploading(false);
            if (response.success) {
              const newUser = {
                ...user,
                profile: { ...user.profile, profile_image: null, avatar: null },
              };
              setUser(newUser);
              await AsyncStorage.setItem(
                PROFILE_CACHE_KEY,
                JSON.stringify({ data: newUser, timestamp: Date.now() }),
              );
              setProfileImageUrl(null);
              setSelectImage(null);
              Toast.show({ type: "success", text1: "Photo supprimée" });
            } else {
              Toast.show({
                type: "error",
                text1: response.message || "Échec",
              });
            }
          },
        },
      ],
    });
  };

  const animateAvatarChange = () => {
    Animated.sequence([
      Animated.timing(avatarOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(avatarOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogoutConfirm = async () => {
    setLogoutDialogVisible(false);
    try {
      const refreshAsync = await AsyncStorage.getItem("refresh");
      const refreshSecure = await SecureStore.getItemAsync("refresh");
      const refresh = refreshSecure || refreshAsync;
      if (refresh) {
        try {
          await log_out(refresh);
        } catch (e) {
          console.warn("Logout serveur échoué (ignoré):", e);
        }
      }

      await AsyncStorage.multiRemove([
        "authToken",
        "refresh",
        "auths",
        "authUser",
        PROFILE_CACHE_KEY,
        "profile_stats_cache_v1",
        "events_cache",
        "events_cache_expiration",
        "pending_deletions",
      ]);

      await Promise.allSettled([
        SecureStore.deleteItemAsync("authToken").catch(() => {}),
        SecureStore.deleteItemAsync("refresh").catch(() => {}),
        SecureStore.deleteItemAsync("authUser").catch(() => {}),
        SecureStore.deleteItemAsync("refresh_token").catch(() => {}),
        SecureStore.deleteItemAsync("access_token").catch(() => {}),
      ]);

      logout();
    } catch (e) {
      console.warn("Erreur déconnexion:", e);
      await AsyncStorage.multiRemove(["authToken", "refresh", "auths"]);
      await Promise.allSettled([
        SecureStore.deleteItemAsync("authToken").catch(() => {}),
        SecureStore.deleteItemAsync("refresh").catch(() => {}),
      ]);
      logout();
    }
  };

  const handleToggleOnline = (v: boolean) => {
    Haptics.selectionAsync();
    setOnlineStatus(v);
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement du profil…</Text>
      </View>
    );
  }

  const initials = getUserInitials(user);
  const avatarGradient = getAvatarGradient(firstName || lastName || email);
  const displayImageUri = selectImage || profileImageUrl;
  const fullName = `${firstName} ${lastName}`.trim() || "Utilisateur";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <Animated.View
          style={[styles.identityCard, { opacity: contentOpacity }]}
        >
          <View style={styles.avatarWrapper}>
            <Animated.View
              style={{
                transform: [{ scale: avatarScale }],
                opacity: avatarOpacity,
              }}
            >
              {uploading ? (
                <View style={[styles.avatar, styles.avatarLoading]}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : displayImageUri ? (
                <Image
                  source={{ uri: displayImageUri }}
                  style={styles.avatar}
                />
              ) : (
                <LinearGradient
                  colors={avatarGradient as unknown as string[]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </LinearGradient>
              )}
            </Animated.View>
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={() => {
                Haptics.selectionAsync();
                setPhotoMenuVisible(true);
              }}
              disabled={uploading}
            >
              <Ionicons name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {fullName}
            </Text>
            {/* ✅ Badge de vérification coloré selon le plan */}
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={planColor}
              style={{ marginLeft: spacing.xs }}
            />
          </View>

          {username ? (
            <View style={styles.usernameRow}>
              <Ionicons name="at" size={13} color={colors.primary} />
              <Text style={styles.usernameText}>{username}</Text>
            </View>
          ) : null}

          <Text style={styles.userEmail}>{email}</Text>

          <View style={styles.statusRow}>
            <View style={styles.onlinePill}>
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: onlineStatus
                      ? profileStatus.online
                      : profileStatus.offline,
                  },
                ]}
              />
              <Text style={styles.onlineText}>
                {onlineStatus ? "En ligne" : "Hors ligne"}
              </Text>
            </View>

            {/* ✅ Badge plan coloré */}
            <View
              style={[styles.subBadge, { backgroundColor: planColor + "20" }]}
            >
              <Ionicons name="diamond" size={11} color={planColor} />
              <Text style={[styles.subBadgeText, { color: planColor }]}>
                {planLabel}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              Haptics.selectionAsync();
              setAccountModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.editBtnText}>Modifier le profil</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.statsCard, { opacity: contentOpacity }]}>
          <StatBox
            value={statsEvents}
            label="Événements"
            icon="calendar-outline"
          />
          <View style={styles.statDivider} />
          <StatBox value={statsGuests} label="Invités" icon="people-outline" />
          <View style={styles.statDivider} />
          <StatBox
            value={statsControllers}
            label="Contrôleurs"
            icon="shield-checkmark-outline"
          />
        </Animated.View>

        <Section title="Compte">
          <OptionItem
            icon="person-outline"
            label="Détails du compte"
            sublabel="Nom, email, téléphone, bio…"
            onPress={() => setAccountModalVisible(true)}
          />

          <OptionItem
            icon="card-outline"
            label="Abonnement"
            sublabel={
              isPremium
                ? `Votre plan ${planLabel} actif`
                : "Débloquez toutes les fonctionnalités"
            }
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(main)/subscription");
            }}
            badge={planLabel}
          />

          <OptionItem
            icon="trash-outline"
            label="Corbeille"
            sublabel={
              trashCount > 0
                ? `${trashCount} événement${trashCount > 1 ? "s" : ""} récupérable${trashCount > 1 ? "s" : ""} (48h)`
                : "Aucun événement supprimé"
            }
            onPress={() => {
              Haptics.selectionAsync();
              router.push("/(main)/trash");
            }}
            badge={trashCount > 0 ? String(trashCount) : null}
            isLast
          />
        </Section>

        <Section title="Préférences">
          <OptionItem
            icon="notifications-outline"
            label="Notifications"
            sublabel="Alertes, emails et rappels"
            onPress={() => setNotifModalVisible(true)}
          />
          <ToggleItem
            icon="radio-outline"
            label="Statut en ligne"
            sublabel="Visible par vos contacts"
            value={onlineStatus}
            onValueChange={handleToggleOnline}
            isLast
          />
        </Section>

        <Section title="Sécurité">
          <OptionItem
            icon="lock-closed-outline"
            label="Mot de passe"
            sublabel="Changer votre mot de passe"
            onPress={() => setPasswordModalVisible(true)}
          />
          <OptionItem
            icon="shield-checkmark-outline"
            label="Authentification 2FA"
            sublabel="Sécurité renforcée"
            onPress={() => setTwoFAModalVisible(true)}
          />
          <OptionItem
            icon="phone-portrait-outline"
            label="Sessions actives"
            sublabel="Appareils connectés"
            onPress={() => setSessionsModalVisible(true)}
            isLast
          />
        </Section>

        <Section title="Support & Légal">
          <OptionItem
            icon="chatbubbles-outline"
            label="Aide / Contact"
            sublabel="FAQ et nous contacter"
            onPress={() => setHelpModalVisible(true)}
          />
          <OptionItem
            icon="document-text-outline"
            label="Conditions d'utilisation"
            onPress={() => setTermsModalVisible(true)}
          />
          <OptionItem
            icon="shield-outline"
            label="Confidentialité"
            sublabel="Politique et données personnelles"
            onPress={() => setPrivacyModalVisible(true)}
            isLast
          />
        </Section>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setLogoutDialogVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutBtnText}>Se déconnecter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Toast.show({
              type: "info",
              text1: "Bientôt disponible",
              text2: "La suppression de compte sera bientôt disponible",
            });
          }}
        >
          <Text style={styles.deleteBtnText}>Supprimer mon compte</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Event Plan · v1.0.0</Text>
        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <ActionSheet
        visible={photoMenuVisible}
        onClose={() => setPhotoMenuVisible(false)}
        onCamera={handleTakePhoto}
        onGallery={handlePickFromGallery}
        onDelete={handleDeletePhoto}
        canDelete={!!(selectImage || profileImageUrl)}
      />

      <AccountDetailsModal
        visible={accountModalVisible}
        onClose={() => setAccountModalVisible(false)}
        user={user}
        onUpdate={setUser}
      />

      <NotificationsModal
        visible={notifModalVisible}
        onClose={() => setNotifModalVisible(false)}
      />

      <ChangePasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
      />

      <TwoFactorModal
        visible={twoFAModalVisible}
        onClose={() => setTwoFAModalVisible(false)}
      />

      <SessionsModal
        visible={sessionsModalVisible}
        onClose={() => setSessionsModalVisible(false)}
      />

      <HelpContactModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />

      <TermsModal
        visible={termsModalVisible}
        onClose={() => setTermsModalVisible(false)}
      />

      <PrivacyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />

      <LogoutDialog
        visible={logoutDialogVisible}
        onClose={() => setLogoutDialogVisible(false)}
        onConfirm={handleLogoutConfirm}
      />

      {AlertHost}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
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
  scrollContent: { paddingBottom: spacing.xl },

  identityCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.base,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    ...shadows.md,
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.lg,
  },
  avatarLoading: { backgroundColor: colors.surfaceAlt },
  avatarText: {
    fontSize: 36,
    fontWeight: fontWeight.extrabold,
    color: "#FFF",
    letterSpacing: 1,
  },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.md,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  usernameText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  onlineText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
  subBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  subBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: "capitalize",
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  editBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingVertical: spacing.base,
    borderRadius: radius.xl,
    ...shadows.sm,
  },
  statBox: { alignItems: "center", flex: 1 },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.sm,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 68,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  optionItemLast: { borderBottomWidth: 0 },
  optionIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  optionSublabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textTransform: "capitalize",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.errorSoft,
  },
  logoutBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
  deleteBtn: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  deleteBtnText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    textDecorationLine: "underline",
  },
  version: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
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
    paddingBottom: spacing.xl,
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
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  optionDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  cancelText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
});

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: lineHeight.sm,
    marginBottom: spacing.lg,
  },
  buttons: { flexDirection: "row", gap: spacing.md, width: "100%" },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.error,
    alignItems: "center",
  },
  confirmText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: "#FFF",
  },
});

export default Profils;
