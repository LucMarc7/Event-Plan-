// src/components/profile/modals/TwoFactorModal.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    radius,
    spacing,
} from "../../../../src/theme";
import { ModalWrapper } from "./ModalWrapper";

type Method = "sms" | "app" | "email" | null;

export const TwoFactorModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState<Method>(null);
  const [step, setStep] = useState<1 | 2>(1); // 1=choix méthode, 2=confirmation

  const methods = [
    {
      id: "sms" as Method,
      icon: "chatbubble-outline",
      label: "SMS",
      desc: "Recevez un code à 6 chiffres par SMS",
    },
    {
      id: "app" as Method,
      icon: "key-outline",
      label: "Application d'authentification",
      desc: "Google Authenticator, Authy, etc.",
    },
    {
      id: "email" as Method,
      icon: "mail-outline",
      label: "Email",
      desc: "Code envoyé à votre adresse email",
    },
  ];

  const handleEnable = () => {
    if (!selected) {
      Toast.show({
        type: "error",
        text1: "Choisissez une méthode",
      });
      return;
    }
    setStep(2);
  };

  const handleConfirm = () => {
    setEnabled(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: "success",
      text1: "2FA activée",
      text2: "Votre compte est maintenant protégé",
    });
    onClose();
    setTimeout(() => {
      setEnabled(false);
      setSelected(null);
      setStep(1);
    }, 500);
  };

  const handleDisable = () => {
    setEnabled(false);
    setSelected(null);
    setStep(1);
    Toast.show({
      type: "info",
      text1: "2FA désactivée",
    });
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Authentification 2FA"
      subtitle="Sécurité renforcée pour votre compte"
    >
      {/* État actuel */}
      <View
        style={[
          s.statusCard,
          {
            backgroundColor: enabled ? colors.successSoft : colors.warningSoft,
          },
        ]}
      >
        <View
          style={[
            s.statusIcon,
            {
              backgroundColor: enabled ? colors.success : colors.warning,
            },
          ]}
        >
          <Ionicons
            name={enabled ? "shield-checkmark" : "shield-outline"}
            size={22}
            color="#FFF"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.statusTitle}>
            {enabled ? "2FA activée" : "2FA désactivée"}
          </Text>
          <Text style={s.statusSub}>
            {enabled
              ? "Votre compte est protégé par une double vérification"
              : "Activez la 2FA pour renforcer la sécurité"}
          </Text>
        </View>
      </View>

      {enabled ? (
        <TouchableOpacity style={s.disableBtn} onPress={handleDisable}>
          <Ionicons
            name="close-circle-outline"
            size={iconSize.md}
            color={colors.error}
          />
          <Text style={s.disableText}>Désactiver la 2FA</Text>
        </TouchableOpacity>
      ) : step === 1 ? (
        <>
          <Text style={s.sectionTitle}>Choisissez une méthode</Text>
          {methods.map((m) => (
            <TouchableOpacity
              key={m.id as string}
              style={[s.methodCard, selected === m.id && s.methodCardActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelected(m.id);
              }}
            >
              <View
                style={[
                  s.methodIcon,
                  {
                    backgroundColor:
                      selected === m.id ? colors.primary : colors.primarySoft,
                  },
                ]}
              >
                <Ionicons
                  name={m.icon as any}
                  size={iconSize.md}
                  color={selected === m.id ? "#FFF" : colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.methodLabel}>{m.label}</Text>
                <Text style={s.methodDesc}>{m.desc}</Text>
              </View>
              <View style={[s.radio, selected === m.id && s.radioActive]}>
                {selected === m.id ? <View style={s.radioInner} /> : null}
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={s.primaryBtn} onPress={handleEnable}>
            <Text style={s.primaryText}>Activer la 2FA</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={s.confirmBox}>
            <Ionicons
              name="phone-portrait-outline"
              size={40}
              color={colors.primary}
            />
            <Text style={s.confirmTitle}>Vérifiez votre appareil</Text>
            <Text style={s.confirmText}>
              Nous avons envoyé un code de vérification à 6 chiffres.
              Saisissez-le pour confirmer l activation.
            </Text>
            <View style={s.codeDots}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={s.codeDot} />
              ))}
            </View>
          </View>
          <TouchableOpacity style={s.primaryBtn} onPress={handleConfirm}>
            <Text style={s.primaryText}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => setStep(1)}>
            <Text style={s.secondaryText}>Changer de méthode</Text>
          </TouchableOpacity>
        </>
      )}
    </ModalWrapper>
  );
};

const s = StyleSheet.create({
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  statusTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statusSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  methodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft + "50",
  },
  methodIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  methodLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  methodDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  primaryText: {
    color: "#FFF",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  secondaryBtn: {
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  secondaryText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  disableBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.errorSoft,
  },
  disableText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
  confirmBox: {
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  confirmTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  confirmText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  codeDots: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  codeDot: {
    width: 40,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
});
