// src/components/profile/modals/SubscriptionModal.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { useAppAlert } from "../../../hooks/useAppAlert";
import {
  colors,
  fontSize,
  fontWeight,
  iconSize,
  radius,
  spacing,
} from "../../../theme/tokens";
import { ModalWrapper } from "./ModalWrapper";

const PLANS = [
  {
    id: "standard",
    name: "Standard",
    price: 19.9,
    desc: "Pour les organisateurs occasionnels",
    features: ["5 événements/mois", "Support email", "Notifications push"],
    color: colors.primary,
    icon: "star-outline",
  },
  {
    id: "premium",
    name: "Premium",
    price: 29.9,
    desc: "Pour les organisateurs réguliers",
    features: [
      "Événements illimités",
      "Support prioritaire",
      "Analytics avancés",
      "Badge Premium",
    ],
    color: colors.warning,
    icon: "diamond-outline",
    popular: true,
  },
  {
    id: "vip",
    name: "VIP",
    price: 59.9,
    desc: "Pour les professionnels",
    features: ["Tout Premium", "Accès VIP", "Concierge dédié", "Cashback 5%"],
    color: "#8B5CF6",
    icon: "diamond",
  },
];

const INVOICES = [
  { id: "INV-2025-012", date: "01 Jan 2026", amount: 29.9, status: "Payée" },
  { id: "INV-2025-011", date: "01 Déc 2025", amount: 29.9, status: "Payée" },
  { id: "INV-2025-010", date: "01 Nov 2025", amount: 29.9, status: "Payée" },
];

export const SubscriptionModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [currentPlan] = useState("premium");
  const [tab, setTab] = useState<"plans" | "invoices">("plans");
  const { showAlert, AlertHost } = useAppAlert();

  // ✅ MIGRATION : Alert.alert → showAlert
  const handleSelectPlan = (plan: any) => {
    Haptics.selectionAsync();
    showAlert({
      title: `Passer au plan ${plan.name} ?`,
      message: `Vous allez être redirigé vers le paiement sécurisé.\n\nMontant : $${plan.price}/mois.`,
      variant: "info",
      buttons: [
        { text: "Annuler", style: "cancel" },
        {
          text: "Continuer",
          style: "default",
          onPress: () => {
            Toast.show({
              type: "success",
              text1: "Demande envoyée",
              text2: "Le lien de paiement vous sera envoyé",
            });
            onClose();
          },
        },
      ],
    });
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Abonnement"
      subtitle="Gérez votre plan et facturation"
    >
      {/* Plan actuel */}
      <View style={s.currentCard}>
        <View style={s.currentHeader}>
          <View>
            <Text style={s.currentLabel}>Plan actuel</Text>
            <Text style={s.currentPlan}>Premium</Text>
          </View>
          <View style={s.currentBadge}>
            <Ionicons name="diamond" size={12} color={colors.warning} />
            <Text style={s.currentBadgeText}>Actif</Text>
          </View>
        </View>
        <View style={s.currentFooter}>
          <Text style={s.currentRenew}>
            Prochain renouvellement : 1er Mars 2026
          </Text>
          <Text style={s.currentPrice}>$29.9 / mois</Text>
        </View>
      </View>

      {/* Onglets */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === "plans" && s.tabActive]}
          onPress={() => setTab("plans")}
        >
          <Text style={[s.tabText, tab === "plans" && s.tabTextActive]}>
            Changer de plan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === "invoices" && s.tabActive]}
          onPress={() => setTab("invoices")}
        >
          <Text style={[s.tabText, tab === "invoices" && s.tabTextActive]}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "plans" ? (
        <>
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <View
                key={plan.id}
                style={[
                  s.planCard,
                  { borderColor: plan.color + "40" },
                  plan.popular && { borderColor: plan.color, borderWidth: 2 },
                ]}
              >
                {plan.popular ? (
                  <View
                    style={[s.popularBadge, { backgroundColor: plan.color }]}
                  >
                    <Text style={s.popularText}>⭐ Populaire</Text>
                  </View>
                ) : null}

                <View style={s.planHeader}>
                  <View style={s.planLeft}>
                    <View
                      style={[
                        s.planIcon,
                        { backgroundColor: plan.color + "15" },
                      ]}
                    >
                      <Ionicons
                        name={plan.icon as any}
                        size={22}
                        color={plan.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.planName, { color: plan.color }]}>
                        {plan.name}
                      </Text>
                      <Text style={s.planDesc}>{plan.desc}</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[s.planPrice, { color: plan.color }]}>
                      ${plan.price}
                    </Text>
                    <Text style={s.planPeriod}>/mois</Text>
                  </View>
                </View>

                <View style={s.features}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={s.featureRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={plan.color}
                      />
                      <Text style={s.featureText}>{f}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    s.chooseBtn,
                    {
                      backgroundColor: isCurrent
                        ? colors.surfaceAlt
                        : plan.color,
                    },
                  ]}
                  onPress={() => !isCurrent && handleSelectPlan(plan)}
                  disabled={isCurrent}
                >
                  <Text
                    style={[
                      s.chooseText,
                      { color: isCurrent ? colors.textMuted : "#FFF" },
                    ]}
                  >
                    {isCurrent ? "Plan actuel" : `Choisir ${plan.name}`}
                  </Text>
                  {!isCurrent ? (
                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                  ) : null}
                </TouchableOpacity>
              </View>
            );
          })}
        </>
      ) : (
        <View>
          <Text style={s.invoicesTitle}>Vos dernières factures</Text>
          {INVOICES.map((inv) => (
            <View key={inv.id} style={s.invoiceRow}>
              <View style={s.invoiceIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={iconSize.md}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.invoiceId}>{inv.id}</Text>
                <Text style={s.invoiceDate}>{inv.date}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.invoiceAmount}>${inv.amount}</Text>
                <View style={s.invoiceBadge}>
                  <Text style={s.invoiceBadgeText}>{inv.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ✅ Hôte de l'alerte custom */}
      {AlertHost}
    </ModalWrapper>
  );
};

const s = StyleSheet.create({
  currentCard: {
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  currentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: fontWeight.semibold,
  },
  currentPlan: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    marginTop: 2,
  },
  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  currentBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.warning,
  },
  currentFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  currentRenew: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  currentPrice: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  tabActive: { backgroundColor: colors.surface },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textMuted,
  },
  tabTextActive: { color: colors.text },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.5,
  },
  popularBadge: {
    position: "absolute",
    top: -1,
    right: -1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: radius.md,
    borderTopRightRadius: radius.lg,
  },
  popularText: {
    color: "#FFF",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  planLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  planName: { fontSize: fontSize.md, fontWeight: fontWeight.extrabold },
  planDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  planPrice: { fontSize: fontSize.xl, fontWeight: fontWeight.extrabold },
  planPeriod: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
  features: { marginBottom: spacing.md, gap: spacing.xs },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  chooseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  chooseText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  invoicesTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  invoiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  invoiceIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  invoiceId: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  invoiceDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  invoiceAmount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  invoiceBadge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  invoiceBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
});
