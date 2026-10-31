// src/utils/eventId.ts

/**
 * Récupère l'identifiant canonique d'un événement.
 * Priorité :
 *   1. event.id (le plus fiable, c'est ce que `readEvent` attend)
 *   2. event.event_id
 *   3. event.pk
 *   4. event.uuid
 *   5. event.code_event / event.event_code (fallback)
 *
 * Retourne null si aucun champ valide n'est trouvé.
 */
export const getEventId = (event: any): string | null => {
  if (!event) return null;

  const rawId =
    event.id ??
    event.event_id ??
    event.pk ??
    event.uuid ??
    event.code_event ??
    event.event_code ??
    null;

  if (rawId === null || rawId === undefined) return null;

  const str = String(rawId).trim();
  if (!str || str === "undefined" || str === "null") return null;

  return str;
};
