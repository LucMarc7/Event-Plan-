// src/components/subscription/UpgradeModal.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { PlanId } from "../../api/subscription";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing,
} from "../../theme/tokens";

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  /** Message détaillé (ex: "Vous avez atteint 2/2 événements") */
  message?: string;
  /** Plan actuel de l'utilisateur */
  currentPlan: PlanId;
  /** Plan recommandé pour débloquer */
  recommendedPlan?: PlanId;
  /** Titre de la feature (ex: "Créer un événement") */
  featureName?: string;
}

const PLAN_LABELS: Record<PlanId, string> = {
  free: "Free",
  standard: "Standard",
  premium: "Premium",
  vip: "VIP",
};

const PLAN_PRICES: Record<PlanId, string> = {
  free: "Gratuit",
  standard: "19,90 $/mois",
  premium: "29,90 $/mois",
  vip: "59,90 $/mois",
};

const PLAN_COLORS: Record<PlanId, string> = {
  free: colors.textMuted,
  standard: colors.primary,
  premium: "#F59E0B",
  vip: "#8B5CF6",
};

export const UpgradeModal = ({
  visible,
  onClose,
  message,
  currentPlan,
  recommendedPlan = "standard",
  featureName,
}: UpgradeModalProps) => {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push("/(main)/subscription");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Icône */}
          <View style={s.iconCircle}>
            <Ionicons name="rocket-outline" size={32} color="#FFF" />
          </View>

          {/* Titre */}
          <Text style={s.title}>Limite atteinte</Text>

          {/* Feature name */}
          {featureName ? (
            <View style={s.featureBadge}>
              <Ionicons name="lock-closed" size={12} color={colors.primary} />
              <Text style={s.featureBadgeText}>{featureName}</Text>
            </View>
          ) : null}

          {/* Message détaillé */}
          {message ? <Text style={s.message}>{message}</Text> : null}

          {/* Comparaison */}
          <View style={s.compareCard}>
            <View style={s.compareRow}>
              <View style={s.compareCol}>
                <Text style={s.compareLabel}>Votre plan</Text>
                <Text
                  style={[s.comparePlan, { color: PLAN_COLORS[currentPlan] }]}
                >
                  {PLAN_LABELS[currentPlan]}
                </Text>
                <Text style={s.comparePrice}>{PLAN_PRICES[currentPlan]}</Text>
              </View>
              <View style={s.arrowBox}>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={s.compareCol}>
                <Text style={s.compareLabel}>Recommandé</Text>
                <Text
                  style={[
                    s.comparePlan,
                    { color: PLAN_COLORS[recommendedPlan] },
                  ]}
                >
                  {PLAN_LABELS[recommendedPlan]}
                </Text>
                <Text style={s.comparePrice}>
                  {PLAN_PRICES[recommendedPlan]}
                </Text>
              </View>
            </View>
          </View>

          {/* Boutons */}
          <TouchableOpacity
            style={s.upgradeBtn}
            onPress={handleUpgrade}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-up-circle" size={18} color="#FFF" />
            <Text style={s.upgradeBtnText}>Voir les abonnements</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.cancelBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={s.cancelBtnText}>Plus tard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    ...shadows.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  featureBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  compareCard: {
    width: "100%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compareCol: {
    flex: 1,
    alignItems: "center",
  },
  compareLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  comparePlan: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
  },
  comparePrice: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrowBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.base,
    width: "100%",
    ...shadows.md,
  },
  upgradeBtnText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  cancelBtn: {
    width: "100%",
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  cancelBtnText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
});
