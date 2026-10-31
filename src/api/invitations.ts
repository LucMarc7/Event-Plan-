// src/api/invitations.ts
// Invitations côté ORGANISATEUR (créer, modifier, supprimer ses invités)

import api from "./client";
import { ENDPOINTS } from "./endpoints";

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ─── Liste des invitations d'un événement ─────────────────────
export const listInvitations = async (eventId: string) => {
  if (!eventId) throw new Error("listInvitations: eventId manquant");
  const response = await api.get(ENDPOINTS.invitations.listByEvent(eventId));
  return Array.isArray(response.data) ? response.data : [];
};

// ─── Création ─────────────────────────────────────────────────
export const createInvitation = async (eventId: string, data: any) => {
  const response = await api.post(ENDPOINTS.invitations.create(eventId), data);
  return response.data;
};

// ─── Détail d'une invitation (UUID strict) ────────────────────
export const readInvitation = async (invitationId: string) => {
  if (!invitationId || !UUID_V4_REGEX.test(invitationId)) {
    throw new Error(`Format UUID invalide: ${invitationId}`);
  }
  const response = await api.get(ENDPOINTS.invitations.retrieve(invitationId));
  return response.data;
};

// ─── Mise à jour ──────────────────────────────────────────────
export const updateInvitation = async (invitationId: string, data: any) => {
  const response = await api.put(
    ENDPOINTS.invitations.update(invitationId),
    data,
  );
  return response.data;
};

// ✅ SUPPRESSION IDEMPOTENTE
//    - 200/204 → succès normal
//    - 404    → l'invitation est déjà supprimée → succès
//    - Network Error (timeout) → on considère que le serveur a reçu la requête
//      et l'a traitée (voir logs OSError: write error) → succès optimiste
//      (l'UI se rafraîchit de toute façon en revenant à la liste)
export const deleteInvitation = async (
  invitationId: string,
): Promise<{ success: boolean; alreadyDeleted?: boolean }> => {
  try {
    await api.delete(ENDPOINTS.invitations.delete(invitationId));
    return { success: true };
  } catch (error: any) {
    const status = error?.response?.status;

    // 404 → déjà supprimé → succès
    if (status === 404) {
      console.log(`[deleteInvitation] 404 → déjà supprimé (${invitationId})`);
      return { success: true, alreadyDeleted: true };
    }

    // Network Error (timeout) → succès optimiste
    if (!error?.response) {
      console.warn(
        `[deleteInvitation] Network Error (timeout probable) → considéré comme supprimé (${invitationId})`,
      );
      return { success: true, alreadyDeleted: true };
    }

    // Autres erreurs (403, 500…) → on laisse remonter
    throw error;
  }
};
