import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { buildQrEntryMetadata } from "@/features/qr/publicEntry";
import { buildQrStudioCodeHref, QR_STUDIO_PATH } from "@/features/qr/security";

type PageProps = {
  params: Promise<{ qrId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { qrId } = await params;
  return buildQrEntryMetadata(qrId);
}

export default async function LegacyQrEntryPage({ params }: PageProps) {
  const { qrId } = await params;
  redirect(buildQrStudioCodeHref(qrId) ?? `${QR_STUDIO_PATH}?invalidTarget=1&legacy=qr`);
}
