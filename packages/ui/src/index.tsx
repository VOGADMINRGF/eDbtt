// Design-Komponenten
export { default as Badge } from "./design/Badge";
export { default as Modal } from "./design/Modal";
export { default as ModalConfirm } from "./design/ModalConfirm";
export { default as Toast } from "./design/Toast";
export { default as Spinner } from "./design/Spinner";
export { default as LoadingOverlay } from "./design/LoadingOverlay";
export { default as Button } from "./design/Button";

// Farben: alles re-exportieren + default-Alias anbieten
export * from "./design/badgeColor";
export { default as badgeColors } from "./design/badgeColor";
export * from "./theme"; 

// Layout
export { default as Header } from "./layout/Header";
export { default as Footer } from "./layout/Footer";
