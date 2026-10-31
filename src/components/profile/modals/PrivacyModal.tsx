// src/components/profile/modals/PrivacyModal.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    radius,
    spacing,
} from "../../../../src/theme/tokens";
import { ModalWrapper } from "./ModalWrapper";

const SECTIONS = [
  {
    title: "Données collectées",
    body: "Nous collectons les informations que vous fournissez lors de l'inscription (nom, email, téléphone) et les données liées à vos événements (invités, contrôleurs).",
  },
  {
    title: "Utilisation des données",
    body: "Vos données servent uniquement à faire fonctionner l'application : génération des QR codes, gestion des invitations, notifications d'événements.",
  },
  {
    title: "Partage des données",
    body: "Nous ne partageons jamais vos données avec des tiers à des fins commerciales. Seuls vos contrôleurs voient les noms des invités que vous leur avez assignés.",
  },
  {
    title: "Sécurité",
    body: "Vos mots de passe sont chiffrés. Les communications sont sécurisées par HTTPS. Les sessions expirent automatiquement après 24 heures d'inactivité.",
  },
  {
    title: "Vos droits",
    body: "Vous pouvez à tout moment accéder à vos données, les corriger, les exporter ou demander leur suppression depuis l'application ou par email.",
  },
  {
    title: "Conservation",
    body: "Les données sont conservées le temps de votre utilisation du service. En cas de suppression du compte, elles sont effacées sous 30 jours.",
  },
  {
    title: "Cookies",
    body: "L'application mobile n'utilise pas de cookies. La version web utilise uniquement des cookies techniques nécessaires au fonctionnement.",
  },
];

export const PrivacyModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const handleDownload = () => {
    Toast.show({
      type: "success",
      text1: "Demande envoyée",
      text2: "Vous recevrez votre archive par email sous 48h",
    });
  };

  const handleDelete = () => {
    Toast.show({
      type: "info",
      text1: "Bientôt disponible",
      text2: "La suppression de compte sera bientôt disponible",
    });
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Confidentialité"
      subtitle="Vos données personnelles"
    >
      <View style={s.banner}>
        <Ionicons name="shield-checkmark" size={20} color={colors.success} />
        <Text style={s.bannerText}>
          Nous respectons votre vie privée et protégeons vos données.
        </Text>
      </View>

      {SECTIONS.map((sec, i) => (
        <View key={i} style={s.section}>
          <Text style={s.sectionTitle}>{sec.title}</Text>
          <Text style={s.sectionBody}>{sec.body}</Text>
        </View>
      ))}

      {/* Actions RGPD */}
      <Text style={[s.sectionTitle, { marginTop: spacing.lg }]}>
        Vos droits
      </Text>
      <TouchableOpacity style={s.actionRow} onPress={handleDownload}>
        <View style={[s.actionIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons
            name="download-outline"
            size={iconSize.md}
            color={colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.actionLabel}>Télécharger mes données</Text>
          <Text style={s.actionSub}>
            Recevez une archive avec toutes vos données
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={iconSize.sm}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.actionRow, { borderBottomWidth: 0 }]}
        onPress={handleDelete}
      >
        <View style={[s.actionIcon, { backgroundColor: colors.errorSoft }]}>
          <Ionicons
            name="trash-outline"
            size={iconSize.md}
            color={colors.error}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.actionLabel, { color: colors.error }]}>
            Supprimer mon compte
          </Text>
          <Text style={s.actionSub}>Action définitive et irréversible</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={iconSize.sm}
          color={colors.error}
        />
      </TouchableOpacity>

      <Text style={s.footer}>
        DPO : dpo@eventplan.app · Réponse sous 30 jours
      </Text>
    </ModalWrapper>
  );
};

const s = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  bannerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: fontWeight.semibold,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  actionSub: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  footer: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
    fontStyle: "italic",
  },
});
