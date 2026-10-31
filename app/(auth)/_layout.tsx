// app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  // ❌ Ne redirige JAMAIS automatiquement
  return <Stack screenOptions={{ headerShown: false }} />;
}
