# E150 Master Spec – Part 9: Community Research, Follow-up & Newsletter

## 1. Zweck dieses Dokuments

Part 09 baut direkt auf:

- Part05 (Orchestrator E150),
- Part06 (Consequences & Fairness),
- Part07 (Graph & Structured Knowledge),
- Part08 (Eventualities & DecisionTrees)

auf und definiert:

1. **Community-Research-Workflow**  
   – wie offene Fragen, Eventualitäten, Lücken und Konflikte an die Community ausgespielt werden.

2. **Follow-up-Mechanik**  
   – wie unbearbeitete Fragen, Eventualitäten oder Konflikte später erneut aufgegriffen werden.

3. **Newsletter & Recap-Formate**  
   – wie Bürger:innen wöchentlich/monatlich eine sinnvolle Zusammenfassung bekommen (Themen, Impact, offene Baustellen).

4. **Rollen & XP-Integration**  
   – wie Engagierte, Begeisterte, Brennende Bürger ihre Expertise einbringen und dafür XP/Level erhalten.

5. **Schnittstellen für B2G/B2B**  
   – wie Gemeinden/Unternehmen offene Punkte sehen, beauftragen und auswerten können.

Ziel:  
Aus einer „reinen Analyse-Plattform“ wird ein **dauerhafter, gemeinschaftlicher Forschungs- und Klärungsprozess**.

---

## 2. Motivation: Warum Community-Research?

Viele Fragen bleiben nach Statements/Eventualitäten offen:

- „Gibt es belastbare Studien dazu?“  
- „Wie haben andere Länder das gelöst?“  
- „Welche Kosten entstehen wirklich?“  
- „Welche Alternativen wurden noch nicht beleuchtet?“

Statt teure (externe) Think-Tanks zu bemühen, können:

- **Brennende** und **Inspirierende** Bürger:innen,
- Expert:innen aus der Community,
- B2G/B2B-Partner

gezielt an solchen offenen Punkten arbeiten.

---

## 3. Zentrale Konzepte

### 3.1 ResearchTask

Ein ResearchTask ist eine strukturierte „Bitte um Vertiefung“.

