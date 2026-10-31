// src/hooks/useAppAlert.tsx
import React, { useCallback, useState } from "react";
import { AppAlert, AppAlertConfig } from "../components/ui/AppAlert";

/**
 * Hook qui gère l'état d'une alerte custom (remplacement de Alert.alert).
 *
 * Usage :
 *   const { showAlert, AlertHost } = useAppAlert();
 *
 *   showAlert({ title: "Titre", message: "Message" });
 *   showAlert({
 *     title: "Confirmer ?",
 *     message: "Action irréversible",
 *     variant: "danger",
 *     buttons: [
 *       { text: "Annuler", style: "cancel" },
 *       { text: "Supprimer", style: "destructive", onPress: () => doSomething() },
 *     ],
 *   });
 *
 *   // Dans le JSX du composant :
 *   {AlertHost}
 */
export const useAppAlert = () => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AppAlertConfig | null>(null);

  const showAlert = useCallback((cfg: AppAlertConfig) => {
    setConfig(cfg);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    // Petit délai avant de nettoyer la config (pour éviter le flash)
    setTimeout(() => setConfig(null), 250);
  }, []);

  const AlertHost = (
    <AppAlert visible={visible} config={config} onClose={hideAlert} />
  );

  return { showAlert, hideAlert, AlertHost };
};

export default useAppAlert;
