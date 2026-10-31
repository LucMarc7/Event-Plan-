// src/components/guests/GuestList.tsx
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import "dayjs/locale/fr";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useFocusEffect, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import GuestListSkeleton from "../../../src/components/common/Skeletons/GuestListSkeleton";
import { useAppAlert } from "../../../src/hooks/useAppAlert";
import { useGuestList } from "../../../src/hooks/useGuestList";
import { useGuestSelection } from "../../../src/hooks/useGuestSelection";
import { useDataStore } from "../../../src/stores/data.store";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../theme/tokens";
import AddGuestModal from "./AddGuestModal";
import GuestDetailModal from "./GuestDetailModal";

import { useSubscription } from "../../hooks/useSubscription";
import { UpgradeModal } from "../subscription/UpgradeModal";

const { width: SCREEN_W } = Dimensions.get("window");

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ═══════════════ HELPERS ═══════════════
const getAvatarColor = (name: string) => {
  const palette = [
    "#4F46E5",
    "#7C3AED",
    "#DB2777",
    "#059669",
    "#D97706",
    "#2563EB",
    "#DC2626",
    "#0891B2",
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const getAvatarBg = (name: string) => getAvatarColor(name) + "15";

const getGuestCreatedTime = (g: any): number => {
  if (!g) return 0;
  const candidates = [
    g.created_date,
    g.created_at,
    g.date_created,
    g.updated_date,
    g.updated_at,
    g.modified_date,
  ];
  for (const v of candidates) {
    if (!v) continue;
    const t = new Date(v).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
};

const extractQrSource = (guest: any): string | null => {
  if (!guest) return null;
  const candidates = [
    guest.qr_code_url,
    guest.qr_code,
    guest.qr_url,
    guest.qrCodeUrl,
    guest.qr_code_path,
    guest.qrcode_url,
  ];
  for (const c of candidates) {
    if (c != null) {
      const s = String(c).trim();
      if (s && s !== "null" && s !== "undefined") return s;
    }
  }
  return null;
};

const hasAppliedTheme = async (
  eventId: string | null | undefined,
): Promise<boolean> => {
  if (!eventId) return false;
  try {
    const currentThemeId = await AsyncStorage.getItem(
      `current_theme_${eventId}`,
    );
    if (!currentThemeId) return false;
    const themesData = await AsyncStorage.getItem(`themes_${eventId}`);
    if (!themesData) return false;
    const themes = JSON.parse(themesData);
    if (!Array.isArray(themes)) return false;
    return themes.some((t: any) => t.id === currentThemeId);
  } catch {
    return false;
  }
};

const DEFAULT_THEME = {
  canvas: { width: 800, height: 600 },
  background: { type: "color", value: "#ffffff" },
  blocks: [],
  pages: [{ background: { type: "color", value: "#ffffff" } }],
};

// ═══════════════ SOUS-COMPOSANTS ═══════════════

const AlertBanners = ({ showLimitAlert, bannerAnim, isConnected }: any) => (
  <>
    {showLimitAlert && (
      <Animated.View
        style={[
          alertStyles.banner,
          { backgroundColor: colors.warningSoft, opacity: bannerAnim },
        ]}
      >
        <Feather name="alert-triangle" size={16} color={colors.warning} />
        <Text style={[alertStyles.bannerText, { color: colors.warning }]}>
          Limite de sélection atteinte
        </Text>
      </Animated.View>
    )}
    {!isConnected && (
      <View style={[alertStyles.banner, { backgroundColor: colors.errorSoft }]}>
        <Feather name="wifi-off" size={16} color={colors.error} />
        <Text style={[alertStyles.bannerText, { color: colors.error }]}>
          Connexion internet absente
        </Text>
      </View>
    )}
  </>
);

const alertStyles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
  },
  bannerText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
});

const GuestCount = ({ count }: { count: number }) => (
  <View style={gcStyles.container}>
    <Text style={gcStyles.text}>
      {count} invité{count > 1 ? "s" : ""}
    </Text>
  </View>
);

const gcStyles = StyleSheet.create({
  container: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  text: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
});

const SelectionHeader = ({
  selectionCount,
  onDeselectAll,
  onSelectAll,
  maxSelectionLimit,
}: any) => (
  <View style={selStyles.container}>
    <TouchableOpacity onPress={onDeselectAll} style={selStyles.actionBtn}>
      <Feather name="x" size={16} color={colors.textSecondary} />
      <Text style={selStyles.actionText}>Annuler</Text>
    </TouchableOpacity>
    <View style={selStyles.center}>
      <Text style={selStyles.countText}>
        {selectionCount} / {maxSelectionLimit}
      </Text>
    </View>
    <TouchableOpacity onPress={onSelectAll} style={selStyles.actionBtn}>
      <Feather name="check-square" size={16} color={colors.primary} />
      <Text style={[selStyles.actionText, { color: colors.primary }]}>
        Tout
      </Text>
    </TouchableOpacity>
  </View>
);

const selStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  center: { flex: 1, alignItems: "center" },
  countText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
});

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récents", icon: "clock" },
  { value: "name", label: "Par nom (A-Z)", icon: "type" },
  { value: "table", label: "Par table", icon: "grid" },
];

