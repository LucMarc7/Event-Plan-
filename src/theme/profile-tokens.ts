// src/theme/profile-tokens.ts
// Tokens spécifiques à l'interface Profil
// Complète tokens.ts sans le polluer.

export const profileGradients = {
  // Dégradé du bandeau (cover)
  cover: ["#4F46E5", "#7C3AED", "#EC4899"] as const,
  // Dégradés de secours pour l'avatar (si pas de photo)
  avatar: [
    ["#4F46E5", "#818CF8"],
    ["#F59E0B", "#FCD34D"],
    ["#10B981", "#6EE7B7"],
    ["#EF4444", "#FCA5A5"],
    ["#8B5CF6", "#C4B5FD"],
  ] as const,
};

export const profileStatus = {
  online: "#10B981",
  away: "#F59E0B",
  offline: "#94A3B8",
} as const;

export const profileBadges = {
  verified: "#3B82F6", // bleu Facebook/Instagram
  premium: "#F59E0B",
  vip: "#8B5CF6",
} as const;

export const profileLayout = {
  coverHeight: 150,
  avatarSize: 104,
  avatarOverlap: 52, // combien l'avatar dépasse du cover
  highlightSize: 64,
} as const;

export const HIGHLIGHTS = [
  { id: "events", icon: "calendar-outline", label: "Événements" },
  { id: "guests", icon: "people-outline", label: "Invités" },
  { id: "favorites", icon: "heart-outline", label: "Favoris" },
  { id: "share", icon: "share-social-outline", label: "Partager" },
] as const;
