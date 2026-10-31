// src/components/profile/modals/NotificationsModal.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    radius,
    spacing,
} from "../../../../src/theme/tokens";
import { ModalWrapper, styles as mStyles } from "./ModalWrapper";

const buildItems = (setters: any) => [
  {
    section: "Général",
    items: [
      {
        key: "push",
        icon: "notifications-outline",
        label: "Notifications push",
        sublabel: "Autoriser les notifications",
      },
      {
        key: "email",
        icon: "mail-outline",
        label: "Notifications par email",
        sublabel: "Recevoir un résumé par email",
      },
      {
        key: "sms",
        icon: "chatbubble-outline",
        label: "Notifications SMS",
        sublabel: "Alertes critiques uniquement",
      },
    ],
  },
  {
    section: "Événements",
    items: [
      {
        key: "eventReminders",
        icon: "alarm-outline",
        label: "Rappels d'événements",
        sublabel: "24h avant chaque événement",
      },
      {
        key: "newGuests",
        icon: "person-add-outline",
        label: "Nouveaux invités",
        sublabel: "Quand un invité est ajouté",
      },
      {
        key: "rsvp",
        icon: "checkmark-done-outline",
        label: "Confirmations de présence",
        sublabel: "Quand un invité confirme",
      },
      {
        key: "controllers",
        icon: "shield-checkmark-outline",
        label: "Demandes de contrôleur",
        sublabel: "Nouvelles demandes d'accès",
      },
    ],
  },
  {
    section: "Marketing",
    items: [
      {
        key: "newsletter",
        icon: "newspaper-outline",
        label: "Newsletter",
        sublabel: "Conseils et nouveautés Event Plan",
      },
      {
        key: "promotions",
        icon: "pricetag-outline",
        label: "Promotions & offres",
        sublabel: "Réductions et offres spéciales",
      },
    ],
  },
  {
    section: "Sons & vibrations",
    items: [
      {
        key: "sound",
        icon: "volume-high-outline",
        label: "Sons",
        sublabel: "Jouer un son à la réception",
      },
      {
        key: "vibration",
        icon: "phone-portrait-outline",
        label: "Vibrations",
        sublabel: "Vibrer à la réception",
      },
    ],
  },
];

export const NotificationsModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    push: true,
    email: true,
    sms: false,
    eventReminders: true,
    newGuests: true,
    rsvp: true,
    controllers: true,
    newsletter: false,
    promotions: false,
    sound: true,
    vibration: true,
  });

  const groups = buildItems(toggles);

  const toggle = (key: string, value: boolean) => {
    Haptics.selectionAsync();
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={onClose}
      title="Notifications"
      subtitle="Choisissez ce que vous voulez recevoir"
    >
      {groups.map((group) => (
        <View key={group.section} style={{ marginBottom: spacing.lg }}>
          <Text style={s.sectionTitle}>{group.section}</Text>
          <View style={s.card}>
            {group.items.map((item, idx) => (
              <View
                key={item.key}
                style={[
                  s.row,
                  idx === group.items.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={s.iconBox}>
                  <Ionicons
                    name={item.icon as any}
                    size={iconSize.md}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.label}>{item.label}</Text>
                  <Text style={s.sublabel}>{item.sublabel}</Text>
                </View>
                <Switch
                  value={!!toggles[item.key]}
                  onValueChange={(v) => toggle(item.key, v)}
                  trackColor={{
                    false: colors.border,
                    true: colors.primarySoft,
                  }}
                  thumbColor={toggles[item.key] ? colors.primary : "#FFF"}
                  ios_backgroundColor={colors.border}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      <Text style={mStyles.help}>
        Les notifications critiques (sécurité du compte) restent toujours
        activées pour votre protection.
      </Text>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  sublabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});
