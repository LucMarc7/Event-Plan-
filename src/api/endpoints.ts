// src/api/endpoints.ts
// ⚠️ SOURCE DE VÉRITÉ — aligné sur le backend Django (vérifié le 07/10/2026)
//    Test navigateur : /events/api/<resource>/<uuid>/ → 401 (existe)
//                      /events/<uuid>/                → 404 (n'existe PAS)

export const ENDPOINTS = {
  // ─── Auth Organizer ──────────────────────────────────────────
  auth: {
    login: "/accounts/login/",
    register: "/accounts/register/",
    logout: "/accounts/logout/",
    refresh: "/accounts/token/refresh/",
    profile: "/accounts/profile/",
    profileMe: "/accounts/profile/me/", // ✅ confirmé users/urls.py:13
    updateProfile: "/accounts/update/profile/", // ✅ confirmé users/urls.py:12
    avatar: "/accounts/profile/avatar/",
    changePassword: "/accounts/change_password/",
    forgotPassword: "/accounts/forgot_password/", // ✅ confirmé users/urls.py:17
    resetPassword: (uid: string, token: string) =>
      `/accounts/reset-password/${uid}/${token}/`, // ✅ confirmé users/urls.py:18
  },

  // ─── Events ──────────────────────────────────────────────────
  events: {
    // Liste unifiée (tous types confondus)
    list: "/events/",
    // Détail unifié — ⚠️ À TESTER (le contrat dit /events/<uuid>/)
    detail: (id: string) => `/events/${id}/`,
    // Création
    create: "/events/create/",
    // Upload image
    uploadImage: (eventId: string) => `/events/api/ajout/image/${eventId}/`,
    // Stats
    sellerStats: "/events/seller/stats/",
    sellerMe: "/events/seller/me/", // ✅ confirmé events/urls.py:25

    // ─── Contrôleurs ─────────────────────────────────────────
    controllersList: (eventId: string) => `/events/${eventId}/controllers/`,
    controllersCreate: (eventId: string) => `/events/${eventId}/controllers/`,
    controllerDetail: (eventId: string, userId: number) =>
      `/events/${eventId}/controllers/${userId}/`,
    controllersReport: (eventId: string) =>
      `/events/${eventId}/controllers/report/`,
    // ✅ NOUVEAU — Rapport détaillé d'un contrôleur
    controllerReport: (eventId: string, userId: number) =>
      `/events/${eventId}/controllers/${userId}/report/`,
    // ✅ NOUVEAU — Limite de contrôleurs
    controllersMax: (eventId: string) => `/events/${eventId}/controllers/max/`,

    // ─── LEGACY (endpoints par catégorie) ──────────────────────
    // ⚠️ NE PAS SUPPRIMER — le backend les utilise encore.
    legacyMariage: (id: string) => `/events/api/mariages/${id}/`,
    legacyBirthday: (id: string) => `/events/api/birthdays/${id}/`,
    legacyConcert: (id: string) => `/events/api/concerts/${id}/`,
    legacyConference: (id: string) => `/events/api/events/${id}/`,
  },

  // ─── Invitations (organizer) ──────────────────────────────────
  invitations: {
    listByEvent: (eventId: string) =>
      `/invitations/api/invitations_list/${eventId}/`,
    create: (eventId: string) =>
      `/invitations/api/create_invitation/${eventId}/`,
    retrieve: (invitationId: string) =>
      `/invitations/api/retrieve_invitation/${invitationId}/`,
    update: (invitationId: string) =>
      `/invitations/api/update_invitation/${invitationId}/`,
    delete: (invitationId: string) =>
      `/invitations/api/delete_invitation/${invitationId}/`,
  },

  // ─── Contrôleur (mobile only) ────────────────────────────────
  controles: {
    checkCredentials: "/controles/check-credentials/",
    login: "/controles/login/",
    me: "/controles/me/",
    invitations: "/controles/invitations/",
    validate: "/controles/validate/",
  },

  // ─── Payments ─────────────────────────────────────────────────
  payments: {
    initiate: "/payments/api/payments/initiate/",
    serdipayStatus: (sessionId: string) =>
      `/payments/api/payments/serdipay/status/${sessionId}/`,
    serdipayCallback: "/payments/api/payments/serdipay/callback/",
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────
export const isControllerEndpoint = (url: string): boolean => {
  return url.startsWith("/controles/");
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  REFRESH_TOKEN: "refresh",
  AUTH_USER: "auths",
  CONTROLLER_TOKEN: "controllerToken",
  CONTROLLER_REFRESH: "controllerRefresh",
  CONTROLLER_EVENT: "controllerEvent",
} as const;
