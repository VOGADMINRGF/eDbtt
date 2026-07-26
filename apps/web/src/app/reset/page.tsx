import type { Metadata } from "next";
import ResetPageClient from "./ResetPageClient";
import { NOINDEX_ROBOTS } from "@/lib/seo/publicDiscovery";

export const metadata: Metadata = {
  title: "Passwort zurücksetzen – eDebatte",
  robots: NOINDEX_ROBOTS,
};

export default function ResetPage() {
  return <ResetPageClient />;
}
