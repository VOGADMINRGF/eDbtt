export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqCategory = {
  id: string;
  label: string;
  faqs: FaqItem[];
};

export const FAQ_HOW_IT_WORKS_STEPS = [
  {
    title: "Thema & Vorlage",
    subtitle: "Worum geht es genau?",
    description:
      "Themen werden als klar strukturierte Vorlage vorbereitet: Kurztext, Hintergrund, Pro & Contra, Quellen und offene Fragen. Alles ist verlinkt und später nachvollziehbar.",
    badge: "Schritt 1",
  },
  {
    title: "Prüfen & diskutieren",
    subtitle: "Argumente sichtbar machen",
    description:
      "Im Evidenz-Graph werden Aussagen mit Belegen, Gegenpositionen und Unsicherheiten verknüpft. So siehst du, worauf sich eine vorgeschlagene Entscheidung stützt – und wo offene Punkte liegen.",
    badge: "Schritt 2",
  },
  {
    title: "Abstimmen & entscheiden",
    subtitle: "Eine Person, eine Stimme",
    description:
      "Wer berechtigt ist, gibt eine geheime Stimme ab. Quorum, Mehrheiten und Minderheitenbericht werden automatisch berechnet. Ergebnis, Beteiligung und Prüfprotokoll sind von Beginn an öffentlich dokumentiert.",
    badge: "Schritt 3",
  },
];

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "grundlagen",
    label: "Grundlagen",
    faqs: [
      {
        id: "grundlagen-1",
        question: "Was ist eDebatte?",
        answer:
          "eDebatte ist die direktdemokratische Bewegung. Wir heißen alle willkommen, die das Mehrheitsprinzip stärken und an eine gerechtere Welt glauben. Mit eDebatte, unserem eigens entwickelten Werkzeug, bauen wir eine digitale Infrastruktur für nachvollziehbare Entscheidungen.",
      },
      {
        id: "grundlagen-1b",
        question: "Was ist eDebatte?",
        answer:
          "eDebatte ist unser eigens entwickeltes Werkzeug. Dort werden Themen vorbereitet, Quellen gesammelt, Pro & Contra sichtbar gemacht und Abstimmungen durchgeführt. So bleibt der Prozess transparent, fair und überprüfbar.",
      },
      {
        id: "grundlagen-2",
        question: "Ist eDebatte eine Partei?",
        answer:
          "Nein. eDebatte ist keine Partei, sondern eine unabhängige Bewegung und Infrastruktur. Mit eDebatte stellen wir Werkzeuge bereit, mit denen Menschen, Organisationen und verantwortliche Personen Themen einbringen, diskutieren und abstimmen können. Niemand erhält Sonderstimmrechte aufgrund von Rolle oder finanziellen Beiträgen.",
      },
      {
        id: "grundlagen-3",
        question: "Warum spricht ihr von Infrastruktur?",
        answer:
          "Weil wir digitale Teilhabe als dauerhaftes Fundament sehen. Mit eDebatte und eDebatte machen wir Entscheidungsprozesse sichtbar: Wer schlägt was vor, welche Belege gibt es, wie wurde abgestimmt – und warum. Diese Infrastruktur soll überall funktionieren, wo Menschen gemeinsam entscheiden.",
      },
    ],
  },
  {
    id: "abstimmung",
    label: "Abstimmen",
    faqs: [
      {
        id: "abstimmung-1",
        question: "Wie läuft eine Abstimmung ab?",
        answer:
          "1. Vorlage lesen: Du siehst Kurztext, Begründung, Pro & Contra, Quellen und Unsicherheiten.\n2. Berechtigung prüfen: Je nach Thema kann es Kriterien geben (z. B. Region, Alter). Grundsatz bleibt: eine Person, eine Stimme.\n3. Stimme abgeben: Du stimmst digital, die Identität ist technisch vom Stimmzettel getrennt.\n4. Zählen & prüfen: Quorum, definierte Mehrheiten (z. B. 2/3 bei Grundsatzfragen) und Minderheitenbericht werden ermittelt.\n5. Veröffentlichen: Ergebnis, Beteiligung, Minderheitenbericht und Prüfprotokoll sind öffentlich einsehbar.",
      },
      {
        id: "abstimmung-2",
        question: "Was ist der Evidenz-Graph?",
        answer:
          "Der Evidenz-Graph verknüpft Aussagen mit Belegen und Gegenbelegen. Jede Aussage kann auf Quellen, Studien oder Erfahrungsberichte verweisen. Gegenpositionen und Unsicherheiten werden nicht versteckt, sondern sichtbar gemacht. So kannst du nachvollziehen, warum eine Entscheidung inhaltlich sinnvoll erscheint – oder wo du selbst noch Kritik siehst.",
      },
      {
        id: "abstimmung-3",
        question: "Sind meine Stimmen anonym?",
        answer:
          "Ja. Die technische Architektur trennt Identität und Stimmzettel. Überprüfungen wie Berechtigung oder Region laufen getrennt von der eigentlichen Stimmabgabe. Für Auswertungen nutzen wir aggregierte Daten, nicht deine persönliche Stimmhistorie mit Klarnamen.",
      },
      {
        id: "abstimmung-4",
        question: "Wer legt die Regeln für Quorum und Mehrheiten fest?",
        answer:
          "Regeln hängen vom Abstimmungstyp ab. Für einfache Stimmungsbilder reicht oft eine einfache Mehrheit. Für Grundsatzfragen kann ein höheres Quorum und eine 2/3-Mehrheit notwendig sein. Die jeweils geltenden Regeln werden vor jeder Abstimmung klar angezeigt und sind Teil des Prüfprotokolls.",
      },
    ],
  },
  {
    id: "mitmachen",
    label: "Mitmachen",
    faqs: [
      {
        id: "mitmachen-1",
        question: "Wer kann teilnehmen?",
        answer:
          "Grundsätzlich kann jeder ab 16 Jahre mitmachen. Bürger:innen können außerdem Themen, Streams oder Regionen als Creator begleiten. Bei bestimmten Abstimmungen – zum Beispiel zu kommunalen Fragen – kann es Einschränkungen nach Region oder Zielgruppe geben. Diese werden jeweils klar gekennzeichnet.",
      },
      {
        id: "mitmachen-2",
        question: "Brauche ich eine Mitgliedschaft?",
        answer:
          "Viele Funktionen, insbesondere offene Abstimmungen und das Lesen von Inhalten, sollen ohne kostenpflichtige Mitgliedschaft möglich sein. Eine Mitgliedschaft stärkt die Bewegung und finanziert die Infrastruktur. Zusätzlich ermöglicht sie neue Funktionen oder Meta-Mitbestimmung, zum Beispiel bei der Priorisierung von Features.",
      },
      {
        id: "mitmachen-3",
        question: "Wie können Organisationen, Verwaltung und verantwortliche Personen eDebatte nutzen?",
        answer:
          "Organisationen, Initiativen, Kommunen und verantwortliche Personen können eDebatte nutzen, um Stimmungsbilder einzuholen, Vorschläge zu testen oder verbindliche Mitglieder- bzw. Bürgerentscheide durchzuführen. Wir stellen aufbereitete Entscheidungsgrundlagen, Datenpakete und Dossiers bereit, damit Beschlüsse nachvollziehbar bleiben. Die Regeln bleiben dabei für alle gleich: eine Person, eine Stimme – keine Zusatzstimmen für Organisationen.",
      },
      {
        id: "mitmachen-3b",
        question: "Wie können Verbände und Vereine eDebatte nutzen?",
        answer:
          "Verbände und Vereine können Mitgliederbefragungen, interne Abstimmungen und Arbeitsgruppen in eDebatte aufsetzen. Dossiers bündeln Quellen und Argumente; Ergebnisse liefern Mandate für Mitgliederkommunikation und Beschlüsse.",
      },
      {
        id: "mitmachen-3c",
        question: "Wie können Journalist:innen mitmachen?",
        answer:
          "Journalist:innen können redaktionell mitgestalten: offene Fragen präzisieren, Faktenchecks ergänzen und Dossiers als Grundlage für Beiträge nutzen. eDebatte liefert Quellen, Minderheitenberichte und exportierbare Daten für Artikel, Podcasts oder Streams.",
      },
      {
        id: "mitmachen-4",
        question: "Wie kann ich in der Aufbauphase unterstützen?",
        answer:
          "Du kannst dich registrieren, Mitglied werden, eine einmalige Gutschrift geben oder die eDebatte-Pakete vormerken. Ebenso wichtig sind Tests, Feedback und Weiterempfehlungen. Jede Form von Unterstützung hilft, die Bewegung und die Infrastruktur stabil aufzubauen.",
      },
    ],
  },
  {
    id: "datenschutz",
    label: "Datenschutz & Finanzierung",
    faqs: [
      {
        id: "datenschutz-1",
        question: "Wie geht ihr mit meinen Daten um?",
        answer:
          "Wir verarbeiten nur die Daten, die für Registrierung, Sicherheit und Teilnahme nötig sind – etwa deine E-Mail-Adresse und optionale Profilangaben. Welche Daten genau verarbeitet werden, dokumentieren wir in der Datenschutzerklärung, sobald die Gesellschaft eingetragen ist. Datenverkauf ist nicht Teil des Geschäftsmodells.",
      },
      {
        id: "datenschutz-2",
        question: "Wie finanziert sich eDebatte?",
        answer:
          "eDebatte soll sich langfristig über viele kleine Beiträge tragen: Mitgliedschaften, einmalige Gutschriften und Nutzung der Plattform durch Organisationen. So bleibt die Bewegung unabhängig. Details zur aktuellen Finanzierungslogik findest du im Transparenzbericht.",
      },
      {
        id: "datenschutz-3",
        question: "Wo finde ich den Transparenzbericht?",
        answer:
          "Schau im Footer (im Unteren rechten Rand nach Transparenzbericht - dort veröffentlichen wir regelmäßig eine Übersicht über Einnahmen, Ausgaben, offene Punkte und Risiken. In der Aufbauphase beschreiben wir dort außerdem das geschätzte Entwicklungs-Minus und die Prioritäten für den Einsatz der ersten Gelder.",
      },
    ],
  },
];
