// src/components/theme/MotifPicker.tsx
import { Feather } from "@expo/vector-icons";
import {
    FlatList,
    Image,
    Modal,
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
    spacing,
} from "../../theme/tokens";
import { MOTIFS } from "./motifs";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (source: any, name: string) => void;
}

export default function MotifPicker({ visible, onClose, onSelect }: Props) {
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
              <Text style={styles.title}>Motifs décoratifs</Text>
              <Text style={styles.subtitle}>
                {MOTIFS.length} ornements · tape pour insérer
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={MOTIFS}
            keyExtractor={(item) => item.id}
            numColumns={4}
            columnWrapperStyle={{ gap: spacing.sm }}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.tile}
                onPress={() => {
                  onSelect(item.source, item.name);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Image
                  source={item.source}
                  style={styles.tileImage}
                  resizeMode="contain"
                />
                <Text style={styles.tileLabel} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
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
  subtitle: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    marginBottom: spacing.sm,
  },
  tileImage: { width: "100%", height: "70%" },
  tileLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
});
