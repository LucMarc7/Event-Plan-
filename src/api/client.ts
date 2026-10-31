// src/api/client.ts
// Client HTTP unifié — version avec logs de diagnostic

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { isControllerEndpoint, STORAGE_KEYS } from "./endpoints";
// ✅ Identifiant + infos device (X-Device-Id, X-Device-Info)
import { getDeviceId, getDeviceInfoHeader } from "../utils/deviceInfo";

export const API_BASE_URL = "https://klmarc.pythonanywhere.com";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Channel": "mobile",
  },
});

type TokenType = "organizer" | "controller";

// ─── Lecture des tokens ───
const getTokens = async (type: TokenType) => {
  if (type === "controller") {
    const access = await SecureStore.getItemAsync(
      STORAGE_KEYS.CONTROLLER_TOKEN,
    );
    const refresh = await SecureStore.getItemAsync(
      STORAGE_KEYS.CONTROLLER_REFRESH,
    );
    return { access, refresh };
  }

  // Organizer : SecureStore + fallback AsyncStorage (ancien système)
  const access =
    (await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN)) ||
    (await AsyncStorage.getItem("authToken"));
  const refresh =
    (await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN)) ||
    (await AsyncStorage.getItem("refresh"));

  return { access, refresh };
};

const setAccessToken = async (type: TokenType, token: string) => {
  if (type === "controller") {
    await SecureStore.setItemAsync(STORAGE_KEYS.CONTROLLER_TOKEN, token);
  } else {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
  }
};

const setRefreshToken = async (type: TokenType, token: string) => {
  if (type === "controller") {
    await SecureStore.setItemAsync(STORAGE_KEYS.CONTROLLER_REFRESH, token);
  } else {
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
  }
};

const clearTokens = async (type: TokenType) => {
  if (type === "controller") {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.CONTROLLER_TOKEN).catch(
        () => {},
      ),
      SecureStore.deleteItemAsync(STORAGE_KEYS.CONTROLLER_REFRESH).catch(
        () => {},
      ),
      SecureStore.deleteItemAsync(STORAGE_KEYS.CONTROLLER_EVENT).catch(
        () => {},
      ),
    ]);
  } else {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN).catch(() => {}),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN).catch(() => {}),
      SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_USER).catch(() => {}),
    ]);
  }
};

const refreshState: Record<
  TokenType,
  { isRefreshing: boolean; queue: ((token: string | null) => void)[] }
> = {
  organizer: { isRefreshing: false, queue: [] },
  controller: { isRefreshing: false, queue: [] },
};

const flushQueue = (type: TokenType, token: string | null) => {
  refreshState[type].queue.forEach((cb) => cb(token));
  refreshState[type].queue = [];
};

