// src/hooks/useAuth.ts
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  login as apiLogin,
  log_out as apiLogout,
  sign_up as apiRegister,
} from "../api/auth";
import { STORAGE_KEYS } from "../api/endpoints";
import { useAuthStore } from "../stores/auth.store";

export const useAuth = () => {
  const { user, token, setUser, setToken, logout } = useAuthStore();

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const { data } = await apiLogin(credentials);

      // ✅ Stockage SecureStore (cohérent avec client.ts)
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, data.access);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, data.refresh);
      if (data.user) {
        await SecureStore.setItemAsync(
          STORAGE_KEYS.AUTH_USER,
          JSON.stringify(data.user),
        );
      }

      // Zustand (mémoire)
      setUser(data.user);
      setToken(data.access);

      return data;
    } catch (error: any) {
      console.error("❌ Erreur login:", error.response?.data || error.message);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const data = await apiRegister(userData);

      // Le backend register ne renvoie pas forcément access/refresh
      // → on tente de login automatiquement si besoin
      if (data.access && data.refresh) {
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, data.access);
        await SecureStore.setItemAsync(
          STORAGE_KEYS.REFRESH_TOKEN,
          data.refresh,
        );
        setToken(data.access);
      }
      if (data.user) {
        await SecureStore.setItemAsync(
          STORAGE_KEYS.AUTH_USER,
          JSON.stringify(data.user),
        );
        setUser(data.user);
      }
      return data;
    } catch (error: any) {
      console.error(
        "❌ Erreur register:",
        error.response?.data || error.message,
      );
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const refresh = await SecureStore.getItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN,
      );
      if (refresh) await apiLogout(refresh);
    } catch (e) {
      console.warn("Erreur déconnexion serveur:", e);
    } finally {
      await Promise.all([
        SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN).catch(() => {}),
        SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN).catch(() => {}),
        SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_USER).catch(() => {}),
      ]);
      logout();
      router.replace("/choose");
    }
  };

  return { user, token, login, register, signOut };
};
