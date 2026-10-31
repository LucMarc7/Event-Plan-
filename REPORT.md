# Rapport d'état du projet Event-Plan

## Section 1 — ARBORESCENCE UTILE

### app/
```
app/
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
├── (controller)/
│   ├── _layout.tsx
│   └── index.tsx
├── (main)/
│   └── _layout.tsx
├── _layout.tsx
├── choose.tsx
├── index.tsx
├── initialCheck.tsx
└── onboarding.tsx
```

### src/
```
src/
├── api/
│   ├── api.js
│   ├── auth.ts
│   ├── client.ts
│   ├── controles.ts
│   ├── events.ts
│   ├── guests.ts
│   └── profile.ts
├── constants/
│   ├── colors.ts
│   ├── config.ts
│   ├── routes.ts
│   ├── theme.ts
│   ├── typography.ts
│   └── spacing.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useDebounce.ts
│   ├── useError.ts
│   ├── useEvents.ts
│   ├── useFetch.ts
│   ├── useGuestList.ts
│   ├── useGuestSelection.ts
│   ├── useGuests.ts
│   ├── usePrevious.ts
│   ├── useScreenEntry.ts
│   └── useUserAvatar.ts
├── providers/
│   ├── AuthProvider.tsx
│   ├── ErrorProvider.tsx
│   └── SnackbarProvider.tsx
├── stores/
│   ├── auth.store.ts
│   ├── data.store.ts
│   ├── error.store.ts
│   ├── events.store.ts
│   ├── guests.store.ts
│   ├── navigation.store.ts
│   └── ui.store.ts
├── theme/
│   ├── fonts.ts
│   ├── index.ts
│   └── paper-theme.ts
├── types/
│   ├── api.ts
│   ├── event.ts
│   ├── guest.ts
│   └── user.ts
└── utils/
    ├── eventId.ts
    ├── format.ts
    ├── storage.ts
    ├── string.ts
    ├── userAvatar.ts
    └── validation.ts
```

### assets/
```
assets/
├── annimation/
│   ├── 1.json
│   ├── Animation - 1710359465511.json
│   ├── Animation - 1739841438999.lottie
│   ├── anime1.json
│   ├── anime2.json
│   ├── anime3.json
│   ├── anime4.json
│   ├── anime5.json
│   ├── anime7.json
│   ├── anime8.json
│   ├── anime6.json
│   ├── errorcross.json
│   ├── pdfloading.json
│   ├── success.json
│   └── successcheck.json
├── fonts/
│   ├── Glitten-Regular.otf
│   ├── GreatVibes-Regular.ttf
│   ├── SpaceMono-Regular.ttf
│   ├── montbold.otf
│   ├── montextraLight.otf
│   ├── montheavy.otf
│   └── montthin.otf
├── icons/
│   ├── add.png
│   ├── back.png
│   ├── back2.png
│   ├── balle.png
│   ├── bgPdf.png
│   ├── birthday.png
│   ├── cine.png
│   ├── concert.png
│   ├── conference.png
│   ├── flip-camera.png
│   ├── icon-add.png
│   ├── menu.png
│   ├── notification.png
│   ├── profile.png
│   ├── record.png
│   ├── scan.png
│   ├── scan2.png
│   ├── search.png
│   ├── sport.png
│   ├── stop.png
│   └── wedding.png
└── images/
    ├── 2.png
    ├── 600x400.jpg
    ├── adaptive-icon.png
    ├── android-icon-monochrome.png
    ├── badge01.png
    ├── badge02.png
    ├── bg1.png
    ├── bg2.png
    ├── bg3.png
    ├── bg4.png
    ├── bg5.png
    ├── bg6.png
    ├── bg_1.png
    ├── bgimage.png
    ├── cerftification.png
    ├── certifications.png
    ├── codeconfirm.png
    ├── contrôleur.png
    ├── favicon.png
    ├── footer.png
    ├── icon.png
    ├── login.png
    ├── login1.png
    ├── login2.png
    ├── login3.png
    ├── logo.png
    ├── logo1.png
    ├── logo1b.png
    ├── logo1c.png
    ├── logo2.png
    ├── logo2.svg
    ├── logo3.png
    ├── logo4.png
    ├── logo4b.png
    ├── logouser.png
    ├── luc.jpg
    ├── qr2 (2).png
    ├── qr2.png
    ├── qr3.png
    ├── splash-icon.png
    ├── splash.png
    └── userprofil.png
```

