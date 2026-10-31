// src/components/theme/themeConstants.ts
import { Platform } from "react-native";
import { colors } from "../../theme/tokens";

export const PRESET_BACKGROUND_COLORS = [
  "#FFFFFF",
  "#FAF8FF",
  "#F7F7F7",
  "#FFFBEB",
  "#ECFEFF",
  "#F0F9FF",
  "#FDF2F8",
];

export const COLOR_PALETTE = [
  "#000000",
  "#111827",
  "#334155",
  "#64748B",
  "#94A3B8",
  "#CBD5E1",
  "#FFFFFF",
  "#F43F5E",
  "#EC4899",
  "#D946EF",
  "#A855F7",
  "#8B5CF6",
  "#6366F1",
  "#3B82F6",
  "#0EA5E9",
  "#06B6D4",
  "#14B8A6",
  "#10B981",
  "#84CC16",
  "#EAB308",
  "#F59E0B",
  "#F97316",
  "#EF4444",
];

export const TEXT_COLORS = [
  "#000000",
  "#111827",
  "#334155",
  "#64748B",
  "#F43F5E",
  "#3B82F6",
  "#10B981",
  "#EAB308",
  "#A855F7",
  "#EF4444",
  "#FFFFFF",
];

// ✅ Taille des polices (commence par 4, comme demandé)
export const FONT_SIZES = [
  4, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64,
];

// ✅ Tailles QR (100 → 260)
export const QR_SIZES = [100, 120, 160, 200, 220, 260];

export const FONT_FAMILIES = [
  { name: "System", label: "Système" },
  { name: "sans-serif", label: "Sans Serif" },
  { name: "serif", label: "Serif" },
  { name: "monospace", label: "Monospace" },
];

export const DEFAULT_TEXT_STYLE = {
  fontFamily: Platform.select({ ios: "System", android: "sans-serif" }),
  fontSize: 28,
  color: colors.text,
  align: "center" as const,
};

export const DEFAULT_THEME = {
  canvas: { width: 800, height: 1200 },
  pages: [
    {
      background: { type: "color" as const, value: "#FFFFFF" },
      bgTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
    },
  ],
  blocks: [] as any[],
};

export interface ThemeVariable {
  key: string;
  label: string;
  icon: string;
  example: string;
}

export const THEME_VARIABLES: ThemeVariable[] = [
  {
    key: "{{nom_invite}}",
    label: "Nom invité",
    icon: "user",
    example: "Jean Dupont",
  },
  {
    key: "{{categorie_invite}}",
    label: "Catégorie",
    icon: "tag",
    example: "Couple",
  },
  {
    key: "{{code_invitation}}",
    label: "Code invitation",
    icon: "hash",
    example: "ABC123",
  },
  {
    key: "{{table}}",
    label: "Table / Place",
    icon: "grid",
    example: "Table 5",
  },
  {
    key: "{{nom_evenement}}",
    label: "Nom événement",
    icon: "calendar",
    example: "Mariage",
  },
  {
    key: "{{date_evenement}}",
    label: "Date",
    icon: "clock",
    example: "15/06/26",
  },
  { key: "{{lieu}}", label: "Lieu", icon: "map-pin", example: "Lubumbashi" },
  {
    key: "{{telephone}}",
    label: "Téléphone",
    icon: "phone",
    example: "+243...",
  },
  { key: "{{email}}", label: "Email", icon: "mail", example: "jean@..." },
];
