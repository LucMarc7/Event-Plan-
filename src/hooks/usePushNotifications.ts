// src/hooks/usePushNotifications.ts
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { registerPushToken } from "../api/push";
import { useAuthStore } from "../stores/auth.store";
import {
    getNotifications,
    registerForPushNotificationsAsync,
} from "../utils/pushNotifications";

export function usePushNotifications() {
  const router = useRouter();
  const user = useAuthStore((s: any) => s.user);
  const accessToken = useAuthStore(
    (s: any) => s.accessToken ?? s.access ?? s.token ?? s.authToken,
  );

  useEffect(() => {
    // ============ DIAGNOSTIC ============
    const state = useAuthStore.getState();
    console.log("[DIAG] Store keys:", Object.keys(state).join(", "));
    console.log(
      "[DIAG] user?.username:",
      (state as any)?.user?.username || "AUCUN",
    );
    console.log("[DIAG] accessToken présent:", !!accessToken);

    (async () => {
      if (!user || !accessToken) {
        console.log("[Push] Skip — user ou token manquant");
        return;
      }

      try {
        const token = await registerForPushNotificationsAsync();
        if (!token) {
          console.log("[Push] Pas de token obtenu");
          return;
        }

        const { Platform } = require("react-native");
        const res = await registerPushToken({
          token,
          device_id: `${Platform.OS}-${user.id}`,
          platform: Platform.OS as "ios" | "android",
        });
        console.log("[Push] ✅ API register OK:", res);
      } catch (err: any) {
        console.warn(
          "[Push] ❌ Erreur API:",
          err?.response?.status,
          err?.response?.data || err?.message,
        );
      }
    })();

    // Listeners
    const Notifications = getNotifications();
    if (!Notifications) return;

    const notifListener = Notifications.addNotificationReceivedListener(
      (n: any) => console.log("[Push] Reçue:", n.request.content.title),
    );

    const respListener = Notifications.addNotificationResponseReceivedListener(
      (r: any) => {
        const data = r.notification.request.content.data as any;
        if (data?.type === "trash_expiring") {
          router.push("/(main)/trash");
        } else if (data?.event_id) {
          router.push({
            pathname: "/(main)/events/wedding/detail/[id]",
            params: { id: String(data.event_id) },
          } as any);
        }
      },
    );

    return () => {
      notifListener?.remove?.();
      respListener?.remove?.();
    };
  }, [router, user?.id, accessToken]);
}
