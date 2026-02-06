import { DEFAULT_LOCALE, type SupportedLocale } from "@/config/locales";

type LocaleValue<T> = Record<"de", T> & Partial<Record<SupportedLocale, T>>;

const STRINGS: {
  title: LocaleValue<string>;
  intro: LocaleValue<string>;
  responsibleTitle: LocaleValue<string>;
  responsibleBody: LocaleValue<string>;
  legalTitle: LocaleValue<string>;
  legalBody: LocaleValue<string>;
  disclaimerTitle: LocaleValue<string>;
  disclaimerBody: LocaleValue<string>;
  emailLabel: LocaleValue<string>;
} = {
  title: {
    de: "Impressum",
    en: "Legal Notice",
  },

  intro: {
    de: [
      "Anbieterkennzeichnung für die digitalen Angebote von VoiceOpenGov nach den gesetzlichen Vorschriften",
      "(u. a. § 5 Digitale-Dienste-Gesetz (DDG) und § 18 Medienstaatsvertrag (MStV)).",
      "eDebatte ist ein Angebot innerhalb von VoiceOpenGov; zentrale Anbieter- und Kontaktinformationen werden unter voiceopengov.org vorgehalten.",
    ].join(" "),
    en: [
      "Provider identification for VoiceOpenGov’s digital services under applicable German law",
      "(including Section 5 Digitale-Dienste-Gesetz (DDG) and Section 18 Medienstaatsvertrag (MStV)).",
      "eDebatte is a service within VoiceOpenGov; central provider and contact information is maintained at voiceopengov.org.",
    ].join(" "),
  },

  responsibleTitle: {
    de: "Anbieter / Diensteanbieter (gem. § 5 DDG):",
    en: "Provider / Service provider (Section 5 DDG):",
  },

  responsibleBody: {
    de: [
      "VoiceOpenGov – Initiative für digitale Beteiligung",
      "",
      "Anbieter / Diensteanbieter:",
      "Ricky G. Fleischer",
      "(natürliche Person; VoiceOpenGov ist eine Initiative von Ricky G. Fleischer)",
      "Clara-Müller-Jahnke-Str. 41",
      "12589 Berlin",
      "Deutschland",
      "",
      "Kontakt (zentral):",
      "E-Mail: impressum@voiceopengov.org",
      "Website: voiceopengov.org",
      "",
      "Hinweis zum Status",
      "VoiceOpenGov wird aktuell als Initiative betrieben.",
      "Sollte künftig ein eigener Rechtsträger (z. B. eine Gesellschaft oder Organisation) einzelne Angebote betreiben, werden die Angaben an dieser Stelle entsprechend aktualisiert.",
      "",
      "Gerichtsstand",
      "Soweit gesetzlich zulässig, ist Berlin Gerichtsstand.",
    ].join("\n"),

    en: [
      "VoiceOpenGov – Initiative for Digital Participation",
      "",
      "Provider / service provider:",
      "Ricky G. Fleischer",
      "(natural person; VoiceOpenGov is an initiative by Ricky G. Fleischer)",
      "Clara-Müller-Jahnke-Str. 41",
      "12589 Berlin",
      "Germany",
      "",
      "Contact (central):",
      "E-mail: impressum@voiceopengov.org",
      "Website: voiceopengov.org",
      "",
      "Status note",
      "VoiceOpenGov is currently operated as an initiative.",
      "If, in the future, certain services are operated by a separate legal entity (e.g., a company or organisation), the details will be updated here accordingly.",
      "",
      "Place of jurisdiction",
      "To the extent permitted by law, the place of jurisdiction is Berlin.",
    ].join("\n"),
  },

  legalTitle: {
    de: "Verantwortlich i.S.d. § 18 Abs. 2 MStV (journalistisch-redaktionelle Inhalte):",
    en: "Responsible for editorial content (Section 18 (2) MStV):",
  },

  legalBody: {
    de: [
      "Ricky G. Fleischer",
      "Clara-Müller-Jahnke-Str. 41",
      "12589 Berlin",
      "Deutschland",
    ].join("\n"),

    en: [
      "Ricky G. Fleischer",
      "Clara-Müller-Jahnke-Str. 41",
      "12589 Berlin",
      "Germany",
    ].join("\n"),
  },

  disclaimerTitle: {
    de: "Rechtliche Hinweise, Haftung, Urheberrecht, Mitgliedschaften und Datenschutz:",
    en: "Legal information, liability, copyright, memberships and data protection:",
  },

  disclaimerBody: {
    de: [
      "Haftung für eigene Inhalte",
      "Als Diensteanbieter sind wir nach den allgemeinen Gesetzen für eigene Inhalte dieser digitalen Dienste verantwortlich.",
      "Wir übernehmen keine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der bereitgestellten Informationen.",
      "Als Beta- oder Prototyp-Funktionen gekennzeichnete Bereiche können sich jederzeit ändern oder vorübergehend abgeschaltet werden.",
      "",
      "Haftung für Links",
      "Unser Angebot kann Links zu externen Websites Dritter enthalten, auf deren Inhalte wir keinen Einfluss haben.",
      "Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich.",
      "Zum Zeitpunkt der Verlinkung waren keine rechtswidrigen Inhalte erkennbar.",
      "Bei Bekanntwerden von Rechtsverletzungen werden derartige Links unverzüglich entfernt.",
      "",
      "Nutzer:innen-Inhalte / Plattformcharakter",
      "Ein Teil der Inhalte auf VoiceOpenGov wird von Nutzer:innen erstellt (z. B. Beiträge, Kommentare, Abstimmungen, Streams).",
      "Diese Inhalte spiegeln nicht zwingend die Position von VoiceOpenGov oder von Ricky G. Fleischer wider.",
      "Nutzer:innen sind für ihre eigenen Inhalte selbst verantwortlich.",
      "Rechtswidrige Inhalte können über die vorgesehenen Meldewege gemeldet werden; sie werden nach Prüfung im Rahmen der gesetzlichen Vorgaben entfernt oder gesperrt.",
      "",
      "Urheberrecht",
      "Die auf diesen Seiten veröffentlichten Inhalte und Werke (insbesondere Texte, Grafiken, Code-Snippets, Audio- und Video-Inhalte)",
      "unterliegen dem deutschen Urheberrecht, sofern nicht ausdrücklich anders gekennzeichnet.",
      "Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der gesetzlichen Schranken des Urheberrechts",
      "bedürfen der vorherigen schriftlichen Zustimmung von Ricky G. Fleischer.",
      "Downloads und Kopien sind nur für den privaten, nicht kommerziellen Gebrauch zulässig, soweit keine andere Lizenz (z. B. Creative Commons) angegeben ist.",
      "",
      "Mitgliedschaften, Beiträge und finanzielle Unterstützung",
      "Über VoiceOpenGov (einschließlich eDebatte) können Unterstützungs- bzw. Mitgliedschaftsmodelle angeboten werden.",
      "Vertragspartner ist – bis zur Etablierung eines separaten Rechtsträgers – Ricky G. Fleischer als natürliche Person.",
      "Derzeit werden keine Spendenquittungen ausgestellt; Beiträge sind in der Regel nicht steuerlich absetzbar und gelten nicht als Spenden im steuerlichen Sinne.",
      "Konkrete Konditionen (z. B. Beitragshöhe, Laufzeit, Kündigungsfristen) ergeben sich aus den jeweils kommunizierten Angebots- und Vertragsbedingungen.",
      "",
      "Hinweis nach § 36 Verbraucherstreitbeilegungsgesetz (VSBG)",
      "Ricky G. Fleischer / VoiceOpenGov ist weder verpflichtet noch bereit, an Streitbeilegungsverfahren",
      "vor einer Verbraucherschlichtungsstelle teilzunehmen.",
      "",
      "Geltungsbereich / Verweis auf voiceopengov.org",
      "Dieses Impressum gilt für die digitalen Angebote von VoiceOpenGov unter der Domain voiceopengov.org (einschließlich Subdomains).",
      "eDebatte ist ein Angebot innerhalb von VoiceOpenGov. Zentrale Anbieterinformationen und rechtliche Seiten (Impressum/Datenschutz) werden unter voiceopengov.org vorgehalten.",
      "",
      "Datenschutz, Cookies und Telemetrie",
      "Informationen zur Verarbeitung personenbezogener Daten sowie zur Nutzung von Cookies und vergleichbaren Technologien",
      "finden Sie in unserer Datenschutzerklärung unter /datenschutz.",
      "",
      "Sprachfassungen",
      "Dieses Impressum ist in deutscher und teilweise in englischer Sprache verfügbar.",
      "Rechtlich maßgeblich ist ausschließlich die deutsche Fassung; die englische Übersetzung dient lediglich der besseren Verständlichkeit.",
    ].join("\n"),

    en: [
      "Liability for own content",
      "In accordance with general law we are responsible for our own content on these digital services.",
      "We do not assume any guarantee for the accuracy, completeness or up-to-dateness of the information provided.",
      "Areas marked as beta or prototype features may change at any time or be temporarily unavailable.",
      "",
      "Liability for links",
      "Our services may contain links to external third-party websites. We have no influence on their content.",
      "The respective provider or operator of the pages is always responsible for the content of the linked pages.",
      "At the time of linking, no illegal content was recognisable.",
      "If we become aware of legal violations, such links will be removed without delay.",
      "",
      "User-generated content / platform character",
      "Some content on VoiceOpenGov is created by users (e.g. posts, comments, votes, streams).",
      "Such content does not necessarily reflect the position of VoiceOpenGov or of Ricky G. Fleischer.",
      "Users are responsible for their own content.",
      "Unlawful content can be reported via the designated channels; such content will be removed or blocked after review in accordance with legal requirements.",
      "",
      "Copyright",
      "The content and works published on these pages (in particular texts, graphics, code snippets, audio and video content)",
      "are subject to German copyright law unless expressly stated otherwise.",
      "Any reproduction, processing, distribution or other utilisation outside the limits of copyright law",
      "requires prior written consent by Ricky G. Fleischer.",
      "Downloads and copies are permitted only for private, non-commercial use, unless another licence (e.g. Creative Commons) is indicated.",
      "",
      "Memberships, contributions and financial support",
      "VoiceOpenGov (including eDebatte) offers support and membership models.",
      "Until a separate legal entity is established, the contractual partner is Ricky G. Fleischer as a natural person.",
      "No donation receipts are currently issued; contributions are generally not treated as tax-deductible charitable donations.",
      "Specific terms (such as contribution amounts, duration and termination) are defined in the respective offer and contract conditions.",
      "",
      "Consumer dispute resolution (Section 36 VSBG)",
      "Ricky G. Fleischer / VoiceOpenGov is neither obliged nor willing to participate in dispute resolution",
      "proceedings before a consumer arbitration board.",
      "",
      "Scope / reference to voiceopengov.org",
      "This legal notice applies to VoiceOpenGov’s digital services under the domain voiceopengov.org (including subdomains).",
      "eDebatte is a service within VoiceOpenGov. Central legal pages (legal notice/privacy) are maintained at voiceopengov.org.",
      "",
      "Data protection, cookies and telemetry",
      "Information on the processing of personal data and on the use of cookies and similar technologies",
      "can be found in our privacy policy at /datenschutz.",
      "",
      "Language versions",
      "This legal notice is available in German and partly in English.",
      "Only the German version is legally binding. The English translation is provided for convenience only.",
    ].join("\n"),
  },

  emailLabel: {
    de: "impressum@voiceopengov.org",
    en: "impressum@voiceopengov.org",
  },
};

function pick<T>(entry: LocaleValue<T>, locale: SupportedLocale | string): T {
  const normalized = (locale || DEFAULT_LOCALE) as SupportedLocale;
  return entry[normalized] ?? entry.en ?? entry.de;
}

export function getImpressumStrings(locale: SupportedLocale | string) {
  return {
    title: pick(STRINGS.title, locale),
    intro: pick(STRINGS.intro, locale),
    responsibleTitle: pick(STRINGS.responsibleTitle, locale),
    responsibleBody: pick(STRINGS.responsibleBody, locale),
    legalTitle: pick(STRINGS.legalTitle, locale),
    legalBody: pick(STRINGS.legalBody, locale),
    disclaimerTitle: pick(STRINGS.disclaimerTitle, locale),
    disclaimerBody: pick(STRINGS.disclaimerBody, locale),
    emailLabel: pick(STRINGS.emailLabel, locale),
  };
}