const SortModal = ({
  modalVisible,
  setModalVisible,
  sortOption,
  setSortOption,
}: any) => (
  <Modal
    visible={modalVisible}
    transparent
    animationType="fade"
    onRequestClose={() => setModalVisible(false)}
  >
    <Pressable
      style={sortStyles.overlay}
      onPress={() => setModalVisible(false)}
    >
      <View style={sortStyles.card}>
        <Text style={sortStyles.title}>Trier par</Text>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              sortStyles.option,
              sortOption === opt.value && sortStyles.optionActive,
            ]}
            onPress={() => {
              setSortOption(opt.value);
              setModalVisible(false);
            }}
          >
            <Feather
              name={opt.icon as any}
              size={18}
              color={
                sortOption === opt.value ? colors.primary : colors.textSecondary
              }
            />
            <Text
              style={[
                sortStyles.optionText,
                sortOption === opt.value && {
                  color: colors.primary,
                  fontWeight: fontWeight.bold,
                },
              ]}
            >
              {opt.label}
            </Text>
            {sortOption === opt.value && (
              <Feather name="check" size={18} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Pressable>
  </Modal>
);

const sortStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 380,
    ...shadows.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  optionActive: { backgroundColor: colors.primarySoft },
  optionText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
});

const ModernGuestCard = ({
  item,
  isSelected,
  selectionMode,
  onPress,
  onLongPress,
  onToggleSelection,
  recentlyShared,
  isScanned,
  avatarColor,
  index,
}: any) => {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 350,
        delay: Math.min(index * 30, 400),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        delay: Math.min(index * 30, 400),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const initials = (item.first_person || "?")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Animated.View
      style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}
    >
      <TouchableOpacity
        style={[
          gStyles.card,
          isScanned && gStyles.cardScanned,
          isSelected && gStyles.cardSelected,
        ]}
        activeOpacity={0.7}
        onPress={selectionMode ? onToggleSelection : onPress}
        onLongPress={onLongPress}
      >
        <View
          style={[
            gStyles.avatar,
            { backgroundColor: getAvatarBg(item.first_person) },
          ]}
        >
          <Text
            style={[
              gStyles.avatarText,
              { color: avatarColor || getAvatarColor(item.first_person) },
            ]}
          >
            {initials}
          </Text>
          {isScanned && (
            <View style={gStyles.avatarBadge}>
              <Feather name="check" size={12} color="#FFF" />
            </View>
          )}
        </View>

        <View style={gStyles.content}>
          <View style={gStyles.topRow}>
            <Text
              style={[gStyles.name, isScanned && gStyles.nameScanned]}
              numberOfLines={1}
            >
              {item.first_person}
              {item.second_person ? (
                <Text style={gStyles.nameSecondary}>
                  {" "}
                  & {item.second_person}
                </Text>
              ) : null}
            </Text>
            <View
              style={[
                gStyles.statusBadge,
                isScanned
                  ? { backgroundColor: colors.successSoft }
                  : {
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                    },
              ]}
            >
              <View
                style={[
                  gStyles.dot,
                  {
                    backgroundColor: isScanned
                      ? colors.success
                      : colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  gStyles.statusText,
                  { color: isScanned ? colors.success : colors.textMuted },
                ]}
              >
                {isScanned ? "Présent" : "En attente"}
              </Text>
            </View>
          </View>

          <View style={gStyles.bottomRow}>
            <View style={gStyles.meta}>
              <Feather name="grid" size={12} color={colors.textMuted} />
              <Text style={gStyles.metaText}>Table {item.place || "—"}</Text>
            </View>
            {item.invitation_type && (
              <View style={gStyles.meta}>
                <Feather name="tag" size={12} color={colors.textMuted} />
                <Text style={gStyles.metaText}>{item.invitation_type}</Text>
              </View>
            )}
            {recentlyShared && (
              <View style={gStyles.meta}>
                <Feather name="clock" size={12} color={colors.textMuted} />
                <Text style={gStyles.metaText}>Cooldown</Text>
              </View>
            )}
          </View>
        </View>

        {selectionMode ? (
          <View
            style={[
              gStyles.checkCircle,
              isSelected && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            {isSelected && <Feather name="check" size={14} color="#FFF" />}
          </View>
        ) : (
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const gStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  cardScanned: {
    backgroundColor: colors.successSoft + "40",
    borderWidth: 1,
    borderColor: colors.success + "20",
  },
  cardSelected: { borderWidth: 2, borderColor: colors.primary },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: { fontSize: fontSize.md, fontWeight: fontWeight.bold },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.success,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  content: { flex: 1, marginRight: spacing.sm },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  nameScanned: { color: colors.success },
  nameSecondary: {
    fontWeight: fontWeight.regular,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  bottomRow: { flexDirection: "row", gap: spacing.md, flexWrap: "wrap" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: fontSize.xs, color: colors.textMuted },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
});

const EnhancedSearchAndFilter = ({
  search,
  setSearch,
  onFilterPress,
  sortOption,
}: any) => {
  const currentSort = SORT_OPTIONS.find((s) => s.value === sortOption);
  return (
    <View style={sfStyles.container}>
      <View style={sfStyles.searchBox}>
        <Feather name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={sfStyles.input}
          placeholder="Rechercher un invité..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search !== "" && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[
          sfStyles.filterBtn,
          currentSort?.value !== "recent" && sfStyles.filterBtnActive,
        ]}
        onPress={onFilterPress}
      >
        <Feather
          name={currentSort?.icon as any}
          size={18}
          color={colors.primary}
        />
      </TouchableOpacity>
    </View>
  );
};

const sfStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.base,
    color: colors.text,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primary + "20",
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});

