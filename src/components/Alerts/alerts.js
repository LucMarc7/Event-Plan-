// src/components/Alerts/alerts.ts
import { useUIStore } from '../../stores/ui.store.ts';

/**
 * Affiche une notification de succès
 * Utilise le snackbar du store UI
 */
export const showToasts_success = (message: string) => {
  const { showSnackbar } = useUIStore.getState();
  showSnackbar(`✅ ${message}`);
};

/**
 * Affiche une notification d'erreur
 */
export const showToasts_error = (message: string) => {
  const { showSnackbar } = useUIStore.getState();
  showSnackbar(`❌ ${message}`);
};

/**
 * Affiche une notification d'avertissement
 */
export const showToasts_warning = (message: string) => {
  const { showSnackbar } = useUIStore.getState();
  showSnackbar(`⚠️ ${message}`);
};

/**
 * Affiche une notification d'information
 */
export const showToasts_info = (message: string) => {
  const { showSnackbar } = useUIStore.getState();
  showSnackbar(`ℹ️ ${message}`);
};

/**
 * Affiche une notification par défaut
 */
export const showToasts_default = (message: string) => {
  const { showSnackbar } = useUIStore.getState();
  showSnackbar(message);
};