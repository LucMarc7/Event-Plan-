// app/(main)/guests/themes/[eventId]/customize.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image, // ✅ AJOUT — pour resolveAssetSource
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image as RNImage,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { v4 as uuidv4 } from "uuid";
import { UpgradeModal } from "../../../../../src/components/subscription/UpgradeModal";
import Block from "../../../../../src/components/theme/Block";
import CustomAlert from "../../../../../src/components/theme/CustomAlert";
import ExitConfirmModal from "../../../../../src/components/theme/ExitConfirmModal";
import Header from "../../../../../src/components/theme/Header";
import IconButton from "../../../../../src/components/theme/IconButton";
import LayersPanel from "../../../../../src/components/theme/LayersPanel";
import MotifPicker from "../../../../../src/components/theme/MotifPicker";
import OptionsPanel from "../../../../../src/components/theme/OptionsPanel";
import PropertiesModal from "../../../../../src/components/theme/PropertiesModal";
import TextToolbar from "../../../../../src/components/theme/TextToolbar";
import {
  DEFAULT_TEXT_STYLE,
  INIT_ASSET_IMAGES,
} from "../../../../../src/components/theme/themeConstants";
import { Button, Modal } from "../../../../../src/components/ui";
import { useSubscription } from "../../../../../src/hooks/useSubscription";
import { useThemeStorage } from "../../../../../src/hooks/useThemeStorage";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../../../../src/theme/tokens";

const MAX_HISTORY = 40;
const GRID_SIZE = 20;
const MOVE_STEP = 10;

const newId = () => String(uuidv4());

// ✅ NOUVEAU — Résolution d'un require() en URI string
const resolveAssetToUri = (src: any): string => {
  if (!src) return "";
  if (typeof src === "string") return src;
  try {
    const resolved = (RNImage as any).resolveAssetSource(src);
    return resolved?.uri || "";
  } catch {
    return "";
  }
};

// ✅ NOUVEAU — Normalise un thème : convertit tous les require() en URI
const normalizeTheme = (t: any) => {
  if (!t) return t;
  return {
    ...t,
    pages: (t.pages || []).map((p: any) => {
      if (p.background?.type === "image") {
        return {
          ...p,
          background: {
            ...p.background,
            value: resolveAssetToUri(p.background.value),
          },
        };
      }
      if (p.background?.type === "asset") {
        // legacy : assetModule → uri
        const uri = resolveAssetToUri(p.background.assetModule);
        return {
          ...p,
          background: { type: "image", value: uri },
        };
      }
      return p;
    }),
    blocks: (t.blocks || []).map((b: any) => {
      if (b.type === "image") {
        return { ...b, src: resolveAssetToUri(b.src) };
      }
      return b;
    }),
  };
};

