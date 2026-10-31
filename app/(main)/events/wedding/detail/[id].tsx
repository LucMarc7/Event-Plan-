// app/(main)/events/wedding/detail/[id].tsx
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import EventDetail from "../../../../../src/components/events/EventDetail";

export default function WeddingDetailScreen() {
  // Récupération de l'ID depuis les paramètres de la route
  const { id } = useLocalSearchParams<{ id: string }>();

  // Si l'ID est manquant, afficher un message d'erreur
  if (!id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>ID d'événement manquant</Text>
      </View>
    );
  }

  // Rendu du composant EventDetail avec l'ID
  return <EventDetail id={id} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "500",
    textAlign: "center",
  },
});
