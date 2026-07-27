# ADMIN-MARKETING-OPERATING-DASHBOARD-02

Stand: 2026-07-27  
Status: `review`

## Anlass

Die erste `/admin/marketing`-Registry war fachlich korrekt, aber als tägliche Betreiberoberfläche zu technisch und zu granular:

- technische Registry-/Control-Plane-Sprache dominierte,
- Kennzahlen waren nicht konsequent klickbar,
- Kampagnen, Chancen, Assets, Brandprofile, Evidence und Dateipfade standen gleichrangig nebeneinander,
- echte Ergebnisse waren nicht klar von Planung getrennt,
- Statuscodes und interne Blocker-Keys mussten vom Nutzer selbst übersetzt werden,
- aus Erkenntnissen waren keine klaren nächsten Arbeitswege ableitbar.

Die Nutzerentscheidung vom 27.07.2026 lautet:

> `/admin/marketing` soll eine verständliche Marketing-Zentrale sein. Zahlen und Ergebnisse sollen klickbar sein, nächste Aktionen sollen aus dem Befund ableitbar und in bestehende Arbeitsbereiche übergebbar sein. Demo-Werte und programmierungsorientierte Informationen gehören nicht in die operative Hauptsicht.

## Verbindlicher Scope

Dieser Slice ist ausschließlich eine fokussierte Informationsarchitektur- und Bedienbarkeitsüberarbeitung für `/admin/marketing`.

### Enthalten

- verständliche Betreiberübersicht,
- relevante Ergebnisse und Kennzahlen priorisieren,
- Zahlen und Erkenntnisse anklickbar machen,
- daraus nächste Aktionen ableiten,
- Übergaben an bereits bestehende Arbeitsbereiche ermöglichen,
- technische Detailkarten, Demos und programmierungsorientierte Informationen aus der Betreiberseite entfernen,
- `/create` als bestehende UX-Referenz respektieren.

### Nicht enthalten

- kein neues globales Designsystem,
- keine alternative Workspace-Architektur,
- keine Änderungen an `/create`, `/runden` oder `/dossier`,
- keine Änderungen an Root-Layouts, Design-Tokens oder breit verwendeten Shared Components,
- kein vollständiger Umbau des übrigen `/admin`,
- keine neue Marketing-Delegationspersistenz oder Agentenruntime,
- keine automatische Veröffentlichung oder Budgetsteuerung.

Die gemeinsame V3-Workspace-Harmonisierung für `/dossier` und `/runden` bleibt ein separater Arbeitsstrang.

## Umgesetztes Zielbild

### Primäre Betreiberperspektive

Die Oberfläche priorisiert:

1. **Bereit zur Umsetzung**
2. **Deine Entscheidung nötig**
3. **Beleg fehlt**
4. **Veröffentlicht / echte Ergebnisse**
5. **Heute wichtig**
6. verständliche Kampagnen und Chancen

Alle vier Hauptkennzahlen sind klickbar und führen in die passende gefilterte Sicht.

### Kampagnen

Kampagnen werden nicht mehr primär als technische Tabelle mit IDs und Statuscodes dargestellt. Sichtbar sind:

- Zweck und Beschreibung,
- verständlicher aktueller Zustand,
- nächster sinnvoller Schritt,
- Zielgruppe,
- vorhandene Materialien,
- Zielaktion,
- verständlich formulierte Blocker,
- passende Übergabe in einen bereits vorhandenen Arbeitsbereich.

Beispiele für bestehende Übergabeziele:

- `/admin/research/tasks`
- `/admin/evidence/items`
- `/admin/editorial/queue`
- `/admin/review`

Die Marketing-Seite erzeugt dabei keine neue Queue, keine neue Persistenz und keinen verdeckten Agentenlauf.

### Ergebnisse

- Es werden keine Demo-, Fixture- oder erfundenen Performancewerte angezeigt.
- Ohne realen `DistributionRecord` zeigt die Oberfläche einen klaren leeren Zustand.
- Reale Distributionen sind klickbar und werden mit Kampagne, Asset, Kanal, Zeitpunkt und öffentlichem Link dargestellt.
- Spätere Analytics bleiben an den bereits beschlossenen Campaign-Analytics-Contract gebunden.

### Technische Details

Assets, Brandprofile, Evidence, Registry-Quellen, IDs und Dateipfade werden auf `/admin/marketing` nicht mehr ausgegeben – auch nicht in einem aufklappbaren Bereich. Die kanonische technische Wahrheit bleibt unverändert im Registry-Readmodel, in der geschützten Read-only-API, in den Contracts, im Repository und in den Tests verfügbar. Die Betreiberansicht bleibt dadurch konsequent auf Ergebnisse, Entscheidungen und nächste Aktionen begrenzt.

## Dateien

- `apps/web/src/app/admin/marketing/page.tsx`
- `apps/web/src/features/marketing/registry/readModel.ts`
- `apps/web/src/app/admin/adminNav.ts`
- `apps/web/tests/admin-marketing.page.test.tsx`
- diese E150-Evidenz

Nicht verändert werden insbesondere:

- `/create`,
- `/runden`,
- `/dossier`,
- Root-Layouts,
- Design-Tokens,
- Shared Components,
- globale Workspace-Architektur.

## Offene PRs und Dateikollisionen

Vor der finalen Scope-Bereinigung wurden offene PRs geprüft:

- PR `#457` verändert `docs/E150/OpenTasks.md` und kollidiert damit mit jedem weiteren direkten OpenTasks-Schreibzugriff.
- PR `#454` / `#455` bilden den separaten kanonischen OpenTasks-Sync-Pfad.
- PR `#460` verändert keine Dateien aus `/create`, `/runden`, `/dossier`, Root-Layouts, Design-Tokens oder Shared Components.

Daher wird `docs/E150/OpenTasks.md` nicht im Produkt-PR `#460` verändert. Die Folgearbeit wird im kanonischen OpenTasks-Sync nach Auflösung der bestehenden Dateikollision manifestiert.

## Guardrails

- keine automatische Veröffentlichung,
- keine automatische Budgetänderung,
- keine erfundenen Ergebnisse,
- keine personenbezogenen Marketingprofile,
- keine Provider-Credentials,
- keine Änderung an Beteiligungskampagnen unter `/admin/campaigns`,
- keine neue Queue oder Delegationsruntime,
- keine heutige Umstrukturierung anderer Admin-Boards.

## Folgearbeit für alle Admin-Boards

Issue `#459` / `ADMIN-BOARD-INFORMATION-ARCHITECTURE-03` hält die allgemeine Nutzerentscheidung fest:

Nach erfolgreicher Produktabnahme von `/admin/marketing` sollen die übrigen Admin-Boards nach demselben Muster geprüft und schrittweise vereinfacht werden:

- Ergebnis, Risiko, Entscheidung und nächste Aktion zuerst,
- Kennzahlen klickbar,
- Übergabe nur in reale vorhandene Workflows,
- technische Diagnosedaten nachrangig,
- keine Demo-/Docs-only-Werte als operative Wahrheit,
- redundante oder rein technische Flächen konsolidieren,
- keine stillen Rollen-, Routing- oder Governanceänderungen.

Der Folgeslice bleibt bis zur erfolgreichen Abnahme dieses Marketing-Referenzprojekts `blocked`.
