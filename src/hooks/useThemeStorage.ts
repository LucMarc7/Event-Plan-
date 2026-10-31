// src/hooks/useThemeStorage.ts
// Hook centralisé pour la persistance des thèmes dans AsyncStorage

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useMemo } from "react";
import { percentToPx, pxToPercent } from "../components/theme/helpers";
import { DEFAULT_THEME } from "../components/theme/themeConstants";

// ─── Clés AsyncStorage ───
const KEY_THEMES = (eventId: string) => `themes_${eventId}`;
const KEY_CURRENT = (eventId: string) => `current_theme_${eventId}`;

// ─── Type d'un thème stocké ───
export interface StoredTheme {
  id: string;
  name: string;
  eventId: string;
  pages: any[];
  blocks: any[];
  canvas: { width: number; height: number };
  meta: { canvasW: number; canvasH: number; savedAt: number };
  createdAt: number;
  updatedAt: number;
}

// ═══════════════════════════════════════════════════════════════
// SÉRIALISATION PX ↔ %
// ═══════════════════════════════════════════════════════════════

/** Convertit un thème px → format stockage (%) */
export const serializeTheme = (
  theme: any,
  canvasW: number,
  canvasH: number,
): StoredTheme => ({
  id: theme.id,
  name: theme.name || "Nouveau thème",
  eventId: theme.eventId,
  pages: (theme.pages || []).map((p: any) => ({
    ...p,
    bgTransform: p.bgTransform || { x: 0, y: 0, scale: 1, rotation: 0 },
  })),
  blocks: (theme.blocks || []).map((b: any) => ({
    id: b.id,
    pageIndex: b.pageIndex ?? 0,
    type: b.type,
    xPercent: pxToPercent(b.x, canvasW),
    yPercent: pxToPercent(b.y, canvasH),
    widthPercent: pxToPercent(b.width, canvasW),
    heightPercent: pxToPercent(b.height, canvasH),
    text: b.text ?? null,
    src: b.src ?? null,
    assetModule: b.assetModule ?? null,
    value: b.value ?? null,
    style: b.style ? { ...b.style } : undefined,
    rotation: b.rotation || 0,
    zIndex: b.zIndex || 1,
  })),
  canvas: { width: canvasW, height: canvasH },
  meta: { canvasW, canvasH, savedAt: Date.now() },
  createdAt: theme.createdAt || Date.now(),
  updatedAt: Date.now(),
});

/** Convertit un thème stocké (%) → format px */
export const deserializeTheme = (
  theme: StoredTheme,
  canvasW: number,
  canvasH: number,
) => ({
  id: theme.id,
  name: theme.name,
  eventId: theme.eventId,
  pages: (theme.pages || []).map((p: any) => ({
    ...p,
    bgTransform: p.bgTransform || { x: 0, y: 0, scale: 1, rotation: 0 },
  })),
  blocks: (theme.blocks || []).map((b: any) => ({
    ...b,
    x: b.xPercent !== undefined ? percentToPx(b.xPercent, canvasW) : b.x || 0,
    y: b.yPercent !== undefined ? percentToPx(b.yPercent, canvasH) : b.y || 0,
    width:
      b.widthPercent !== undefined
        ? percentToPx(b.widthPercent, canvasW)
        : b.width || 100,
    height:
      b.heightPercent !== undefined
        ? percentToPx(b.heightPercent, canvasH)
        : b.height || 40,
    rotation: b.rotation || 0,
    zIndex: b.zIndex || 1,
  })),
  createdAt: theme.createdAt,
  updatedAt: theme.updatedAt,
});