```ts
type ResearchTask = {
  id: string;
  sourceType: "statement" | "question" | "knot" | "eventuality" | "consequence";
  sourceId: string;          // Referenz auf Graph-Node oder StatementId
  title: string;
  description: string;       // Was genau soll recherchiert/erklärt werden?
  locale: string;
  tags: string[];
  region?: string;           // wenn relevant (z.B. Kommune)
  difficulty: "low" | "medium" | "high";
  status: "open" | "in_progress" | "review" | "done" | "archived";
  createdBy: string;         // userId oder "system"
  assignedTo?: string;       // userId oder orgId (optional)
  createdAt: string;
  updatedAt?: string;
};
3.2 ResearchContribution
Ein Community-Mitglied kann eine oder mehrere Antworten/Quellen liefern:

ts
Code kopieren
type ResearchContribution = {
  id: string;
  taskId: string;
  userId: string;
  summary: string;           // eigene Zusammenfassung
  sources: {
    url: string;
    title?: string;
    snippet?: string;
  }[];
  locale: string;
  createdAt: string;
  reviewedBy?: string;       // staff/council
  reviewStatus?: "pending" | "accepted" | "rejected" | "needs_changes";
  reviewComment?: string;
};

### 3.3 Strukturierte Community-Beitraege (Pilot PR-0011)

Zusatzpfad fuer den Pilot:
- ContributionType: `source` | `option` | `question` | `impact` | `view`
- Status: `proposed` → `approved` oder `rejected`
- Referenz: `topicId` oder `candidateId`

Ziel: schnelle, moderierbare Inputs fuer Quellen, Optionen und offene Fragen.
4. Wie entstehen ResearchTasks?
4.1 Automatisch aus E150/E200 (system)
Folgende Trigger erzeugen automatisch Tasks:

Statement mit vielen Swipes, aber:

wenig oder keinen Consequences,

oder klaren Konflikten (Knots),

oder offenen Fragen (Questions ohne Antwort/Quellen).

Eventualität mit hohem Impact, aber geringer Begründung.

B2G/B2B-Kampagne, deren Fragen vertieft werden sollen:

z.B. „Welche Kosten hat Option A in den letzten 10 Jahren verursacht?“

4.2 Durch User
Brennende/Inspirierende Bürger:innen können:

aus einem Statement heraus auf „Research-Aufgabe erstellen“ klicken,

einen Titel + Beschreibung + Links hinzufügen,

Aufgaben an Community oder bestimmte Gruppen übergeben.

4.3 Durch Gemeinden/Unternehmen (Org)
B2G/B2B-Konten (siehe Part04) können:

„Research-Briefings“ erstellen,

„Bitte die 3 wichtigsten Studien zu diesem Thema finden.“

„Wie haben es andere Städte gemacht?“,

diese Tasks werden öffentlich (anonymisiert) oder nur intern ausgespielt.

5. Workflow-Phasen
5.1 Phase 1 – Erstellung
Status: open

Task wird erzeugt (system / user / org).

Task hängt an konkrete Quelle (Statement, Question, Eventuality, etc.).

XP-Potential und Difficulty werden gesetzt (z.B. difficulty: "medium").

5.2 Phase 2 – Übernahme
Status: in_progress

Bürger:innen mit genügend XP/Level:

können Task „claimen“,

sehen Deadlines (optional),

bekommen XP-Vorschau (z.B. 50–150 XP).

5.3 Phase 3 – Abgabe
Status: review

ResearchContribution wird erstellt,

verknüpfte Quellen werden angegeben,

erste automatische Checks (z.B. Dubletten, offensichtliche Fake-Quellen).

5.4 Phase 4 – Review
Status: review → done | needs_changes | rejected

Staff oder Council prüfen:

Verständlichkeit,

Quellenqualität,

Fairness (keine Einseitigkeit),

keine Werbung / Agenda.

Bei accepted:

Contribution fließt in Reports, Graph, Szenarien ein,

XP werden vergeben (z.B. 35–200 XP je nach Difficulty).

5.5 Phase 5 – Integration
Status: done

Ergebnisse werden an:

Graph (Nodes/Edges),

Reports (Summary + Quellen),

Eventualitäten (Zusatzinfos),

Streams (Themenkarten)

angeschlossen.

6. XP & Level Integration (Part02)
6.1 XP für Research
Vorschlag:

einfache Recherche (low) → 35 XP

mittlere Recherche (medium) → 75 XP

tiefe Recherche (high) → 150 XP

besonders wertvoll (vom Council markiert) → Bonus 100 XP

6.2 Level-Gates
ResearchTasks können Level-Gates haben:

z.B. „mindestens Engagiert für diese Aufgabe“,

oder „mindestens Brennend“ bei sensiblen Themen.

Council-Review vorzugsweise durch:

Inspirierend,

Leuchtend,

Staff mit Spezialrolle.

Codex MUSS diese Gates über can(user, "take_research_task") etc. abbilden.

7. UI/UX – Community-Research
7.1 Research Hub
Route: /research oder /community/research

Elemente:

Task-Liste:

Filter: Themen, Regionen, Schwierigkeitsgrad, Status.

Task-Detailseite:

Quelle (Statement/Eventuality),

offene Fragen,

bisherige Contributions,

Take-Button.

Eigene Tasks:

„Meine offenen Aufgaben“,

Historie,

XP-Gewinne.

7.2 From Statement/Eventuality
Button: „Unklar? Lass es die Community erforschen“

Modal:

Titel vorschlagen,

Beschreibung,

Tags/Region,

absenden → erzeugt ResearchTask.

8. Follow-up & Newsletter
8.1 Wöchentlicher Newsletter (B2C)
E-Mail-Summary (oder In-App-Feed) z.B.:

„Top-Themen dieser Woche in deiner Region“

„Neu beantwortete Fragen“

„Offene Baustellen (ResearchTasks), die deine Region betreffen“

„Streams & Events zum Thema X“

Datengrundlage:

Graph (Part07),

Eventualities (Part08),

ResearchTasks & Contributions (Part09).

8.2 B2G/B2B-Reports
Gemeinden/Unternehmen bekommen:

„Was ist seit der letzten Kampagne passiert?“

„Wie hat sich das Meinungsbild verändert?“

„Welche Research-Aufgaben wurden erledigt?“

„Welche offenen Punkte gibt es noch?“

Output-Formate:

PDF,

Web-Dashboards,

JSON-Exports (später).

9. Umgang mit unbeantworteten Fragen
Du hast explizit gesagt:

„Es wird nichts ignoriert – unbeantwortete Fragen sollen an die Community gehen.“

Daraus folgt:

Jede offene Frage aus AnalyzeResult.questions kann (optional) einen ResearchTask erzeugen.

Verwaltungslogik:

pro Statement max. X Tasks,

Duplikate werden zusammengeführt.

UI zeigt:

„Offene Fragen zu diesem Thema (3)“

Klick → Research-Details.

Codex MUSS:

deduplizierte Task-Erstellung implementieren,

Mechanismen für „Frage bereits in Arbeit“ anzeigen,

Unklarheiten nicht einfach verwerfen.

## 9.5 Offene Aufgaben / Phase 2

Die erste Implementierungsrunde (Part09 – Phase 1) deckt Domain-Modelle, Admin-UI,
User-Board und XP-Awarding ab. Folgende Punkte bleiben explizit offen:

1. Seeding „Key Research Tasks“
   - Aus offenen Questions/Knots/Eventualities werden initiale ResearchTasks erzeugt.
   - Ziel: Navigator- und Impact-Daten praktisch nutzbar machen, ohne manuelle Erfassung.

2. Research Board – Filter & Sortierung
   - Filter nach Level (Beginner/Intermediate/Expert), Tags, Topic, Region.
   - Sortierung z.B. nach „neueste“, „dringend“, „meiste offenen Contributions“.

3. Feedback für Contributors
   - Review-Status + Review-Notizen für eingereichte Contributions sichtbar machen.
   - Leichte Benachrichtigungen (z.B. Badge, Hinweis im Profil oder einfache Notification-Liste).

4. Rückfluss in Statements & Graph
   - Akzeptierte ResearchContributions sollen:
     - an Statements/Eventualities angehängt werden (z.B. zusätzliche Quellen, Fakten),
     - in den Graph (Knowledge/Impact) einfließen für spätere Reports.

5. Anti-Spam / Abuse-Schutz
   - Rate Limits oder Cooldowns pro User/Task.
   - Evtl. Mindest-Engagement-Level für bestimmte Task-Level.
   - Eindeutige Audit-Logs für Moderation.


10. B2G/B2B-Anbindung (Part04)
10.1 Gemeinden
können Tasks markieren als:

„kritisch für nächsten Ausschuss“,

„Hintergrund für Ratssitzung“,

„Schwerpunkt fürs Quartal“.

können entscheiden:

welche Research-Results in offizielle Beschlussvorlagen einfließen.

10.2 Unternehmen
nutzen Research für:

Mitarbeiterbeteiligung,

Kulturfragen,

interne Policy-Fragen.

können Tasks intern halten (nicht öffentlich)
→ Flag: visibility: "public" | "org_only".

11. Codex-Anweisungen (kompakt)
Codex MUSS:

ResearchTask & ResearchContribution als Typen + DB-Modelle implementieren.

API-Routen anlegen:

POST /api/research/tasks

GET /api/research/tasks

POST /api/research/contributions

GET /api/research/tasks/:id

UI-Seiten erstellen:

/research (Hub)

/research/tasks/:id

Einstiegspunkte in:

/statement/*

/contributions/*

/admin/*

XP-Vergabe-Logik für Research in das XP-System (Part02) integrieren.

Admin-Review-Panel für Research-Contributions bauen:

Status-Wechsel,

Review-Kommentare,

XP-Freigabe.

Newsletter/Recap-Datenquellen vorbereiten:

Query-Funktionen für „Top-Themen“, „Neue Antworten“, „Offene Tasks“.

PII & Fairness-Standards (Part00/Part06) einhalten:

keine personenbezogenen Daten in Tasks/Summaries,

Quellenhinweise ohne Doxxing/Tracking.

B2G/B2B-Spezialansichten „Research“ vorbereiten:

Filter nach Organisation,

Sichtbarkeit.

12. Summary
Part09 macht deutlich:

Eventualitäten (Part08) sind nicht Endpunkt, sondern Start,

aus offenen Fragen werden konkrete Aufgaben,

aus Aufgaben werden Research-Beiträge,

aus Research wird Wissen im Graph (Part07),

aus Wissen werden Reports & Entscheidungen (B2G/B2B),

Bürger:innen erhalten Anerkennung (XP/Level),

Gemeinden/Unternehmen erhalten wertvolle Unterstützung,

ohne die demokratische Balance oder Neutralität zu verlieren.

Damit ist der Kreis zwischen:
Analyse → Eventualitäten → Community-Research → Reports → Impact
vollständig geschlossen.
