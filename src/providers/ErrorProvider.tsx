import React from "react";
import { GlobalError } from "../components/common/GlobalError";
import { useErrorStore } from "../stores/error.store";

export const ErrorProvider = ({ children }: { children: React.ReactNode }) => {
  const { error, visible, type, clearError } = useErrorStore();

  return (
    <>
      {children}
      <GlobalError
        error={error}
        visible={visible}
        type={type}
        onDismiss={clearError}
      />
    </>
  );
};
