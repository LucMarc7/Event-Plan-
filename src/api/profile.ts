// src/api/profile.ts
import api from "./client";
import { ENDPOINTS } from "./endpoints";

export const getProfile = async () => {
  const response = await api.get(ENDPOINTS.auth.profile);
  return response.data;
};

export const updateProfile = async (data: any) => {
  try {
    const response = await api.post(ENDPOINTS.auth.updateProfile, data);
    return { success: true, user: response.data };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.detail || "Échec de la mise à jour du profil",
    };
  }
};

export const uploadProfileImage = async (uri: string) => {
  const formData = new FormData();
  formData.append("avatar", {
    uri,
    type: "image/jpeg",
    name: "avatar.jpg",
  } as any);
  try {
    const response = await api.post(ENDPOINTS.auth.avatar, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, image_url: response.data.avatar };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || "Upload failed",
    };
  }
};

export const deleteProfileImage = async () => {
  try {
    const response = await api.delete(ENDPOINTS.auth.avatar);
    return {
      success: true,
      message: response.data?.message || "Photo supprimée",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.detail || "Échec de la suppression",
    };
  }
};

// ─── Changement de mot de passe (3 champs backend) ────────────
export const changePassword = async (payload: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}) => {
  try {
    const response = await api.post(ENDPOINTS.auth.changePassword, payload);
    return {
      success: true,
      message: response.data?.detail || "Mot de passe modifié",
    };
  } catch (error: any) {
    return {
      success: false,
      message:
        error.response?.data?.detail ||
        error.response?.data?.new_password?.[0] ||
        error.response?.data?.old_password?.[0] ||
        "Échec du changement de mot de passe",
    };
  }
};
