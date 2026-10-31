// app/(main)/home/index.tsx
import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Image,
  RefreshControl,
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
import {
  countEventsByCategory,
  filterEventsByCategory,
  supprimerEvent,
  type EventCategory,
  type NormalizedEvent,
} from "../../../src/api/events";
import HomeSkeleton from "../../../src/components/common/Skeletons/HomeSkeleton";
import { DeleteSuccessModal } from "../../../src/components/events/DeleteSuccessModal";
import { EmptyState, FAB } from "../../../src/components/ui";
import { useAppAlert } from "../../../src/hooks/useAppAlert";
import { useEvents } from "../../../src/hooks/useEvents";
import { useUserAvatar } from "../../../src/hooks/useUserAvatar";
import { colors, fontWeight, shadows } from "../../../src/theme/tokens";
import { getEventId } from "../../../src/utils/eventId";

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const isImageUrl = (str: any) =>
  typeof str === "string" &&
  (str.startsWith("http") ||
    str.startsWith("/") ||
    str.startsWith("data:image"));

const findImage = (obj: any, visited = new WeakSet()): string | null => {
  if (!obj || typeof obj !== "object") return null;
  if (visited.has(obj)) return null;
  visited.add(obj);
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const f = findImage(item, visited);
      if (f) return f;
    }
    return null;
  }
  const keys = [
    "image",
    "cover_image",
    "event_image",
    "photo",
    "banner",
    "thumbnail",
    "cover",
    "image_url",
    "event_image_url",
  ];
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && isImageUrl(v)) return v;
    if (typeof v === "object" && v) {
      const n = findImage(v, visited);
      if (n) return n;
    }
  }
  for (const k in obj) {
    if (keys.includes(k)) continue;
    const v = obj[k];
    if (typeof v === "string" && isImageUrl(v)) return v;
    if (typeof v === "object" && v) {
      const n = findImage(v, visited);
      if (n) return n;
    }
  }
  return null;
};

const findCode = (obj: any, visited = new WeakSet()): string | null => {
  if (!obj || typeof obj !== "object") return null;
  if (visited.has(obj)) return null;
  visited.add(obj);
  const isValid = (v: any) => {
    if (typeof v === "string" && /^[A-Z0-9]{6,10}$/i.test(v.trim()))
      return v.trim();
    return null;
  };
  const keys = [
    "code_event",
    "event_code",
    "invitation_code",
    "code_invit",
    "code",
  ];
  for (const k of keys) {
    const c = isValid(obj[k]);
    if (c) return c;
  }
  for (const k in obj) {
    if (keys.includes(k)) continue;
    const c = isValid(obj[k]);
    if (c) return c;
  }
  return null;
};