export default function ThemeCustomizeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    eventId: string;
    themeId?: string;
    isEditing?: string;
    themeData?: string;
  }>();
  const eventId = String(params.eventId || "");
  const isEditing = params.isEditing === "true";
  const themeId = params.themeId;

  const storage = useThemeStorage();

  const { plan: currentPlan, limits } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{
    visible: boolean;
    message?: string;
  }>({ visible: false });

  const [layersVisible, setLayersVisible] = useState(false);
  const [motifPickerVisible, setMotifPickerVisible] = useState(false);

  // ─── Dimensions ───
  const [screen, setScreen] = useState(Dimensions.get("window"));
  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) =>
      setScreen(window),
    );
    return () => sub?.remove?.();
  }, []);

  const MAX_W = Math.min(screen.width - 32, 900);
  const MAX_H = Math.min(screen.height - 240, 1200);
  const canvasW = Math.max(300, MAX_W);
  const canvasH = Math.min(Math.round((canvasW * 297) / 210), MAX_H);

  // ─── State ───
  const [theme, setTheme] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [optionsVisible, setOptionsVisible] = useState(false);
  const [propertiesVisible, setPropertiesVisible] = useState(false);
  const [showTextToolbar, setShowTextToolbar] = useState(false);
  const [showFontSizePalette, setShowFontSizePalette] = useState(false);
  const [showColorPalette, setShowColorPalette] = useState(false);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [alertConfig, setAlertConfig] = useState<any>(null);

  const [assetImages, setAssetImages] = useState<any[]>(INIT_ASSET_IMAGES);

  // ═══════════════════════════════════════════════════════════════
  // CHARGEMENT INITIAL
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        let loaded: any = null;

        if (isEditing && themeId) {
          loaded = await storage.loadTheme(eventId, themeId, canvasW, canvasH);
        }

        if (!loaded && params.themeData) {
          try {
            const parsed = JSON.parse(String(params.themeData));
            loaded = storage.createEmptyTheme(eventId);
            loaded = { ...loaded, ...parsed };
          } catch {}
        }

        if (!loaded) {
          loaded = storage.createEmptyTheme(eventId);
        }

        if (!Array.isArray(loaded.pages) || loaded.pages.length === 0) {
          loaded.pages = [
            {
              id: `page-${Date.now()}`,
              background: { type: "color", value: "#FFFFFF" },
              bgTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
            },
          ];
        }
        if (!Array.isArray(loaded.blocks)) loaded.blocks = [];

        // ✅ NOUVEAU — Résolution de tous les require() en URI string
        loaded = normalizeTheme(loaded);

        if (cancelled) return;
        setTheme(loaded);
        setSaveName(loaded.name);
        setHistory([loaded]);
        setHistoryIndex(0);
        setActivePage(0);
      } catch (e) {
        console.error("[Customize] load:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [eventId, themeId, isEditing]);

  useEffect(() => {
    const loadPreset = async () => {
      try {
        const saved = await AsyncStorage.getItem("preset_images");
        if (saved) {
          const uris = JSON.parse(saved);
          setAssetImages([
            ...INIT_ASSET_IMAGES,
            ...uris.map((uri: string) => ({ uri })),
          ]);
        }
      } catch {}
    };
    loadPreset();
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // HISTORY
  // ═══════════════════════════════════════════════════════════════
  const pushHistory = useCallback(
    (nextTheme: any) => {
      if (!nextTheme) return;
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        const next = [...sliced, JSON.parse(JSON.stringify(nextTheme))];
        if (next.length > MAX_HISTORY) next.shift();
        return next;
      });
      setHistoryIndex((i) => Math.min(i + 1, MAX_HISTORY - 1));
    },
    [historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    if (!prev) return;
    setTheme(JSON.parse(JSON.stringify(prev)));
    setHistoryIndex(historyIndex - 1);
    setSelectedBlockId(null);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    if (!next) return;
    setTheme(JSON.parse(JSON.stringify(next)));
    setHistoryIndex(historyIndex + 1);
    setSelectedBlockId(null);
  }, [history, historyIndex]);

  // ═══════════════════════════════════════════════════════════════
  // UPDATE HELPERS
  // ═══════════════════════════════════════════════════════════════
  const updateTheme = useCallback(
    (patch: any) => {
      setTheme((prev: any) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch, updatedAt: Date.now() };
        pushHistory(next);
        return next;
      });
    },
    [pushHistory],
  );

  const updateBlock = useCallback(
    (id: string, patch: any, saveToHistory = true) => {
      setTheme((prev: any) => {
        if (!prev || !Array.isArray(prev.blocks)) return prev;
        const blocks = prev.blocks.map((b: any) =>
          b.id === id ? { ...b, ...patch } : b,
        );
        const next = { ...prev, blocks, updatedAt: Date.now() };
        if (saveToHistory) pushHistory(next);
        return next;
      });
    },
    [pushHistory],
  );

  const removeBlock = useCallback(
    (id: string) => {
      setTheme((prev: any) => {
        if (!prev || !Array.isArray(prev.blocks)) return prev;
        const next = {
          ...prev,
          blocks: prev.blocks.filter((b: any) => b.id !== id),
        };
        pushHistory(next);
        return next;
      });
      setSelectedBlockId(null);
    },
    [pushHistory],
  );

  const duplicateBlock = useCallback(
    (block: any) => {
      const id = newId();
      setTheme((prev: any) => {
        if (!prev || !Array.isArray(prev.blocks)) return prev;
        const newBlock = {
          ...block,
          id,
          x: Math.min(block.x + 20, canvasW - block.width),
          y: Math.min(block.y + 20, canvasH - block.height),
          zIndex:
            Math.max(...prev.blocks.map((b: any) => b.zIndex || 0), 0) + 1,
        };
        const next = { ...prev, blocks: [...prev.blocks, newBlock] };
        pushHistory(next);
        return next;
      });
      setSelectedBlockId(id);
    },
    [canvasW, canvasH, pushHistory],
  );

  const bringToFront = useCallback(
    (id: string) => {
      setTheme((prev: any) => {
        if (!prev || !Array.isArray(prev.blocks)) return prev;
        const maxZ = Math.max(...prev.blocks.map((b: any) => b.zIndex || 0), 0);
        const blocks = prev.blocks.map((b: any) =>
          b.id === id ? { ...b, zIndex: maxZ + 1 } : b,
        );
        const next = { ...prev, blocks };
        pushHistory(next);
        return next;
      });
    },
    [pushHistory],
  );

  const sendToBack = useCallback(
    (id: string) => {
      setTheme((prev: any) => {
        if (!prev || !Array.isArray(prev.blocks)) return prev;
        const minZ = Math.min(...prev.blocks.map((b: any) => b.zIndex || 0), 0);
        const blocks = prev.blocks.map((b: any) =>
          b.id === id ? { ...b, zIndex: minZ - 1 } : b,
        );
        const next = { ...prev, blocks };
        pushHistory(next);
        return next;
      });
    },
    [pushHistory],
  );

  const toggleHidden = useCallback(
    (id: string) => {
      setTheme((prev: any) => {
        if (!prev) return prev;
        const blocks = prev.blocks.map((b: any) =>
          b.id === id ? { ...b, isHidden: !b.isHidden } : b,
        );
        const next = { ...prev, blocks };
        pushHistory(next);
        return next;
      });
    },
    [pushHistory],
  );

  const toggleLocked = useCallback(
    (id: string) => {
      setTheme((prev: any) => {
        if (!prev) return prev;
        const blocks = prev.blocks.map((b: any) =>
          b.id === id ? { ...b, isLocked: !b.isLocked } : b,
        );
        const next = { ...prev, blocks };
        pushHistory(next);
        return next;
      });
    },
    [pushHistory],
  );

  const duplicateById = useCallback(
    (id: string) => {
      const b = theme?.blocks?.find((x: any) => x.id === id);
      if (b) duplicateBlock(b);
    },
    [theme, duplicateBlock],
  );

  const moveBlock = useCallback(
    (dir: "left" | "right" | "up" | "down") => {
      if (!selectedBlockId || !theme) return;
      const block = theme.blocks.find((b: any) => b.id === selectedBlockId);
      if (!block) return;
      let x = block.x;
      let y = block.y;
      if (dir === "left") x = Math.max(0, x - MOVE_STEP);
      if (dir === "right") x = Math.min(canvasW - block.width, x + MOVE_STEP);
      if (dir === "up") y = Math.max(0, y - MOVE_STEP);
      if (dir === "down") y = Math.min(canvasH - block.height, y + MOVE_STEP);
      updateBlock(selectedBlockId, { x, y });
    },
    [selectedBlockId, theme, canvasW, canvasH, updateBlock],
  );

  // ═══════════════════════════════════════════════════════════════
  // AJOUTS
  // ═══════════════════════════════════════════════════════════════
  const addTextBlock = useCallback(
    (text = "Votre texte") => {
      const id = newId();
      setTheme((prev: any) => {
        if (!prev || !Array.isArray(prev.blocks)) return prev;
        const block = {
          id,
          type: "text",
          pageIndex: activePage,
          text,
          x: canvasW * 0.1,
          y: canvasH * 0.1,
          width: canvasW * 0.8,
          height: 80,
          rotation: 0,
          zIndex:
            Math.max(...prev.blocks.map((b: any) => b.zIndex || 0), 0) + 1,
          style: { ...DEFAULT_TEXT_STYLE },
        };
        const next = { ...prev, blocks: [...prev.blocks, block] };
        pushHistory(next);
        return next;
      });
      setSelectedBlockId(id);
    },
    [activePage, canvasW, canvasH, pushHistory],
  );

  const addQrBlock = useCallback(
    (value = "{{code_invitation}}") => {
      const id = newId();
      const size = 200;
      setTheme((prev: any) => {
        if (!prev || !Array.isArray(prev.blocks)) return prev;
        const block = {
          id,
          type: "qr",
          pageIndex: activePage,
          value,
          x: (canvasW - size) / 2,
          y: canvasH * 0.5,
          width: size,
          height: size,
          rotation: 0,
          zIndex:
            Math.max(...prev.blocks.map((b: any) => b.zIndex || 0), 0) + 1,
        };
        const next = { ...prev, blocks: [...prev.blocks, block] };
        pushHistory(next);
        return next;
      });
      setSelectedBlockId(id);
    },
    [activePage, canvasW, canvasH, pushHistory],
  );

  // ✅ MODIFIÉ — Résolution du motif require() en URI string
  const addMotifBlock = useCallback(
    (motifSource: any, motifName: string) => {
      const uri = resolveAssetToUri(motifSource);
      if (!uri) {
        setAlertConfig({
          title: "Motif indisponible",
          message:
            "Ce motif n'a pas pu être chargé. Vérifie que le fichier PNG existe dans assets/motifs/.",
          buttons: [{ text: "OK" }],
        });
        return;
      }

      const id = newId();
      setTheme((prev: any) => {
        if (!prev || !Array.isArray(prev.blocks)) return prev;
        const block = {
          id,
          type: "image",
          pageIndex: activePage,
          src: uri, // ✅ URI string résolue
          x: canvasW * 0.35,
          y: canvasH * 0.4,
          width: canvasW * 0.3,
          height: canvasW * 0.3,
          rotation: 0,
          zIndex:
            Math.max(...prev.blocks.map((b: any) => b.zIndex || 0), 0) + 1,
          name: motifName,
        };
        const next = { ...prev, blocks: [...prev.blocks, block] };
        pushHistory(next);
        return next;
      });
      setSelectedBlockId(id);
    },
    [activePage, canvasW, canvasH, pushHistory],
  );

  const addImageBlock = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (res.canceled) return;
    const uri = res.assets[0]?.uri;
    if (!uri) return;

    const id = newId();
    setTheme((prev: any) => {
      if (!prev || !Array.isArray(prev.blocks)) return prev;
      const block = {
        id,
        type: "image",
        pageIndex: activePage,
        src: uri,
        x: canvasW * 0.15,
        y: canvasH * 0.15,
        width: canvasW * 0.6,
        height: canvasH * 0.3,
        rotation: 0,
        zIndex: Math.max(...prev.blocks.map((b: any) => b.zIndex || 0), 0) + 1,
      };
      const next = { ...prev, blocks: [...prev.blocks, block] };
      pushHistory(next);
      return next;
    });
    setSelectedBlockId(id);
  }, [activePage, canvasW, canvasH, pushHistory]);

  const handleClearAllBlocks = useCallback(() => {
    if (!theme) return;
    const count = (theme.blocks || []).filter(
      (b: any) => (b.pageIndex ?? 0) === activePage,
    ).length;

    if (count === 0) {
      setAlertConfig({
        title: "Rien à effacer",
        message: "Cette page ne contient aucun élément.",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    setAlertConfig({
      title: "Tout effacer ?",
      message: `${count} élément${count > 1 ? "s" : ""} seront supprimés de cette page. Cette action est irréversible.`,
      buttons: [
        { text: "Annuler" },
        {
          text: "Tout effacer",
          onPress: () => {
            setTheme((prev: any) => {
              if (!prev || !Array.isArray(prev.blocks)) return prev;
              const next = {
                ...prev,
                blocks: prev.blocks.filter(
                  (b: any) => (b.pageIndex ?? 0) !== activePage,
                ),
              };
              pushHistory(next);
              return next;
            });
            setSelectedBlockId(null);
            setEditingText(null);
            setShowTextToolbar(false);
          },
        },
      ],
    });
  }, [theme, activePage, pushHistory]);

  const addPage = useCallback(() => {
    setTheme((prev: any) => {
      if (!prev || !Array.isArray(prev.pages)) return prev;
      const next = {
        ...prev,
        pages: [
          ...prev.pages,
          {
            id: `page-${Date.now()}`,
            background: { type: "color", value: "#FFFFFF" },
            bgTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
          },
        ],
      };
      pushHistory(next);
      return next;
    });
    setActivePage((p) => p + 1);
  }, [pushHistory]);

  const removePage = useCallback(() => {
    if (!theme || !theme.pages) return;
    if (theme.pages.length <= 1) {
      setAlertConfig({
        title: "Info",
        message: "Il doit rester au moins une page.",
        buttons: [{ text: "OK" }],
      });
      return;
    }
    const idx = activePage;
    setTheme((prev: any) => {
      if (!prev || !Array.isArray(prev.pages)) return prev;
      const next = {
        ...prev,
        pages: prev.pages.filter((_: any, i: number) => i !== idx),
        blocks: (prev.blocks || [])
          .filter((b: any) => (b.pageIndex ?? 0) !== idx)
          .map((b: any) => ({
            ...b,
            pageIndex:
              (b.pageIndex ?? 0) > idx ? (b.pageIndex ?? 0) - 1 : b.pageIndex,
          })),
      };
      pushHistory(next);
      return next;
    });
    setActivePage(Math.max(0, idx - 1));
  }, [theme, activePage, pushHistory]);

  // ═══════════════════════════════════════════════════════════════
  // SAUVEGARDE
  // ═══════════════════════════════════════════════════════════════
  const handleSaveClick = () => {
    if (!theme) return;
    setSaveName(theme.name || "Nouveau thème");
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = async () => {
    if (!theme) return;
    const finalName = saveName.trim() || "Thème sans nom";

    if (!isEditing) {
      const maxThemes = limits?.max_themes_per_event;
      if (maxThemes !== null && maxThemes !== undefined) {
        const existing = await storage.listThemes(eventId);
        if (existing.length >= maxThemes) {
          setShowSaveDialog(false);
          setUpgradeModal({
            visible: true,
            message:
              `Votre plan ${currentPlan} autorise ${maxThemes} thème${maxThemes > 1 ? "s" : ""} ` +
              `par événement. Ce thème ne peut pas être sauvegardé.`,
          });
          return;
        }
      }
    }

    setShowSaveDialog(false);
    setSaving(true);
    const toSave = { ...theme, name: finalName };
    const ok = await storage.saveAndApply(toSave, canvasW, canvasH);
    setSaving(false);
    if (ok) {
      setAlertConfig({
        title: "Sauvegardé",
        message: `Le thème "${finalName}" a été enregistré et appliqué.`,
        buttons: [{ text: "OK", onPress: () => router.back() }],
      });
    } else {
      setAlertConfig({
        title: "Erreur",
        message: "La sauvegarde a échoué.",
        buttons: [{ text: "OK" }],
      });
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) setShowExitConfirm(true);
    else router.back();
  };

  const handleQuitWithoutSaving = () => {
    setShowExitConfirm(false);
    router.back();
  };

  const handleSaveAndClose = async () => {
    if (!theme) return;
    setShowExitConfirm(false);
    setSaving(true);
    const ok = await storage.saveAndApply(theme, canvasW, canvasH);
    setSaving(false);
    if (ok) router.back();
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════
  if (
    isLoading ||
    !theme ||
    !Array.isArray(theme.pages) ||
    theme.pages.length === 0
  ) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement du thème…</Text>
      </SafeAreaView>
    );
  }

  const safeActivePage = Math.min(activePage, theme.pages.length - 1);
  const page = theme.pages[safeActivePage];

  const allBlocksOnPage = (theme.blocks || [])
    .filter((b: any) => (b.pageIndex ?? 0) === safeActivePage)
    .sort((a: any, b: any) => (a.zIndex || 1) - (b.zIndex || 1));

  const blocksOnPage = allBlocksOnPage.filter((b: any) => !b.isHidden);

  const selectedBlock = (theme.blocks || []).find(
    (b: any) => b.id === selectedBlockId,
  );

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <Header
        onBack={handleBack}
        title={isEditing ? "Modifier le thème" : "Nouveau thème"}
        subtitle={`${theme.pages.length} page${
          theme.pages.length > 1 ? "s" : ""
        } · ${theme.blocks.length} élément${theme.blocks.length > 1 ? "s" : ""}`}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSaveClick}
        saving={saving}
        undoDisabled={historyIndex <= 0}
        redoDisabled={historyIndex >= history.length - 1}
      />

      {showTextToolbar && selectedBlock?.type === "text" && (
        <TextToolbar
          block={selectedBlock}
          onUpdateStyle={(id, patch) =>
            updateBlock(id, {
              style: { ...(selectedBlock.style || {}), ...patch },
            })
          }
          showFontSizePalette={showFontSizePalette}
          showColorPalette={showColorPalette}
          onToggleFontSizePalette={() =>
            setShowFontSizePalette(!showFontSizePalette)
          }
          onToggleColorPalette={() => setShowColorPalette(!showColorPalette)}
          onClose={() => {
            setShowTextToolbar(false);
            setEditingText(null);
          }}
        />
      )}

      <Pressable
        style={styles.canvasWrapper}
        onPress={() => {
          setSelectedBlockId(null);
          setEditingText(null);
          setShowTextToolbar(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.canvasScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                styles.canvas,
                {
                  width: canvasW,
                  height: canvasH,
                  backgroundColor:
                    page.background?.type === "color"
                      ? page.background.value
                      : "#FFFFFF",
                },
              ]}
            >
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {Array.from({
                  length: Math.ceil(canvasH / GRID_SIZE) + 1,
                }).map((_, i) => (
                  <View
                    key={`h-${i}`}
                    style={{
                      position: "absolute",
                      top: i * GRID_SIZE,
                      left: 0,
                      right: 0,
                      height: 1,
                      backgroundColor: "rgba(99, 102, 241, 0.06)",
                    }}
                  />
                ))}
                {Array.from({
                  length: Math.ceil(canvasW / GRID_SIZE) + 1,
                }).map((_, i) => (
                  <View
                    key={`v-${i}`}
                    style={{
                      position: "absolute",
                      left: i * GRID_SIZE,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      backgroundColor: "rgba(99, 102, 241, 0.06)",
                    }}
                  />
                ))}
              </View>

              {/* Image de fond — après normalizeTheme, value est toujours une string */}
              {page.background?.type === "image" && page.background?.value ? (
                <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
                  <Image
                    source={{ uri: page.background.value }}
                    style={styles.bgImage}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              {blocksOnPage.map((b: any) => (
                <Block
                  key={b.id}
                  block={b}
                  canvasW={canvasW}
                  canvasH={canvasH}
                  isSelected={selectedBlockId === b.id}
                  onSelect={(id) => {
                    const target = theme.blocks.find((x: any) => x.id === id);
                    if (target?.isLocked) {
                      setAlertConfig({
                        title: "Élément verrouillé",
                        message:
                          "Déverrouillez-le depuis le panneau Calques pour le modifier.",
                        buttons: [{ text: "OK" }],
                      });
                      return;
                    }
                    setSelectedBlockId(id);
                    if (b.type === "text") setShowTextToolbar(true);
                  }}
                  onUpdate={updateBlock}
                  onRemove={removeBlock}
                  onDuplicate={duplicateBlock}
                  onBringToFront={bringToFront}
                  onSendToBack={sendToBack}
                  editingText={editingText}
                  setEditingText={(id) => {
                    setEditingText(id);
                    if (id) setShowTextToolbar(true);
                  }}
                  onRequestProperties={(id) => {
                    setSelectedBlockId(id);
                    setPropertiesVisible(true);
                  }}
                  allBlocks={blocksOnPage}
                />
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>

      <View style={styles.quickBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickBarContent}
        >
          <IconButton icon="type" onPress={() => addTextBlock()} primary />
          <IconButton icon="image" onPress={addImageBlock} />
          <IconButton icon="star" onPress={() => setMotifPickerVisible(true)} />
          <IconButton icon="grid" onPress={() => addQrBlock()} />

          <View style={styles.divider} />

          <IconButton
            icon="user-plus"
            onPress={() => addTextBlock("{{nom_invite}}")}
          />
          <IconButton
            icon="tag"
            onPress={() => addTextBlock("{{categorie_invite}}")}
          />
          <IconButton
            icon="hash"
            onPress={() => addTextBlock("{{code_invitation}}")}
          />

          <View style={styles.divider} />

          <IconButton
            icon="chevron-left"
            onPress={() => setActivePage(Math.max(0, safeActivePage - 1))}
            disabled={safeActivePage === 0}
          />
          <View style={styles.pageIndicator}>
            <Text style={styles.pageIndicatorText}>
              {safeActivePage + 1} / {theme.pages.length}
            </Text>
          </View>
          <IconButton
            icon="chevron-right"
            onPress={() =>
              setActivePage(
                Math.min(theme.pages.length - 1, safeActivePage + 1),
              )
            }
            disabled={safeActivePage === theme.pages.length - 1}
          />
          <IconButton icon="plus" onPress={addPage} />
          <IconButton
            icon="minus"
            onPress={removePage}
            danger
            disabled={theme.pages.length <= 1}
          />

          <View style={styles.divider} />

          <IconButton icon="layers" onPress={() => setLayersVisible(true)} />
          <IconButton icon="settings" onPress={() => setOptionsVisible(true)} />
          <IconButton icon="trash-2" onPress={handleClearAllBlocks} danger />
        </ScrollView>
      </View>

      <LayersPanel
        visible={layersVisible}
        onClose={() => setLayersVisible(false)}
        blocks={allBlocksOnPage}
        selectedId={selectedBlockId}
        onSelect={(id) => setSelectedBlockId(id)}
        onToggleHidden={toggleHidden}
        onToggleLocked={toggleLocked}
        onBringToFront={bringToFront}
        onSendToBack={sendToBack}
        onDuplicate={duplicateById}
        onDelete={removeBlock}
      />

      <MotifPicker
        visible={motifPickerVisible}
        onClose={() => setMotifPickerVisible(false)}
        onSelect={addMotifBlock}
      />

      <OptionsPanel
        visible={optionsVisible}
        onClose={() => setOptionsVisible(false)}
        theme={theme}
        activePage={safeActivePage}
        canvasW={canvasW}
        canvasH={canvasH}
        onUpdateTheme={updateTheme}
        onAddTextBlock={addTextBlock}
        onAddImageBlock={addImageBlock}
        onAddQrBlock={() => addQrBlock()}
        onExportToPDF={() => {}}
        exporting={false}
        assetImages={assetImages}
      />

      <PropertiesModal
        visible={propertiesVisible}
        onClose={() => setPropertiesVisible(false)}
        block={selectedBlock}
        onUpdate={updateBlock}
        onRemove={removeBlock}
        canvasW={canvasW}
        canvasH={canvasH}
      />

      <ExitConfirmModal
        visible={showExitConfirm}
        onQuitWithoutSaving={handleQuitWithoutSaving}
        onSaveAndClose={handleSaveAndClose}
        onContinueEditing={() => setShowExitConfirm(false)}
      />

      <Modal
        visible={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        position="center"
        animationType="fade"
        title="Nom du thème"
      >
        <TextInput
          value={saveName}
          onChangeText={setSaveName}
          style={styles.saveInput}
          placeholder="Nouveau thème"
          placeholderTextColor={colors.textMuted}
          autoFocus
        />
        <View style={styles.saveActions}>
          <View style={{ flex: 1 }}>
            <Button
              title="Annuler"
              variant="ghost"
              size="md"
              onPress={() => setShowSaveDialog(false)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Enregistrer"
              variant="primary"
              size="md"
              onPress={handleSaveConfirm}
            />
          </View>
        </View>
      </Modal>

      <UpgradeModal
        visible={upgradeModal.visible}
        onClose={() => setUpgradeModal({ visible: false })}
        message={upgradeModal.message}
        featureName="Créer un thème"
        currentPlan={currentPlan}
        recommendedPlan="premium"
      />

      {alertConfig && (
        <CustomAlert
          visible={!!alertConfig}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={() => setAlertConfig(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
    gap: spacing.base,
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  canvasWrapper: { flex: 1, backgroundColor: colors.surfaceAlt },
  canvasScroll: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.base,
    minHeight: "100%",
  },
  canvas: {
    position: "relative",
    borderRadius: radius.md,
    overflow: "hidden",
    ...shadows.md,
  },
  bgImage: { width: "100%", height: "100%" },
  quickBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingVertical: spacing.sm,
  },
  quickBarContent: {
    paddingHorizontal: spacing.md,
    alignItems: "center",
    gap: spacing.sm,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  pageIndicator: {
    paddingHorizontal: spacing.md,
    minWidth: 60,
    alignItems: "center",
  },
  pageIndicatorText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  saveInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontSize: fontSize.base,
    color: colors.text,
    marginTop: spacing.base,
  },
  saveActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.base,
  },
});