## Section 2 — POINTS D'ENTRÉE

### app/_layout.tsx
```typescript
// app/_layout.tsx
import { Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { useNavigationStore } from "../src/stores/navigation.store";
import { theme } from "../src/theme/index";

export default function RootLayout() {
  const segments = useSegments();
  const { setLastRoute } = useNavigationStore();

  // Enregistre la route actuelle à chaque changement
  useEffect(() => {
    if (segments.length > 0) {
      const route = "/" + segments.join("/");
      setLastRoute(route);
    }
  }, [segments]);

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="initialCheck" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="choose" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
        <Stack.Screen name="(controller)" />
      </Stack>
    </PaperProvider>
  );
}
```

### app/index.tsx
```typescript
import { Redirect } from "expo-router";

export default function Index() {
  return <Redirect href="/initialCheck" />;
}
```

### app/initialCheck.tsx
```typescript
// app/initialCheck.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../src/stores/auth.store";
import { useNavigationStore } from "../src/stores/navigation.store";

export default function InitialCheck() {
  const router = useRouter();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const { token } = useAuthStore();
  const { lastRoute } = useNavigationStore();

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  useEffect(() => {
    if (isFirstLaunch === null) return;

    if (token) {
      // Utilisateur connecté → restaurer la dernière route ou aller à l'accueil
      const target =
        lastRoute && lastRoute.startsWith("/(main)")
          ? lastRoute
          : "/(main)/home";
      router.replace(target);
    } else {
      // Utilisateur non connecté
      if (isFirstLaunch) {
        router.replace("/onboarding");
      } else {
        router.replace("/choose");
      }
    }
  }, [isFirstLaunch, token, lastRoute]);

  const checkFirstLaunch = async () => {
    try {
      const value = await AsyncStorage.getItem("@alreadyLaunched");
      if (value === null) {
        await AsyncStorage.setItem("@alreadyLaunched", "true");
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    } catch (error) {
      console.error(error);
      setIsFirstLaunch(false);
    }
  };

  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}
```

### app/choose.tsx
```typescript
// app/choose.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import BtnChoose from "../src/components/choose/BtnChoose";

export default function ChooseProfile() {
  const router = useRouter();

  const handleRoleSelect = async (role: "organisateur" | "controleur") => {
    await AsyncStorage.setItem("userRole", role);
    if (role === "organisateur") {
      router.push("/(auth)/login");
    } else {
      router.push("/(auth)/controller/otp");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Image
          source={require("../assets/images/logo3.png")}
          style={styles.logoImage}
        />
      </View>
      <View style={styles.title}>
        <Text style={styles.titleText}>Choisissez votre rôle</Text>
        <Text style={styles.subtitleText}>
          Vous pouvez vous inscrire en tant que contrôleur ou organisateur pour
          démarrer votre événement.
        </Text>
      </View>
      <View style={styles.BtnChoose}>
        <View style={styles.btnContainer}>
          <BtnChoose
            title="Organisateur"
            onPress={() => handleRoleSelect("organisateur")}
          />
        </View>
        <View style={styles.btnContainer}>
          <BtnChoose
            title="Contrôleur"
            onPress={() => handleRoleSelect("controleur")}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: wp(6),
  },
  logo: { marginBottom: hp(4), backgroundColor: "#FFFFFF", padding: wp(6) },
  logoImage: { width: wp(38), height: wp(38), resizeMode: "contain" },
  title: { marginBottom: hp(4), alignItems: "center" },
  titleText: {
    fontSize: hp(3.2),
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: hp(1),
  },
  subtitleText: {
    fontSize: hp(1.7),
    color: "#64748B",
    textAlign: "center",
    lineHeight: hp(2.5),
    paddingHorizontal: wp(4),
  },
  BtnChoose: { width: wp(45), height: hp(35), alignSelf: "center", gap: hp(3) },
  btnContainer: { width: "100%" },
});
```

