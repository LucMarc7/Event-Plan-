import { useErrorStore } from "../stores/error.store";

export const useError = () => {
  const { error, visible, type, setError, clearError } = useErrorStore();

  const showError = (
    message: string,
    type: "snackbar" | "dialog" | "fullscreen" = "snackbar",
  ) => {
    setError(message, type);
  };

  return { error, visible, type, showError, clearError };
};
