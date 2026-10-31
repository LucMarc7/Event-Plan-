import { create } from "zustand";

export interface ErrorState {
  error: string | null;
  visible: boolean;
  type: "snackbar" | "dialog" | "fullscreen";
  setError: (
    message: string,
    type?: "snackbar" | "dialog" | "fullscreen",
  ) => void;
  clearError: () => void;
}

export const useErrorStore = create<ErrorState>((set) => ({
  error: null,
  visible: false,
  type: "snackbar",
  setError: (message, type = "snackbar") =>
    set({ error: message, visible: true, type }),
  clearError: () => set({ error: null, visible: false, type: "snackbar" }),
}));
