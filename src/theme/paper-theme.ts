// src/theme/paper-theme.ts
import { MD3LightTheme } from "react-native-paper";
import { colors, radius } from "./tokens";

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primarySoft,
    onPrimary: colors.textInverse,
    secondary: colors.secondary,
    secondaryContainer: colors.secondarySoft,
    onSecondary: colors.textInverse,
    background: colors.bg,
    onBackground: colors.text,
    surface: colors.surface,
    onSurface: colors.text,
    error: colors.error,
    onError: colors.textInverse,
    outline: colors.border,
  },
  roundness: radius.md,
};

export default paperTheme;
