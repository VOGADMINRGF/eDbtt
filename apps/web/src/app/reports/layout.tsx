import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Hub – eDebatte",
  description: "Aggregierte Themen- und Regionen-Reports als Entscheidungsgrundlage.",
  openGraph: {
    title: "Report Hub – eDebatte",
    description: "Aggregierte Themen- und Regionen-Reports als Entscheidungsgrundlage.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Report Hub – eDebatte",
    description: "Aggregierte Themen- und Regionen-Reports als Entscheidungsgrundlage.",
  },
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
