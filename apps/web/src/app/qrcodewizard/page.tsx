import { redirect } from "next/navigation";
import { QR_STUDIO_PATH } from "@/features/qr/security";

export default function LegacyQrWizardPage() {
  redirect(`${QR_STUDIO_PATH}?legacy=qrcodewizard`);
}
