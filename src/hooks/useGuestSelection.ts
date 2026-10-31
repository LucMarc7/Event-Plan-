// src/hooks/useGuestSelection.ts
import { useRef, useState } from "react";
import { Animated } from "react-native";

export const useGuestSelection = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const bannerAnim = useRef(new Animated.Value(0)).current;

  const handleLongPress = (id: string, list: any[]) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds([id]);
    } else {
      handleToggleSelection(id, list);
    }
  };

  const handlePress = (id: string, list: any[]) => {
    if (selectionMode) {
      handleToggleSelection(id, list);
    }
  };

  const handleToggleSelection = (id: string, list: any[]) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
    setSelectionMode(false);
  };

  const handleSelectAll = (list: any[]) => {
    setSelectedIds(list.map((g) => g.id));
  };

  return {
    selectedIds,
    selectionMode,
    showLimitAlert,
    handleLongPress,
    handlePress,
    handleToggleSelection,
    handleDeselectAll,
    handleSelectAll,
    bannerAnim,
  };
};
