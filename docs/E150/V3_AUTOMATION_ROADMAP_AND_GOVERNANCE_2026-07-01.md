# V3 Automation Roadmap and Governance

## 1. Executive Summary

- V3 startet nach abgeschlossener V2-Plattformreife.
- V3 bedeutet kontrollierte Automatisierung vor Entscheidungen.
- `#277` bleibt damit die Governance-Basis, aber nicht die vollstaendige
  V3-Gesamtkarte.
- V3 bedeutet nicht automatische Veroeffentlichung, Wahrheit oder
  Verifikation.
- Admin bleibt Kontrollinstanz.
- Jede Automatisierung muss testbar, auditierbar und abschaltbar sein.

Dieses Dokument ist ein docs-only Startslice fuer V3. Es baut keine neue
Runtime-Logik, keine neue Admin-UI und keine Automatisierung.

Die breitere V3-Lesart als gefuehrte Betriebs- und Automatisierungsreife wird
ergaenzend in `docs/E150/V3_TOTAL_SCOPE_READINESS_MAP_2026-07-01.md`
kanonisiert.

## 2. V3 Grundsatz

Automatisierung darf vorbereiten, priorisieren, buendeln, vorschlagen und
warnen.

Automatisierung darf nicht ohne Review veroeffentlichen, verifizieren, mergen
oder oeffentliche Wahrheit behaupten.

## 3. Erlaubte Automatisierung

- automatische Priorisierung von Review Items
- Vorschlaege fuer naechste Bearbeitungsschritte
- Dossier-Vorschlaege aus Review-Material
- Anlassraum-Vorschlaege aus geprueften Kontexten
- Beteiligungsraum-Vorschlaege nach redaktioneller Freigabe
- Quellen-/Kontext-Clustering als Hinweis
- DeepSearch-Vorschlaege nur nach explizitem Cost Gate
- Admin Summary
- Risiko-/Guardrail-Warnungen
- SLA-/Queue-Warnungen
- Handout-/Nutzungsanleitungen generieren oder aktualisieren

## 4. Verbotene Automatisierung

- Auto-Publish
- Auto-Activation
- Auto-Factcheck
- Auto-Verification
- Auto-Graph-Write
- Auto-Merge
- Auto-Dossier-publication
- Auto-Anlassraum-publication
- Auto-Beteiligungsraum-publication
- Hidden DeepSearch
- Hidden Cost Paths
- Public Truth Claims
- Review bypass

## 5. Admin-/Dashboard-Befaehigung

V3 hat ein klares Pflichtziel: Admin muss die zentralen Pfade sehen und steuern
koennen.

Admin muss sehen und steuern koennen:

- offene Review Items
- Moderation Operations
- Dossier Publish Status
- Anlassraum Activation/Publish Status
- Beteiligungsraum Publish Status
- Handoff Status
- V3 Automation Suggestions
- Cost Gate / DeepSearch Status
- Guardrail Warnings
- Test-/Production Validation Status
- offene Verknuepfungen
- fehlgeschlagene Handoffs
- manuelle Override-/Block-/Reject-Moeglichkeiten

Der aktuelle Stand ist dafuer noch verteilt ueber mehrere Flaechen:

- `/admin` als Operator-Konsole mit Links auf Review-, Feed-, Telemetry- und
  Dashboard-Pfade
- `/admin/review` als zentrale review-first Workbench fuer Dossier-,
  Anlassraum-, Beteiligungsraum- und Community-Moderationspfade
- `/admin/feeds` fuer Feed-/Handoff- und Runtime-Gesundheit
- `/admin/telemetry/ai/orchestrator` und angrenzende Telemetry-Pfade fuer
  AI-/Ops-Sicht
- `/account/organization/dashboard` fuer organisationsnahe Freigabe-,
  Release- und Scope-Sichten

Falls aktuelle Admin-Flaechen das noch nicht vollstaendig leisten, ist das ein
V3-Folgepfad und kein Build-Ziel dieses Slices.

## 6. Verknuepfungs-/Handoff-Modell

Bestehende Pfade:

