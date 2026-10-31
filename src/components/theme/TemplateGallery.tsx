// src/components/theme/TemplateGallery.tsx
import { Feather } from "@expo/vector-icons";
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    shadows,
    spacing,
} from "../../theme/tokens";
import { THEME_TEMPLATES, ThemeTemplate } from "./templates";

const { width: SCREEN_W } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: ThemeTemplate) => void;
}

export default function TemplateGallery({ visible, onClose, onSelect }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Choisir un modèle</Text>
              <Text style={styles.subtitle}>
                {THEME_TEMPLATES.length} modèles prêts à personnaliser
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {THEME_TEMPLATES.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                style={styles.card}
                onPress={() => onSelect(tpl)}
                activeOpacity={0.9}
              >
                <View style={styles.preview}>
                  {tpl.previewColors.map((c, i) => (
                    <View
                      key={i}
                      style={[styles.previewSwatch, { backgroundColor: c }]}
                    />
                  ))}
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>{tpl.name}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {tpl.description}
                  </Text>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: tpl.accent + "20" },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: tpl.accent }]}>
                        {tpl.format}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.surfaceAlt },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: colors.textMuted }]}
                      >
                        {tpl.pages.length} page{tpl.pages.length > 1 ? "s" : ""}
                      </Text>
                    </View>
                  </View>
                </View>
                <Feather
                  name="chevron-right"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: "85%",
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  preview: {
    width: 64,
    height: 80,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
    flexDirection: "column",
  },
  previewSwatch: { flex: 1, width: "100%" },
  cardContent: { flex: 1 },
  cardName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  badgeRow: { flexDirection: "row", gap: 6 },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
