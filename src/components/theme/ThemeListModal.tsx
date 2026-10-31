// src/components/theme/ThemeListModal.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
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
    iconSize,
    radius,
    spacing,
} from "../../theme/tokens";
import { Button, Modal } from "../ui";

interface ThemeItem {
  id: string;
  name: string;
  updatedAt: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  themes: ThemeItem[];
  onLoadTheme: (theme: ThemeItem) => void;
  onApplyTheme: (id: string) => void;
  onDeleteTheme: (id: string) => void;
  onCreateNewTheme?: () => void;
  currentThemeId?: string;
}

const ThemeListModal: React.FC<Props> = ({
  visible,
  onClose,
  themes,
  onLoadTheme,
  onApplyTheme,
  onDeleteTheme,
  onCreateNewTheme,
  currentThemeId,
}) => (
  <Modal
    visible={visible}
    onClose={onClose}
    position="bottom"
    animationType="slide"
    title="Mes thèmes"
    subtitle={`${themes.length} thème${themes.length > 1 ? "s" : ""}`}
    showCloseButton
  >
    <ScrollView
      style={{ maxHeight: 480 }}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {themes.length === 0 ? (
        <View style={styles.emptyBox}>
          <View style={styles.emptyIcon}>
            <Feather
              name="layers"
              size={iconSize.xxl}
              color={colors.textMuted}
            />
          </View>
          <Text style={styles.emptyTitle}>Aucun thème</Text>
          <Text style={styles.emptyText}>
            Créez votre premier thème pour personnaliser vos invitations.
          </Text>
        </View>
      ) : (
        themes.map((item) => {
          const isActive = item.id === currentThemeId;
          return (
            <View
              key={item.id}
              style={[styles.item, isActive && styles.itemActive]}
            >
              <View
                style={[styles.itemIcon, isActive && styles.itemIconActive]}
              >
                <Feather
                  name="layers"
                  size={iconSize.sm}
                  color={isActive ? colors.primary : colors.textSecondary}
                />
              </View>

              <TouchableOpacity
                style={styles.itemContent}
                onPress={() => onLoadTheme(item)}
                activeOpacity={0.7}
              >
                <View style={styles.itemTitleRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Actif</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.itemDate}>
                  {new Date(item.updatedAt).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>

              <View style={styles.itemActions}>
                {!isActive && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      onLoadTheme(item);
                      onApplyTheme(item.id);
                    }}
                  >
                    <Feather
                      name="check"
                      size={iconSize.sm}
                      color={colors.success}
                    />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => onDeleteTheme(item.id)}
                >
                  <Feather
                    name="trash-2"
                    size={iconSize.sm}
                    color={colors.error}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      {onCreateNewTheme && (
        <View style={styles.createBtnWrapper}>
          <Button
            title="Nouveau thème"
            icon="plus"
            variant="outline"
            size="md"
            onPress={onCreateNewTheme}
          />
        </View>
      )}
    </ScrollView>
  </Modal>
);

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: spacing.base },
  emptyBox: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.xxl,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
    lineHeight: fontSize.sm * 1.5,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  itemActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  itemIconActive: { backgroundColor: colors.surface },
  itemContent: { flex: 1 },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 2,
  },
  itemName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flexShrink: 1,
  },
  activeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  activeBadgeText: {
    fontSize: fontSize.xs,
    color: colors.textInverse,
    fontWeight: fontWeight.bold,
  },
  itemDate: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  itemActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  createBtnWrapper: {
    marginTop: spacing.md,
  },
});

export default ThemeListModal;
