// app/(controller)/_layout.tsx
import { Stack } from "expo-router";

export default function ControllerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
    </Stack>
  );
}
