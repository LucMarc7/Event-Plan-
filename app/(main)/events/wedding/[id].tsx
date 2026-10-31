// app/(main)/events/wedding/detail/[id].tsx
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import EventDetail from "../../../../src/components/events/EventDetail";

export default function WeddingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <View style={styles.centered}>
        <Text>ID dévénement manquant</Text>
      </View>
    );
  }

  return <EventDetail id={id} />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});
