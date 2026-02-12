"use client";
import QRCodeWizard from "@/components/QRCodeWizard";
export default function Page() {
  return (
    <main style={{ padding: 16 }}>
      <h1 className="sr-only">QR Code Wizard</h1>
      <QRCodeWizard />
    </main>
  );
}
