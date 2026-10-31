// src/stores/data.store.ts
import { create } from "zustand";

interface DataState {
  detailEvent: any | null;
  setDetailEvent: (event: any) => void;
  clearDetailEvent: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  detailEvent: null,
  setDetailEvent: (event) => set({ detailEvent: event }),
  clearDetailEvent: () => set({ detailEvent: null }),
}));
