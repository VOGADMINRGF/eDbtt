import type { Metadata } from "next";
import { PublicParticipationSpaceIndex } from "@/features/participation/publicParticipationSpaceIndex";
import { listPublishedParticipationSpaces } from "@/features/participation/publicParticipationSpaceRuntime";
import { buildShareMetadata } from "@/features/share/metadata";

/* page-contract: delegated-h1 */

export const metadata: Metadata = buildShareMetadata({
  objectType: "report",
  pathOrUrl: "/beteiligung",
  title: "Öffentliche Beteiligungsräume",
  description:
    "Read-only Übersicht lokaler öffentlicher Beteiligungsräume mit sicheren Statushinweisen und Links zu den Detailseiten.",
  ogType: "website",
});

export default async function PublicParticipationSpaceIndexPage() {
  const { items, status } = await listPublishedParticipationSpaces();

  return <PublicParticipationSpaceIndex items={items} status={status} />;
}
