// src/api/controles.ts
// ⚠️ CONTRÔLEUR uniquement — ne pas confondre avec src/api/controllers.ts (organisateur)

import * as SecureStore from "expo-secure-store";
import api from "./client";
import { ENDPOINTS, STORAGE_KEYS } from "./endpoints";

// ═══════════════════════════════════════════════════════════════
// ERROR CLASS — Rate limiting
// ═══════════════════════════════════════════════════════════════
export class RateLimitError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
export interface CheckCredentialsPayload {
  username: string;
  password: string;
}

export interface CheckCredentialsResponse {
  valid: boolean;
  user: { id: number; username: string; name: string };
}

export interface LoginControllerPayload {
  username: string;
  password: string;
  event_code: string;
}

export interface ControllerSession {
  access: string;
  refresh: string;
  user: { id: number; username: string; name: string };
  event: {
    id: string;
    name: string;
    event_code: string;
    date?: string;
    ville?: string;
    description?: string;
  };
}

export interface ControllerInvitation {
  id: string;
  first_person: string;
  second_person?: string;
  place?: string;
  invitation_type?: string;
  used: boolean;
  code_invit?: string;
}

export interface ControllerInvitationsResponse {
  event_id: string;
  total: number;
  invitations: ControllerInvitation[];
}

export interface ValidateQrPayload {
  qr_data: string | Record<string, any>;
}

export interface ValidateQrResponse {
  valid: boolean;
  status?: string;
  message?: string;
  guest_name?: string;
  second_person?: string;
  buyer_name?: string;
  category_name?: string;
  place?: string;
  event_name?: string;
  validated_at?: string;
  error?: string;
  other_event_name?: string;
}

// ═══════════════════════════════════════════════════════════════
// ÉTAPE 1 — Vérification des identifiants contrôleur
// POST /controles/check-credentials/
// ═══════════════════════════════════════════════════════════════
export const controllerCheckCredentials = async (
  payload: CheckCredentialsPayload,
): Promise<CheckCredentialsResponse> => {
  try {
    const response = await api.post(
      ENDPOINTS.controles.checkCredentials,
      payload,
    );
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 429) {
      const body = err.response.data || {};
      throw new RateLimitError(
        body.error || "Trop de tentatives. Réessayez dans une minute.",
        body.retry_after_seconds || 60,
      );
    }
    throw err;
  }
};

// ═══════════════════════════════════════════════════════════════
// ÉTAPE 2 — Connexion complète (identifiants + code event)
// POST /controles/login/
// ═══════════════════════════════════════════════════════════════
export const controllerLogin = async (
  payload: LoginControllerPayload,
): Promise<ControllerSession> => {
  try {
    const response = await api.post(ENDPOINTS.controles.login, payload);
    return response.data;
  } catch (err: any) {
    if (err?.response?.status === 429) {
      const body = err.response.data || {};
      throw new RateLimitError(
        body.error || "Trop de tentatives. Réessayez dans une minute.",
        body.retry_after_seconds || 60,
      );
    }
    throw err;
  }
};

// ═══════════════════════════════════════════════════════════════
// SESSION — Persistance locale (SecureStore)
// ═══════════════════════════════════════════════════════════════
export const saveControllerSession = async (
  data: ControllerSession,
): Promise<void> => {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.CONTROLLER_TOKEN, data.access),
    SecureStore.setItemAsync(STORAGE_KEYS.CONTROLLER_REFRESH, data.refresh),
    SecureStore.setItemAsync(
      STORAGE_KEYS.CONTROLLER_EVENT,
      JSON.stringify({ user: data.user, event: data.event }),
    ),
  ]);
};

export const getControllerSession = async (): Promise<{
  user: any;
  event: any;
} | null> => {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEYS.CONTROLLER_EVENT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearControllerSession = async (): Promise<void> => {
  await Promise.all([
    SecureStore.deleteItemAsync(STORAGE_KEYS.CONTROLLER_TOKEN).catch(() => {}),
    SecureStore.deleteItemAsync(STORAGE_KEYS.CONTROLLER_REFRESH).catch(
      () => {},
    ),
    SecureStore.deleteItemAsync(STORAGE_KEYS.CONTROLLER_EVENT).catch(() => {}),
  ]);
};

// ═══════════════════════════════════════════════════════════════
// LISTE DES INVITATIONS DU CONTRÔLEUR
// GET /controles/invitations/
// ═══════════════════════════════════════════════════════════════
export const controllerInvitations =
  async (): Promise<ControllerInvitationsResponse> => {
    const response = await api.get(ENDPOINTS.controles.invitations);
    return response.data;
  };

// ═══════════════════════════════════════════════════════════════
// VALIDATION D'UN QR CODE
// POST /controles/validate/
// ═══════════════════════════════════════════════════════════════
export const controllerValidate = async (
  payload: ValidateQrPayload,
): Promise<ValidateQrResponse> => {
  const response = await api.post(ENDPOINTS.controles.validate, payload);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// INFOS SESSION COURANTE
// GET /controles/me/
// ═══════════════════════════════════════════════════════════════
export const controllerMe = async () => {
  const response = await api.get(ENDPOINTS.controles.me);
  return response.data;
};
