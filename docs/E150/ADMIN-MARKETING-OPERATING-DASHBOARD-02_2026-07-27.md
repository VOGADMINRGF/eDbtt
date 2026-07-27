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
- Arbeit konnte nicht als realer Auftrag delegiert werden.

Die Nutzerentscheidung vom 27.07.2026 lautet:

> `/admin/marketing` soll eine verständliche Marketing-Zentrale sein. Zahlen und Ergebnisse sollen klickbar sein, Aufgaben sollen sinnvoll delegiert werden können, Demo-Werte und programmierungsorientierte Informationen gehören nicht in die operative Hauptsicht.

## Umgesetztes Zielbild

### Primäre Betreiberperspektive

Die Oberfläche priorisiert nun:

1. **Bereit zur Umsetzung**
2. **Deine Entscheidung nötig**
3. **Aktiv delegiert**
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
- Delegationsmöglichkeit.

### Ergebnisse

- Es werden keine Demo-, Fixture- oder erfundenen Performancewerte angezeigt.
- Ohne realen `DistributionRecord` zeigt die Oberfläche einen klaren leeren Zustand.
- Reale Distributionen sind klickbar und werden mit Kampagne, Asset, Kanal, Zeitpunkt und öffentlichem Link dargestellt.
- Spätere Analytics bleiben an den bereits beschlossenen Campaign-Analytics-Contract gebunden.

### Delegation

Neu ist eine reale, serverseitig validierte Marketing-Delegationsqueue.

Zulässige Ziele:

- `marketing_operator`
- `research_operator`
- `content_operator`
- `analytics_operator`

Delegierbar sind:

- MarketingCampaigns,
- MarketingOpportunities.

Jeder Auftrag wird ausschließlich aus kanonischen Registry-Objekten erzeugt. Freie, ungeprüfte Prompttexte werden nicht aus dem Browser übernommen.

Jeder Delegationsrecord enthält:

- Objektart und kanonische ID,
- Titel,
- zuständige Operatorrolle,
- konkretes Ziel,
- erwartete Ergebnisse,
- anfordernden Admin,
- Zeitstempel und Status,
- `requiresHumanReview: true`,
- `autoExecute: false`,
- `autoPublish: false`.

Der bestehende Admin-/2FA-Gate schützt GET und POST. PATCH, DELETE und Publishing-Endpunkte sind nicht Teil dieses Slices.

### Technische Details

Assets, Brandprofile, Evidence, Registry-Quellen, IDs und Dateipfade bleiben für Audit und Fachprüfung vorhanden, erscheinen aber nur noch in einem aufklappbaren Fach- und Technikbereich.

## Dateien

- `apps/web/src/app/admin/marketing/page.tsx`
- `apps/web/src/app/admin/marketing/MarketingDelegateControl.tsx`
- `apps/web/src/app/api/admin/marketing/route.ts`
- `apps/web/src/app/api/admin/marketing/delegations/route.ts`
- `apps/web/src/features/marketing/delegations/contracts.ts`
- `apps/web/src/features/marketing/delegations/repository.ts`
- `apps/web/src/features/marketing/registry/readModel.ts`
- `apps/web/src/app/admin/adminNav.ts`
- fokussierte Marketingtests

## Guardrails

- keine automatische Veröffentlichung,
- keine automatische Budgetänderung,
- keine erfundenen Ergebnisse,
- keine personenbezogenen Marketingprofile,
- keine Provider-Credentials,
- keine Änderung an Beteiligungskampagnen unter `/admin/campaigns`,
- keine heutige Umstrukturierung anderer Admin-Boards.

## Folgearbeit für alle Admin-Boards

Issue `#459` / `ADMIN-BOARD-INFORMATION-ARCHITECTURE-03` hält die allgemeine Nutzerentscheidung fest:

Nach erfolgreicher Produktabnahme von `/admin/marketing` sollen die übrigen Admin-Boards nach demselben Muster geprüft und schrittweise vereinfacht werden:

- Ergebnis, Risiko, Entscheidung und nächste Aktion zuerst,
- Kennzahlen klickbar,
- reale Delegation nur über vorhandene Workflows,
- technische Diagnosedaten nachrangig,
- keine Demo-/Docs-only-Werte als operative Wahrheit,
- redundante oder rein technische Flächen konsolidieren,
- keine stillen Rollen-, Routing- oder Governanceänderungen.

Der Folgeslice bleibt bis zur erfolgreichen Abnahme dieses Marketing-Referenzprojekts `blocked`.
