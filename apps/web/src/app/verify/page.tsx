import type { Metadata } from "next";
import VerifyPageClient from "./VerifyPageClient";
import { NOINDEX_ROBOTS } from "@/lib/seo/publicDiscovery";

/* page-contract: delegated-h1 */

export const metadata: Metadata = {
  title: "E-Mail verifizieren – eDebatte",
  robots: NOINDEX_ROBOTS,
};

export default function VerifyPage() {
  return <VerifyPageClient />;
}
