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
        question: "Was ist VoiceOpenGov?",
        answer:
          "VoiceOpenGov ist die Initiative hinter eDebatte. Sie steht für faire, nachvollziehbare Beteiligung und für Regeln, die offen, prüfbar und nicht käuflich sind. eDebatte ist das Werkzeug, mit dem diese Infrastruktur im review-first Produktmodus praktisch nutzbar wird.",
      },
      {
        id: "grundlagen-1b",
        question: "Was ist eDebatte?",
        answer:
          "eDebatte ist unser eigens entwickeltes Werkzeug. Dort werden Themen vorbereitet, Quellen gesammelt, Pro & Contra sichtbar gemacht und Beteiligungsschritte dokumentiert. Der Produktmodus ist review-first, auditierbar und ohne automatische Veröffentlichung, automatisches Siegel oder automatische Amtlichkeit. Unser Leitsatz dabei ist: „Lass das beste Argument gewinnen.“",
      },
      {
        id: "grundlagen-1c",
        question: "Was meint eDebatte mit einer regionalen Startlage?",
        answer:
          "Wenn sich eine Verwaltung, ein Verband, ein Verein oder ein Träger für eine Region interessiert, kann eDebatte aus regionalen Quellen eine review-first vorstrukturierte Themenlage vorbereiten. Das ist keine Demo-Strecke, sondern eine kuratierte regionale Startlage mit sicherer Material- und Quellenprüfung. Sie bleibt auditierbar, reviewpflichtig und wird nicht automatisch amtlich oder verbindlich.",
      },
      {
        id: "grundlagen-1d",
        question: "Was passiert zuerst in /create?",
        answer:
          "In /create soll zuerst die Frage „Haben wir dich richtig verstanden?“ klären, was gemeint ist. Primär geht es danach um Einreichen, als Arbeitsstand speichern oder zur Prüfung vorbereiten, je nach Kontext und Risikologik. Erst danach folgen tiefere Themenarbeit und Werkzeugauswahl.",
      },
      {
        id: "grundlagen-1e",
        question: "Ist eDebatte nur ein Pilot?",
        answer:
          "Nein. eDebatte ist nicht auf einen dauerhaften Pilotzustand angelegt. Manche Bereiche sind heute pilotfähig oder produktionsnah, andere sind erst als Grundlage vorhanden. Das Ziel ist eine klare Reifekette: Grundlage vorhanden, pilotfähig, produktionsnah, produktionsfähig und live.",
      },
      {
        id: "grundlagen-1f",
        question: "Was bedeutet pilotfähig?",
        answer:
          "Pilotfähig heißt: Ein Bereich kann in einem kontrollierten Rahmen mit klaren Guardrails genutzt werden. Es gibt also schon einen echten Pfad, aber noch nicht das volle Produktversprechen für jede Zielgruppe und jeden Betriebsfall.",
      },
      {
        id: "grundlagen-1g",
        question: "Wann ist ein Bereich produktionsfähig?",
        answer:
          "Produktionsfähig ist ein Bereich dann, wenn er für eine klar benannte Zielgruppe als belastbarer Produktpfad genutzt werden kann. Dazu gehören geschlossene Rechte- und Reviewregeln, klare Betriebsannahmen, ehrliche Sichtbarkeitslogik und keine stillen Demo- oder Seed-Abhängigkeiten im Produktpfad.",
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
          "Weil wir digitale Teilhabe als dauerhaftes Fundament sehen. Mit VoiceOpenGov und eDebatte machen wir Entscheidungsprozesse sichtbar: Wer schlägt was vor, welche Belege gibt es, wie wurde abgestimmt – und warum. Diese Infrastruktur soll überall funktionieren, wo Menschen gemeinsam entscheiden.",
      },
      {
        id: "grundlagen-4",
        question: "Sind Thema und Dossier dasselbe?",
        answer:
          "Nein. Ein Thema ist ein inhaltliches Feld, zum Beispiel Wohnen, Verkehr, Bildung oder Klima. Ein Dossier ist ein konkreter Arbeitsstand zu einer öffentlichen Frage. Ein Dossier hat meistens ein Hauptthema, kann aber mehrere Themenfelder berühren. Beispiel: Das Dossier „Kommunale Prioritäten und Zielkonflikte“ kann die Themenfelder Wohnen, Verkehr, Klima, Bildung, Sicherheit/Rechtsstaat, Gesundheit/Pflege, kommunale Finanzen und Bürgerbeteiligung enthalten.",
      },
      {
        id: "grundlagen-4b",
        question: "Ist ein Anlassraum nur ein Admin-Container?",
        answer:
          "Nein. Ein Anlassraum ist ein öffentlicher Themenraum. Er kann mit Freund:innen und Nachbar:innen geteilt, per QR-Code geöffnet, bei Veranstaltungen genutzt, aus Zeitung, TV oder Artikeln weitergeführt und für Bürgerdialoge verwendet werden. Verwaltung und Redaktion arbeiten darin, aber der Anlassraum ist nicht nur ein interner Admin-Container.",
      },
      {
        id: "grundlagen-5",
        question: "Was ist eine Aussage?",
        answer:
          "Eine Aussage ist eine konkrete Aussage, Forderung, Frage oder Position innerhalb eines Dossiers. Eine Aussage gehört zu einem Dossier und berührt ein oder mehrere Themen. Beispiel: „Kommunaler Wohnungsbau soll schneller genehmigt werden“ gehört zum Dossier „Kommunale Prioritäten und Zielkonflikte“ und berührt die Themen Wohnen, Verwaltung, Finanzen und soziale Gerechtigkeit.",
      },
      {
        id: "grundlagen-6",
        question: "Was ist eine Abstimmung?",
        answer:
          "Eine Abstimmung entsteht aus einer Aussage oder aus einer übergeordneten Dossierfrage. Nutzer stimmen also nicht einfach über ein ganzes Thema ab, sondern über konkrete Fragen, Prioritäten, Positionen oder Entscheidungsoptionen. Beispiel: „Welche kommunalen Prioritäten sollen zuerst bearbeitet werden?“ ist eine Dossierfrage. „Soll kommunaler Wohnungsbau beschleunigt werden, auch wenn Auflagen reduziert werden?“ ist eine Abstimmungsfrage zu einer konkreten Aussage.",
      },
      {
        id: "grundlagen-6b",
        question: "Wie funktioniert die Veröffentlichungslogik?",
        answer:
          "eDebatte trennt Sichtbarkeit und Prüfstatus über eine Risk Ladder:\n- private_draft: nur als eigener Arbeitsstand\n- internal_review: intern sichtbar zur Prüfung\n- public_unverified: öffentlich sichtbar, aber ungeprüft\n- public_reviewed: öffentlich sichtbar und geprüft\n- public_official: offiziell freigegeben\n- archived: archiviert\n- blocked: gesperrt\nNiedrigrisiko-Beiträge können nach den Sichtbarkeitsregeln als `public_unverified` freigegeben werden, aber nicht automatisch als amtlich oder geprüft gelten. Faktenstatus, Dossiers und amtliche Antworten bleiben reviewpflichtig. Doxxing, Drohungen und sensible Daten werden blockiert.",
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
          "1. Vorlage lesen: Du siehst Kurztext, Begründung, Pro & Contra, Quellen und Unsicherheiten.\n2. Berechtigung prüfen: Je nach Thema kann es Kriterien geben (z. B. Region, Alter). Grundsatz bleibt: eine Person, eine Stimme.\n3. Stimme abgeben: Du stimmst digital, die Identität ist technisch vom Stimmzettel getrennt.\n4. Zählen & prüfen: Quorum, definierte Mehrheiten (z. B. 2/3 bei Grundsatzfragen) und Minderheitenbericht werden ermittelt.\n5. Sichtbar machen oder veröffentlichen: Ergebnis, Beteiligung, Minderheitenbericht und Prüfprotokoll sind je nach Kontext öffentlich einsehbar.",
      },
      {
        id: "abstimmung-2",
        question: "Was ist der Evidenz-Graph?",
        answer:
          "Der Evidenz-Graph verknüpft Aussagen mit Belegen und Gegenbelegen. Jede Aussage kann auf Quellen, Studien oder Erfahrungsberichte verweisen. Gegenpositionen und Unsicherheiten werden nicht versteckt, sondern sichtbar gemacht. So kannst du nachvollziehen, warum eine Entscheidung inhaltlich sinnvoll erscheint – oder wo du selbst noch Kritik siehst. Kurz gesagt: Lass das beste Argument gewinnen.",
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
        id: "mitmachen-3d",
        question: "Woher kommen Regionen, Verwaltungsdaten und Geobezüge?",
        answer:
          "Für Regionen nutzt eDebatte zuerst eine RegionRegistry aus Destatis GV-ISys / Gemeindeverzeichnis. Ein OfficialDirectory führt die Anschriften der Gemeinde- und Stadtverwaltungen. Eine GeoBoundaryRegistry auf Basis von BKG VG250 oder Eurostat GISCO und eine StatsRegistry auf Basis von GENESIS / Regionalstatistik sind spätere Ausbaustufen. XLSX, CSV und APIs sind dabei Importquellen, keine Runtime-Abhängigkeit und keine behauptete externe Register-Live-Integration.",
      },
      {
        id: "mitmachen-3e",
        question: "Was braucht eine Verwaltung oder Organisation im Dashboard?",
        answer:
          "Ein Verwaltungs- oder Organisationsdashboard braucht mindestens Status, Region, Freischaltung, Rollen, offene Reviews sowie Dossier- und Anlassraum-Drafts. Dazu gehört auch eine review-first vorstrukturierte Themenlage für die jeweilige Region. Das Dashboard ist damit nicht nur eine Nutzerliste, sondern der operative Review- und Arbeitsraum.",
      },
      {
        id: "mitmachen-3f",
        question: "Was sieht eine Verwaltung oder Organisation?",
        answer:
          "Eine Verwaltung oder Organisation soll im eigenen Arbeitsraum Status, Region, Freischaltung, Rollen, offene Reviews, Dossier- und Anlassraum-Drafts sowie die review-first vorstrukturierte Themenlage ihrer Region sehen. Das ist ein Review- und Arbeitsraum, nicht bloß eine Liste von Nutzerkonten.",
      },
      {
        id: "mitmachen-3g",
        question: "Was sieht die Öffentlichkeit?",
        answer:
          "Die Öffentlichkeit sieht nur, was entlang der Sichtbarkeits- und Prüfregeln freigegeben ist. Niedrigrisiko-Beiträge können nach Freigabe öffentlich sichtbar werden. Dossiers, Faktenstatus und amtliche Antworten bleiben bis zur Prüfung reviewpflichtig. Interne Reviews, Freischaltungen und Verwaltungsentwürfe sind nicht automatisch öffentlich.",
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
          "eDebatte soll sich langfristig über viele kleine Beiträge tragen: Mitgliedschaften, einmalige Gutschriften und Nutzung der Plattform durch Organisationen. So bleibt die Bewegung unabhängig. Es gibt keine Datenverkäufe und keine versteckten AI-Kosten. Details zur aktuellen Finanzierungslogik findest du im Transparenzbericht.",
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
