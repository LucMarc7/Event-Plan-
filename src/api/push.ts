// src/api/push.ts
import api from "./client";

export interface RegisterPushTokenPayload {
  token: string;
  device_id?: string;
  platform?: "ios" | "android" | "web" | "test";
}

/**
 * POST /accounts/push-tokens/ — enregistre le token Expo pour le user connecté.
 * Le backend fait un update_or_create : pas de doublon possible.
 */
export const registerPushToken = async (
  payload: RegisterPushTokenPayload,
): Promise<{ success: boolean; created: boolean; token_id?: number }> => {
  const { data } = await api.post("/accounts/push-tokens/", payload);
  return data;
};

/**
 * DELETE /accounts/push-tokens/ — désactive le token (logout, device perdu).
 */
export const unregisterPushToken = async (token: string): Promise<void> => {
  try {
    await api.delete("/accounts/push-tokens/", { data: { token } });
  } catch {
    // silencieux : le token expirera de toute façon côté Expo
  }
};
