# PUBLIC-MODERATION-OPERATIONS-07

## Ausgangslage nach #274

Nach `#274` waren die produktkritischen Public-, Review-, Publish- und
Activation-Pfade für Dossier, Anlassraum und Beteiligungsraum geschlossen und
durch einen manuellen Production-Validation-Contract abgesichert. Für
öffentliche Community-Hinweise gab es bereits:

- die gehärtete Public-Submission-API
- den kleinen öffentlichen Einstieg auf veröffentlichten
  `/beteiligung/[slug]`-Räumen
- die Community-Source-Review-Workbench in `/admin/review`

Die bestehende Workbench konnte Status, Priorität, Signale, Audit, Archivierung
und interne Notizen tragen, hatte aber noch keine kleine, explizite
Operations-Sicht für Queue, SLA/Aging, Owner-Status und Eskalationsdruck.

## Vorhandene Community-Source-Review-Workbench

Vor diesem Slice waren die folgenden Strukturen bereits vorhanden:

- `communitySourceReviewContribution.ts`
  - typed review-first Hinweisarten
- `communitySourceReviewModeration.ts`
  - Moderations-, Abuse-, Spam-, Trust- und Source-Quality-Signale
- `communitySourceReviewServer.ts`
  - persistente Records und Audit-Events für denselben Review-Pfad
- `communitySourceReviewWorkbench.ts`
  - Status-, Prioritäts- und Guardrail-Lesart für `/admin/review`
- `AdminCommunitySourceReviewSection.tsx`
  - kleine Moderationsoberfläche mit Actions und Audit-Anzeige

Wichtig für diesen Slice:

- Es existierten keine belastbaren persistierten Owner-/Assignee-Felder.
- Es existierte keine echte Teamverwaltung.
- Es existierte keine gesonderte SLA-/Inbox-/Schicht-Runtime.

Deshalb bleibt dieser Slice bewusst ein Operations-Readmodel- und
UI-Härtungsschnitt.

## Neue Operations Summary

`/admin/review` zeigt jetzt oberhalb der Community-Moderationsliste eine kleine
Operations Summary mit:

- `Aktive Hinweise`
- `Ohne Bearbeiter`
- `Eskaliert`
- `Überfällig / Stale`
- `Quellenprüfung`
- `Redaktionelle Prüfung`

Die Summary ist rein operativ. Sie zeigt Bearbeitungsdruck, aber keine
Wahrheits- oder Veröffentlichungslogik.

## Queue Buckets

Im bestehenden Workbench-Modul wurde eine kleine Operations-Lesart ergänzt:

- `new`
- `queued_for_moderation`
- `needs_source_review`
- `needs_editorial_review`
- `escalated`
- `overdue`
- `stale`
- `blocked_or_rejected`
- `archived`

Dabei gilt bewusst:

- `hidden`, `rejected` und `archived` zählen nicht als aktive Queue.
- `needs_source_review` und `needs_editorial_review` bleiben eigene Buckets.
- `escalation_request` und `escalated` werden operativ sichtbar priorisiert.

## SLA-/Aging-Status

Für dieselben Review-Items gibt es jetzt eine einfache, konstante
SLA-/Aging-Lesart:

- `on_track`
- `aging`
- `stale`
- `overdue`
- `escalated`

Die Schwellen bleiben bewusst klein und technisch:

- `aging` ab 24h
- `stale` ab 72h
- `overdue` ab 120h

`escalated` übersteuert diese Lesart für Eskalationsfälle.

Wichtig:

- SLA dient nur der Bearbeitungspriorität.
- SLA erzeugt keine automatische Entscheidung.
- SLA ist keine Aussage über Wahrheit, Relevanz oder Verifikation.

## Owner-State

Da das persistierte Modell noch keine belastbare Owner-Runtime enthält, wird nur
eine ehrliche Readmodel-Lesart gezeigt:

- `unassigned`
- `assigned`
- `needs_owner`
- `system_owned`

Im aktuellen Slice tritt praktisch vor allem `needs_owner` auf, wenn ein aktives
Item keinen expliziten Owner trägt. Das ist bewusst nur Sichtbarkeit:

- Owner State ist nicht Approval.
- Owner State ist keine Rollenfreigabe.
- Owner State erzeugt keine Aktion von selbst.

## Escalation Handling

Eskalation wird jetzt expliziter als Operationssignal gespiegelt:

- `escalation_request` und `escalated` landen im Eskalationsbucket
- Eskalation beeinflusst Priorisierung und Operations-Flags
- Eskalation bleibt getrennt von Wahrheit, Beweis und Verifikation

Die UI trägt dazu bewusst Guardrail-Copy:

- `Betriebsstatus, keine Bewertung der Wahrheit.`
- `SLA dient der Bearbeitungspriorität.`
- `Eskalation ist kein Beweis.`

## Pro Item sichtbare Operations-Felder

Jedes Workbench-Item zeigt jetzt zusätzlich:

- Queue Bucket
- SLA/Aging-Status
- Owner State
- Operational Flags
- letzte Aktivität
- Alter

Die bestehende Workbench bleibt dabei dieselbe Moderationsoberfläche. Es wurden
keine neuen Owner-/Assign-/Team-Aktionen ergänzt, weil das Modell dafür keine
persistente Grundlage hat.

## Was bewusst nicht gebaut wurde

Dieser Slice baut bewusst nicht:

- keine neue Öffentlichkeit
- kein neues Community-System
- keine neue Teamverwaltung
- keine RBAC-Großbaustelle
- keine Benachrichtigungslogik
- keine SLA-Automation
- keine Auto-Publish- oder Auto-Activation-Logik
- keine Fact-Verifikation
- keine Source-Verifikation
- keinen Graph-Write
- keinen Merge
- keine Dossier-/Anlassraum-/Beteiligungsraum-Erstellung
- keinen versteckten DeepSearch-/Kostenpfad

## Guardrails

- Operations Status is not truth
- SLA is prioritization only
- escalation is not proof
- owner state is not approval
- no auto publish
- no auto activation
- no fact verification
- no source verification
- no graph write
- no merge
- no dossier/anlassraum/beteiligungsraum creation
- no hidden DeepSearch/cost path
- no public leak of internal ops/audit data

## Tests / Build

Lokal validiert mit:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/public-moderation-operations.test.ts tests/public-moderation-operations-ui.test.tsx tests/community-source-review-workbench.test.ts tests/community-source-review-workbench-ui.test.tsx tests/admin-review.page.test.tsx`
- `pnpm -C apps/web run build`
- `git diff --check`

## Offene Folgepfade

- `MODERATION-TEAM-RBAC-08`
- `MODERATION-NOTIFICATIONS-08`
- `EXTERNAL-BROWSER-SMOKE-08`
- `MONITORING-ALERTING-08`
- `ROLLBACK-AUTOMATION-08`

## Ergebnis

Public Moderation Operations sind jetzt als kleine, ehrliche
Operations-Readmodel-Schicht `operational-basic / runtime-wired`:

- dieselbe review-first Runtime
- mehr betriebliche Sichtbarkeit
- keine neue Moderationswelt
- keine Team-/Owner-Runtime-Behauptung
- keine Wahrheits-, Verifikations- oder Publish-Automation