const forceLogout = async (type: TokenType) => {
  console.warn(`🔒 Session ${type} expirée — déconnexion forcée`);
  await clearTokens(type);
  try {
    if (type === "organizer") {
      const { useAuthStore } = require("../stores/auth.store");
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setToken(null);
    }
  } catch (e) {}
};

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================
// ✅ Routes publiques : pas besoin de token → on évite le warning bruité
const PUBLIC_ENDPOINTS = [
  "/accounts/login/",
  "/accounts/register/",
  "/accounts/forgot_password/",
  "/accounts/reset-password/",
  "/controles/login/",
  "/controles/check-credentials/",
  "/accounts/username-suggestion/",
  "/accounts/check-username/",
  "/accounts/verify-email/",
  "/accounts/resend-verification/",
];

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const url = config.url || "";
      const isPublic = PUBLIC_ENDPOINTS.some((p) => url.includes(p));

      const type: TokenType = isControllerEndpoint(url)
        ? "controller"
        : "organizer";

      // ✅ Injecter les headers device (identifiant + infos)
      try {
        const deviceId = await getDeviceId();
        const deviceInfo = getDeviceInfoHeader();
        console.log(
          `[DEVICE] id=${deviceId ? deviceId.slice(0, 12) + "..." : "NULL"} | info_len=${deviceInfo?.length ?? 0}`,
        );
        if (config.headers) {
          config.headers["X-Device-Id"] = deviceId;
          config.headers["X-Device-Info"] = deviceInfo;
        }
      } catch (e) {
        console.error(`[DEVICE] ❌ Erreur injection headers :`, e);
      }

      const { access } = await getTokens(type);
      console.log(
        `[REQ] ${(config.method || "get").toUpperCase()} ${url} → type=${type}, hasToken=${!!access}, len=${access?.length ?? 0}`,
      );

      if (access && config.headers) {
        config.headers.Authorization = `Bearer ${access}`;
      } else if (!isPublic) {
        console.warn(`[REQ] ⚠️ Pas de token ${type} pour ${url}`);
      }
    } catch (e) {
      console.error("[REQ] Erreur lecture token:", e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================
const AUTH_ENDPOINTS_SKIP_REFRESH = [
  "/accounts/login/",
  "/accounts/register/",
  "/accounts/token/refresh/",
  "/controles/login/",
];

client.interceptors.response.use(
  (response) => {
    console.log(
      `[RES OK] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
    );
    // ✅ Log temporaire du body pour les endpoints critiques
    const url = response.config.url || "";
    if (url.includes("/accounts/sessions/")) {
      console.log(`[RES BODY] sessions →`, JSON.stringify(response.data));
    }
    return response;
  },

  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    console.log(
      `[RES ERR] ${status} ${originalRequest?.method?.toUpperCase()} ${url}`,
    );
    if (error.response?.data) {
      console.log(`[RES ERR] body:`, error.response.data);
    }

    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (AUTH_ENDPOINTS_SKIP_REFRESH.some((p) => url.includes(p))) {
      console.log(`[REFRESH] Skip pour endpoint auth: ${url}`);
      return Promise.reject(error);
    }

    if (status !== 401) {
      return Promise.reject(error);
    }

    const type: TokenType = isControllerEndpoint(url)
      ? "controller"
      : "organizer";

    const state = refreshState[type];

    if (state.isRefreshing) {
      console.log(`[REFRESH] ${type} → en queue (déjà en cours)`);
      return new Promise((resolve, reject) => {
        state.queue.push((token) => {
          if (!token) return reject(error);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(client(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    state.isRefreshing = true;

    try {
      const { refresh } = await getTokens(type);
      console.log(
        `[REFRESH] type=${type}, hasRefresh=${!!refresh}, len=${refresh?.length ?? 0}`,
      );

      if (!refresh) {
        console.log(`[REFRESH] ❌ Pas de refresh token pour ${type}`);
        state.isRefreshing = false;
        flushQueue(type, null);
        await forceLogout(type);
        throw error;
      }

      const refreshRes = await axios.post(
        `${API_BASE_URL}/accounts/token/refresh/`,
        { refresh },
        {
          timeout: 15000,
          headers: { "X-Client-Channel": "mobile" },
        },
      );

      const newToken = refreshRes.data.access;
      const newRefresh = refreshRes.data.refresh;

      console.log(
        `[REFRESH] ✅ type=${type} → hasNewAccess=${!!newToken}, hasNewRefresh=${!!newRefresh}`,
      );

      if (!newToken) throw new Error("Pas de nouveau token");

      await setAccessToken(type, newToken);
      if (newRefresh) await setRefreshToken(type, newRefresh);

      state.isRefreshing = false;
      flushQueue(type, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return client(originalRequest);
    } catch (refreshError: any) {
      console.log(
        `[REFRESH] ❌ type=${type} → status=${refreshError?.response?.status}`,
      );
      if (refreshError?.response?.data) {
        console.log(`[REFRESH] ❌ body:`, refreshError.response.data);
      }
      state.isRefreshing = false;
      flushQueue(type, null);
      await forceLogout(type);
      return Promise.reject(refreshError);
    }
  },
);

export const resetAuthRedirectFlag = () => {
  // no-op
};

export default client;
