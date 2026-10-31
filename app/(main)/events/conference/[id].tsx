// app/(main)/events/conference/[id].tsx
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import EventDetail from "../../../../src/components/events/EventDetail";

export default function ConferenceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>ID d`événement manquant</Text>
      </View>
    );
  }

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
