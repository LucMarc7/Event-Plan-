// src/utils/string.ts

/**
 * Récupère les initiales d'un nom complet
 * Exemple : "John Doe" => "JD"
 */
export const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

/**
 * Tronque une chaîne à une longueur maximale
 */
export const truncate = (str: string, maxLength: number = 20): string => {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
};

/**
 * Met la première lettre en majuscule
 */
export const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
