// src/theme/tokens.ts
// Design tokens centralisés — responsive
// Les tailles de police et d'icônes s'adaptent à la taille de l'écran.

import {
    fontScale,
    moderateScale,
    screenHeight,
    screenWidth,
} from "./responsive";

// ============================================================
// COULEURS
// ============================================================
export const colors = {
  // Brand
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  primaryLight: "#818CF8",
  primarySoft: "#EEF2FF",

  // Secondary
  secondary: "#7C3AED",
  secondarySoft: "#F5F3FF",

  // Status
  success: "#10B981",
  successSoft: "#ECFDF5",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  error: "#EF4444",
  errorSoft: "#FEF2F2",
  info: "#3B82F6",
  infoSoft: "#EFF6FF",

  // Neutrals
  bg: "#F5F7FA",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  divider: "#E5E7EB",

  // Text
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  textInverse: "#FFFFFF",
} as const;

// ============================================================
// SPACING (fixé en dp — universel)
// ============================================================
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ============================================================
// RADIUS (fixé — universel)
// ============================================================
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 999,
} as const;

// ============================================================
// TYPOGRAPHIE (responsive via fontScale)
// ============================================================
export const fontSize = {
  xs: fontScale(11),
  sm: fontScale(13),
  base: fontScale(15),
  md: fontScale(17),
  lg: fontScale(20),
  xl: fontScale(24),
  xxl: fontScale(28),
  display: fontScale(34),
} as const;

export const lineHeight = {
  xs: fontSize.xs * 1.4,
  sm: fontSize.sm * 1.4,
  base: fontSize.base * 1.5,
  md: fontSize.md * 1.4,
  lg: fontSize.lg * 1.3,
  xl: fontSize.xl * 1.25,
  xxl: fontSize.xxl * 1.2,
  display: fontSize.display * 1.15,
} as const;

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
};

// ============================================================
// ICÔNES (responsive)
// ============================================================
export const iconSize = {
  xs: moderateScale(12, 0.4),
  sm: moderateScale(16, 0.4),
  md: moderateScale(20, 0.4),
  lg: moderateScale(24, 0.4),
  xl: moderateScale(28, 0.4),
  xxl: moderateScale(36, 0.4),
} as const;

// ============================================================
// DIMENSIONS DE COMPOSANTS
// ============================================================
export const buttonHeight = {
  sm: 40,
  md: 48,
  lg: 56,
} as const;

export const inputHeight = moderateScale(52, 0.3);

export const avatarSize = {
  sm: moderateScale(36, 0.4),
  md: moderateScale(44, 0.4),
  lg: moderateScale(56, 0.4),
  xl: moderateScale(80, 0.4),
  xxl: moderateScale(100, 0.4),
} as const;

// Touch target minimum (accessibilité iOS/Android)
export const touchTarget = 44;

// ============================================================
// OMBRES
// ============================================================
export const shadows = {
  none: {},
  sm: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lg: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  xl: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;

// ============================================================
// DURÉES D'ANIMATION
// ============================================================
export const duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// ============================================================
// HELPERS DE LAYOUT (responsive)
// ============================================================
export const layout = {
  screenWidth,
  screenHeight,
  // Largeur utile avec padding par défaut
  contentWidth: screenWidth - spacing.lg * 2,
  // Padding horizontal recommandé par taille d'écran
  horizontalPadding:
    screenWidth < 360
      ? spacing.base
      : screenWidth < 414
        ? spacing.lg
        : spacing.xl,
} as const;
