import type { Metadata } from "next";
import StartPage from "./start/page";
import { buildPublicPageMetadata } from "@/lib/seo/publicDiscovery";

/* page-contract: delegated-h1 */

const HOME_TITLE = "eDebatte – Verstehen, was sich verändert. Mitreden, wo es zählt.";
const HOME_DESCRIPTION =
  "eDebatte bündelt aktuelle Entwicklungen, Quellen, Positionen und Beteiligungsmöglichkeiten zu nachvollziehbaren Themenständen – von deiner Region bis zur Welt.";

export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    path: "/",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    ogType: "website",
  }),
  title: { absolute: HOME_TITLE },
};

export default function HomePage() {
  return <StartPage />;
}
