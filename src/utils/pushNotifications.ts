// src/utils/pushNotifications.ts
import Constants from "expo-constants";
import * as Device from "expo-device";

// ⚠️ On ne fait plus confiance à appOwnership (déprécié SDK 54).
// On essaie juste de charger le module dynamiquement : s'il n'existe
// pas (Expo Go Android), le require échoue et on renvoie null.

let NotificationsModule: any = null;
let moduleLoadAttempted = false;

function loadNotificationsModule() {
  if (moduleLoadAttempted) return NotificationsModule;
  moduleLoadAttempted = true;

  try {
    const Notifs = require("expo-notifications");
    Notifs.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    NotificationsModule = Notifs;
    console.log("[Push] ✅ expo-notifications chargé");
  } catch (e: any) {
    console.warn(
      "[Push] expo-notifications indisponible (Expo Go Android ?):",
      e?.message || e,
    );
    NotificationsModule = null;
  }
  return NotificationsModule;
}

export function getNotifications() {
  return loadNotificationsModule();
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  console.log("[Push] Début enregistrement token...");

  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    console.warn("[Push] Module indisponible, abandon.");
    return null;
  }

  if (!Device.isDevice) {
    console.warn("[Push] Pas un appareil physique.");
    return null;
  }

  const { Platform } = require("react-native");

  // Dans pushNotifications.ts, remplace le bloc du canal Android par :
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Notifications Event Plan",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4F46E5",
      // sound: "default",  ← retire ou commente cette ligne
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log("[Push] Permission actuelle:", existingStatus);

  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log("[Push] Nouvelle permission:", status);
  }

  if (finalStatus !== "granted") {
    console.warn("[Push] Permission refusée.");
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    console.log("[Push] projectId:", projectId);

    if (!projectId) {
      console.warn("[Push] projectId manquant.");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("[Push] ✅ Token obtenu:", tokenData.data.slice(0, 40) + "...");
    return tokenData.data;
  } catch (err: any) {
    console.warn("[Push] getExpoPushTokenAsync échec:", err?.message || err);
    return null;
  }
}