const ActionButtons = ({
  onAddGuest,
  onSharePdfs,
  selectedCount,
  isSharing,
  fabWidth,
  fabTextOpacity,
  fabTextWidth,
  fabTextMargin,
  fabPadding,
}: any) => {
  const hasSelection = selectedCount > 0;
  return (
    <View style={fabStyles.container}>
      {hasSelection && (
        <TouchableOpacity
          style={[fabStyles.btn, fabStyles.btnShare]}
          onPress={onSharePdfs}
          disabled={isSharing}
          activeOpacity={0.85}
        >
          <Feather
            name={isSharing ? "loader" : "share-2"}
            size={16}
            color="#FFF"
          />
          <Text style={fabStyles.btnText}>
            {isSharing ? "Génération..." : `Partager (${selectedCount})`}
          </Text>
        </TouchableOpacity>
      )}

      <Animated.View style={{ width: fabWidth }}>
        <AnimatedTouchable
          style={[fabStyles.btnPrimary, { paddingHorizontal: fabPadding }]}
          onPress={onAddGuest}
          activeOpacity={0.85}
        >
          <Animated.View
            style={[
              fabStyles.textWrap,
              {
                width: fabTextWidth,
                opacity: fabTextOpacity,
                marginRight: fabTextMargin,
              },
            ]}
          >
            <Text style={fabStyles.btnText} numberOfLines={1}>
              Ajouter invité
            </Text>
          </Animated.View>
          <View style={fabStyles.circle}>
            <Feather name="plus" size={16} color={colors.primary} />
          </View>
        </AnimatedTouchable>
      </Animated.View>
    </View>
  );
};

const fabStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: spacing.sm,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    gap: spacing.sm,
    ...shadows.md,
  },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    ...shadows.lg,
  },
  btnShare: {
    backgroundColor: "#8B5CF6",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.3,
  },
  btnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: "#FFF",
    letterSpacing: 0.2,
  },
  textWrap: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  circle: {
    width: 40,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
});

