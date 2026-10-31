import React, { useEffect } from "react";
import { getProfile } from "../api/profile";
import { useAuthStore } from "../stores/auth.store";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (!user) {
      getProfile()
        .then(setUser)
        .catch(() => {});
    }
  }, []);

  return <>{children}</>;
};
