// app/_layout.tsx
import { Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import "react-native-get-random-values";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { usePushNotifications } from "../src/hooks/usePushNotifications";
import { useNavigationStore } from "../src/stores/navigation.store";
import { paperTheme } from "../src/theme/paper-theme";

export default function RootLayout() {
  const segments = useSegments();
  const { setLastRoute } = useNavigationStore();

  // ✅ Notifications push globales
  usePushNotifications();

  useEffect(() => {
    if (segments.length > 0) {
      const route = "/" + segments.join("/");
      setLastRoute(route);
    }
  }, [segments]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: paperTheme.colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="initialCheck" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="choose" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" />
          <Stack.Screen name="(controller)" />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
