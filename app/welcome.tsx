// app/welcome.tsx
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import {
    colors,
    fontSize,
    fontWeight,
    radius,
    spacing,
} from "../src/theme/tokens";

const ALREADY_LAUNCHED_KEY = "@alreadyLaunched";

export default function WelcomeScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;

  // ─── Animation d'entrée ───
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ─── Au montage : vérifier si l'app a déjà été lancée ───
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        await AsyncStorage.getItem(ALREADY_LAUNCHED_KEY);
      } catch (e) {
        console.error("Erreur AsyncStorage:", e);
      } finally {
        setChecking(false);
      }
    };
    checkFirstLaunch();
  }, []);

  // ─── Bouton Commencer ───
  const handleStart = async () => {
    try {
      const alreadyLaunched = await AsyncStorage.getItem(ALREADY_LAUNCHED_KEY);

      if (!alreadyLaunched) {
        // Premier lancement → onboarding
        await AsyncStorage.setItem(ALREADY_LAUNCHED_KEY, "true");
        router.replace("/onboarding");
      } else {
        // Déjà lancé → choose
        router.replace("/choose");
      }
    } catch (e) {
      console.error("Erreur handleStart:", e);
      router.replace("/choose");
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        {/* Logo + Branding */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Image
              source={require("../assets/images/logo3.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.brandTitle}>
            Event <Text style={styles.brandTitleAccent}>Plan</Text>
          </Text>
          <Text style={styles.brandTagline}>Contrôlez vos événements</Text>
        </Animated.View>

        {/* Bas de page : bouton + footer */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleStart}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaText}>Commencer</Text>
            <Feather name="arrow-right" size={18} color={colors.textInverse} />
          </TouchableOpacity>

          <View style={styles.footer}>
            <Feather name="shield" size={12} color={colors.textMuted} />
            <Text style={styles.footerText}>
              Version 1.0.0 · © 2026 Event Plan
            </Text>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    justifyContent: "space-between",
  },

  // ─── Hero ───
  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: radius.xxl,
    backgroundColor: colors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logo: {
    width: 110,
    height: 110,
  },
  brandTitle: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.extrabold,
    color: colors.text,
    letterSpacing: -1,
    textAlign: "center",
  },
  brandTitleAccent: {
    color: colors.primary,
  },
  brandTagline: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
    fontWeight: fontWeight.medium,
  },

  // ─── Bas ───
  bottomSection: {
    gap: spacing.lg,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  ctaText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
});
