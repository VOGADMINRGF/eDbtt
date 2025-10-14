"use client";
import Modal from "./Modal";

interface ModalConfirmProps {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ModalConfirm({
  title = "Bist du sicher?",
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Ja, fortfahren",
  cancelLabel = "Abbrechen",
}: ModalConfirmProps) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="text-sm text-gray-500 hover:underline">{cancelLabel}</button>
        <button onClick={onConfirm} className="text-sm font-semibold text-coral hover:underline">{confirmLabel}</button>
      </div>
    </Modal>
  );
}
