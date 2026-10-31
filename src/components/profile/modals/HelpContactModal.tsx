// src/components/profile/modals/HelpContactModal.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAppAlert } from "../../../hooks/useAppAlert";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../../../theme/tokens";
import { ModalWrapper, styles as mStyles } from "./ModalWrapper";

const FAQ = [
  {
    q: "Comment créer un événement ?",
    a: "Depuis l'écran d'accueil, appuyez sur le bouton + en bas à droite, puis choisissez la catégorie (Mariage, Anniversaire, etc.).",
  },
  {
    q: "Comment inviter des personnes ?",
    a: "Ouvrez un événement, puis allez dans « Liste des invités ». Vous pouvez ajouter des invités manuellement ou importer depuis un fichier.",
  },
  {
    q: "Comment générer les QR codes ?",
    a: "Depuis la liste des invités, sélectionnez les invitations et appuyez sur « Générer QR ». Les PDF sont téléchargeables.",
  },
  {
    q: "Comment ajouter un contrôleur ?",
    a: "Dans les options de l'événement, choisissez « Contrôleurs d'accès », puis ajoutez le contrôleur avec un nom d'utilisateur.",
  },
  {
    q: "Comment scanner les entrées ?",
    a: "Le contrôleur se connecte avec son compte, saisit le code événement et accède au scanner. Il peut vérifier chaque QR.",
  },
];

export const HelpContactModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // ✅ MIGRATION : Alert.alert → showAlert
  const { showAlert, AlertHost } = useAppAlert();

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      Toast.show({
        type: "error",
        text1: "Champs requis",
        text2: "Objet et message sont obligatoires",
      });
      return;
    }
    setSending(true);
    const mailto = `mailto:support@eventplan.app?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(message)}`;
    try {
      await Linking.openURL(mailto);
      Toast.show({
        type: "success",
        text1: "Message prêt",
        text2: "Votre client mail va s'ouvrir",
      });
      setSubject("");
      setMessage("");
      onClose();
    } catch {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible d'ouvrir l'application mail",
      });
    } finally {
      setSending(false);
    }
  };

  // ✅ MIGRATION : Alert.alert → showAlert
  const openWhatsapp = async () => {
    const url = "https://wa.me/243856163550";
    try {
      await Linking.openURL(url);
    } catch {
      showAlert({
        title: "WhatsApp indisponible",
        message:
          "WhatsApp n'est pas installé sur cet appareil. Vous pouvez nous contacter par email à support@eventplan.app",
        variant: "warning",
        buttons: [{ text: "OK", style: "default" }],
      });
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Aide & Contact"
      subtitle="FAQ et support direct"
    >
      {/* Contact rapide */}
      <Text style={s.sectionTitle}>Contacter le support</Text>
      <View style={s.quickRow}>
        <TouchableOpacity
          style={[s.quickCard, { borderColor: colors.successSoft }]}
          onPress={openWhatsapp}
          activeOpacity={0.85}
        >
          <View style={[s.quickIcon, { backgroundColor: colors.successSoft }]}>
            <Ionicons name="logo-whatsapp" size={22} color={colors.success} />
          </View>
          <Text style={s.quickLabel}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.quickCard, { borderColor: colors.primarySoft }]}
          onPress={() => Linking.openURL("mailto:support@eventplan.app")}
          activeOpacity={0.85}
        >
          <View style={[s.quickIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="mail-outline" size={22} color={colors.primary} />
          </View>
          <Text style={s.quickLabel}>Email</Text>
        </TouchableOpacity>
      </View>

      {/* FAQ */}
      <Text style={[s.sectionTitle, { marginTop: spacing.lg }]}>
        Questions fréquentes
      </Text>
      <View style={s.faqCard}>
        {FAQ.map((item, i) => {
          const isOpen = openFaq === i;
          const isLast = i === FAQ.length - 1;
          return (
            <View
              key={i}
              style={[s.faqItem, isLast && { borderBottomWidth: 0 }]}
            >
              <TouchableOpacity
                style={s.faqHeader}
                activeOpacity={0.7}
                onPress={() => setOpenFaq(isOpen ? null : i)}
              >
                <Text style={s.faqQuestion}>{item.q}</Text>
                <Ionicons
                  name={isOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              {isOpen ? <Text style={s.faqAnswer}>{item.a}</Text> : null}
            </View>
          );
        })}
      </View>

      {/* Formulaire */}
      <Text style={[s.sectionTitle, { marginTop: spacing.lg }]}>
        Envoyer un message
      </Text>
      <View style={mStyles.inputGroup}>
        <Text style={mStyles.label}>Objet</Text>
        <TextInput
          style={mStyles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Ex: Problème avec les QR codes"
          placeholderTextColor={colors.textMuted}
        />
      </View>
      <View style={mStyles.inputGroup}>
        <Text style={mStyles.label}>Message</Text>
        <TextInput
          style={[mStyles.input, s.textarea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Décrivez votre problème…"
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={mStyles.help}>{message.length}/500</Text>
      </View>

      <TouchableOpacity
        style={[mStyles.saveBtn, sending && { opacity: 0.6 }]}
        onPress={handleSend}
        disabled={sending}
      >
        <Text style={mStyles.saveText}>Envoyer le message</Text>
      </TouchableOpacity>

      {/* ✅ Hôte de l'alerte custom */}
      {AlertHost}
    </ModalWrapper>
  );
};

const s = StyleSheet.create({
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  quickRow: { flexDirection: "row", gap: spacing.md },
  quickCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.sm,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  faqItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  faqQuestion: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  textarea: {
    height: 120,
    paddingTop: spacing.md,
  },
});
