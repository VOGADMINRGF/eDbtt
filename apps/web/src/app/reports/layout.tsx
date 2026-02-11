import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

const title = `Reports – ${BRAND.name}`;
const description = "Oeffentliche Reports und Graph-Auswertungen zu Themen und Regionen.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: `${BRAND.baseUrl}/reports`,
    siteName: BRAND.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
