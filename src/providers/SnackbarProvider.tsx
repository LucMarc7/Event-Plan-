// src/providers/SnackbarProvider.tsx
import React from "react";
import { Snackbar } from "react-native-paper";
import { useUIStore } from "../../src/stores/ui.store";

export const SnackbarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { snackbarVisible, snackbarMessage, hideSnackbar } = useUIStore();

  return (
    <>
      {children}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={hideSnackbar}
        duration={3000}
        style={{ backgroundColor: "#1E293B" }}
      >
        {snackbarMessage}
      </Snackbar>
    </>
  );
};
