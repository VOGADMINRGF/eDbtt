import { redirect } from "next/navigation";
import { buildQrStudioTargetHref, QR_STUDIO_PATH } from "@/features/qr/security";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return "";
}

export default async function LegacyQrGeneratorPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const target = readParam(resolved.target);
  redirect(
    buildQrStudioTargetHref(target) ??
      `${QR_STUDIO_PATH}?invalidTarget=1&legacy=qrcodegenerator`,
  );
}