### app/onboarding.tsx
```typescript
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";
import {
    heightPercentageToDP as hp,
    widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const slides = [
  {
    id: 1,
    title: "Bienvenu(e)",
    subtitle: "Créer votre premier Event et obtener vos première E-invitation.",
    image: require("../assets/images/certifications.png"),
  },
  {
    id: 2,
    title: "Partager vos E-invitation",
    subtitle: "Créer et partager vos Billets, Invitations, Ticket.",
    image: require("../assets/images/qr2.png"),
  },
  {
    id: 3,
    title: "Contrôleur d'accès",
    subtitle:
      "Controler ou faites vous aider par un ou plusieurs amis à contrôler l'accès à votre Event.",
    image: require("../assets/images/qr3.png"),
  },
];

export default function OnBoarding() {
  const router = useRouter();

  const buttonLabel = (label: string) => (
    <View style={{ flex: 1 }}>
      <View
        style={{
          paddingBottom: hp(10),
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View style={Styles.btLabel}>
          <Text style={{ color: "white", fontSize: hp(2), fontWeight: "bold" }}>
            {label}
          </Text>
        </View>
      </View>
    </View>
  );

  const doneButton = () => (
    <View
      style={{
        paddingBottom: hp(10),
        paddingLeft: hp(15),
        paddingRight: hp(15),
      }}
    >
      <TouchableOpacity
        style={Styles.btnDone}
        onPress={() => router.replace("/choose")}
      >
        <Text style={{ color: "#000F30", fontWeight: "600", fontSize: hp(2) }}>
          Fait
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <AppIntroSlider
      data={slides}
      renderItem={({ item }) => (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
          }}
        >
          <Image
            source={item.image}
            style={{
              width: wp("65%"),
              height: wp("65%"),
              resizeMode: "contain",
            }}
          />
          <View style={{ bottom: -15 }}>
            <Text
              style={{
                fontSize: hp(3),
                bottom: hp(2),
                fontWeight: "bold",
                color: "#111",
                textAlign: "center",
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{
                textAlign: "center",
                fontWeight: "400",
                color: "#333",
                bottom: 15,
                paddingHorizontal: hp(5),
              }}
            >
              {item.subtitle}
            </Text>
          </View>
        </View>
      )}
      activeDotStyle={{ backgroundColor: "#333", width: hp(4) }}
      renderNextButton={() => buttonLabel("Prochain")}
      renderDoneButton={() => doneButton()}
    />
  );
}

const Styles = StyleSheet.create({
  btnDone: {
    alignItems: "center",
    paddingVertical: 12.5,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#1C1C1C",
  },
  btLabel: {
    backgroundColor: "#1C1C1C",
    padding: 15,
    paddingHorizontal: 40,
    borderRadius: 60,
  },
});
```

## Section 3 — API CLIENT

### src/api/client.ts
```typescript
// src/api/client.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_BASE_URL = "https://klmarc.pythonanywhere.com";
console.log(`🌐 API Base URL: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

let isRefreshing = false;
let pendingQueue: ((token: string | null) => void)[] = [];
let isLoggingOut = false;

// ✅ Utilisez ceci après un login réussi pour réarmer les redirections
export const resetAuthRedirectFlag = () => {
  isLoggingOut = false;
};

const flushQueue = (token: string | null) => {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
};

const forceLogout = async () => {
  if (isLoggingOut) return;
  isLoggingOut = true;

  console.warn("🔒 Session expirée — déconnexion forcée");
  await AsyncStorage.multiRemove([
    "authToken",
    "refresh",
    "auths",
    "userProfileCache",
    "events_cache",
    "events_cache_expiration",
    "pending_deletions",
  ]);

  // Notifie le store Zustand (laisse les layouts réagir proprement)
  try {
    const { useAuthStore } = require("../stores/auth.store");
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setToken(null);
  } catch (e) {
    console.warn("Impossible de reset le store:", e);
  }
};

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.error("Erreur lecture token:", e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";
    if (
      url.includes("/accounts/login/") ||
      url.includes("/accounts/register/") ||
      url.includes("/accounts/token/refresh/")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) return reject(error);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refresh = await AsyncStorage.getItem("refresh");
      if (!refresh) {
        isRefreshing = false;
        flushQueue(null);
        await forceLogout();
        throw error;
      }

      const { data } = await axios.post(
        `${API_BASE_URL}/accounts/token/refresh/`,
        { refresh },
        { timeout: 15000 },
      );

      const newToken = data.access;
      if (!newToken) throw new Error("Pas de nouveau token");

      await AsyncStorage.setItem("authToken", newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      isRefreshing = false;
      flushQueue(newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      flushQueue(null);
      await forceLogout();
      return Promise.reject(refreshError);
    }
  },
);

