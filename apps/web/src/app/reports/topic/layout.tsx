import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Topic Report – eDebatte",
  description: "Aggregierte Topics und Responsibility-Statistiken für schnelle Analyse.",
  openGraph: {
    title: "Topic Report – eDebatte",
    description: "Aggregierte Topics und Responsibility-Statistiken für schnelle Analyse.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Topic Report – eDebatte",
    description: "Aggregierte Topics und Responsibility-Statistiken für schnelle Analyse.",
  },
};

export default function TopicReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
