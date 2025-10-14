import React from "react";
import { FiX } from "react-icons/fi";

export type ModalProps = {
  isOpen?: boolean;               // <-- optional, default true
  title?: string;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
};

export default function Modal({
  isOpen = true,
  title,
  onClose,
  children,
  className
}: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center">
      <div className={`bg-white rounded-2xl shadow-lg p-4 max-w-lg w-full ${className ?? ""}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-lg">{title}</div>
          {onClose && (
            <button
              aria-label="Modal schließen"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-neutral-100"
            >
              <FiX />
            </button>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
