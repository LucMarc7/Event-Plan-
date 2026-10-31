// src/components/profile/modals/TermsModal.tsx
import { StyleSheet, Text, View } from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    spacing,
} from "../../../../src/theme/tokens";
import { ModalWrapper } from "./ModalWrapper";

const SECTIONS = [
  {
    title: "1. Acceptation des conditions",
    body: "En utilisant Event Plan, vous acceptez les présentes conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.",
  },
  {
    title: "2. Description du service",
    body: "Event Plan est une plateforme de gestion d'événements permettant de créer des événements, gérer des invitations, générer des QR codes et contrôler les entrées.",
  },
  {
    title: "3. Compte utilisateur",
    body: "Vous êtes responsable de la confidentialité de vos identifiants. Toute activité effectuée depuis votre compte vous est imputable. Signalez immédiatement toute utilisation non autorisée.",
  },
  {
    title: "4. Utilisation acceptable",
    body: "Vous vous engagez à ne pas utiliser l'application à des fins illégales, à ne pas tenter de contourner les mesures de sécurité, et à ne pas porter atteinte aux droits de tiers.",
  },
  {
    title: "5. Propriété intellectuelle",
    body: "L'ensemble des contenus, logos, marques et codes sources sont la propriété exclusive d'Event Plan. Toute reproduction sans autorisation est interdite.",
  },
  {
    title: "6. Responsabilité",
    body: "Event Plan met tout en œuvre pour assurer la disponibilité du service mais ne peut garantir une disponibilité ininterrompue. Nous déclinons toute responsabilité en cas de perte de données liée à un usage non conforme.",
  },
  {
    title: "7. Modification des conditions",
    body: "Nous nous réservons le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés des changements majeurs.",
  },
  {
    title: "8. Droit applicable",
    body: "Ces conditions sont régies par le droit applicable en République Démocratique du Congo. Tout litige sera soumis aux tribunaux compétents.",
  },
];

export const TermsModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => (
  <ModalWrapper
    visible={visible}
    onClose={onClose}
    title="Conditions d'utilisation"
    subtitle="Dernière mise à jour : 1er janvier 2026"
  >
    <View style={s.banner}>
      <Text style={s.bannerText}>
        En utilisant Event Plan, vous acceptez les conditions ci-dessous.
      </Text>
    </View>

    {SECTIONS.map((sec, i) => (
      <View key={i} style={s.section}>
        <Text style={s.sectionTitle}>{sec.title}</Text>
        <Text style={s.sectionBody}>{sec.body}</Text>
      </View>
    ))}

    <Text style={s.footer}>
      Pour toute question, contactez-nous à legal@eventplan.app
    </Text>
  </ModalWrapper>
);

const s = StyleSheet.create({
  banner: {
    backgroundColor: colors.primarySoft,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  bannerText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    lineHeight: 20,
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
  footer: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
    fontStyle: "italic",
  },
});