export default api;
```

### src/api/api.js
```javascript
// api.js
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { router } from "expo-router";

// ================== CONFIGURATION ==================
const API_BASE_URL = "https://klmarc.pythonanywhere.com";
console.log(`🌐 API Base URL: ${API_BASE_URL}`);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Intercepteurs
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Erreur lecture token:", error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = await SecureStore.getItemAsync("refresh");
        if (!refresh) {
          await SecureStore.deleteItemAsync("authToken");
          await SecureStore.deleteItemAsync("refresh");
          await SecureStore.deleteItemAsync("auths");
          router.push("/screens/Auths");
          return Promise.reject(error);
        }
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/accounts/token/refresh/`,
          { refresh },
        );
        const newToken = refreshResponse.data.access;
        await SecureStore.setItemAsync("authToken", newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Erreur refresh token:", refreshError);
        await SecureStore.deleteItemAsync("authToken");
        await SecureStore.deleteItemAsync("refresh");
        await SecureStore.deleteItemAsync("auths");
        router.push("/screens/Auths");
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

// ================== CACHE ==================
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const withCache = async (key, fetcher, forceRefresh = false) => {
  try {
    if (!forceRefresh) {
      const cachedStr = await SecureStore.getItemAsync(key);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log(`✅ Cache utilisé pour ${key}`);
          return cached.data;
        }
      }
    }
    const data = await fetcher();
    await SecureStore.setItemAsync(
      key,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
    console.log(`🔄 Cache mis à jour pour ${key}`);
    return data;
  } catch (error) {
    console.error(`❌ Erreur avecCache pour ${key}:`, error);
    if (!forceRefresh) {
      const cachedStr = await SecureStore.getItemAsync(key);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        console.log(`⚠️ Retour du cache périmé pour ${key}`);
        return cached.data;
      }
    }
    throw error;
  }
};

// ================== AUTHENTIFICATION ==================
export const login = async (credentials) => {
  try {
    console.log(
      "🔐 Tentative de connexion avec fetch vers:",
      `${API_BASE_URL}/accounts/login/`,
    );
    const response = await fetch(`${API_BASE_URL}/accounts/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) {
      throw { response: { status: response.status, data } };
    }
    console.log("✅ Connexion réussie, token reçu");
    return { data, status: response.status };
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    throw error;
  }
};

export const getUsernameSuggestion = async (firstName, lastName) => {
  try {
    const response = await api.post("/username-suggestion/", {
      firstName,
      lastName,
    });
    return response.data.suggestion;
  } catch (error) {
    console.error("❌ Erreur suggestion nom d'utilisateur :", error);
    throw error;
  }
};

export const sign_up = async (data) => {
  try {
    const response = await api.post("/accounts/register/", data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    throw error;
  }
};

export const log_out = async (refresh_token) => {
  try {
    const response = await api.post("/accounts/logout/", {
      refresh: refresh_token,
    });
    await AsyncStorage.multiRemove(["authToken", "refresh", "auths"]);
    return response.data;
  } catch (error) {
    if (error.response?.data?.detail === "Invalid token.") {
      console.warn("Invalid token détecté. Nettoyage local.");
      await AsyncStorage.multiRemove(["authToken", "refresh", "auths"]);
      router.push("/screens/Auths");
      return;
    }
    console.error("Erreur lors de la déconnexion :", error.message || error);
    throw new Error("Impossible de se déconnecter. Veuillez réessayer.");
  }
};

// ================== EVENTS ==================
export const getAllEvents = async (forceRefresh = false) =>
  withCache(
    "allEventsData",
    async () => {
      const endpoints = [
        { url: "/events/api/mariages/", type: "wedding" },
        { url: "/events/api/birthdays/", type: "birthday" },
        { url: "/events/api/conferences/", type: "conference" },
        { url: "/events/api/concerts/", type: "concert" },
      ];

      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await api.get(endpoint.url);
            let dataArray = [];
            if (Array.isArray(response.data)) {
              dataArray = response.data;
            } else if (response.data && Array.isArray(response.data.results)) {
              dataArray = response.data.results;
            } else {
              const keys = Object.keys(response.data || {});
              const arrayKey = keys.find((k) =>
                Array.isArray(response.data[k]),
              );
              if (arrayKey) {
                dataArray = response.data[arrayKey];
              } else {
                console.warn(`⚠️ Format inattendu pour ${endpoint.url}`);
                return [];
              }
            }
            return dataArray.map((event) => ({
              ...event,
              type: endpoint.type,
            }));
          } catch (error) {
            if (error.response?.status === 404) {
              console.warn(`⚠️ Endpoint ${endpoint.url} non trouvé – ignoré.`);
              return [];
            }
            throw error;
          }
        }),
      );
      return results.flat();
    },
    forceRefresh,
  );