- Public Submission -> Community Source Review
- Community Source Review -> Workbench
- Review Material -> Dossier Runtime / Publish
- Review Material -> Anlassraum Runtime / Activation / Publish
- Review Material -> Beteiligungsraum Runtime / Public Route
- Publish/Activation -> Public Readmodels
- Moderation Operations -> Admin Review Dashboard
- Production Validation -> Release Gate

Aktueller Befund:

- Public Submission -> Community Source Review ist runtime-wired ueber
  `/api/community/source-review/submissions`,
  `communitySourceReviewPublicSubmission.ts` und die kleine Public-Form auf
  veroeffentlichten `/beteiligung/[slug]`-Raeumen.
- Community Source Review -> Workbench ist runtime-wired ueber
  `communitySourceReviewWorkbench.ts`, `communitySourceReviewServer.ts`,
  `AdminCommunitySourceReviewSection` und `/admin/review`.
- Review Material -> Dossier Runtime / Publish ist runtime-wired ueber
  `createHandoffReviewQueue.ts`, `dossierRuntime.ts`,
  `dossierPublishWorkflow.ts`, zugehoerige Server-Module und die
  review-first Admin-Sektionen.
- Review Material -> Anlassraum Runtime / Activation / Publish ist runtime-wired
  ueber `anlassraumRuntime.ts`, `anlassraumActivationWorkflow.ts` und die
  zugehoerigen Admin-Pfade.
- Review Material -> Beteiligungsraum Runtime / Public Route ist runtime-wired
  ueber `participationSpaceRuntime.ts`,
  `participationSpacePublishWorkflow.ts` und die public-safe
  `/beteiligung`-Readmodels.
- Publish/Activation -> Public Readmodels ist ueber Dossier-,
  Anlassraum- und Beteiligungsraum-Public-Route-Tests abgesichert.
- Moderation Operations -> Admin Review Dashboard ist runtime-wired als
  review-first Operations-Readmodel, aber noch keine Team-/RBAC-/Notification-
  Runtime.
- Production Validation -> Release Gate ist als manueller GitHub-Actions-
  Contract verdrahtet, nicht als Auto-Deploy.

Luecken, die V3 schliessen soll:

- Welche Handoffs sind vollstaendig runtime-wired und welche nur
  review-context?
- Welche Verknuepfungen muessen im Admin/Dashboard explizit sichtbar werden?
- Wo fehlen Integrity-Pruefungen, Fehlerlesarten oder Linkage-Maps?
- Welche Suggestions duerfen vorbereitet, aber nie automatisch ausgefuehrt
  werden?

Nicht automatisch erlaubt:

- keine automatische Dossier-Erstellung oder -Veroeffentlichung
- keine automatische Anlassraum-Aktivierung oder -Veroeffentlichung
- keine automatische Beteiligungsraum-Veroeffentlichung
- kein Review-Bypass zwischen Submission, Queue, Publish und Public Route

## 7. Teststrategie V3

Pflicht: Jeder V3-Slice braucht Tests.

Testkategorien:

- Unit Tests fuer Automation Decision Models
- Guardrail Tests
- Admin UI Tests
- Handoff Tests
- Public Route Leak Tests
- Cost Gate Tests
- DeepSearch Governance Tests
- Production Validation / Smoke Tests
- Regression Tests fuer `no auto publish`, `no auto activation`, `no graph`
  und `no merge`

Akzeptanzdefinition:

Kein V3-Slice darf ohne Tests gemerged werden, wenn er Logik oder UI aendert.

Bestehende Testbasis, auf der V3 aufbauen kann:

- Admin-Review- und Community-Source-Review-UI-Tests
- Dossier-/Anlassraum-/Beteiligungsraum-Publish- und Public-Route-Tests
- Handoff- und Create-Review-Queue-Contracts
- no-auto-publish- und no-auto-activation-Guardrail-Tests
- Production-Validation-Checks fuer `git diff --check`, `typecheck`, `lint`
  und `build`

## 8. Handout-Zielbild

Am Ende von V3 muss ein detailliertes Nutzungshandout entstehen:

- `docs/E150/HANDOUT_ADMIN_NUTZUNG_EDEBATTE_V3.md`

