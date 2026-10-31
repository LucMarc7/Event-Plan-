// src/components/ui/Modal.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
    Pressable,
    Modal as RNModal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    radius,
    shadows,
    spacing,
} from "../../theme/tokens";

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  animationType?: "fade" | "slide" | "none";
  position?: "center" | "bottom";
  showCloseButton?: boolean;
  contentStyle?: ViewStyle;
}

export const Modal: React.FC<Props> = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  animationType = "fade",
  position = "center",
  showCloseButton = false,
  contentStyle,
}) => {
  const isBottom = position === "bottom";

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.content,
            isBottom ? styles.contentBottom : styles.contentCenter,
            contentStyle,
          ]}
        >
          {isBottom && <View style={styles.handle} />}

          {(title || showCloseButton) && (
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                {title && <Text style={styles.title}>{title}</Text>}
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>
              {showCloseButton && (
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Feather
                    name="x"
                    size={iconSize.md}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: colors.surface,
    width: "90%",
    maxWidth: 480,
  },
  contentCenter: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  contentBottom: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    maxWidth: undefined,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.base,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: fontSize.sm * 1.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Modal;
