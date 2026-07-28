# MARKETING-WORKSPACE-OPERABILITY-01

Stand: 2026-07-28  
Status: implementation_review  
Issue: #497

## Anlass

Die Produktabnahme zeigte:

- `/admin/marketing/review` war nicht dauerhaft sichtbar,
- ein veralteter lokaler Build führte zu einem 404, obwohl die Route auf `main` existierte,
- Seitenwechsel erzeugten lange leere Übergänge,
- fünf gleichgewichtete Kennzahlkarten priorisierten Nullen statt Arbeit,
- Kampagnen und Assistent beanspruchten zu viel vertikalen Raum,
- die Oberfläche wirkte wie Reporting statt wie ein täglicher Operator-Workspace.

## Umsetzung

### Lokaler Marketing-Workspace

Unter `/admin/marketing/**` existiert ein lokales verschachteltes Layout mit dauerhaft sichtbarer Navigation:

- Cockpit,
- Kampagnen,
- Inhalte & Freigaben mit echtem Review-Count,
- Ergebnisse.

Es wurden keine Root-Layouts, globalen Tokens oder breit verwendeten Shared Components verändert.

### Ladezustand

Ein lokales `loading.tsx` hält Navigation und Kontext sichtbar und zeigt Skeletons sowie einen verständlichen Ladehinweis. Kein schwarzer oder vollständig leerer Übergang innerhalb des Marketing-Teilbaums.

### Operator-first Cockpit

- kompakter Kopf,
- Handlungszeile `Heute wichtig`,
- direkter Review-Button mit echtem Count,
- Filter kompakt zusammengefasst,
- Assistent als kurze priorisierte Arbeitsliste,
- Kampagnen als kompakte Liste statt 13 großer Karten,
- zusätzliche Kampagnenangaben aufklappbar,
- Content-, Kampagnendetail- und Datenquellenwahrheit bleibt erhalten.

### Performance-nahe Maßnahmen

- persistentes Layout reduziert wahrgenommene Vollseitenabbrüche,
- Next-Links für wahrscheinliche Zielrouten werden vorgeladen,
- URL-abhängige Navigation ist mit Suspense begrenzt,
- kein neuer Provider- oder Datenbankzugriff,
- Readmodels bleiben deterministisch und serverseitig.

## Grenzen

Nicht enthalten:

- Kampagnen- oder Caption-Bearbeitung,
- Freigabemutation,
- Delegation und Verantwortlichen-Workflow,
- Kalender oder Drag-and-drop,
- Scheduling und Publishing,
- Provider- oder CSV-Import,
- neue globale Workspace-Architektur.

Diese Folgearbeit benötigt Persistenz-, Audit- und PublishApproval-Verträge und bleibt separat.

## Abnahme vor `done`

- `/admin/marketing` auf Desktop und Mobile visuell prüfen,
- permanente Navigation und Review-Count prüfen,
- `/admin/marketing/review` direkt aus der Navigation öffnen,
- Ladezustand bei kaltem Route-Wechsel prüfen,
- Filter und Kampagnendetails prüfen,
- keine tote Marketingroute oder leere Platzhalterfläche.