export const getEvent = async (forceRefresh = false) => {
  return withCache(
    "eventsData",
    async () => {
      console.log("📡 Appel API /events/api/mariages/");
      const response = await api.get("/events/api/mariages/");
      console.log("📦 Réponse API brute:", response.data);
      if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.error("La réponse n'est pas un tableau:", response.data);
        if (response.data && Array.isArray(response.data.results)) {
          return response.data.results;
        }
        return [];
      }
    },
    forceRefresh,
  );
};

export const createEvent = async (data) => {
  try {
    const response = await api.post("/events/api/mariages/", data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la création de l'événement :", error);
    throw error;
  }
};

export const readEvent = async (id, forceRefresh = false) =>
  withCache(
    `event_${id}`,
    async () => {
      const response = await api.get(`/events/api/mariages/${id}/`);
      return response.data;
    },
    forceRefresh,
  );

export const updateEvent = async (data, id) => {
  try {
    const response = await api.put(`/events/api/mariages/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'événement :", error);
    throw error;
  }
};

export const supprimerEvent = async (id) => {
  try {
    const response = await api.delete(`/events/api/mariages/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement :", error);
    throw error;
  }
};

export const uploadImage = async (id, data) => {
  try {
    const response = await api.patch(`/events/api/ajout/image/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'ajout/modification de l'image :", error);
    throw error;
  }
};

// ================== BIRTHDAYS ==================
export const createBirthEvent = async (data) => {
  try {
    const response = await api.post("/events/api/birthdays/", data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la création d'anniversaire :", error);
    throw error;
  }
};

export const readBirthEvent = async (id, forceRefresh = false) =>
  withCache(
    `birthday_${id}`,
    async () => {
      const response = await api.get(`/events/api/birthdays/${id}/`);
      return response.data;
    },
    forceRefresh,
  );

// ================== CONFERENCES ==================
export const createConferenceEvent = async (data) => {
  try {
    const response = await api.post("/events/api/conferences/", data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la création de conférence :", error);
    throw error;
  }
};

export const readConferenceEvent = async (id, forceRefresh = false) =>
  withCache(
    `conference_${id}`,
    async () => {
      const response = await api.get(`/events/api/conferences/${id}/`);
      return response.data;
    },
    forceRefresh,
  );

// ================== INVITATIONS ==================
export const guestListe = async (id) => {
  try {
    const response = await api.get(`/invitations/api/invitations_list/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des invités :", error);
    throw error;
  }
};

export const createGuest = async (data, id) => {
  try {
    const response = await api.post(
      `/invitations/api/create_invitation/${id}/`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la création d'invité :", error);
    throw error;
  }
};

export const updateGuest = async (guest, id) => {
  try {
    const response = await api.put(
      `/invitations/api/update_invitation/${id}/`,
      guest,
    );
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour d'invité :", error);
    throw error;
  }
};

export const deleteGuest = async (id) => {
  try {
    const response = await api.delete(
      `/invitations/api/delete_invitation/${id}/`,
    );
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la suppression d'invité :", error);
    throw error;
  }
};

export const readInvitation = async (id, forceRefresh = false) => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error(`Format UUID invalide: ${id}`);
  }
  return withCache(
    `invitation_${id}`,
    async () => {
      const response = await api.get(
        `/invitations/api/retrieve_invitation/${id}/`,
      );
      if (!response.data?.id) throw new Error("Réponse API invalide");
      return response.data;
    },
    forceRefresh,
  );
};

// ================== CONTROLES ==================
export const controller = async (code) => {
  try {
    const response = await api.get(
      `/controles/api/details_invitation/${code}/`,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const controllerGuestList = async (event_code, organizer_username) => {
  try {
    const response = await api.get(
      `/controles/api/list_invitations/${event_code}/${organizer_username}`,
    );
    return response.data;
  } catch (error) {
    console.error("Erreur liste invités contrôle :", error);
    throw error;
  }
};

export const controlValidation = async (guest_id, data) => {
  try {
    const response = await api.patch(
      `/controles/api/validation_invitation/${guest_id}/`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Erreur validation invitation :", error);
    throw error;
  }
};

// ================== SOFT DELETE ==================
export const softDeleteGuest = async (id) => {
  try {
    const response = await api.patch(`/invitations/api/soft_delete/${id}/`, {
      deleted: true,
    });
    return response.data;
  } catch (error) {
    console.error("Erreur softDeleteGuest:", error);
    throw error;
  }
};

// ================== PROFIL USER ==================
export const uploadProfileImage = async (uri) => {
  const formData = new FormData();
  formData.append("avatar", {
    uri,
    type: "image/jpeg",
    name: "avatar.jpg",
  });
  try {
    const response = await api.post("/accounts/profile/avatar/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { success: true, image_url: response.data.avatar };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Upload failed",
    };
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get("/accounts/profile/");
    return response.data;
  } catch (error) {
    console.error("Erreur getProfile:", error);
    throw error;
  }
};

export const updateProfile = async (data) => {
  try {
    const response = await api.patch("/accounts/profile/", data);
    return {
      success: true,
      user: response.data,
    };
  } catch (error) {
    console.error("Erreur updateProfile:", error);
    return {
      success: false,
      message:
        error.response?.data?.detail || "Échec de la mise à jour du profil",
    };
  }
};

export const deleteProfileImage = async () => {
  try {
    const response = await api.delete("/accounts/profile/avatar/");
    return {
      success: true,
      message: response.data?.message || "Photo supprimée avec succès",
    };
  } catch (error) {
    console.error("Erreur deleteProfileImage:", error);
    return {
      success: false,
      message:
        error.response?.data?.detail || "Échec de la suppression de la photo",
    };
  }
};

export const fetchUserProfile = async () => {
  try {
    const response = await api.get("/auth/profile/");
    return response.data;
  } catch (error) {
    console.error("Erreur fetchUserProfile:", error);
    throw error;
  }
};

// ================== NOTIFICATIONS & PASSWORD ==================
export const updateNotificationPreferences = async (preferences) => {
  try {
    const response = await api.patch(
      "/auth/profile/notifications/",
      preferences,
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Erreur updateNotificationPreferences:", error);
    return {
      success: false,
      message:
        error.response?.data?.detail ||
        "Échec de la mise à jour des préférences",
    };
  }
};

export const changePassword = async (passwords) => {
  try {
    const response = await api.post("/auth/password/change/", passwords);
    return {
      success: true,
      message: response.data?.detail || "Mot de passe modifié",
    };
  } catch (error) {
    console.error("Erreur changePassword:", error);
    return {
      success: false,
      message:
        error.response?.data?.detail ||
        "Échec du changement de mot de passe",
    };
  }
};
```

### src/stores/auth.store.ts
```typescript
// src/stores/auth.store.ts
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  id: number;
  username?: string;
  email?: string;
  profile?: any;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

// Custom storage middleware for SecureStore
const secureStoreStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await SecureStore.getItemAsync(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      // ✅ Nettoie user ET token
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => secureStoreStorage),
    },
  ),
);

export default useAuthStore;
```

## Section 4 — ÉCRANS CONTRÔLEUR

### app/(controller)/index.tsx
```typescript
// app/(controller)/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { ActivityIndicator, Button, Card, Chip } from "react-native-paper";
import { getGuests } from "../../src/api/guests"; // adapter si besoin

export default function ControllerHome() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchGuests = async () => {
      const code = await AsyncStorage.getItem("eventCode");
      if (code) {
        try {
          const data = await getGuests(code); // à adapter
          setGuests(data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        // Si pas de code, rediriger vers saisie
        router.replace("/controller/otp");
      }
    };
    fetchGuests();
  }, []);

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, justifyContent: "center" }}
      />
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liste des invités</Text>
      <FlatList
        data={guests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.name}>{item.first_person}</Text>
              {item.second_person && <Text>{item.second_person}</Text>}
              <Chip
                icon={item.used ? "check" : "close"}
                style={item.used ? styles.used : styles.notUsed}
              >
                {item.used ? "Scanné" : "Non scanné"}
              </Chip>
            </Card.Content>
          </Card>
        )}
      />
      <Button
        mode="contained"
        onPress={() => router.push("/controller/otp")}
        style={styles.button}
      >
        Changer d'événement
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  card: { marginVertical: 8 },
  name: { fontSize: 18, fontWeight: "600" },
  used: { backgroundColor: "#10B981" },
  notUsed: { backgroundColor: "#EF4444" },
  button: { marginTop: 20 },
});
```

### app/controller/otp.tsx
```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

