import type { Metadata } from "next";
import StartPage from "./start/page";
import { buildPublicPageMetadata } from "@/lib/seo/publicDiscovery";

/* page-contract: delegated-h1 */

const HOME_TITLE = "eDebatte – Bürgerbeteiligung beginnt vor dem Verfahren";
const HOME_DESCRIPTION =
  "Vom ungeklärten Anliegen zur gemeinsamen Agenda: Quellen, Perspektiven und Handlungsoptionen strukturieren, bevor ein formelles Verfahren beginnt.";

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
