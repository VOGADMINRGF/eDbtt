import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digitale Entscheidungsarchitektur – Referenzarchitektur für strukturierte Mehrheitsbildung",
  description:
    "Referenzarchitektur für Informationsarchitektur, Legitimationslogik und Governance-Modell. Fokus: Pilot (12 Wochen), Nachweisführung und nachvollziehbare Mehrheitsbildung.",
  openGraph: {
    title: "Digitale Entscheidungsarchitektur",
    description:
      "Referenzarchitektur für strukturierte Mehrheitsbildung: Informationsarchitektur, Legitimationslogik, Governance-Modell und Pilotkonzept (12 Wochen).",
  },
  twitter: {
    title: "Digitale Entscheidungsarchitektur",
    description:
      "Referenzarchitektur für strukturierte Mehrheitsbildung: Informationsarchitektur, Legitimationslogik, Governance-Modell und Pilotkonzept (12 Wochen).",
  },
};

export default function ReferenzarchitekturLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-slate-50 text-slate-900">{children}</div>;
}
