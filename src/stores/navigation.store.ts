// src/stores/navigation.store.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface NavigationState {
  lastRoute: string;
  setLastRoute: (route: string) => void;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      lastRoute: "",
      setLastRoute: (route) => set({ lastRoute: route }),
    }),
    {
      name: "navigation-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
