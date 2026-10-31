// src/utils/deviceInfo.ts
// Identifiant de device stable + infos matérielles pour les sessions

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "eventplan_device_id";

let cachedDeviceId: string | null = null;
let cachedDeviceInfo: DeviceInfo | null = null;

export interface DeviceInfo {
  brand: string;
  model: string;
  os: string;
  os_version: string;
  app_version: string;
}

// ─── UUID stable par installation ───
const generateUuid = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) return cachedDeviceId;

  try {
    const fromSecure = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (fromSecure) {
      cachedDeviceId = fromSecure;
      return fromSecure;
    }
  } catch {}

  try {
    const fromAsync = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (fromAsync) {
      cachedDeviceId = fromAsync;
      SecureStore.setItemAsync(DEVICE_ID_KEY, fromAsync).catch(() => {});
      return fromAsync;
    }
  } catch {}

  const fresh = generateUuid();
  cachedDeviceId = fresh;
  await Promise.all([
    SecureStore.setItemAsync(DEVICE_ID_KEY, fresh).catch(() => {}),
    AsyncStorage.setItem(DEVICE_ID_KEY, fresh).catch(() => {}),
  ]);
  return fresh;
};

// ─── Détection OS PROPRE (fix bug expo-device Android) ───
// Sur Android, Device.osName renvoie parfois une chaine longue du type
// "samsung/c2sxx/c2s:13/TP1A.2206". On utilise Platform.OS qui est fiable.
const detectOs = (): string => {
  if (Platform.OS === "ios") return "iOS";
  if (Platform.OS === "android") return "Android";
  return Device.osName || "Unknown";
};

export const getDeviceInfo = (): DeviceInfo => {
  if (cachedDeviceInfo) return cachedDeviceInfo;

  const appVersion =
    Application.nativeApplicationVersion ||
    Application.nativeBuildVersion ||
    "1.0.0";

  cachedDeviceInfo = {
    brand: Device.brand || "Unknown",
    model: Device.modelName || Device.deviceName || "Unknown device",
    os: detectOs(),
    os_version: Device.osVersion || "Unknown",
    app_version: String(appVersion),
  };

  return cachedDeviceInfo;
};

export const getDeviceInfoHeader = (): string => {
  const info = getDeviceInfo();
  return JSON.stringify({
    brand: info.brand.slice(0, 60),
    model: info.model.slice(0, 80),
    os: info.os.slice(0, 30),
    os_version: info.os_version.slice(0, 30),
    app_version: info.app_version.slice(0, 20),
  });
};
