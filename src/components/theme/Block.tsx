// src/components/theme/Block.tsx
import { Feather } from "@expo/vector-icons";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../theme/tokens";
import { getFontFamily } from "./helpers";

const SNAP_THRESHOLD = 10;
const GRID_SIZE = 20;
const MIN_SIZE = 40;
const HANDLE_SIZE = 20;

interface BlockProps {
  block: any;
  canvasW: number;
  canvasH: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: any, saveToHistory?: boolean) => void;
  onRemove: (id: string) => void;
  onDuplicate: (block: any) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  editingText: string | null;
  setEditingText: (id: string | null) => void;
  onRequestProperties: (id: string) => void;
  allBlocks: any[];
  zoom?: number;
}

const Block: React.FC<BlockProps> = ({
  block,
  canvasW,
  canvasH,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  editingText,
  setEditingText,
  onRequestProperties,
  allBlocks,
  zoom = 1,
}) => {
  const [localText, setLocalText] = useState(block.text || "");
  const [isDragging, setIsDragging] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({
    v: null,
    h: null,
  });

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastTapRef = useRef(0);

  // ═══════════════════════════════════════════════════════════
  // REFS synchronisées (accessibles partout)
  // ═══════════════════════════════════════════════════════════
  const blockRef = useRef(block);
  blockRef.current = block;
  const isSelectedRef = useRef(isSelected);
  isSelectedRef.current = isSelected;
  const editingTextRef = useRef(editingText);
  editingTextRef.current = editingText;
  const showContextMenuRef = useRef(showContextMenu);
  showContextMenuRef.current = showContextMenu;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    setLocalText(block.text || "");
  }, [block.text]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.02 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isSelected]);

  // ═══════════════════════════════════════════════════════════
  // SNAP
  // ═══════════════════════════════════════════════════════════
  const calculateSnap = useCallback(
    (newX: number, newY: number, width: number, height: number) => {
      const b = blockRef.current;
      const snaps = {
        x: newX,
        y: newY,
        guides: { v: null as number | null, h: null as number | null },
      };
      const snapToGrid = (val: number) =>
        Math.round(val / GRID_SIZE) * GRID_SIZE;
      snaps.x = snapToGrid(newX);
      snaps.y = snapToGrid(newY);

      const centerX = canvasW / 2;
      const centerY = canvasH / 2;
      const blockCenterX = snaps.x + width / 2;
      const blockCenterY = snaps.y + height / 2;

      if (Math.abs(blockCenterX - centerX) < SNAP_THRESHOLD) {
        snaps.x = centerX - width / 2;
        snaps.guides.v = centerX;
      }
      if (Math.abs(blockCenterY - centerY) < SNAP_THRESHOLD) {
        snaps.y = centerY - height / 2;
        snaps.guides.h = centerY;
      }

      (allBlocks || []).forEach((other) => {
        if (other.id === b.id) return;
        const otherCenterX = other.x + other.width / 2;
        const otherCenterY = other.y + other.height / 2;
        if (Math.abs(blockCenterX - otherCenterX) < SNAP_THRESHOLD) {
          snaps.x = otherCenterX - width / 2;
          snaps.guides.v = otherCenterX;
        }
        if (Math.abs(blockCenterY - otherCenterY) < SNAP_THRESHOLD) {
          snaps.y = otherCenterY - height / 2;
          snaps.guides.h = otherCenterY;
        }
      });

      return snaps;
    },
    [canvasW, canvasH, allBlocks],
  );

  // ═══════════════════════════════════════════════════════════
  // DRAG — PanResponder principal
  // ═══════════════════════════════════════════════════════════
  const dragStartRef = useRef({ x: 0, y: 0 });

  const dragResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () =>
          !editingTextRef.current && !showContextMenuRef.current,
        onMoveShouldSetPanResponder: (_, g) =>
          !editingTextRef.current && (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2),
        onPanResponderGrant: (e) => {
          const b = blockRef.current;
          if (!isSelectedRef.current) onSelectRef.current(b.id);
          setIsDragging(true);
          dragStartRef.current = {
            x: e.nativeEvent.pageX - b.x * zoom,
            y: e.nativeEvent.pageY - b.y * zoom,
          };
        },
        onPanResponderMove: (e) => {
          if (editingTextRef.current) return;
          const b = blockRef.current;
          const rawX = (e.nativeEvent.pageX - dragStartRef.current.x) / zoom;
          const rawY = (e.nativeEvent.pageY - dragStartRef.current.y) / zoom;
          const snap = calculateSnap(rawX, rawY, b.width, b.height);
          const newX = Math.max(0, Math.min(snap.x, canvasW - b.width));
          const newY = Math.max(0, Math.min(snap.y, canvasH - b.height));
          setGuides(snap.guides);
          onUpdateRef.current(b.id, { x: newX, y: newY }, false);
        },
        onPanResponderRelease: () => {
          setIsDragging(false);
          setGuides({ v: null, h: null });
          onUpdateRef.current(blockRef.current.id, {}, true);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          setGuides({ v: null, h: null });
        },
      }),
    [zoom, canvasW, canvasH, calculateSnap],
  );

  // ═══════════════════════════════════════════════════════════
  // RESIZE — un PanResponder PAR poignée
  // ═══════════════════════════════════════════════════════════
  const resizeStartRef = useRef({ w: 0, h: 0, x: 0, y: 0 });

  const createHandleResponder = useCallback(
    (corner: "tl" | "tr" | "bl" | "br") =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          const b = blockRef.current;
          resizeStartRef.current = {
            w: b.width,
            h: b.height,
            x: b.x,
            y: b.y,
          };
        },
        onPanResponderMove: (_, g) => {
          const b = blockRef.current;
          const dx = g.dx / zoom;
          const dy = g.dy / zoom;
          const start = resizeStartRef.current;

          let newWidth = start.w;
          let newHeight = start.h;
          let newX = start.x;
          let newY = start.y;

          const maintainRatio = b.type === "image" || b.type === "qr";
          const ratio = start.w / start.h;

          switch (corner) {
            case "br":
              newWidth = Math.max(MIN_SIZE, start.w + dx);
              newHeight = maintainRatio
                ? newWidth / ratio
                : Math.max(MIN_SIZE, start.h + dy);
              break;
            case "bl":
              newWidth = Math.max(MIN_SIZE, start.w - dx);
              newHeight = maintainRatio
                ? newWidth / ratio
                : Math.max(MIN_SIZE, start.h + dy);
              newX = start.x + (start.w - newWidth);
              break;
            case "tr":
              newWidth = Math.max(MIN_SIZE, start.w + dx);
              newHeight = maintainRatio
                ? newWidth / ratio
                : Math.max(MIN_SIZE, start.h - dy);
              newY = start.y + (start.h - newHeight);
              break;
            case "tl":
              newWidth = Math.max(MIN_SIZE, start.w - dx);
              newHeight = maintainRatio
                ? newWidth / ratio
                : Math.max(MIN_SIZE, start.h - dy);
              newX = start.x + (start.w - newWidth);
              newY = start.y + (start.h - newHeight);
              break;
          }

          newX = Math.max(0, Math.min(newX, canvasW - MIN_SIZE));
          newY = Math.max(0, Math.min(newY, canvasH - MIN_SIZE));
          newWidth = Math.min(newWidth, canvasW - newX);
          newHeight = Math.min(newHeight, canvasH - newY);

          onUpdateRef.current(
            b.id,
            { x: newX, y: newY, width: newWidth, height: newHeight },
            false,
          );
        },
        onPanResponderRelease: () => {
          onUpdateRef.current(blockRef.current.id, {}, true);
        },
        onPanResponderTerminate: () => {
          onUpdateRef.current(blockRef.current.id, {}, true);
        },
      }),
    [zoom, canvasW, canvasH],
  );

  const tlResponder = useMemo(
    () => createHandleResponder("tl"),
    [createHandleResponder],
  );
  const trResponder = useMemo(
    () => createHandleResponder("tr"),
    [createHandleResponder],
  );
  const blResponder = useMemo(
    () => createHandleResponder("bl"),
    [createHandleResponder],
  );
  const brResponder = useMemo(
    () => createHandleResponder("br"),
    [createHandleResponder],
  );

  // ═══════════════════════════════════════════════════════════
  // TAP / édition
  // ═══════════════════════════════════════════════════════════
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (block.type === "text") setEditingText(block.id);
      else onRequestProperties(block.id);
    } else {
      onSelect(block.id);
    }
    lastTapRef.current = now;
  }, [block, setEditingText, onRequestProperties, onSelect]);

  const startInlineEdit = useCallback(() => {
    if (block.type === "text") setEditingText(block.id);
  }, [block, setEditingText]);

  const finishInlineEdit = useCallback(() => {
    setEditingText(null);
    if (localText !== block.text) {
      onUpdate(block.id, { text: localText }, true);
    }
  }, [localText, block.text, block.id, onUpdate, setEditingText]);

  const imgSource = useMemo(() => {
    if (block.assetModule) return block.assetModule;
    if (block.src) return { uri: block.src };
    return null;
  }, [block.assetModule, block.src]);

  // ═══════════════════════════════════════════════════════════
  // Rendu des poignées
  // ═══════════════════════════════════════════════════════════
  const renderHandles = () => {
    if (!isSelected || editingText) return null;

    const half = HANDLE_SIZE / 2;
    const positions = {
      tl: { left: -half, top: -half },
      tr: { right: -half, top: -half },
      bl: { left: -half, bottom: -half },
      br: { right: -half, bottom: -half },
    };

    const handleStyle = (corner: "tl" | "tr" | "bl" | "br") => [
      styles.resizeHandle,
      positions[corner],
    ];

    return (
      <>
        {/* Bordure de sélection */}
        <View
          style={[
            styles.selectionBorder,
            {
              width: block.width + 4,
              height: block.height + 4,
              left: -2,
              top: -2,
            },
          ]}
          pointerEvents="none"
        />

        {/* 4 poignées — chacune avec son PanResponder */}
        <View style={handleStyle("tl")} {...tlResponder.panHandlers}>
          <View style={styles.handleDot} />
        </View>
        <View style={handleStyle("tr")} {...trResponder.panHandlers}>
          <View style={styles.handleDot} />
        </View>
        <View style={handleStyle("bl")} {...blResponder.panHandlers}>
          <View style={styles.handleDot} />
        </View>
        <View style={handleStyle("br")} {...brResponder.panHandlers}>
          <View style={styles.handleDot} />
        </View>

        {/* Guides */}
        {guides.v !== null && (
          <View
            style={[
              styles.guideLine,
              { left: guides.v - block.x, top: -2000, height: 4000, width: 1 },
            ]}
            pointerEvents="none"
          />
        )}
        {guides.h !== null && (
          <View
            style={[
              styles.guideLine,
              { top: guides.h - block.y, left: -2000, width: 4000, height: 1 },
            ]}
            pointerEvents="none"
          />
        )}
      </>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // Context menu
  // ═══════════════════════════════════════════════════════════
  const ContextMenu = () => (
    <Modal
      transparent
      visible={showContextMenu}
      animationType="fade"
      onRequestClose={() => setShowContextMenu(false)}
    >
      <Pressable
        style={styles.contextMenuOverlay}
        onPress={() => setShowContextMenu(false)}
      >
        <View
          style={[
            styles.contextMenu,
            {
              left: Math.min(block.x + block.width + 10, canvasW - 180),
              top: Math.min(block.y, canvasH - 200),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => {
              onDuplicate(block);
              setShowContextMenu(false);
            }}
          >
            <Feather name="copy" size={16} color={colors.text} />
            <Text style={styles.contextMenuItemText}>Dupliquer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => {
              onBringToFront(block.id);
              setShowContextMenu(false);
            }}
          >
            <Feather name="chevrons-up" size={16} color={colors.text} />
            <Text style={styles.contextMenuItemText}>Premier plan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => {
              onSendToBack(block.id);
              setShowContextMenu(false);
            }}
          >
            <Feather name="chevrons-down" size={16} color={colors.text} />
            <Text style={styles.contextMenuItemText}>Arrière-plan</Text>
          </TouchableOpacity>
          <View style={styles.contextMenuDivider} />
          <TouchableOpacity
            style={[styles.contextMenuItem, styles.contextMenuDelete]}
            onPress={() => {
              onRemove(block.id);
              setShowContextMenu(false);
            }}
          >
            <Feather name="trash-2" size={16} color={colors.error} />
            <Text style={[styles.contextMenuItemText, { color: colors.error }]}>
              Supprimer
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <Animated.View
      style={[
        styles.blockContainer,
        {
          left: block.x,
          top: block.y,
          width: block.width,
          height: block.height,
          transform: [
            { rotate: `${block.rotation || 0}deg` },
            { scale: scaleAnim },
          ],
          zIndex: isSelected ? 100 : block.zIndex || 1,
          opacity: isDragging ? 0.9 : 1,
        },
      ]}
      {...dragResponder.panHandlers}
    >
      <ContextMenu />

      {/* Boutons flottants */}
      {isSelected && !editingText && (
        <>
          <TouchableOpacity
            style={[styles.floatingBtn, styles.deleteBtn]}
            onPress={() => onRemove(block.id)}
          >
            <Feather name="x" size={14} color={colors.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingBtn, styles.duplicateBtn]}
            onPress={() => onDuplicate(block)}
          >
            <Feather name="copy" size={12} color={colors.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.floatingBtn, styles.settingsBtn]}
            onPress={() => onRequestProperties(block.id)}
          >
            <Feather name="settings" size={13} color={colors.textInverse} />
          </TouchableOpacity>
        </>
      )}

      {renderHandles()}

      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleTap}
        onLongPress={() => setShowContextMenu(true)}
        style={styles.blockContent}
      >
        {block.type === "text" && (
          <>
            {editingText === block.id ? (
              <TextInput
                value={localText}
                onChangeText={setLocalText}
                autoFocus
                multiline
                onBlur={finishInlineEdit}
                style={[
                  styles.textInput,
                  {
                    textAlign: block.style?.align || "center",
                    fontSize: block.style?.fontSize || 18,
                    color: block.style?.color || colors.text,
                    fontFamily: getFontFamily(block.style?.fontFamily),
                    fontWeight: block.style?.fontWeight || "normal",
                    fontStyle: block.style?.fontStyle || "normal",
                    textDecorationLine:
                      block.style?.textDecorationLine || "none",
                  },
                ]}
              />
            ) : (
              <Pressable onPress={startInlineEdit} style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.textBlock,
                    {
                      fontSize: block.style?.fontSize || 18,
                      color: block.style?.color || colors.text,
                      textAlign: block.style?.align || "center",
                      fontWeight: block.style?.fontWeight || "normal",
                      fontFamily: getFontFamily(block.style?.fontFamily),
                      fontStyle: block.style?.fontStyle || "normal",
                      textDecorationLine:
                        block.style?.textDecorationLine || "none",
                    },
                  ]}
                >
                  {block.text || "Appuyez pour éditer"}
                </Text>
              </Pressable>
            )}
          </>
        )}

        {block.type === "image" && imgSource && (
          <Image
            source={imgSource}
            style={styles.imageBlock}
            resizeMode="cover"
          />
        )}

        {block.type === "qr" && (
          <View
            style={[
              styles.qrBlock,
              { backgroundColor: block.style?.backgroundColor || "#FFFFFF" },
            ]}
          >
            <Feather name="grid" size={32} color={colors.textMuted} />
            <Text style={styles.qrText}>QR</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  blockContainer: { position: "absolute" },
  blockContent: { flex: 1, width: "100%", height: "100%", overflow: "hidden" },
  selectionBorder: {
    position: "absolute",
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: 4,
  },
  resizeHandle: {
    position: "absolute",
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 30,
    ...shadows.md,
  },
  handleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  guideLine: {
    position: "absolute",
    backgroundColor: colors.primary,
    zIndex: 50,
    opacity: 0.6,
  },
  floatingBtn: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 40,
    ...shadows.md,
  },
  deleteBtn: { top: -13, right: -13, backgroundColor: colors.error },
  duplicateBtn: { top: -13, left: -13, backgroundColor: colors.primary },
  settingsBtn: { bottom: -13, right: -13, backgroundColor: colors.text },
  textInput: { flex: 1, padding: 6, textAlignVertical: "center" },
  textBlock: { flex: 1, padding: 6 },
  imageBlock: { width: "100%", height: "100%" },
  qrBlock: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    gap: 4,
  },
  qrText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
  },
  contextMenuOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.08)" },
  contextMenu: {
    position: "absolute",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    minWidth: 180,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.lg,
  },
  contextMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  contextMenuItemText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  contextMenuDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
  contextMenuDelete: { backgroundColor: colors.errorSoft },
});

export default Block;
