import type { Metadata } from "next";
import { listPublicParticipationSpaceFixtures } from "@/features/participation/fixtures/publicParticipationSpace";
import { PublicParticipationSpaceIndex } from "@/features/participation/publicParticipationSpaceIndex";
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

export default function PublicParticipationSpaceIndexPage() {
  const fixtures = listPublicParticipationSpaceFixtures();

  return <PublicParticipationSpaceIndex fixtures={fixtures} />;
}