const getEventImage = (event: any) => {
  const raw = (() => {
    if (event?.image_url) {
      if (
        typeof event.image_url === "string" &&
        event.image_url.startsWith("/")
      ) {
        return "https://klmarc.pythonanywhere.com" + event.image_url;
      }
      if (typeof event.image_url === "string") return event.image_url;
    }
    if (event?.event_image && typeof event.event_image === "string") {
      const v = event.event_image;
      return v.startsWith("/") ? "https://klmarc.pythonanywhere.com" + v : v;
    }
    const img = findImage(event);
    if (!img) return null;
    return img.startsWith("/")
      ? "https://klmarc.pythonanywhere.com" + img
      : img;
  })();
  if (!raw) return null;
  const stamp =
    event?.updated_at ||
    event?.updatedAt ||
    event?.created_date ||
    event?.created_at ||
    "";
  if (!stamp) return raw;
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}v=${encodeURIComponent(String(stamp))}`;
};

const getEventCode = (event: any) => event?.event_code || findCode(event);

const getEventName = (event: any) =>
  event?.title ||
  event?.name ||
  event?.event_name ||
  event?.nom ||
  "Sans titre";

const getEventDate = (event: any) => {
  const fields = [
    "date",
    "start_date",
    "event_date",
    "date_event",
    "created_at",
  ];
  for (const f of fields) {
    const v = event?.[f];
    if (v) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
    }
  }
  return "Date inconnue";
};

const getEventLocation = (event: any) =>
  event?.location ||
  event?.place ||
  event?.venue ||
  event?.address ||
  event?.lieu ||
  event?.ville ||
  null;

const getEventType = (event: any): EventCategory => {
  if (event?.category) {
    const c = String(event.category).toLowerCase().trim();
    if (
      c === "mariage" ||
      c === "birthday" ||
      c === "concert" ||
      c === "conference"
    ) {
      return c as EventCategory;
    }
  }
  const raw = event?.type || event?.event_category || event?.category || "";
  const key = String(raw).toLowerCase().trim();
  const map: Record<string, EventCategory> = {
    wedding: "mariage",
    mariage: "mariage",
    birthday: "birthday",
    anniversaire: "birthday",
    concert: "concert",
    conference: "conference",
    conférence: "conference",
  };
  return map[key] || "default";
};

const getEventTypeLabel = (type: string) =>
  ({
    mariage: "Mariage",
    wedding: "Mariage",
    birthday: "Anniversaire",
    conference: "Conférence",
    concert: "Concert",
    default: "Événement",
  })[type] || "Événement";

const getEventTypeStyle = (type: string) => {
  const styles: Record<string, { bg: string; text: string; icon: string }> = {
    mariage: { bg: "#FDF2F8", text: "#DB2777", icon: "heart" },
    wedding: { bg: "#FDF2F8", text: "#DB2777", icon: "heart" },
    birthday: { bg: "#F0FDF4", text: "#16A34A", icon: "gift" },
    conference: { bg: "#EFF6FF", text: "#2563EB", icon: "users" },
    concert: { bg: "#FAF5FF", text: "#9333EA", icon: "music" },
    default: {
      bg: colors.primarySoft,
      text: colors.primary,
      icon: "calendar",
    },
  };
  return styles[type] || styles.default;
};

// ─────────────────────────────────────────────────────────────
// ✅ Tri décroissant par date de création
//    + Fallback "first-seen" si created_at est absent
// ─────────────────────────────────────────────────────────────
const getCreatedAtMs = (event: any): number => {
  const candidates = [
    event?.created_at,
    event?.created_date,
    event?.created,
    event?.createdAt,
    event?.date_creation,
  ];
  for (const c of candidates) {
    if (!c) continue;
    const t = new Date(c).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
};

// Suivi interne : quand un event est vu pour la 1ère fois par l'app
const firstSeenMap = new Map<string, number>();

const sortEventsByCreatedDesc = (
  list: NormalizedEvent[],
): NormalizedEvent[] => {
  const now = Date.now();
  // Attribue un timestamp "first-seen" aux events jamais vus
  list.forEach((e) => {
    const id = getEventId(e);
    if (id && !firstSeenMap.has(id)) firstSeenMap.set(id, now);
  });
  return [...list].sort((a, b) => {
    const aMs = getCreatedAtMs(a);
    const bMs = getCreatedAtMs(b);
    if (aMs !== bMs) return bMs - aMs; // priorité absolue : created_at
    // Fallback : ordre de première apparition dans l'app
    const aId = getEventId(a) || "";
    const bId = getEventId(b) || "";
    const aSeen = firstSeenMap.get(aId) || 0;
    const bSeen = firstSeenMap.get(bId) || 0;
    return bSeen - aSeen;
  });
};

// ═══════════════════════════════════════════════════════════════
// EventCard
// ═══════════════════════════════════════════════════════════════
const EventCard = memo(
  ({
    event,
    isSelecting,
    isSelected,
    onPressItem,
    onLongPress,
    onCopyCode,
  }: any) => {
    const [imageError, setImageError] = useState(false);
    const scale = useRef(new Animated.Value(1)).current;

    const eventName = useMemo(() => getEventName(event), [event]);
    const eventDate = useMemo(() => getEventDate(event), [event]);
    const eventCode = useMemo(() => getEventCode(event), [event]);
    const eventImage = useMemo(() => getEventImage(event), [event]);
    const eventLocation = useMemo(() => getEventLocation(event), [event]);
    const eventType = useMemo(() => getEventType(event), [event]);
    const typeStyle = useMemo(() => getEventTypeStyle(eventType), [eventType]);
    const eventId = useMemo(() => getEventId(event), [event]);

    useEffect(() => setImageError(false), [eventImage]);

    const pressIn = () =>
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
    const pressOut = () =>
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    const handlePress = () => {
      if (!eventId) return;
      onPressItem(eventId);
    };
    const handleLong = () => {
      if (!eventId) return;
      onLongPress(eventId);
    };

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handlePress}
          onLongPress={handleLong}
          onPressIn={pressIn}
          onPressOut={pressOut}
          delayLongPress={300}
          style={[cardStyles.card, isSelected && cardStyles.cardSelected]}
        >
          <View style={cardStyles.imageContainer}>
            {eventImage && !imageError ? (
              <Image
                source={{ uri: eventImage }}
                style={cardStyles.image}
                resizeMode="cover"
                onError={() => setImageError(true)}
                key={eventImage}
              />
            ) : (
              <View
                style={[
                  cardStyles.image,
                  {
                    backgroundColor: typeStyle.bg,
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
              >
                <Feather
                  name={typeStyle.icon as any}
                  size={44}
                  color={typeStyle.text}
                />
              </View>
            )}

            <View
              style={[cardStyles.typeBadge, { backgroundColor: typeStyle.bg }]}
            >
              <Text
                style={[cardStyles.typeBadgeText, { color: typeStyle.text }]}
              >
                {getEventTypeLabel(eventType)}
              </Text>
            </View>

            {eventCode && (
              <View style={cardStyles.codeOverlay}>
                <Feather name="hash" size={11} color={colors.textInverse} />
                <Text style={cardStyles.codeOverlayText}>{eventCode}</Text>
              </View>
            )}

            {isSelecting && (
              <View style={cardStyles.checkboxContainer}>
                <View
                  style={[
                    cardStyles.checkbox,
                    isSelected && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  {isSelected && (
                    <Feather
                      name="check"
                      size={14}
                      color={colors.textInverse}
                    />
                  )}
                </View>
              </View>
            )}
          </View>

          <View style={cardStyles.content}>
            <Text style={cardStyles.name} numberOfLines={2}>
              {eventName}
            </Text>

            <View style={cardStyles.metaRow}>
              <View style={cardStyles.metaItem}>
                <Feather
                  name="calendar"
                  size={12}
                  color={colors.textSecondary}
                />
                <Text style={cardStyles.metaText} numberOfLines={1}>
                  {eventDate}
                </Text>
              </View>
              {eventCode && (
                <TouchableOpacity
                  style={cardStyles.codeBadge}
                  onPress={() => onCopyCode?.(eventCode)}
                  activeOpacity={0.7}
                >
                  <Feather name="hash" size={10} color={colors.primary} />
                  <Text style={cardStyles.codeBadgeText}>{eventCode}</Text>
                </TouchableOpacity>
              )}
            </View>

            {eventLocation && (
              <View style={cardStyles.footer}>
                <Feather name="map-pin" size={11} color={colors.textMuted} />
                <Text style={cardStyles.footerText} numberOfLines={1}>
                  {eventLocation}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);
EventCard.displayName = "EventCard";

const FILTERS: {
  label: string;
  value: EventCategory | "all";
  icon: "grid" | "heart" | "gift" | "users" | "music";
}[] = [
  { label: "Tout", value: "all", icon: "grid" },
  { label: "Mariages", value: "mariage", icon: "heart" },
  { label: "Anniversaires", value: "birthday", icon: "gift" },
  { label: "Conférences", value: "conference", icon: "users" },
  { label: "Concerts", value: "concert", icon: "music" },
];

export default function Home() {
  const router = useRouter();
  const { showAlert, AlertHost } = useAppAlert();

  const {
    imageUrl: profileImageUrl,
    initials,
    imageError,
    onImageError,
  } = useUserAvatar();

  const { events, loading, refresh } = useEvents();

  const [selectedFilter, setSelectedFilter] = useState<EventCategory | "all">(
    "all",
  );
  const [allEvents, setAllEvents] = useState<NormalizedEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<NormalizedEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refreshRef.current?.(true).catch(() => {});

      const onBackPress = () => {
        router.replace("/choose");
        return true;
      };
      const sub = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => sub.remove();
    }, [router]),
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  // ✅ TRI + debug : dernier créé en haut
  useEffect(() => {
    const raw = (events as NormalizedEvent[]) || [];

    // 🔍 DEBUG (visible uniquement en dev) — à retirer une fois le tri validé
    if (__DEV__ && raw.length > 0) {
      const sample = raw[0] as any;
      console.log(
        "[HOME SORT] keys event[0] =",
        Object.keys(sample).join(", "),
      );
      console.log(
        "[HOME SORT] created_at (3 premiers) =",
        raw.slice(0, 3).map((e: any) => ({
          id: e.id,
          created_at: e.created_at ?? null,
          created_date: e.created_date ?? null,
          created: e.created ?? null,
          createdAt: e.createdAt ?? null,
          date_creation: e.date_creation ?? null,
        })),
      );
    }

    setAllEvents(sortEventsByCreatedDesc(raw));
  }, [events]);

  const categoryCounts = useMemo(
    () => countEventsByCategory(allEvents),
    [allEvents],
  );

  useEffect(() => {
    let filtered = filterEventsByCategory(allEvents, selectedFilter);

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((i) =>
        getEventName(i).toLowerCase().includes(q),
      );
    }

    setFilteredEvents(filtered);
  }, [allEvents, selectedFilter, search]);

  const copyToClipboard = async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh(true);
    setRefreshing(false);
  };

  const handleLongPress = (id: string) => {
    if (!isSelecting) {
      setIsSelecting(true);
      setSelectedEvents([id]);
    } else {
      toggleSelection(id);
    }
  };

  const toggleSelection = (id: string) =>
    setSelectedEvents((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const selectAll = () =>
    setSelectedEvents(
      filteredEvents
        .map((e) => getEventId(e))
        .filter((x): x is string => x !== null),
    );

  const deselectAll = () => setSelectedEvents([]);

  const handlePressItem = (id: string) => {
    if (isSelecting) {
      toggleSelection(id);
      return;
    }
    if (!id || id === "undefined" || id === "null") return;
    router.push({
      pathname: "/events/wedding/detail/[id]",
      params: { id },
    });
  };

  const confirmDeleteMultiple = async () => {
    const count = selectedEvents.length;
    const idsToDelete = [...selectedEvents];

    const toDelete = idsToDelete.map((id) => {
      const ev = allEvents.find((e) => getEventId(e) === id);
      return { id, category: ev ? getEventType(ev) : "default" };
    });

    setSelectedEvents([]);
    setIsSelecting(false);

    try {
      await Promise.allSettled(
        toDelete.map(({ id, category }) =>
          supprimerEvent(id, category).catch(() => ({
            success: false,
          })),
        ),
      );

      setDeletedCount(count);
      setShowDeleteSuccess(true);

      await refreshRef.current?.(true);
    } catch {
      // silencieux
    }
  };

  const handleDelete = () => {
    const count = selectedEvents.length;
    showAlert({
      title:
        count > 1 ? "Supprimer ces événements ?" : "Supprimer cet événement ?",
      message:
        count > 1
          ? `${count} événements seront déplacés dans la corbeille. Vous pourrez les récupérer pendant 48h.`
          : "Cet événement sera déplacé dans la corbeille. Vous pourrez le récupérer pendant 48h.",
      variant: "danger",
      buttons: [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: confirmDeleteMultiple,
        },
      ],
    });
  };

  const exitSelectionMode = () => {
    setSelectedEvents([]);
    setIsSelecting(false);
  };

  const isEventSelected = (event: any) => {
    const id = getEventId(event);
    return id !== null && selectedEvents.includes(id);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {copiedCode && (
          <View style={styles.toast}>
            <Feather name="check-circle" size={14} color={colors.success} />
            <Text style={styles.toastText}>Code {copiedCode} copié</Text>
          </View>
        )}

        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>Event Plan</Text>
            <Text style={styles.subtitle}>Organisez vos événements</Text>
          </View>
          <TouchableOpacity
            style={styles.avatar}
            activeOpacity={0.85}
            onPress={() =>
              isSelecting ? exitSelectionMode() : router.push("/(main)/profile")
            }
          >
            {profileImageUrl && !imageError ? (
              <Image
                source={{ uri: profileImageUrl }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={onImageError}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un événement…"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            editable={!isSelecting}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {FILTERS.map((f) => {
              const active = selectedFilter === f.value;
              const count =
                f.value === "all"
                  ? allEvents.length
                  : categoryCounts[f.value as EventCategory] || 0;

              return (
                <TouchableOpacity
                  key={f.value}
                  activeOpacity={0.85}
                  onPress={() => setSelectedFilter(f.value)}
                  disabled={isSelecting}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Feather
                    name={f.icon}
                    size={14}
                    color={active ? colors.textInverse : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        styles.filterCountBadge,
                        active && styles.filterCountBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterCountText,
                          active && styles.filterCountTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.counterRow}>
          <Text style={styles.counterText}>
            {filteredEvents.length} événement
            {filteredEvents.length > 1 ? "s" : ""}
          </Text>
          {selectedFilter !== "all" && (
            <TouchableOpacity onPress={() => setSelectedFilter("all")}>
              <Text style={styles.counterReset}>Réinitialiser</Text>
            </TouchableOpacity>
          )}
        </View>

        {isSelecting && (
          <View style={styles.multiSelectBar}>
            <TouchableOpacity style={styles.multiSelectBtn} onPress={selectAll}>
              <Feather name="check-circle" size={14} color={colors.primary} />
              <Text style={styles.multiSelectText}>Tout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.multiSelectBtn}
              onPress={deselectAll}
            >
              <Feather name="x-circle" size={14} color={colors.error} />
              <Text style={[styles.multiSelectText, { color: colors.error }]}>
                Aucun
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && filteredEvents.length === 0 ? (
          <HomeSkeleton />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="Aucun événement"
            message="Créez votre premier événement pour commencer."
            actionLabel="Créer un événement"
            onAction={() => router.push("/events/category")}
          />
        ) : (
          <ScrollView
            style={styles.listScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {filteredEvents.map((event, idx) => {
              const id = getEventId(event);
              return (
                <EventCard
                  key={id || `e-${idx}`}
                  event={event}
                  isSelecting={isSelecting}
                  isSelected={isEventSelected(event)}
                  onPressItem={handlePressItem}
                  onLongPress={handleLongPress}
                  onCopyCode={copyToClipboard}
                />
              );
            })}
          </ScrollView>
        )}
      </Animated.View>

      {isSelecting ? (
        <View style={styles.selectionFooter}>
          <TouchableOpacity onPress={exitSelectionMode}>
            <Text style={styles.selectionCancel}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.selectionCount}>
            {selectedEvents.length} sélectionné
            {selectedEvents.length > 1 ? "s" : ""}
          </Text>
          <TouchableOpacity
            style={styles.selectionDelete}
            onPress={handleDelete}
          >
            <Feather name="trash-2" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      ) : (
        <FAB
          icon="plus"
          variant="primary"
          size="md"
          position="bottom-right"
          onPress={() => router.push("/events/category")}
        />
      )}

      {AlertHost}

      <DeleteSuccessModal
        visible={showDeleteSuccess}
        title={deletedCount > 1 ? "Événements supprimés" : "Événement supprimé"}
        message={
          deletedCount > 1
            ? `${deletedCount} événements ont été déplacés dans la corbeille.`
            : "L'événement a été déplacé dans la corbeille."
        }
        primaryLabel="Voir la corbeille"
        onPrimary={() => {
          setShowDeleteSuccess(false);
          router.push("/(main)/trash");
        }}
        secondaryLabel="Retour à l'accueil"
        onSecondary={() => setShowDeleteSuccess(false)}
      />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES (inchangés)
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1, paddingHorizontal: wp(4), paddingTop: hp(2) },
  toast: {
    position: "absolute",
    top: hp(6),
    left: wp(10),
    right: wp(10),
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(2),
    zIndex: 999,
    ...shadows.md,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  toastText: {
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    fontSize: hp(1.6),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
  },
  headerTextBlock: { gap: 8 },
  title: {
    fontSize: hp(3.4),
    lineHeight: hp(3.6),
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: hp(1.65),
    lineHeight: hp(1.9),
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  avatar: {
    width: hp(6.2),
    height: hp(6.2),
    borderRadius: hp(3.1),
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadows.sm,
    backgroundColor: colors.surfaceAlt,
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  avatarInitials: {
    color: colors.textInverse,
    fontWeight: fontWeight.extrabold,
    fontSize: hp(1.9),
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2.5),
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: wp(4),
    height: hp(5.7),
    marginTop: hp(2),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: hp(1.9),
    color: colors.text,
    paddingVertical: 0,
  },
  filterRow: { marginTop: hp(2) },
  filterContent: { gap: wp(2.5), paddingRight: wp(4) },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.5),
    backgroundColor: colors.surface,
    paddingHorizontal: wp(3),
    height: hp(4.5),
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
    fontSize: hp(1.55),
  },
  filterChipTextActive: { color: colors.textInverse },
  filterCountBadge: {
    minWidth: hp(2.2),
    height: hp(2.2),
    paddingHorizontal: hp(0.6),
    borderRadius: hp(1.1),
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  filterCountBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  filterCountText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: hp(1.2),
  },
  filterCountTextActive: { color: colors.textInverse },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: hp(1.5),
    height: hp(2),
  },
  counterText: {
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    fontSize: hp(1.55),
  },
  counterReset: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: hp(1.55),
  },
  multiSelectBar: {
    flexDirection: "row",
    gap: wp(2.5),
    marginBottom: hp(2),
  },
  multiSelectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: wp(1.5),
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: hp(1.2),
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  multiSelectText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: hp(1.55),
  },
  listScroll: { flex: 1 },
  listContent: { paddingBottom: hp(12) },
  selectionFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: hp(9),
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(6),
    ...shadows.lg,
  },
  selectionCancel: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: hp(1.9),
  },
  selectionCount: {
    color: colors.text,
    fontWeight: fontWeight.extrabold,
    fontSize: hp(1.9),
  },
  selectionDelete: {
    width: hp(5.3),
    height: hp(5.3),
    borderRadius: hp(2.65),
    backgroundColor: colors.error,
    justifyContent: "center",
    alignItems: "center",
  },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...shadows.sm,
  },
  cardSelected: { borderWidth: 2, borderColor: colors.primary },
  imageContainer: { position: "relative", width: "100%", height: hp(22) },
  image: { width: "100%", height: "100%" },
  typeBadge: {
    position: "absolute",
    top: hp(1.2),
    right: wp(3),
    borderRadius: 20,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
  },
  typeBadgeText: {
    fontWeight: fontWeight.extrabold,
    fontSize: hp(1.25),
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  codeOverlay: {
    position: "absolute",
    bottom: hp(1.2),
    left: wp(3),
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.5),
    backgroundColor: "rgba(15,23,42,0.82)",
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.6),
    borderRadius: 8,
  },
  codeOverlayText: {
    color: colors.textInverse,
    fontSize: hp(1.3),
    fontWeight: fontWeight.bold,
    letterSpacing: 0.6,
  },
  checkboxContainer: {
    position: "absolute",
    top: hp(1.2),
    left: wp(3),
  },
  checkbox: {
    width: hp(3),
    height: hp(3),
    borderRadius: hp(1.5),
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 2,
    borderColor: colors.textInverse,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  content: { padding: wp(4.5), gap: 12 },
  name: {
    fontSize: hp(2.1),
    lineHeight: hp(2.6),
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1.5),
    flex: 1,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: hp(1.5),
    fontWeight: fontWeight.semibold,
  },
  codeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(1),
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
  },
  codeBadgeText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: hp(1.3),
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: hp(1.2),
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerText: {
    color: colors.textMuted,
    fontSize: hp(1.35),
    fontWeight: fontWeight.medium,
    flex: 1,
  },
});
