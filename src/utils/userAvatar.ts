// src/utils/userAvatar.ts

const BASE_URL = "https://klmarc.pythonanywhere.com";

/**
 * Normalise une URL d'image (ajoute le BASE_URL si relatif).
 */
const normalizeUrl = (raw: string): string => {
  if (!raw) return raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("data:")) return raw;
  if (raw.startsWith("file://")) return raw;
  if (raw.startsWith("/")) return `${BASE_URL}${raw}`;
  return `${BASE_URL}/${raw}`;
};

/**
 * Extrait l'URL de l'avatar depuis un objet `user` quel que soit son format.
 * Cherche dans plusieurs clés et gère les objets imbriqués { url: "..." }.
 */
export const getUserAvatarUrl = (user: any): string | null => {
  if (!user) return null;

  const profile = user.profile || user.userprofile || user;

  const candidates: any[] = [
    profile?.profile_image,
    profile?.avatar,
    profile?.image,
    profile?.photo,
    profile?.picture,
    profile?.avatar_url,
    profile?.profile_image_url,
    user?.profile_image,
    user?.avatar,
    user?.image,
    user?.photo,
  ];

  for (const c of candidates) {
    // Cas 1 : chaîne directe
    if (typeof c === "string" && c.trim() !== "") {
      return normalizeUrl(c.trim());
    }
    // Cas 2 : objet imbriqué { url: "..." }
    if (c && typeof c === "object") {
      const nested =
        c.url || c.uri || c.src || c.path || c.image_url || c.avatar_url;
      if (typeof nested === "string" && nested.trim() !== "") {
        return normalizeUrl(nested.trim());
      }
    }
  }

  return null;
};

/**
 * Retourne les initiales (2 lettres max) du user.
 */
export const getUserInitials = (user: any, fallback: string = "?"): string => {
  const profile = user?.profile || user?.userprofile || user || {};
  const first = profile?.first_name || "";
  const last = profile?.last_name || "";
  const email = profile?.email || user?.email || "";
  const username = profile?.username || user?.username || "";

  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first[0].toUpperCase();
  if (last) return last[0].toUpperCase();
  if (username) return username[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return fallback;
};