// ═══════════════ COMPOSANT PRINCIPAL ═══════════════
export default function GuestList({ id }: { id: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert, AlertHost } = useAppAlert();
  const filteredGuestsRef = useRef<any[]>([]);
  const eventDetail = useDataStore((state) => state.detailEvent);

  const { plan: currentPlan, canDo } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{
    visible: boolean;
    message?: string;
  }>({ visible: false });

  const [isSharing, setIsSharing] = useState(false);
  const [showShareSuccessPopup, setShowShareSuccessPopup] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);
  const cancelRequested = useRef(false);
  const [recentlySharedGuestIds, setRecentlySharedGuestIds] = useState(
    new Set<string>(),
  );
  const base64Cache = useRef(new Map()).current;
  const qrCache = useRef(new Map()).current;

  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [addGuestModalVisible, setAddGuestModalVisible] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const fabWidth = scrollY.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [200, 200, 64],
    extrapolate: "clamp",
  });

  const fabTextOpacity = scrollY.interpolate({
    inputRange: [0, 60, 110],
    outputRange: [1, 0.2, 0],
    extrapolate: "clamp",
  });

  const fabTextWidth = scrollY.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [110, 110, 0],
    extrapolate: "clamp",
  });

  const fabTextMargin = scrollY.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [spacing.sm, spacing.sm, 0],
    extrapolate: "clamp",
  });

  const fabPadding = scrollY.interpolate({
    inputRange: [0, 80, 140],
    outputRange: [spacing.base, spacing.base, 0],
    extrapolate: "clamp",
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  const {
    event,
    search,
    setSearch,
    sortOption,
    setSortOption,
    modalVisible,
    setModalVisible,
    isConnected,
    refreshing,
    onRefresh,
    filterAndMarkGuests,
    sortGuests,
  } = useGuestList(id);

  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useFocusEffect(
    useCallback(() => {
      onRefreshRef.current?.();
    }, []),
  );

  const defaultAppliedRef = useRef(false);
  useEffect(() => {
    if (!defaultAppliedRef.current && sortOption !== "recent") {
      defaultAppliedRef.current = true;
      setSortOption("recent");
    }
  }, [sortOption, setSortOption]);

  const {
    selectedIds,
    selectionMode,
    handleLongPress,
    handlePress,
    handleToggleSelection,
    handleDeselectAll,
    handleSelectAll,
    bannerAnim,
  } = useGuestSelection();

  const MAX_PDF_SELECTION = 50;

  const fileToBase64 = async (uri: string) => {
    if (!uri || !uri.startsWith("file://")) return uri;
    if (base64Cache.has(uri)) return base64Cache.get(uri);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const ext = uri.split(".").pop()?.toLowerCase() || "jpeg";
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      const dataUri = `data:${mime};base64,${base64}`;
      base64Cache.set(uri, dataUri);
      return dataUri;
    } catch (e) {
      console.warn("Conversion base64 impossible :", e);
      return uri;
    }
  };

  const replaceVariables = (
    template: string,
    variables: Record<string, string>,
  ) => {
    if (!template) return "";
    let result = template;
    for (const [key, value] of Object.entries(variables))
      result = result.split(key).join(value || "");
    return result;
  };

  const getAppliedTheme = async () => {
    try {
      const eventId = eventDetail?.id || id;
      if (!eventId) return DEFAULT_THEME;
      const currentThemeId = await AsyncStorage.getItem(
        `current_theme_${eventId}`,
      );
      if (!currentThemeId) return DEFAULT_THEME;
      const themesData = await AsyncStorage.getItem(`themes_${eventId}`);
      if (!themesData) return DEFAULT_THEME;
      const themes = JSON.parse(themesData);
      const savedTheme = themes.find((t: any) => t.id === currentThemeId);
      if (!savedTheme) return DEFAULT_THEME;

      let pages = savedTheme.pages || DEFAULT_THEME.pages;
      const canvasW = savedTheme.canvas?.width || DEFAULT_THEME.canvas.width;
      const canvasH = savedTheme.canvas?.height || DEFAULT_THEME.canvas.height;

      pages = await Promise.all(
        pages.map(async (page: any) => {
          let bg = page.background;
          if (bg?.type === "image" && bg.value?.startsWith("file://")) {
            bg = { ...bg, value: await fileToBase64(bg.value) };
          }
          return { ...page, background: bg };
        }),
      );

      let blocks = savedTheme.blocks || [];
      if (!Array.isArray(blocks)) blocks = Object.values(blocks);

      blocks = await Promise.all(
        blocks.map(async (b: any) => {
          if (b.type === "image" && b.src?.startsWith("file://")) {
            return { ...b, src: await fileToBase64(b.src) };
          }
          return b;
        }),
      );

      return {
        ...DEFAULT_THEME,
        ...savedTheme,
        canvas: { width: canvasW, height: canvasH },
        pages,
        blocks,
      };
    } catch (err) {
      console.error("Erreur chargement thème:", err);
      return DEFAULT_THEME;
    }
  };

  const fetchGuestQRBase64 = async (guest: any): Promise<string> => {
    if (!guest) return "";
    if (qrCache.has(guest.id)) {
      return qrCache.get(guest.id) || "";
    }

    const qrSource = extractQrSource(guest);
    if (!qrSource) {
      console.warn(
        `[QR] Aucune source pour invité ${guest.first_person} (id=${guest.id})`,
      );
      return "";
    }

    try {
      const rawQr = String(qrSource).trim();
      let result = "";

      if (rawQr.startsWith("data:")) {
        result = rawQr;
      } else if (rawQr.startsWith("http://") || rawQr.startsWith("https://")) {
        const extMatch = rawQr.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        const ext = extMatch ? extMatch[1].toLowerCase() : "png";
        const localPath = FileSystem.cacheDirectory + `qr_${guest.id}.${ext}`;
        await FileSystem.downloadAsync(rawQr, localPath);
        const base64 = await FileSystem.readAsStringAsync(localPath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        result = `data:${mime};base64,${base64}`;
      } else if (rawQr.startsWith("/")) {
        const absoluteUrl = "https://klmarc.pythonanywhere.com" + rawQr;
        const extMatch = rawQr.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        const ext = extMatch ? extMatch[1].toLowerCase() : "png";
        const localPath = FileSystem.cacheDirectory + `qr_${guest.id}.${ext}`;
        await FileSystem.downloadAsync(absoluteUrl, localPath);
        const base64 = await FileSystem.readAsStringAsync(localPath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        result = `data:${mime};base64,${base64}`;
      } else if (rawQr.startsWith("file://")) {
        result = await fileToBase64(rawQr);
      } else if (rawQr.length > 100) {
        result = `data:image/png;base64,${rawQr}`;
      } else {
        const absoluteUrl = "https://klmarc.pythonanywhere.com/" + rawQr;
        const localPath = FileSystem.cacheDirectory + `qr_${guest.id}.png`;
        await FileSystem.downloadAsync(absoluteUrl, localPath);
        const base64 = await FileSystem.readAsStringAsync(localPath, {
          encoding: FileSystem.EncodingType.Base64,
        });
        result = `data:image/png;base64,${base64}`;
      }

      if (result) qrCache.set(guest.id, result);
      return result;
    } catch (err) {
      console.warn(`[QR] Échec chargement QR pour ${guest.first_person}:`, err);
      return "";
    }
  };

  // ✅ CORRIGÉ :
  //    1. Nom = NOM INVITE en MAJUSCULES sans accents
  //    2. Gestion des doublons (NOM INVITE, NOM INVITE 2, NOM INVITE 3...)
  //    3. Plus de page-break-after inline → nombre de pages exact
  //    4. Retourne { path, fileName }
  const generateGuestPDF = async (
    guest: any,
    theme: any,
    folderPath: string,
    usedNames: Map<string, number>,
  ): Promise<{ path: string; fileName: string }> => {
    const canvasW = theme.canvas?.width || 800;
    const canvasH = theme.canvas?.height || 600;

    const qrImageSrc = await fetchGuestQRBase64(guest);

    const guestFullName =
      `${guest.first_person || ""} ${guest.second_person || ""}`.trim() ||
      "Invité";
    const dateFormatted = eventDetail?.date
      ? dayjs(eventDetail.date).format("DD/MM/YY")
      : "";

    const variables: Record<string, string> = {
      "{{nom_invite}}": guestFullName,
      "{{code_invitation}}": guest.code_invit || guest.id || "",
      "{{table}}": guest.place || "Non assignée",
      "{{categorie}}": guest.invitation_type || "Standard",
      "{{categorie_invite}}": guest.invitation_type || "Standard",
      "{{telephone}}": guest.tel || "Non renseigné",
      "{{email}}": guest.email || "Non renseigné",
      "{{nom_evenement}}": eventDetail?.name || "Événement",
      "{{date_evenement}}": dateFormatted,
      "{{lieu}}": eventDetail?.location || "Non précisé",
    };

    const pagesHTML = theme.pages
      .map((page: any, pageIndex: number) => {
        const pageBlocks = theme.blocks.filter(
          (b: any) => (b.pageIndex ?? 0) === pageIndex,
        );
        const bg = page.background;
        let bgStyle = "";
        if (bg?.type === "color") bgStyle = `background-color: ${bg.value};`;
        else if (bg?.type === "image" && bg?.value)
          bgStyle = `background-image: url('${bg.value}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;

        const blocksHTML = pageBlocks
          .map((block: any) => {
            let leftPct, topPct, widthPct, heightPct;
            if (block.xPercent !== undefined) {
              leftPct = block.xPercent;
              topPct = block.yPercent;
              widthPct = block.widthPercent;
              heightPct = block.heightPercent;
            } else {
              leftPct = ((block.x || 0) / canvasW) * 100;
              topPct = ((block.y || 0) / canvasH) * 100;
              widthPct = ((block.width || 100) / canvasW) * 100;
              heightPct = ((block.height || 40) / canvasH) * 100;
            }
            const positionStyle = `position: absolute; left: ${leftPct}%; top: ${topPct}%; width: ${widthPct}%; height: ${heightPct}%; transform: rotate(${block.rotation || 0}deg); z-index: 2;`;
            let contentHTML = "";
            switch (block.type) {
              case "text": {
                const text = replaceVariables(block.text || "", variables);
                const style = block.style || {};
                const safeText = text
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;")
                  .replace(/\n/g, "<br/>");
                contentHTML = `<div style="font-size: ${style.fontSize || 24}px; color: ${style.color || "#000000"}; text-align: ${style.align || "left"}; font-family: ${style.fontFamily || "Arial"}; font-weight: ${style.fontWeight || "normal"}; width: 100%; height: 100%; display: flex; align-items: center; ${style.align === "center" ? "justify-content: center;" : ""} overflow: hidden; line-height: 1.2;">${safeText}</div>`;
                break;
              }
              case "image":
                contentHTML = `<div style="width: 100%; height: 100%; background-image: url('${block.src || ""}'); background-size: cover; background-position: center; background-repeat: no-repeat;"></div>`;
                break;
              case "qr":
                if (qrImageSrc) {
                  contentHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;"><img src="${qrImageSrc}" style="max-width: 90%; max-height: 90%; width: auto; height: auto;" /></div>`;
                } else {
                  contentHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 12pt; font-family: Arial;">QR indisponible</div>`;
                }
                break;
              default:
                contentHTML = `<div></div>`;
            }
            return `<div style="${positionStyle}">${contentHTML}</div>`;
          })
          .join("");

        // ✅ Pas de page-break-after inline → le CSS .page:last-child gère
        return `<div class="page" style="width: ${canvasW}pt; height: ${canvasH}pt; position: relative; overflow: hidden; ${bgStyle}">${blocksHTML}</div>`;
      })
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
      @page { size: ${canvasW}pt ${canvasH}pt; margin: 0; }
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
      * { box-sizing: border-box; }
      .page { page-break-after: always; }
      .page:last-child { page-break-after: avoid; }
    </style></head><body>${pagesHTML}</body></html>`;

    const result = await Print.printToFileAsync({
      html,
      width: canvasW,
      height: canvasH,
      base64: true,
    });

    if (!result.base64) {
      throw new Error("PDF base64 manquant");
    }

    // ✅ Nom MAJUSCULE sans accents ni caractères spéciaux
    const baseName = guestFullName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();

    const safeBaseName = baseName || "INVITE";

    // ✅ Gestion des doublons : NOM INVITE, NOM INVITE 2, NOM INVITE 3...
    let fileName: string;
    const existingCount = usedNames.get(safeBaseName) || 0;
    if (existingCount === 0) {
      fileName = `${safeBaseName}.pdf`;
      usedNames.set(safeBaseName, 1);
    } else {
      const next = existingCount + 1;
      fileName = `${safeBaseName} ${next}.pdf`;
      usedNames.set(safeBaseName, next);
    }

    const pdfPath = `${folderPath}${fileName}`;
    await FileSystem.writeAsStringAsync(pdfPath, result.base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return { path: pdfPath, fileName };
  };

  const handleShareSelectedPdfs = async () => {
    if (selectedIds.length > 1 && !canDo("can_export_pdf_multiple")) {
      setUpgradeModal({
        visible: true,
        message:
          "L'export de plusieurs invitations en PDF est réservé aux plans " +
          "Standard et supérieurs. Passez à un plan supérieur pour " +
          "générer plusieurs PDFs en un seul clic (ZIP).",
      });
      return;
    }

    const availableGuests = filteredGuestsRef.current.filter(
      (g: any) =>
        selectedIds.includes(g.id) && !recentlySharedGuestIds.has(g.id),
    );
    if (availableGuests.length === 0) {
      showAlert({
        title: "Aucun invité disponible",
        message:
          "Les invités sélectionnés sont en période de récupération (3 min). Réessayez bientôt.",
        variant: "warning",
        buttons: [{ text: "Compris", style: "default" }],
      });
      return;
    }
    if (availableGuests.length > MAX_PDF_SELECTION) {
      showAlert({
        title: "Limite atteinte",
        message: `Vous ne pouvez partager que ${MAX_PDF_SELECTION} invitations à la fois. Sélectionnez moins d'invités.`,
        variant: "warning",
        buttons: [{ text: "Compris", style: "default" }],
      });
      return;
    }

    const eventIdForTheme = eventDetail?.id || id;
    const themeApplied = await hasAppliedTheme(eventIdForTheme);
    if (!themeApplied) {
      showAlert({
        title: "Aucun thème appliqué",
        message:
          "Vous devez d'abord créer un thème et l'appliquer à cet événement avant de pouvoir générer les invitations PDF.",
        variant: "warning",
        buttons: [
          { text: "Plus tard", style: "cancel" },
          {
            text: "Choisir un thème",
            onPress: () => {
              router.push({
                pathname: "/(main)/guests/themes/[eventId]",
                params: { eventId: String(eventIdForTheme) },
              });
            },
          },
        ],
      });
      return;
    }

    setIsSharing(true);
    cancelRequested.current = false;
    setShowShareSuccessPopup(false);
    base64Cache.clear();
    qrCache.clear();
    setGenerationProgress(0);

    const tempFolder = FileSystem.documentDirectory + "temp_pdfs/";
    let zipPath: string | null = null;

    try {
      await FileSystem.makeDirectoryAsync(tempFolder, { intermediates: true });
      setGenerationStatus("Préparation du thème...");
      const theme = await getAppliedTheme();
      if (cancelRequested.current) {
        setIsSharing(false);
        await FileSystem.deleteAsync(tempFolder, { idempotent: true });
        return;
      }

      const total = availableGuests.length;
      // ✅ Nouveau type : { path, fileName }[] + Map pour doublons
      const pdfPaths: { path: string; fileName: string }[] = [];
      const usedNames = new Map<string, number>();

      for (let i = 0; i < total; i++) {
        if (cancelRequested.current) {
          await FileSystem.deleteAsync(tempFolder, { idempotent: true });
          setIsSharing(false);
          return;
        }

        const guest = availableGuests[i];
        setGenerationStatus(
          `Génération PDF ${i + 1}/${total} : ${guest.first_person || ""}`,
        );
        setGenerationProgress(Math.floor(((i + 1) / total) * 100));

        try {
          const result = await generateGuestPDF(
            guest,
            theme,
            tempFolder,
            usedNames,
          );
          pdfPaths.push(result);
        } catch (err) {
          console.error(`Échec pour ${guest.first_person}`, err);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      if (cancelRequested.current || pdfPaths.length === 0) {
        await FileSystem.deleteAsync(tempFolder, { idempotent: true });
        setIsSharing(false);
        return;
      }

      setGenerationStatus("Compression du fichier ZIP...");
      setGenerationProgress(100);
      const zip = new JSZip();

      // ✅ Utilise item.fileName (nom déjà nettoyé + dédoublonné)
      for (const item of pdfPaths) {
        const base64Content = await FileSystem.readAsStringAsync(item.path, {
          encoding: FileSystem.EncodingType.Base64,
        });
        zip.file(item.fileName, base64Content, { base64: true });
      }

      const zipBase64 = await zip.generateAsync({ type: "base64" });
      const zipFileName = `Invitations_${dayjs().format("YYYYMMDD_HHmm")}.zip`;
      zipPath = FileSystem.documentDirectory + zipFileName;
      await FileSystem.writeAsStringAsync(zipPath, zipBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setGenerationStatus("Ouverture du partage...");
      await Sharing.shareAsync(zipPath, {
        mimeType: "application/zip",
        dialogTitle: "Partager les invitations (ZIP)",
      });

      await FileSystem.deleteAsync(tempFolder, { idempotent: true });
      await FileSystem.deleteAsync(zipPath, { idempotent: true });

      const sharedGuestIds = availableGuests.map((g: any) => g.id);
      setRecentlySharedGuestIds(
        (prev) => new Set([...prev, ...sharedGuestIds]),
      );
      setTimeout(
        () => {
          setRecentlySharedGuestIds((prev) => {
            const newSet = new Set(prev);
            sharedGuestIds.forEach((id: string) => newSet.delete(id));
            return newSet;
          });
        },
        3 * 60 * 1000,
      );

      setShowShareSuccessPopup(true);
    } catch (err: any) {
      console.error("Erreur génération PDFs:", err);
      showAlert({
        title: "Erreur de génération",
        message: err?.message || "Impossible de générer le PDF ou le ZIP.",
        variant: "danger",
        buttons: [{ text: "OK", style: "default" }],
      });
      try {
        if (tempFolder)
          await FileSystem.deleteAsync(tempFolder, { idempotent: true });
        if (zipPath)
          await FileSystem.deleteAsync(zipPath, { idempotent: true });
      } catch {}
    } finally {
      setIsSharing(false);
      setGenerationStatus("");
      setGenerationProgress(0);
      base64Cache.clear();
      qrCache.clear();
    }
  };

  const handleCancelGeneration = () => {
    cancelRequested.current = true;
    setGenerationStatus("Annulation...");
  };

  useEffect(() => {
    filteredGuestsRef.current = filterAndMarkGuests();
  }, [filterAndMarkGuests]);

  const calculateTotalGuestsInSection = useCallback(
    (data: any[]) =>
      data.reduce((total, guest) => total + (guest.second_person ? 2 : 1), 0),
    [],
  );

  const renderCard = useCallback(
    ({ item, index }: any) => {
      const isScanned = item.scanned || item.validated;
      const firstLetter = (item.first_person || "A").charAt(0);
      const avatarColor = getAvatarColor(firstLetter);
      const isRecentlyShared = recentlySharedGuestIds.has(item.id);
      return (
        <ModernGuestCard
          item={item}
          isSelected={selectedIds.includes(item.id)}
          selectionMode={selectionMode}
          onPress={() => setSelectedGuestId(item.id)}
          onLongPress={() =>
            handleLongPress(item.id, filteredGuestsRef.current)
          }
          onToggleSelection={() =>
            handleToggleSelection(item.id, filteredGuestsRef.current)
          }
          recentlyShared={isRecentlyShared}
          isScanned={isScanned}
          avatarColor={avatarColor}
          index={index}
        />
      );
    },
    [
      selectedIds,
      selectionMode,
      handleLongPress,
      handleToggleSelection,
      recentlySharedGuestIds,
    ],
  );

  const renderSectionHeader = useCallback(
    ({ section: { title, data } }: any) => {
      const totalGuests = calculateTotalGuestsInSection(data);
      const firstLetter = title.charAt(0);
      const badgeColor = getAvatarColor(firstLetter);
      const softColor = getAvatarBg(firstLetter);
      return (
        <View style={shStyles.container}>
          <View style={[shStyles.badge, { backgroundColor: badgeColor }]}>
            <Text style={shStyles.badgeText}>{firstLetter}</Text>
          </View>
          <Text style={shStyles.title}>{title}</Text>
          <View
            style={[
              shStyles.countBadge,
              { backgroundColor: softColor, borderColor: badgeColor + "40" },
            ]}
          >
            <Text style={[shStyles.countText, { color: badgeColor }]}>
              {totalGuests}
            </Text>
          </View>
        </View>
      );
    },
    [calculateTotalGuestsInSection],
  );

  const rawSorted = sortGuests();

  const finalSorted = useMemo(() => {
    if (!rawSorted) return [];
    if (sortOption !== "recent") return rawSorted;

    let flat: any[] = [];
    if (Array.isArray(rawSorted)) {
      if (rawSorted.length > 0 && (rawSorted[0] as any)?.data) {
        flat = rawSorted.flatMap((s: any) => s.data || []);
      } else {
        flat = rawSorted;
      }
    }

    return [...flat].sort((a: any, b: any) => {
      const ta = getGuestCreatedTime(a);
      const tb = getGuestCreatedTime(b);
      if (ta === 0 && tb === 0) return 0;
      return tb - ta;
    });
  }, [rawSorted, sortOption]);

  const isSectioned = useMemo(() => {
    return (
      sortOption !== "recent" &&
      Array.isArray(finalSorted) &&
      finalSorted.length > 0 &&
      (finalSorted[0] as any)?.data
    );
  }, [finalSorted, sortOption]);

  const isInitialLoading = event === null && refreshing === false;
  if (
    isInitialLoading &&
    (!finalSorted || (Array.isArray(finalSorted) && finalSorted.length === 0))
  ) {
    return <GuestListSkeleton />;
  }

  const renderProgressModal = () => (
    <Modal
      transparent
      visible={isSharing}
      animationType="fade"
      onRequestClose={handleCancelGeneration}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.glassCard}>
          <View
            style={[
              modalStyles.iconCircle,
              { backgroundColor: colors.primary },
            ]}
          >
            <Feather name="file-text" size={28} color="#FFF" />
          </View>
          <Text style={modalStyles.title}>Génération des invitations</Text>
          <Text style={modalStyles.subtitle} numberOfLines={1}>
            {generationStatus}
          </Text>
          <View style={modalStyles.track}>
            <View
              style={[modalStyles.fill, { width: `${generationProgress}%` }]}
            />
          </View>
          <Text style={modalStyles.progressText}>{generationProgress}%</Text>
          <TouchableOpacity
            style={modalStyles.cancelBtn}
            onPress={handleCancelGeneration}
            activeOpacity={0.8}
          >
            <Feather name="x" size={16} color={colors.error} />
            <Text style={modalStyles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSuccessModal = () => (
    <Modal
      transparent
      visible={showShareSuccessPopup}
      animationType="fade"
      onRequestClose={() => setShowShareSuccessPopup(false)}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.glassCard}>
          <View
            style={[
              modalStyles.iconCircle,
              {
                backgroundColor: colors.successSoft,
                borderWidth: 1.5,
                borderColor: colors.success + "30",
              },
            ]}
          >
            <Feather name="check" size={32} color={colors.success} />
          </View>
          <Text style={modalStyles.title}>ZIP prêt !</Text>
          <Text style={modalStyles.body}>
            {selectedIds.length} invitation{selectedIds.length > 1 ? "s" : ""}{" "}
            dans un fichier ZIP. Ces invités seront indisponibles pendant 3
            minutes.
          </Text>
          <TouchableOpacity
            style={[
              modalStyles.successBtn,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => {
              setShowShareSuccessPopup(false);
              handleDeselectAll();
            }}
            activeOpacity={0.85}
          >
            <Text style={modalStyles.successBtnText}>Continuer</Text>
            <Feather
              name="arrow-right"
              size={18}
              color="#FFF"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      {renderProgressModal()}
      {renderSuccessModal()}

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {eventDetail?.name || "Invités"}
        </Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.push("/camera")}
          activeOpacity={0.7}
        >
          <Feather name="maximize" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <AlertBanners
        showLimitAlert={false}
        bannerAnim={bannerAnim}
        isConnected={isConnected}
      />

      <View style={styles.searchWrapper}>
        <EnhancedSearchAndFilter
          search={search}
          setSearch={setSearch}
          onFilterPress={() => setModalVisible(true)}
          sortOption={sortOption}
        />
      </View>

      <View style={styles.guestCountWrapper}>
        <GuestCount
          count={
            Array.isArray(finalSorted) && isSectioned
              ? (finalSorted as any[]).reduce(
                  (sum, s) => sum + (s.data?.length || 0),
                  0,
                )
              : (finalSorted as any[])?.length || 0
          }
        />
      </View>

      {selectionMode && (
        <View style={styles.selectionWrapper}>
          <SelectionHeader
            selectionCount={selectedIds.length}
            onDeselectAll={handleDeselectAll}
            onSelectAll={() => handleSelectAll(filteredGuestsRef.current)}
            maxSelectionLimit={MAX_PDF_SELECTION}
          />
        </View>
      )}

      <View style={styles.listWithFabWrapper}>
        {isSectioned ? (
          <SectionList
            sections={finalSorted as any}
            keyExtractor={(item: any) => item.id?.toString()}
            renderItem={renderCard}
            renderSectionHeader={renderSectionHeader}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            stickySectionHeadersEnabled
          />
        ) : (
          <FlatList
            data={finalSorted as any}
            keyExtractor={(item: any) => item.id?.toString()}
            renderItem={renderCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
          />
        )}

        <View
          style={[styles.fabOverlay, { bottom: insets.bottom + spacing.lg }]}
          pointerEvents="box-none"
        >
          <ActionButtons
            onAddGuest={() => setAddGuestModalVisible(true)}
            onSharePdfs={handleShareSelectedPdfs}
            selectedCount={selectedIds.length}
            isSharing={isSharing}
            fabWidth={fabWidth}
            fabTextOpacity={fabTextOpacity}
            fabTextWidth={fabTextWidth}
            fabTextMargin={fabTextMargin}
            fabPadding={fabPadding}
          />
        </View>
      </View>

      <SortModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      <GuestDetailModal
        visible={!!selectedGuestId}
        guestId={selectedGuestId}
        onClose={() => setSelectedGuestId(null)}
        onDeleted={() => {
          setSelectedGuestId(null);
          if (typeof onRefresh === "function") onRefresh();
        }}
      />

      <AddGuestModal
        visible={addGuestModalVisible}
        eventId={id}
        onClose={() => setAddGuestModalVisible(false)}
        onSuccess={() => {
          if (typeof onRefresh === "function") onRefresh();
        }}
      />

      <UpgradeModal
        visible={upgradeModal.visible}
        onClose={() => setUpgradeModal({ visible: false })}
        message={upgradeModal.message}
        featureName="Export PDF multiple"
        currentPlan={currentPlan}
        recommendedPlan="standard"
      />

      {AlertHost}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.bg,
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
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },

  searchWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    zIndex: 1,
  },
  guestCountWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    zIndex: 1,
  },
  selectionWrapper: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    zIndex: 1,
  },
  listWithFabWrapper: { flex: 1, zIndex: 1, position: "relative" },
  list: {
    paddingBottom: spacing.xxxl + 60,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  fabOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});

const shStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 0.5,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  badgeText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
  },
  title: {
    flex: 1,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
    color: colors.text,
    letterSpacing: 0.2,
  },
  countBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  countText: { fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  glassCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: SCREEN_W * 0.85,
    alignItems: "center",
    ...shadows.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    marginBottom: spacing.lg,
    maxWidth: "90%",
    textAlign: "center",
  },
  track: {
    width: "100%",
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  fill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.lg,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.errorSoft,
    borderWidth: 1,
    borderColor: colors.error + "30",
  },
  cancelText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  body: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  successBtn: {
    flexDirection: "row",
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  successBtnText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
