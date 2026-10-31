// src/api/sessions.ts
// Gestion des sessions actives (mobile organizer)

import api from "./client";

export interface UserSession {
  id: number;
  session_key: string;
  source: "web" | "mobile";
  display_name: string;
  device_brand: string | null;
  device_model: string | null;
  os_name: string | null;
  os_version: string | null;
  app_version: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  location: string | null;
  user_agent: string;
  is_active: boolean;
  is_current: boolean;
  last_activity: string;
  created_at: string;
}

export interface SessionsListResponse {
  count: number;
  sessions: UserSession[];
}

export const getSessions = async (): Promise<SessionsListResponse> => {
  const response = await api.get("/accounts/sessions/");
  return response.data;
};

export const revokeSession = async (sessionId: number): Promise<void> => {
  await api.delete(`/accounts/sessions/${sessionId}/`);
};
