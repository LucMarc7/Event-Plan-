// src/components/theme/CustomAlert.tsx
// Wrapper rétro-compatible autour du Dialog du design system

import React from "react";
import { Dialog } from "../ui/Dialog";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose?: () => void;
  // Raccourcis directs (utilisés par le thème)
  onCancel?: () => void;
  onConfirm?: () => void;
  confirmButtonColor?: string;
}

const CustomAlert: React.FC<Props> = ({
  visible,
  title,
  message,
  buttons,
  onClose,
  onCancel,
  onConfirm,
}) => {
  // Si on a des boutons explicites → utiliser le premier/dernier
  let confirmLabel = "OK";
  let cancelLabel = "Annuler";
  let handleConfirm = () => onClose?.();
  let handleCancel = () => onClose?.();

  if (buttons && buttons.length > 0) {
    if (buttons.length === 1) {
      confirmLabel = buttons[0].text;
      handleConfirm = () => {
        buttons[0].onPress?.();
        onClose?.();
      };
      handleCancel = handleConfirm;
    } else {
      const cancelBtn = buttons.find((b) => b.style === "cancel") || buttons[0];
      const confirmBtn =
        buttons.find((b) => b.style === "destructive") ||
        buttons[buttons.length - 1];
      cancelLabel = cancelBtn.text;
      confirmLabel = confirmBtn.text;
      handleCancel = () => {
        cancelBtn.onPress?.();
        onClose?.();
      };
      handleConfirm = () => {
        confirmBtn.onPress?.();
        onClose?.();
      };
    }
  } else {
    // Utilisation directe onCancel/onConfirm
    if (onCancel) {
      cancelLabel = "Annuler";
      handleCancel = onCancel;
    }
    if (onConfirm) {
      confirmLabel = "Confirmer";
      handleConfirm = onConfirm;
    }
  }

  const variant =
    buttons?.some((b) => b.style === "destructive") || onConfirm
      ? "danger"
      : "info";

  return (
    <Dialog
      visible={visible}
      title={title}
      message={message}
      variant={variant}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};

export default CustomAlert;
