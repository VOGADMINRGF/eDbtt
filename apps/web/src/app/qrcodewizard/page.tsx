import { redirect } from "next/navigation";
import { buildQrStudioHref } from "@features/qr";

/* page-contract: delegated-h1 legacy redirect only */

type PageProps = {
  searchParams: Promise<{
    target?: string | string[];
    caller?: string | string[];
  }>;
};

export default async function QrCodeWizardRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const target = typeof params.target === "string" ? params.target : null;
  const caller = typeof params.caller === "string" ? params.caller : "legacy_qrcodewizard";

  redirect(
    buildQrStudioHref({
      target,
      caller,
    }),
  );
}
