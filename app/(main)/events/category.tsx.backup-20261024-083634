// app/(main)/events/category.tsx
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
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
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../../src/theme/tokens";

const CATEGORIES = [
  {
    id: "mariage",
    label: "Mariage",
    desc: "Célébrez l'union",
    icon: "heart",
    color: "#DB2777",
    soft: "#FDF2F8",
    route: "/(main)/events/wedding/create",
    available: true,
  },
  {
    id: "birthday",
    label: "Anniversaire",
    desc: "Fêtez un moment",
    icon: "gift",
    color: "#16A34A",
    soft: "#F0FDF4",
    route: "/(main)/events/birthday/create",
    available: true,
  },
  {
    id: "concert",
    label: "Concert",
    desc: "Faites vibrer",
    icon: "music",
    color: "#9333EA",
    soft: "#FAF5FF",
    route: "/(main)/events/concert/create",
    available: true,
  },
  {
    id: "conference",
    label: "Conférence",
    desc: "Partagez vos idées",
    icon: "mic",
    color: "#2563EB",
    soft: "#EFF6FF",
    route: "/(main)/events/conference/create",
    available: true,
  },
  {
    id: "gala",
    label: "Gala",
    desc: "Soirée d'exception",
    icon: "award",
    color: "#0891B2",
    soft: "#ECFEFF",
    route: null,
    available: false,
  },
  {
    id: "cinema",
    label: "Cinéma",
    desc: "Avant-première",
    icon: "film",
    color: "#DC2626",
    soft: "#FEF2F2",
    route: null,
    available: false,
  },
];

export default function EventCategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = (cat: (typeof CATEGORIES)[0]) => {
    if (!cat.available || !cat.route) {
      return;
    }
    router.push(cat.route as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvel événement</Text>
        <View style={styles.headerBtn} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Quel type d‘événement souhaitez-vous créer ?
          </Text>

          <View style={styles.grid}>
            {CATEGORIES.map((cat) => {
              const isDisabled = !cat.available;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.card, isDisabled && styles.cardDisabled]}
                  activeOpacity={isDisabled ? 1 : 0.85}
                  onPress={() => handlePress(cat)}
                >
                  <View
                    style={[styles.iconCircle, { backgroundColor: cat.soft }]}
                  >
                    <Feather
                      name={cat.icon as any}
                      size={26}
                      color={cat.color}
                    />
                  </View>
                  <Text style={styles.cardLabel}>{cat.label}</Text>
                  <Text style={styles.cardDesc}>{cat.desc}</Text>
                  {isDisabled ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Bientôt</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Text style={styles.footerText}>
              Event Plan — Créez des souvenirs inoubliables
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
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
  headerTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    marginBottom: spacing.md,
    alignItems: "center",
    ...shadows.sm,
  },
  cardDisabled: { opacity: 0.5 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  cardDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  badge: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.xl,
  },
  footerLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
});
