import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
    Button,
    Dialog,
    Snackbar
} from "react-native-paper";
import { theme } from "../../theme";

interface GlobalErrorProps {
  error: string | null;
  visible: boolean;
  type: "snackbar" | "dialog" | "fullscreen";
  onDismiss: () => void;
}

export const GlobalError = ({
  error,
  visible,
  type,
  onDismiss,
}: GlobalErrorProps) => {
  if (!visible || !error) return null;

  if (type === "snackbar") {
    return (
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={5000}
        action={{
          label: "Fermer",
          onPress: onDismiss,
        }}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    );
  }

  if (type === "dialog") {
    return (
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>Erreur</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.dialogText}>{error}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>OK</Button>
        </Dialog.Actions>
      </Dialog>
    );
  }

  // Fullscreen error
  return (
    <View style={styles.fullscreen}>
      <Text style={styles.fullscreenTitle}>Oups !</Text>
      <Text style={styles.fullscreenMessage}>{error}</Text>
      <Button
        mode="contained"
        onPress={onDismiss}
        style={styles.fullscreenButton}
      >
        Réessayer
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    backgroundColor: theme.colors.error,
    marginBottom: 20,
  },
  dialog: {
    backgroundColor: "#fff",
  },
  dialogText: {
    fontSize: 16,
    color: "#333",
  },
  fullscreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  fullscreenTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  fullscreenMessage: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  fullscreenButton: {
    marginTop: 20,
  },
});
