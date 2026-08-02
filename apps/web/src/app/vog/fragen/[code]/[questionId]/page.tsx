export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  buildVogPublicBallotHref,
  normalizeVogOriginMetadata,
  normalizeVogPublicBallotLocale,
} from "@features/vog/publicBallotContract";
import { getVogPublicBallotReadModel } from "@/features/vog/publicBallotReadModel";
import {
  hashVogGuestToken,
  isValidVogGuestToken,
  VOG_GUEST_PARTICIPATION_COOKIE,
} from "@/features/vog/publicBallotSecurity";
import { VogPublicBallotClient } from "./VogPublicBallotClient";

type PageProps = {
  params: Promise<{ code: string; questionId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Öffentliche VOG-Frage · eDebatte",
  description:
    "Öffentliche, nicht verifizierte Beteiligung an einer freigegebenen VoiceOpenGov-Frage.",
  robots: { index: false, follow: false },
};

function readSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function MissingBallot({ locale }: { locale: "de" | "en" }) {
  return (
    <main
      className="mx-auto flex min-h-[100svh] max-w-2xl flex-col gap-4 px-4 py-10"
      data-testid="vog-public-ballot-missing"
      lang={locale}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        VoiceOpenGov · eDebatte
      </p>
      <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">
        {locale === "de"
          ? "Öffentliche Frage nicht verfügbar"
          : "Public question unavailable"}
      </h1>
      <p className="text-sm text-[rgb(var(--muted))]">
        {locale === "de"
          ? "Diese Frage fehlt, ist nicht ausdrücklich öffentlich freigegeben oder ihr Freigabevertrag ist ungültig. Herkunftsparameter können keine Freigabe erzeugen."
          : "This question is missing, has not been explicitly released to the public, or has an invalid release contract. Origin parameters cannot grant access."}
      </p>
    </main>
  );
}

export default async function VogPublicBallotPage({
  params,
  searchParams,
}: PageProps) {
  const [{ code, questionId }, cookieStore] = await Promise.all([
    params,
    cookies(),
  ]);
  const rawSearchParams: Record<string, string | string[] | undefined> =
    searchParams ? await searchParams : {};
  const locale = normalizeVogPublicBallotLocale(readSingle(rawSearchParams.locale));
  const guestToken = cookieStore.get(VOG_GUEST_PARTICIPATION_COOKIE)?.value;
  const guestTokenHash = isValidVogGuestToken(guestToken)
    ? hashVogGuestToken(guestToken)
    : null;
  const ballot = await getVogPublicBallotReadModel({
    code,
    questionId,
    locale,
    guestTokenHash,
  }).catch(() => null);

  if (!ballot) return <MissingBallot locale={locale} />;

  const originMetadata = normalizeVogOriginMetadata(
    {
      source: readSingle(rawSearchParams.source),
      origin: readSingle(rawSearchParams.origin),
      origin_id: readSingle(rawSearchParams.origin_id),
      locale,
    },
    ballot.originId,
  );
  const commonLink = {
    code: ballot.code,
    questionId: ballot.questionId,
    source: originMetadata.source,
    origin: originMetadata.origin,
    originId: ballot.originId,
  } as const;

  return (
    <VogPublicBallotClient
      initialBallot={ballot}
      originMetadata={originMetadata}
      localeHrefs={{
        de: buildVogPublicBallotHref({ ...commonLink, locale: "de" }),
        en: buildVogPublicBallotHref({ ...commonLink, locale: "en" }),
      }}
    />
  );
}
