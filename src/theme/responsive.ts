// src/theme/responsive.ts
// Utilitaires de responsive design
// Baseline : iPhone SE (375 x 812)

import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Baseline de référence
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Échelle horizontale (proportionnelle à la largeur)
export const scale = (size: number): number =>
  (SCREEN_WIDTH / BASE_WIDTH) * size;

// Échelle verticale (proportionnelle à la hauteur)
export const verticalScale = (size: number): number =>
  (SCREEN_HEIGHT / BASE_HEIGHT) * size;

// Échelle modérée : n'applique qu'une partie de la variation
// factor = 0 → taille fixe | factor = 1 → scale plein
export const moderateScale = (size: number, factor = 0.4): number =>
  size + (scale(size) - size) * factor;

// Échelle modérée verticale
export const moderateVerticalScale = (size: number, factor = 0.4): number =>
  size + (verticalScale(size) - size) * factor;

// Respecte la préférence utilisateur (accessibilité)
export const fontScale = (size: number): number => {
  const systemScale = PixelRatio.getFontScale();
  const cappedScale = Math.min(systemScale, 1.3); // plafonne à 30%
  return moderateScale(size, 0.4) * cappedScale;
};

// Helpers d'écran
export const isSmallDevice = SCREEN_WIDTH < 360;
export const isMediumDevice = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;

// Largeurs utiles
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;
