// src/components/events/EventCard.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { memo, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing
} from "../../theme/tokens";

// ═══════════════════════════════════════════════════════════════
// HELPERS (identiques à Home pour cohérence)
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

const getEventImage = (event: any) => {
  const img = findImage(event);
  if (!img) return null;
  if (img.startsWith("/")) return "https://klmarc.pythonanywhere.com" + img;
  return img;
};

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
  null;

const getEventType = (event: any) => {
  const raw = event?.type || event?.category || "default";
  const key = String(raw).toLowerCase().trim();
  const map: Record<string, string> = {
    wedding: "wedding",
    mariage: "wedding",
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
    wedding: "Mariage",
    birthday: "Anniversaire",
    conference: "Conférence",
    concert: "Concert",
    default: "Événement",
  })[type] || "Événement";

const getEventTypeStyle = (type: string) => {
  const styles: Record<string, { bg: string; text: string; icon: string }> = {
    wedding: { bg: "#FDF2F8", text: "#DB2777", icon: "heart" },
    birthday: { bg: "#F0FDF4", text: "#16A34A", icon: "gift" },
    conference: { bg: "#EFF6FF", text: "#2563EB", icon: "users" },
    concert: { bg: "#FAF5FF", text: "#9333EA", icon: "music" },
    default: { bg: colors.primarySoft, text: colors.primary, icon: "calendar" },
  };
  return styles[type] || styles.default;
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT
// ═══════════════════════════════════════════════════════════════
interface EventCardProps {
  event: any;
  selected?: boolean;
  isSelecting?: boolean;
  onSelect?: (id: string) => void;
  onPress?: (id: string) => void;
  onLongPress?: (id: string) => void;
  onCopyCode?: (code: string) => void;
}

export const EventCard = memo(
  ({
    event,
    selected = false,
    isSelecting = false,
    onSelect,
    onPress,
    onLongPress,
    onCopyCode,
  }: EventCardProps) => {
    const router = useRouter();
    const [imageError, setImageError] = useState(false);
    const scale = useRef(new Animated.Value(1)).current;

    const eventId =
      event?.id ?? event?.uuid ?? event?.event_id ?? event?.pk ?? null;

    const eventName = useMemo(() => getEventName(event), [event]);
    const eventDate = useMemo(() => getEventDate(event), [event]);
    const eventImage = useMemo(() => getEventImage(event), [event]);
    const eventLocation = useMemo(() => getEventLocation(event), [event]);
    const eventType = useMemo(() => getEventType(event), [event]);
    const typeStyle = useMemo(() => getEventTypeStyle(eventType), [eventType]);

    const handlePress = () => {
      if (!eventId) return;
      if (onSelect) onSelect(eventId);
      else if (onPress) onPress(eventId);
      else router.push(`/events/wedding/detail/${eventId}`);
    };

    const handleLong = () => {
      if (!eventId || !onLongPress) return;
      onLongPress(eventId);
    };

    const pressIn = () =>
      Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
    const pressOut = () =>
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={handlePress}
          onLongPress={handleLong}
          onPressIn={pressIn}
          onPressOut={pressOut}
          delayLongPress={300}
          style={[styles.card, selected && styles.cardSelected]}
        >
          {/* IMAGE */}
          <View style={styles.imageContainer}>
            {eventImage && !imageError ? (
              <Image
                source={{ uri: eventImage }}
                style={styles.image}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View
                style={[
                  styles.image,
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

            <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
                {getEventTypeLabel(eventType)}
              </Text>
            </View>

            {isSelecting ? (
              <View style={styles.checkboxContainer}>
                <View
                  style={[
                    styles.checkbox,
                    selected && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  {selected ? (
                    <Feather name="check" size={14} color="#FFF" />
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>

          {/* CONTENU */}
          <View style={styles.content}>
            <Text style={styles.name} numberOfLines={2}>
              {eventName}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Feather
                  name="calendar"
                  size={12}
                  color={colors.textSecondary}
                />
                <Text style={styles.metaText} numberOfLines={1}>
                  {eventDate}
                </Text>
              </View>
              {event.event_code && onCopyCode ? (
                <TouchableOpacity
                  style={styles.codeBadge}
                  onPress={() => onCopyCode(event.event_code)}
                  activeOpacity={0.7}
                >
                  <Feather name="hash" size={10} color={colors.primary} />
                  <Text style={styles.codeBadgeText}>{event.event_code}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {eventLocation ? (
              <View style={styles.footer}>
                <Feather name="map-pin" size={11} color={colors.textMuted} />
                <Text style={styles.footerText} numberOfLines={1}>
                  {eventLocation}
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

EventCard.displayName = "EventCard";

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    overflow: "hidden",
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  image: { width: "100%", height: "100%" },
  typeBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontWeight: fontWeight.extrabold,
    fontSize: fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  checkboxContainer: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 2,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  content: {
    padding: spacing.base,
    gap: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.3,
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
    gap: spacing.sm,
    flex: 1,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  codeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  codeBadgeText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
});

export default EventCard;
