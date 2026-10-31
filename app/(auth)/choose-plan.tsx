// app/(auth)/choose-plan.tsx
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { PLANS } from "../../src/api/payments";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing,
} from "../../src/theme/tokens";

// ═══════════════════════════════════════════════════════════════
// FORMULE FREE (par défaut)
// ═══════════════════════════════════════════════════════════════
const FREE_PLAN = {
  id: "free" as const,
  name: "Free",
  price: 0,
  currency: "USD",
  period: "/mois",
  description: "Pour découvrir Event Plan",
  features: [
    "Créer jusqu'à 2 événements",
    "50 invités par événement",
    "QR codes d'invitation",
    "Support par email",
  ],
  color: "#10B981", // success
  icon: "gift-outline",
};

export default function ChoosePlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string>(FREE_PLAN.id);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // ─── Choix d'une formule ───
  const handleSelect = (id: string) => {
    Haptics.selectionAsync();
    setSelectedId(id);
  };

  // ─── Continuer ───
  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (selectedId === FREE_PLAN.id) {
      // Free → accès direct à la Home
      router.replace("/(main)/home");
    } else {
      // Plan payant → écran d'abonnement existant
      router.replace("/(main)/subscription");
    }
  };

  const currentPlanName =
    selectedId === FREE_PLAN.id
      ? FREE_PLAN.name
      : PLANS.find((p) => p.id === selectedId)?.name || "";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerBtn} />
        <Text style={styles.headerTitle}>Votre formule</Text>
        <View style={styles.headerBtn} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + spacing.xxl + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* BRANDING */}
          <View style={styles.brandBlock}>
            <View style={styles.brandBadge}>
              <Feather name="award" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brandTitle}>Choisissez votre formule</Text>
            <Text style={styles.brandSubtitle}>
              Vous pourrez changer à tout moment depuis votre profil
            </Text>
          </View>

          {/* CARTE FREE — mise en avant */}
          <Text style={styles.sectionLabel}>Recommandé pour commencer</Text>

          <TouchableOpacity
            style={[
              styles.freeCard,
              selectedId === FREE_PLAN.id && styles.freeCardSelected,
            ]}
            onPress={() => handleSelect(FREE_PLAN.id)}
            activeOpacity={0.9}
          >
            {/* Badge par défaut */}
            <View style={styles.defaultBadge}>
              <Feather name="star" size={11} color="#FFF" />
              <Text style={styles.defaultBadgeText}>DÉFAUT</Text>
            </View>

            <View style={styles.freeHeader}>
              <View style={styles.freeIconBox}>
                <Feather
                  name={FREE_PLAN.icon as any}
                  size={22}
                  color={FREE_PLAN.color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.freeTitle}>{FREE_PLAN.name}</Text>
                <Text style={styles.freeDesc}>{FREE_PLAN.description}</Text>
              </View>
              <View style={styles.radioOuter}>
                {selectedId === FREE_PLAN.id ? (
                  <View style={styles.radioInner} />
                ) : null}
              </View>
            </View>

            <View style={styles.features}>
              {FREE_PLAN.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Feather
                    name="check-circle"
                    size={14}
                    color={FREE_PLAN.color}
                  />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <View style={styles.freePriceRow}>
              <Text style={styles.freePrice}>Gratuit</Text>
              <Text style={styles.freePricePeriod}>à vie</Text>
            </View>
          </TouchableOpacity>

          {/* CARTES PAYANTES — compactes */}
          <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
            Formules premium
          </Text>

          {PLANS.map((plan) => {
            const isSelected = selectedId === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.paidCard,
                  isSelected && {
                    borderColor: plan.color,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => handleSelect(plan.id)}
                activeOpacity={0.9}
              >
                {plan.popular ? (
                  <View
                    style={[
                      styles.popularBadge,
                      { backgroundColor: plan.color },
                    ]}
                  >
                    <Text style={styles.popularText}>⭐ Populaire</Text>
                  </View>
                ) : null}

                <View style={styles.paidHeader}>
                  <View
                    style={[
                      styles.paidIconBox,
                      { backgroundColor: plan.color + "15" },
                    ]}
                  >
                    <Feather
                      name={plan.icon as any}
                      size={20}
                      color={plan.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.paidTitle, { color: plan.color }]}>
                      {plan.name}
                    </Text>
                    <Text style={styles.paidDesc}>{plan.description}</Text>
                  </View>
                  <View style={styles.radioOuter}>
                    {isSelected ? (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: plan.color },
                        ]}
                      />
                    ) : null}
                  </View>
                </View>

                <View style={styles.paidPriceRow}>
                  <Text style={[styles.paidPrice, { color: plan.color }]}>
                    ${plan.price}
                  </Text>
                  <Text style={styles.paidPeriod}>{plan.period}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* NOTE */}
          <View style={styles.noteRow}>
            <Feather name="info" size={12} color={colors.textMuted} />
            <Text style={styles.noteText}>
              Les formules payantes ouvrent un écran de paiement sécurisé via
              SerdiPay.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* BOUTON CONTINUER — fixe en bas */}
      <View
        style={[
          styles.footerBar,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueText}>
            {selectedId === FREE_PLAN.id
              ? "Commencer gratuitement"
              : `Choisir ${currentPlanName}`}
          </Text>
          <Feather name="arrow-right" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

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
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  brandBlock: { alignItems: "center", marginBottom: spacing.lg },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  brandSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  // ─── Free card ───
  freeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.base,
    borderWidth: 2,
    borderColor: "#10B981",
    ...shadows.md,
    overflow: "hidden",
  },
  freeCardSelected: {
    backgroundColor: "#ECFDF5",
  },
  defaultBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10B981",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderBottomLeftRadius: radius.md,
  },
  defaultBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  freeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  freeIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: "#10B98115",
    justifyContent: "center",
    alignItems: "center",
  },
  freeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    color: "#10B981",
  },
  freeDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  features: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    flex: 1,
  },
  freePriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  freePrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: "#10B981",
  },
  freePricePeriod: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },

  // ─── Paid cards ───
  paidCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.sm,
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderBottomLeftRadius: radius.md,
  },
  popularText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "800",
  },
  paidHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  paidIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  paidTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.extrabold,
  },
  paidDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  paidPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs,
  },
  paidPrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
  },
  paidPeriod: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
    textAlign: "center",
  },

  // ─── Footer fixe ───
  footerBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.lg,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    ...shadows.md,
  },
  continueText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