// ═══════════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export const useThemeStorage = () => {
  // ─── Lire tous les thèmes d'un événement ───
  const listThemes = useCallback(
    async (eventId: string): Promise<StoredTheme[]> => {
      try {
        const raw = await AsyncStorage.getItem(KEY_THEMES(eventId));
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error("[useThemeStorage] listThemes:", e);
        return [];
      }
    },
    [],
  );

  // ─── Charger un thème spécifique ───
  const loadTheme = useCallback(
    async (
      eventId: string,
      themeId: string,
      canvasW: number,
      canvasH: number,
    ) => {
      const themes = await listThemes(eventId);
      const found = themes.find((t) => t.id === themeId);
      return found ? deserializeTheme(found, canvasW, canvasH) : null;
    },
    [listThemes],
  );

  // ─── Récupérer l'ID du thème actif ───
  const getCurrentThemeId = useCallback(
    async (eventId: string): Promise<string | null> => {
      try {
        return await AsyncStorage.getItem(KEY_CURRENT(eventId));
      } catch {
        return null;
      }
    },
    [],
  );

  // ─── Charger le thème actif (ou null) ───
  const loadCurrentTheme = useCallback(
    async (eventId: string, canvasW: number, canvasH: number) => {
      const currentId = await getCurrentThemeId(eventId);
      if (!currentId) return null;
      return loadTheme(eventId, currentId, canvasW, canvasH);
    },
    [getCurrentThemeId, loadTheme],
  );

  // ─── Sauvegarder un thème (créer ou mettre à jour) ───
  const saveTheme = useCallback(
    async (theme: any, canvasW: number, canvasH: number): Promise<boolean> => {
      try {
        const serialized = serializeTheme(theme, canvasW, canvasH);
        const themes = await listThemes(theme.eventId);
        const idx = themes.findIndex((t) => t.id === serialized.id);
        if (idx !== -1) themes[idx] = serialized;
        else themes.push(serialized);
        await AsyncStorage.setItem(
          KEY_THEMES(theme.eventId),
          JSON.stringify(themes),
        );
        return true;
      } catch (e) {
        console.error("[useThemeStorage] saveTheme:", e);
        return false;
      }
    },
    [listThemes],
  );

  // ─── Sauvegarder + marquer comme actif ───
  const saveAndApply = useCallback(
    async (theme: any, canvasW: number, canvasH: number): Promise<boolean> => {
      const ok = await saveTheme(theme, canvasW, canvasH);
      if (ok) {
        await applyTheme(theme.eventId, theme.id);
      }
      return ok;
    },
    [saveTheme],
  );

  // ─── Marquer un thème comme actif ───
  const applyTheme = useCallback(async (eventId: string, themeId: string) => {
    try {
      await AsyncStorage.setItem(KEY_CURRENT(eventId), themeId);
      return true;
    } catch (e) {
      console.error("[useThemeStorage] applyTheme:", e);
      return false;
    }
  }, []);

  // ─── Supprimer un thème ───
  const deleteTheme = useCallback(
    async (eventId: string, themeId: string) => {
      try {
        const themes = await listThemes(eventId);
        const updated = themes.filter((t) => t.id !== themeId);
        await AsyncStorage.setItem(
          KEY_THEMES(eventId),
          JSON.stringify(updated),
        );

        // Si c'était le thème actif → retirer l'ID actif
        const currentId = await getCurrentThemeId(eventId);
        if (currentId === themeId) {
          await AsyncStorage.removeItem(KEY_CURRENT(eventId));
        }
        return true;
      } catch (e) {
        console.error("[useThemeStorage] deleteTheme:", e);
        return false;
      }
    },
    [listThemes, getCurrentThemeId],
  );

  // ─── Dupliquer un thème ───
  const duplicateTheme = useCallback(
    async (eventId: string, themeId: string) => {
      try {
        const themes = await listThemes(eventId);
        const original = themes.find((t) => t.id === themeId);
        if (!original) return null;

        const copy: StoredTheme = {
          ...original,
          id: `theme-${Date.now()}`,
          name: `${original.name} (copie)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        themes.push(copy);
        await AsyncStorage.setItem(KEY_THEMES(eventId), JSON.stringify(themes));
        return copy;
      } catch (e) {
        console.error("[useThemeStorage] duplicateTheme:", e);
        return null;
      }
    },
    [listThemes],
  );

  // ─── Créer un thème vide ───
  const createEmptyTheme = useCallback(
    (eventId: string): any => ({
      id: `theme-${Date.now()}`,
      name: "Nouveau thème",
      eventId,
      pages: JSON.parse(JSON.stringify(DEFAULT_THEME.pages)),
      blocks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
    [],
  );

  // ✅ Mémoïsé : évite que les consommateurs re-render à chaque fois
  return useMemo(
    () => ({
      listThemes,
      loadTheme,
      loadCurrentTheme,
      getCurrentThemeId,
      saveTheme,
      saveAndApply,
      applyTheme,
      deleteTheme,
      duplicateTheme,
      createEmptyTheme,
    }),
    [
      listThemes,
      loadTheme,
      loadCurrentTheme,
      getCurrentThemeId,
      saveTheme,
      saveAndApply,
      applyTheme,
      deleteTheme,
      duplicateTheme,
      createEmptyTheme,
    ],
  );
};

export default useThemeStorage;
