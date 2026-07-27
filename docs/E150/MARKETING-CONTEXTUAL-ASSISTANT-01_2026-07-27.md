# MARKETING-CONTEXTUAL-ASSISTANT-01 — Umsetzungsevidenz

Stand: 2026-07-27  
Status: `review` nach technischer Integration  
Issue: `#475`

## Ziel

`/admin/marketing` und `/admin/marketing/insights` erhalten einen kompakten, kontextbezogenen Marketing-Assistenten. Er erklärt den belegten Kampagnenstand, weist auf Datenlücken hin und bietet höchstens drei priorisierte nächste Schritte in bereits vorhandene Arbeitsbereiche an.

Der Slice führt keinen separaten Chat-Kosmos und keine neue Agenten-, Graph-, Queue- oder Persistenzwelt ein.

## Umgesetzt

### Typisierter Assistentenvertrag

`apps/web/src/features/marketing/assistant/contracts.ts`

Der Vertrag begrenzt den Assistenten auf:

- Kontext `portfolio`, `campaign` oder `insights`,
- verständliche deutsche und englische Zusammenfassung,
- Datenqualität und Confidence,
- nachvollziehbare Belege,
- ausdrücklich fehlende Daten,
- maximal drei eindeutig priorisierte Aktionen,
- `automationAllowed: false`.

### Deterministisches Readmodel

`apps/web/src/features/marketing/assistant/readModel.ts`

Das Readmodel nutzt ausschließlich:

- MarketingCampaign-Control-Profile,
- Content-Operations-Einträge,
- DistributionRecords,
- MarketingMetricSnapshots,
- bestehende Datenqualitätswerte.

Fehlende Daten werden nicht als Misserfolg, Null-Performance oder ROI interpretiert.

### Betreiberoberfläche

`apps/web/src/features/marketing/assistant/AssistantPanel.tsx`

Die kompakte Fläche zeigt:

1. wichtigste Beobachtung,
2. Datenlage,
3. Confidence,
4. aufklappbare Belege und Grenzen,
5. maximal drei anklickbare nächste Schritte.

Der Assistent erscheint:

- im Marketingcockpit,
- im Kontext einer ausgewählten Kampagne,
- in der Performance-/Insights-Fläche.

### Reale Arbeitswege

Der erste Slice verlinkt ausschließlich auf bereits vorhandene Ziele:

- `/admin/editorial/queue`,
- `/admin/marketing`,
- `/admin/marketing/insights`.

Die noch nicht implementierte Route `/admin/marketing/connections` wird nicht als toter Verweis ausgegeben.

## Guardrails

- read-only,
- kein Auto-Publish,
- keine Terminierung,
- keine Kampagnen- oder Budgetmutation,
- keine Providerverbindung,
- keine unsichtbare Delegation,
- keine freie Behauptung ohne Readmodel-Grundlage,
- keine individuellen Nutzerreisen oder politischen Profile,
- keine internen Chain-of-Thought-Inhalte,
- keine Änderungen an `/create`, `/runden`, `/dossier`, Root-Layouts, Tokens oder Shared Components.

## Tests

Fokussierte Tests prüfen:

- Schema und maximal drei Aktionen,
- ausschließlich reale Admin-Links,
- kampagnenbezogenen Kontext,
- ehrliche Darstellung fehlender Messdaten,
- deutsche und englische Betreiberansicht,
- Integration in Cockpit und Insights,
- weiterhin keine Fantasiewerte oder ROI-Aussagen.

## Verbleibende Folgearbeit

- Produkt-Sichtprüfung des Assistenten,
- OpenTasks nach Merge von `codex_ready` auf `review` ziehen,
- Issue `#476` / `MARKETING-ASSISTANT-AUTOMATION-02` bleibt blockiert,
- Issue `#474` / `MARKETING-CONNECTIONS-CONTROL-PLANE-03` bleibt `manual_gate`, bis ein realer Provider- oder CSV-Weg end-to-end freigegeben ist.
