// src/components/theme/helpers.ts
import { Platform } from "react-native";

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const getFontFamily = (fontName?: string): string => {
  const fontMapping: Record<string, string | undefined> = {
    System: Platform.select({ ios: "System", android: "sans-serif" }),
    "sans-serif": "sans-serif",
    serif: "serif",
    monospace: "monospace",
  };
  return (
    (fontName && fontMapping[fontName]) ||
    Platform.select({ ios: "System", android: "sans-serif" }) ||
    "sans-serif"
  );
};

// ─── Conversion px ↔ pourcentage (pour la persistance) ───
export const pxToPercent = (px: number, total: number): number =>
  Math.round((px / total) * 10000) / 100;

export const percentToPx = (percent: number, total: number): number =>
  (percent / 100) * total;

// ─── Remplace les variables {{xxx}} dans un template ───
export const replaceVariables = (
  template: string,
  variables: Record<string, string>,
): string => {
  if (!template) return "";
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(key).join(value || "");
  }
  return result;
};

// ─── Échappe le HTML pour éviter les injections ───
export const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br/>");
