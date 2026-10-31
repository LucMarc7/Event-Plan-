// src/components/ui/Input.tsx
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from "react-native";
import {
    colors,
    fontSize,
    fontWeight,
    iconSize,
    inputHeight,
    radius,
    spacing,
} from "../../theme/tokens";

interface Props extends Omit<TextInputProps, "style"> {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  error?: string;
  hint?: string;
  secureToggle?: boolean;
}

export const Input: React.FC<Props> = ({
  label,
  icon,
  error,
  hint,
  secureToggle = false,
  secureTextEntry,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.box,
          focused && styles.boxFocused,
          error ? styles.boxError : null,
        ]}
      >
        {icon ? (
          <Feather
            name={icon}
            size={iconSize.md}
            color={
              error ? colors.error : focused ? colors.primary : colors.textMuted
            }
            style={{ marginRight: spacing.sm }}
          />
        ) : null}

        <TextInput
          {...rest}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        {secureToggle ? (
          <Pressable onPress={() => setHidden((v) => !v)} style={styles.eyeBtn}>
            <Feather
              name={hidden ? "eye-off" : "eye"}
              size={iconSize.md}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.base },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    height: inputHeight,
  },
  boxFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  boxError: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text,
    paddingVertical: 0,
  },
  eyeBtn: { padding: spacing.sm },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
    fontWeight: fontWeight.medium,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});

export default Input;