Das Handout soll spaeter erklaeren:

- Gesamtlogik V1/V2/V3
- Admin Review starten
- Public Submissions pruefen
- Moderation Queue lesen
- Quellenhinweise bewerten, ohne Wahrheit zu behaupten
- Dossier Publish Workflow nutzen
- Anlassraum Activation/Publish nutzen
- Beteiligungsraum Publish/Public Route nutzen
- Automation Suggestions pruefen
- DeepSearch/Cost Gate freigeben oder ablehnen
- Guardrail Warnings verstehen
- Production Validation ausfuehren
- was Admin nie automatisiert tun lassen darf
- Fehlerfaelle / Rollback / Block / Reject

In diesem Slice wird nur Zielbild plus Handout-Stub angelegt. Das ist noch
keine finale Nutzungsanleitung.

## 9. V3 Slice-Roadmap

Empfohlene Reihenfolge:

1. `V3-ADMIN-DASHBOARD-CONTROL-CENTER-01`
   Ziel: zentrale Kontrollflaeche fuer Review, Publish, Handoffs, Automation
   Suggestions, Guardrail Warnings und Production Validation Status.
2. `V3-HANDOFF-INTEGRITY-AND-LINKAGE-MAP-01`
   Ziel: alle Verknuepfungen zwischen Submission, Review, Dossier,
   Anlassraum, Beteiligungsraum und Public Readmodels pruefbar machen.
3. `V3-AUTOMATION-SUGGESTION-ENGINE-01`
   Ziel: automatisierte Vorschlaege, aber keine Entscheidungen.
4. `V3-DEEPSEARCH-COST-GOVERNANCE-01`
   Ziel: DeepSearch nur mit explizitem Cost Gate, Audit und Admin Approval.
5. `V3-ADMIN-HANDOUT-AND-USAGE-GUIDE-01`
   Ziel: detailliertes Handout fuer Admin-/Redaktionsnutzung.
6. `V3-EXTERNAL-BROWSER-E2E-01`
   Ziel: echte Browser-Smokes und Route Checks.
7. `V3-MONITORING-ALERTING-ROLLBACK-01`
   Ziel: Betrieb, Observability, Alerts und begrenzter Rollback-Pfad.
8. `V3-MODERATION-RBAC-NOTIFICATIONS-01`
   Ziel: Team-Rollen, Zuweisung, Benachrichtigungen und echte
   SLA-Automation.

Weitere bereits angelegte V3-Folgepfade wie
`V3-AI-ORCHESTRATION-REVIEW-PREPARATION-01` bleiben davon unberuehrt und
starten nicht automatisch mit diesem Slice.

## 10. Akzeptanzkriterien fuer V3 insgesamt

V3 ist erst reif, wenn:

- Admin Dashboard die zentralen Pfade sichtbar macht
- alle Handoffs testbar sind
- jede Automatisierung review-first bleibt
- alle Automation Suggestions auditierbar sind
- DeepSearch nie ohne Cost Gate laeuft
- Handout aktuell ist
- Production Validation plus E2E Smoke existiert
- Monitoring/Alerting/Rollback zumindest basic vorhanden sind
- Tests fuer alle kritischen Pfade existieren

## 11. Risiken / offene Punkte

- V3 ist noch nicht gebaut.
- Admin Dashboard ist aktuell verteilt ueber Admin-, Review-, Feed-, Telemetry-
  und Dashboard-Flaechen.
- Handoff Integrity muss systematisch geprueft werden.
- Handout darf erst final werden, wenn UI und Flows stabil sind.
- DeepSearch Governance ist noch offen.
- Browser E2E, Monitoring und Rollback sind noch offen.

## Ergebnis

Der kanonische Startstand fuer V3 lautet:

- V3 startet nach abgeschlossener V2-Plattformreife.
- V3 ist review-first Vorbereitung, nicht automatische Entscheidung.
- Admin bleibt Kontrollinstanz.
- Jede spaetere V3-Logik- oder UI-Aenderung braucht Tests.
- Dieses Dokument bleibt die Automations- und Guardrail-Basis; die breitere
  V3-Gesamtkarte wird getrennt dokumentiert.
