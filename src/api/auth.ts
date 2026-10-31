// src/api/auth.ts
import * as SecureStore from "expo-secure-store";
import api, { resetAuthRedirectFlag } from "./client";
import { ENDPOINTS, STORAGE_KEYS } from "./endpoints";

export interface LoginCredentials {
  username: string;
  password: string;
}

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ✅ Via axios : l'intercepteur ajoute automatiquement
//    X-Device-Id et X-Device-Info (nécessaire pour créer la session
//    mobile côté backend)
// ═══════════════════════════════════════════════════════════════
export const login = async (credentials: LoginCredentials) => {
  const response = await api.post(ENDPOINTS.auth.login, credentials);
  resetAuthRedirectFlag();
  return { data: response.data, status: response.status };
};

// ═══════════════════════════════════════════════════════════════
// SUGGESTION DE USERNAME (depuis prénom + nom)
// ═══════════════════════════════════════════════════════════════
export const getUsernameSuggestion = async (
  firstName: string,
  lastName: string,
): Promise<string> => {
  try {
    const response = await api.post("/accounts/username-suggestion/", {
      firstName,
      lastName,
    });
    const data = response.data || {};
    return data.suggestion || data.username || "";
  } catch (error) {
    console.warn("⚠️ Erreur suggestion username :", error);
    const clean = (s: string) =>
      (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
    const f = clean(firstName);
    const l = clean(lastName);
    const rand = Math.random().toString(36).slice(2, 6);
    if (f && l) return `${f}_${l}_${rand}`;
    if (f) return `${f}_${rand}`;
    return `user_${rand}`;
  }
};

// ═══════════════════════════════════════════════════════════════
// VÉRIFIER LA DISPONIBILITÉ D'UN USERNAME
// ═══════════════════════════════════════════════════════════════
export interface UsernameAvailability {
  available: boolean;
  suggestion?: string;
  reason?: string;
}

export const checkUsernameAvailability = async (
  username: string,
): Promise<UsernameAvailability> => {
  try {
    const response = await api.post("/accounts/check-username/", {
      username: username.trim().toLowerCase(),
    });
    const data = response.data || {};
    return {
      available: data.available === true,
      suggestion: data.suggestion,
      reason: data.reason || data.detail || data.error,
    };
  } catch (error: any) {
    console.warn("⚠️ Erreur check username :", error);

    if (error?.response?.status === 404) {
      return { available: true };
    }

    if (error?.response?.data) {
      const data = error.response.data;
      return {
        available: data.available === true,
        suggestion: data.suggestion,
        reason: data.reason || data.detail || data.error,
      };
    }

    return { available: true };
  }
};

// ═══════════════════════════════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════════════════════════════
// ⚠️ Le backend renvoie maintenant :
//   { message, requires_verification: true, email }
// (le compte est créé INACTIF jusqu'à vérification par code email)
export const sign_up = async (userData: any) => {
  const response = await api.post(ENDPOINTS.auth.register, userData);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// VÉRIFICATION EMAIL (code à 6 chiffres)
// ═══════════════════════════════════════════════════════════════
export interface VerifyEmailResponse {
  message: string;
  user: any;
  access: string;
  refresh: string;
}

export const verifyEmail = async (
  email: string,
  code: string,
): Promise<VerifyEmailResponse> => {
  const response = await api.post("/accounts/verify-email/", {
    email: email.trim().toLowerCase(),
    code: code.trim(),
  });
  return response.data;
};

export const resendVerificationCode = async (email: string): Promise<void> => {
  await api.post("/accounts/resend-verification/", {
    email: email.trim().toLowerCase(),
  });
};

// ═══════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════
export const log_out = async (refreshToken: string) => {
  const cleanup = async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN).catch(() => {}),
      SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN).catch(() => {}),
      SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_USER).catch(() => {}),
    ]);
  };

  try {
    const response = await api.post(ENDPOINTS.auth.logout, {
      refresh: refreshToken,
    });
    await cleanup();
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail === "Invalid token.") {
      await cleanup();
      return;
    }
    throw new Error("Impossible de se déconnecter.");
  }
};

// ═══════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ═══════════════════════════════════════════════════════════════
export const forgotPassword = async (email: string): Promise<void> => {
  await api.post(ENDPOINTS.auth.forgotPassword, {
    email: email.trim().toLowerCase(),
  });
};

// ═══════════════════════════════════════════════════════════════
// RESET PASSWORD
// ═══════════════════════════════════════════════════════════════
export const resetPassword = async (
  uid: string,
  token: string,
  data: { new_password: string; confirm_password: string },
): Promise<void> => {
  await api.post(ENDPOINTS.auth.resetPassword(uid, token), data);
};

// ═══════════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════════
export const changePassword = async (data: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}) => {
  const response = await api.post(ENDPOINTS.auth.changePassword, data);
  return response.data;
};
