// src/hooks/useUserAvatar.ts
import { useEffect, useMemo, useState } from "react";
import { Image } from "react-native";
import { getUserAvatarUrl, getUserInitials } from "../../src/utils/userAvatar";
import { useAuthStore } from "../stores/auth.store";
export const useUserAvatar = () => {
  const user = useAuthStore((s) => s.user);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const initials = useMemo(() => getUserInitials(user), [user]);

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      const url = getUserAvatarUrl(user);
      if (!url) {
        if (!cancelled) {
          setImageUrl(null);
          setImageError(false);
        }
        return;
      }

      try {
        await Image.prefetch(url);
      } catch (e) {
        // Pas bloquant, on tente quand même l'affichage
      }

      if (!cancelled) {
        setImageUrl(url);
        setImageError(false);
      }
    };

    prepare();
    return () => {
      cancelled = true;
    };
  }, [
    user?.profile?.profile_image,
    user?.profile?.avatar,
    user?.profile?.image,
    user?.profile?.photo,
    user?.avatar,
    user?.image,
    user, // sécurité : si le user change complètement
  ]);

  return {
    user,
    imageUrl,
    initials,
    imageError,
    onImageError: () => setImageError(true),
  };
};
