# MARKETING-CONTEXTUAL-ASSISTANT-UX-FIX-01 — Umsetzungsevidenz

Stand: 2026-07-27  
Status: `review` nach technischer Integration  
Issue: `#490`

## Anlass

Die Produktabnahme von PR `#478` per Bildschirmaufnahme hat gezeigt, dass der Assistent zwar zwei reviewfähige Marketinginhalte korrekt erkennt, sein CTA jedoch auf die allgemeine MongoDB-Editorial-Queue verweist. Dort sind diese repo-backed `MarketingContentOperation`-Einträge nicht enthalten.

Zusätzlich waren Handlungshierarchie, Sicherheitsdarstellung und Informationsdichte noch nicht operator-tauglich.

## Umgesetzt

### Wahrer Marketing-Reviewweg

Neue read-only Route:

`/admin/marketing/review`

Die Ansicht liest ausschließlich die kanonischen Marketing-Content-Operations und zeigt:

- alle `review_ready` Marketinginhalte,
- aktuell exakt zwei Einträge,
- optional einen Kampagnenfilter,
- Caption- und Script-Entwürfe,
- Kanäle, CTA und konkreten Prüfauftrag,
- Rücksprung in den Kampagnenkontext.

Die allgemeine Editorial Queue bleibt fachlich getrennt. Es gibt keine stille Migration oder Vermischung mit MongoDB-`EditorialItem`s.

### Korrigierte Handlungshierarchie

- Reviewfähige Marketinginhalte verlinken auf `/admin/marketing/review`.
- Kampagnen ohne Inhalte empfehlen zuerst `Inhalt und Briefing vorbereiten`.
- Kanal- und Terminplanung wird nur empfohlen, wenn bereits konkrete Inhalte existieren.
- Messplan und Datenlage bleiben als nachgelagerter, belegpflichtiger Schritt sichtbar.

### Verständliche Sicherheit

Die Oberfläche zeigt nicht mehr pauschal `25 % Sicherheit`.

Stattdessen trennt sie:

- `Bestandsdaten: Verifiziert`,
- `Empfehlungssicherheit: Niedrig / Mittel / Hoch`,
- eine verständliche Begründung für die qualitative Einordnung.

Die numerische Confidence bleibt intern im typisierten Contract, wird aber nicht als scheinpräzise Betreiberkennzahl ausgegeben.

### Kompakteres Marketingcockpit

- zusätzlicher Inhaltsfilter `Alle Inhalte / Zur Freigabe`,
- Caption und Script aufklappbar in der Beitragskarte,
- Kampagnendetails in einem kompakten Raster,
- Datenquellen zunächst als `0 von 6 verbunden`,
- einzelne Datenquellen nur aufklappbar,
- stärkere CTA-Darstellung in Assistentenaktionen.

### Operator-first Editorial Queue

Der bestehende Editorial-Series-/Governance-Block bleibt funktional erhalten, wird in der Queue aber:

- standardmäßig eingeklappt,
- visuell nach der konkreten Tabellenarbeit angeordnet,
- als `Status- und Governance-Details` bezeichnet.

Andere Verwendungen des Editorial-Series-Panels bleiben unverändert.

## Guardrails

- read-only Marketing-Reviewansicht,
- kein Auto-Publish,
- keine Terminierung oder Budgetmutation,
- keine neue Datenbank oder globale Queue,
- keine Migration von Marketinginhalten in EditorialItems,
- keine Provider- oder CSV-Anbindung,
- keine Änderungen an `/create`, `/runden`, `/dossier`, Root-Layouts oder Design-Tokens.

## Tests

Fokussierte Tests decken ab:

- exakt zwei reviewfähige Marketinginhalte,
- Kampagnenfilter und einzelne Content-Anker,
- keine Links auf die allgemeine Editorial Queue,
- content-first Handlungshierarchie,
- qualitative statt prozentuale Empfehlungssicherheit,
- kompakte Datenquellenanzeige,
- deutscher und englischer Operatorfluss,
- nachrangige Governance-Details in der Editorial Queue.

## Verbleibend

- visuelle Desktop-/Mobile-Nachprüfung,
- OpenTasks nach Merge von `codex_ready` auf `review` ziehen,
- Issue `#475` bleibt bis zur erneuten Produktabnahme auf `review`,
- echte Freigabemutation, Aufgabenübergabe, Terminierung und Distribution bleiben separate Folgearbeit.
