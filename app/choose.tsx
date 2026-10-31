// app/choose.tsx
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../src/stores/auth.store";
import {
  colors,
  fontSize,
  fontWeight,
  layout,
  radius,
  spacing,
} from "../src/theme/tokens";

// ─── Helpers JWT ───
const decodeBase64Url = (str: string): string => {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    return typeof atob === "function" ? atob(base64) : "";
  } catch {
    return "";
  }
};

const isJwtExpired = (token: string | null | undefined): boolean => {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

// ✅ Lit un token depuis SecureStore puis AsyncStorage (fallback)
const readToken = async (secureKey: string, asyncKey?: string) => {
  try {
    const secureVal = await SecureStore.getItemAsync(secureKey);
    if (secureVal) return secureVal;
    if (asyncKey) {
      const asyncVal = await AsyncStorage.getItem(asyncKey);
      if (asyncVal) return asyncVal;
    }
  } catch {}
  return null;
};

// ✅ Nettoie tous les tokens orphelins d'un organisateur
const cleanupOrganizerTokens = async () => {
  await Promise.allSettled([
    SecureStore.deleteItemAsync("authToken").catch(() => {}),
    SecureStore.deleteItemAsync("refresh").catch(() => {}),
    SecureStore.deleteItemAsync("authUser").catch(() => {}),
  ]);
  await AsyncStorage.multiRemove([
    "authToken",
    "refresh",
    "auths",
    "authUser",
  ]).catch(() => {});
};

// ✅ Vérifie le REFRESH token + cohérence avec le store Zustand
const hasValidOrganizerSession = async (): Promise<boolean> => {
  const refresh = await readToken("refresh", "refresh");
  if (!refresh || isJwtExpired(refresh)) return false;

  try {
    const state = useAuthStore.getState();
    if (!state?.token && !state?.user) {
      console.log("[CHOOSE] ⚠️ Store vide mais refresh présent → nettoyage");
      await cleanupOrganizerTokens();
      return false;
    }
  } catch (e) {
    console.warn("[CHOOSE] Impossible de lire le store:", e);
  }
  return true;
};

const hasValidControllerSession = async (): Promise<boolean> => {
  const refresh = await readToken("controllerRefresh");
  return !!refresh && !isJwtExpired(refresh);
};

export default function ChooseProfile() {
  const router = useRouter();
  const [loadingRole, setLoadingRole] = useState<
    "organisateur" | "controleur" | null
  >(null);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  // ─── Animation d'entrée ───
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ AUCUN auto-redirect — l'utilisateur choisit toujours son rôle

  // ─── Sélection rôle ───
  const handleRoleSelect = async (role: "organisateur" | "controleur") => {
    setLoadingRole(role);
    try {
      await AsyncStorage.setItem("userRole", role);

      if (role === "organisateur") {
        const valid = await hasValidOrganizerSession();
        console.log(`[CHOOSE] Organisateur → session valide ? ${valid}`);
        if (valid) {
          router.replace("/(main)/home");
        } else {
          router.push("/(auth)/login");
        }
      } else {
        const valid = await hasValidControllerSession();
        console.log(`[CHOOSE] Contrôleur → session valide ? ${valid}`);
        if (valid) router.replace("/(controller)");
        else router.push("/(controller)/login");
      }
    } catch (e) {
      console.error("[CHOOSE] Erreur sélection rôle:", e);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.logoWrapper,
            { opacity: fadeAnim, transform: [{ scale: fadeAnim }] },
          ]}
        >
          <Image
            source={require("../assets/images/logo3.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.headerBlock,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.title}>Choisissez votre rôle</Text>
          <Text style={styles.subtitle}>
            Sélectionnez comment vous souhaitez utiliser Event Plan
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.cardsWrapper,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <RoleCard
            icon="briefcase"
            title="Organisateur"
            description="Créez et gérez vos événements"
            color={colors.primary}
            colorSoft={colors.primarySoft}
            loading={loadingRole === "organisateur"}
            disabled={loadingRole !== null}
            onPress={() => handleRoleSelect("organisateur")}
          />
          <RoleCard
            icon="shield"
            title="Contrôleur"
            description="Scannez et validez les invitations"
            color={colors.success}
            colorSoft={colors.successSoft}
            loading={loadingRole === "controleur"}
            disabled={loadingRole !== null}
            onPress={() => handleRoleSelect("controleur")}
          />
        </Animated.View>

        <View style={styles.footer}>
          <Feather name="shield" size={12} color={colors.textMuted} />
          <Text style={styles.footerText}>Vos données sont sécurisées</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
const RoleCard: React.FC<{
  icon: any;
  title: string;
  description: string;
  color: string;
  colorSoft: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}> = ({
  icon,
  title,
  description,
  color,
  colorSoft,
  loading,
  disabled,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.roleCard, disabled && { opacity: 0.6 }]}
    onPress={onPress}
    activeOpacity={0.85}
    disabled={disabled}
  >
    <View style={[styles.roleIcon, { backgroundColor: colorSoft }]}>
      <Feather name={icon} size={22} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.roleTitle}>{title}</Text>
      <Text style={styles.roleDescription}>{description}</Text>
    </View>
    {loading ? (
      <ActivityIndicator size="small" color={color} />
    ) : (
      <View style={[styles.arrowBox, { backgroundColor: colorSoft }]}>
        <Feather name="arrow-right" size={18} color={color} />
      </View>
    )}
  </TouchableOpacity>
);

// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: {
    flex: 1,
    paddingHorizontal: layout.horizontalPadding,
    justifyContent: "center",
  },
  logoWrapper: { alignItems: "center", marginBottom: spacing.xl },
  logo: { width: 130, height: 130 },
  headerBlock: { alignItems: "center", marginBottom: spacing.xxl },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: fontSize.sm * 1.6,
    paddingHorizontal: spacing.base,
  },
  cardsWrapper: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    gap: spacing.md,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  roleTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.4,
  },
  arrowBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.xxl,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
});
