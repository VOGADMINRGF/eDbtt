import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { buildQrStudioCodeHref, QR_STUDIO_PATH } from "@/features/qr/security";

/* page-contract: delegated-h1 legacy redirect only */

type PageProps = {
  params: Promise<{ qrId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { qrId } = await params;
  return {
    title: `QR Teilnahme · ${qrId}`,
    description: "Teilnahme an einer Abstimmung oder Kampagne per QR-Code.",
  };
}

export default async function LegacyQrEntryPage({ params }: PageProps) {
  const { qrId } = await params;
  redirect(buildQrStudioCodeHref(qrId) ?? `${QR_STUDIO_PATH}?invalidTarget=1&legacy=qr`);
}