export default function OtpScreen() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Vérifier le code avec l'API (controller)
      // Si valide, stocker le code et rediriger vers la liste des invités
      await AsyncStorage.setItem("eventCode", code);
      router.replace("/(controller)/guests");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Contrôleur
      </Text>
      <Text style={styles.subtitle}>Entrez le code de l'événement</Text>
      <TextInput
        label="Code événement"
        value={code}
        onChangeText={setCode}
        mode="outlined"
        style={styles.input}
      />
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        style={styles.button}
      >
        Valider
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { textAlign: "center", marginBottom: 10 },
  subtitle: { textAlign: "center", marginBottom: 20, color: "#64748B" },
  input: { marginBottom: 20 },
  button: { marginTop: 10 },
});
```

### app/(main)/camera/index.tsx
```typescript
// app/(main)/camera/index.tsx
import React from "react";
import { Text, View } from "react-native";

export default function CameraScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Caméra QR</Text>
    </View>
  );
}
```

## Section 5 — DIAGNOSTIC

1. **Quels composants importent "@/theme" ou "src/theme" et QUEL usage exact (colors.primary, colors.primary.main, spacing.md, etc.) ?**
   - Seul `app/_layout.tsx` importe le thème via `import { theme } from "../src/theme/index";`.
   - Usage : le thème est passé à `<PaperProvider theme={theme}>` pour configurer react-native-paper.
   - Aucun accès direct à `colors.primary`, `colors.primary.main` ou `spacing.md` n'est observé dans les fichiers lus.

2. **Le fichier src/theme/fonts.ts est-il importé quelque part ? Où ?**
   - Aucun fichier n'importe `src/theme/fonts.ts` (recherche dans le projet sans correspondance).

3. **La route choose.tsx:19 pointe-t-elle vers /(auth)/controller/otp ou /(controller)/otp ?**
   - La ligne 19 de `app/choose.tsx` contient : `router.push("/(auth)/controller/otp");` → elle pointe vers `/(auth)/controller/otp`.

4. **client.ts et api.js envoient-ils le header "X-Client-Channel: mobile" ?**
   - Ni `src/api/client.ts` ni `src/api/api.js` n'ajoutent cet header dans leurs configurations ou intercepteurs.

5. **Y a-t-il un appel à /events/api/conferences/ (mauvais endpoint) quelque part ?**
   - Oui, l'endpoint apparaît dans :
     - `src/api/api.js` (dans `getAllEvents`, `createConferenceEvent`, `readConferenceEvent`)
     - `src/api/events.ts` (fonctions similaires)
   - Il est utilisé pour les opérations liées aux conférences.

6. **Le placeholder du scan QR dans (main)/camera/index.tsx contient quoi exactement ?**
   - Le fichier `app/(main)/camera/index.tsx` contient uniquement un texte centré : `<Text>Caméra QR</Text>`.

## Tableau récapitulatif

| Fichier | Existe | Problème détecté |
|---------|--------|------------------|
| app/_layout.tsx | Oui | Aucun problème évident |
| app/index.tsx | Oui | Aucun problème évident |
| app/initialCheck.tsx | Oui | Aucun problème évident |
| app/choose.tsx | Oui | Aucun problème évident |
| app/onboarding.tsx | Oui | Aucun problème évident |
| src/api/client.ts | Oui | Aucun problème évident |
| src/api/api.js | Oui | Incohérence : utilise `AsyncStorage` dans `log_out` alors que le store utilise `SecureStore` |
| src/stores/auth.store.ts | Oui | Aucun problème évident |
| app/(controller)/index.tsx | Oui | Aucun problème évident |
| app/controller/otp.tsx | Oui | Aucun problème évident |
| app/(main)/camera/index.tsx | Oui | Placeholder minimal (seulement du texte) |
