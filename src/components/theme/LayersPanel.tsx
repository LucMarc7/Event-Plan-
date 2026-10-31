// src/components/theme/LayersPanel.tsx
import { Feather } from "@expo/vector-icons";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    spacing
} from "../../theme/tokens";

export interface LayerBlock {
  id: string;
  type: string;
  text?: string;
  shape?: string;
  isHidden?: boolean;
  isLocked?: boolean;
  zIndex?: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  blocks: LayerBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleHidden: (id: string) => void;
  onToggleLocked: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const getIcon = (b: LayerBlock) => {
  if (b.type === "text") return "type";
  if (b.type === "image") return "image";
  if (b.type === "qr") return "grid";
  if (b.type === "shape") return "square";
  return "square";
};

const getLabel = (b: LayerBlock) => {
  if (b.type === "text" && b.text) {
    return b.text.replace(/\{\{.*?\}\}/g, "…").slice(0, 22);
  }
  if (b.type === "qr") return "QR Code";
  if (b.type === "image") return "Image";
  if (b.type === "shape") return `Forme · ${b.shape || "rect"}`;
  return b.type;
};

export default function LayersPanel({
  visible,
  onClose,
  blocks,
  selectedId,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
}: Props) {
  // Tri par zIndex décroissant (dessus → dessous)
  const sorted = [...blocks].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

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
              <Text style={styles.title}>Calques</Text>
              <Text style={styles.subtitle}>
                {blocks.length} élément{blocks.length > 1 ? "s" : ""} sur cette
                page
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {sorted.length === 0 ? (
            <View style={styles.empty}>
              <Feather name="layers" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>Aucun élément sur cette page</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            >
              {sorted.map((b) => {
                const isSelected = b.id === selectedId;
                return (
                  <View
                    key={b.id}
                    style={[
                      styles.row,
                      isSelected && styles.rowSelected,
                      b.isHidden && { opacity: 0.5 },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.rowMain}
                      onPress={() => onSelect(b.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.iconWrap,
                          isSelected && {
                            backgroundColor: colors.primary + "20",
                          },
                        ]}
                      >
                        <Feather
                          name={getIcon(b) as any}
                          size={14}
                          color={isSelected ? colors.primary : colors.textMuted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.label,
                          isSelected && { color: colors.primary },
                        ]}
                        numberOfLines={1}
                      >
                        {getLabel(b)}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onToggleHidden(b.id)}
                      >
                        <Feather
                          name={b.isHidden ? "eye-off" : "eye"}
                          size={14}
                          color={b.isHidden ? colors.warning : colors.textMuted}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onToggleLocked(b.id)}
                      >
                        <Feather
                          name={b.isLocked ? "lock" : "unlock"}
                          size={14}
                          color={b.isLocked ? colors.error : colors.textMuted}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onBringToFront(b.id)}
                      >
                        <Feather
                          name="chevrons-up"
                          size={14}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onSendToBack(b.id)}
                      >
                        <Feather
                          name="chevrons-down"
                          size={14}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onDuplicate(b.id)}
                      >
                        <Feather
                          name="copy"
                          size={14}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => onDelete(b.id)}
                      >
                        <Feather
                          name="trash-2"
                          size={14}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
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
    maxHeight: "75%",
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
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "08",
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  actions: { flexDirection: "row", gap: 2 },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
