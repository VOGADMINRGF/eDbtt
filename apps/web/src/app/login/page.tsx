import type { Metadata } from "next";
import LoginPageClient from "./LoginPageClient";
import { NOINDEX_ROBOTS } from "@/lib/seo/publicDiscovery";

/* page-contract: delegated-h1 */

export const metadata: Metadata = {
  title: "Login – eDebatte",
  robots: NOINDEX_ROBOTS,
};

export default function LoginPage() {
  return <LoginPageClient />;
}
