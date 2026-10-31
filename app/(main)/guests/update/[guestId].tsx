// app/(main)/guests/update/[guestId].tsx
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function GuestUpdateScreen() {
  const { guestId } = useLocalSearchParams();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Modification invité {guestId}</Text>
    </View>
  );
}
