// app/initialCheck.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../src/theme/tokens";
import { getOrganizerSession } from "../src/utils/auth";

export default function InitialCheck() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        // 1. Vérifier si l'app a déjà été lancée
        const alreadyLaunched = await AsyncStorage.getItem("@alreadyLaunched");

        // 2. Session organizer valide ?
        const session = await getOrganizerSession();

        if (session) {
          setTarget("/(main)/home");
        } else if (!alreadyLaunched) {
          await AsyncStorage.setItem("@alreadyLaunched", "true");
          setTarget("/onboarding");
        } else {
          setTarget("/choose");
        }
      } catch (e) {
        console.error("Erreur initialCheck:", e);
        setTarget("/choose");
      }
    };
    check();
  }, []);

  if (!target) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.surface,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={target as any} />;
}
