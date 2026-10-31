// src/stores/ui.store.ts
import { create } from "zustand";

interface UIState {
  snackbarVisible: boolean;
  snackbarMessage: string;
  loading: boolean;
  showSnackbar: (message: string) => void;
  hideSnackbar: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  snackbarVisible: false,
  snackbarMessage: "",
  loading: false,
  showSnackbar: (message) =>
    set({ snackbarVisible: true, snackbarMessage: message }),
  hideSnackbar: () => set({ snackbarVisible: false, snackbarMessage: "" }),
  setLoading: (loading) => set({ loading }),
}));
