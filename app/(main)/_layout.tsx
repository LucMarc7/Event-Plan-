// app/(main)/_layout.tsx
import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "../../src/stores/auth.store";
import { paperTheme } from "../../src/theme/paper-theme";

export default function MainLayout() {
  const { token } = useAuthStore();

  // Dès que le token devient null, redirige instantanément
  if (!token) {
    return <Redirect href="/choose" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 250,
        gestureEnabled: false,
        contentStyle: { backgroundColor: paperTheme.colors.background },
      }}
    >
      {/* 🏠 Home = écran d'atterrissage → fondu doux */}
      <Stack.Screen name="home/index" options={{ animation: "fade" }} />

      {/* 📷 Caméra = action ponctuelle → monte du bas (effet modal) */}
      <Stack.Screen
        name="camera/index"
        options={{
          animation: "slide_from_bottom",
          animationDuration: 280,
        }}
      />

      {/* 👤 Profile = consultation → léger slide horizontal */}
      <Stack.Screen
        name="profile/index"
        options={{ animation: "slide_from_right" }}
      />

      {/* Les autres écrans (events, guests, controllers, category_event)
          héritent de l'animation slide_from_right par défaut */}
    </Stack>
  );
}
