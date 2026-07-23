import type { Metadata } from "next";
import StartPage from "./start/page";

/* page-contract: delegated-h1 */

const HOME_TITLE = "eDebatte – Verstehen, was sich verändert. Mitreden, wo es zählt.";
const HOME_DESCRIPTION =
  "eDebatte bündelt aktuelle Entwicklungen, Quellen, Positionen und Beteiligungsmöglichkeiten zu nachvollziehbaren Themenständen – von deiner Region bis zur Welt.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "https://www.edebatte.org/",
  },
  openGraph: {
    type: "website",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "https://www.edebatte.org/",
    siteName: "eDebatte",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

export default function HomePage() {
  return <StartPage />;
}
