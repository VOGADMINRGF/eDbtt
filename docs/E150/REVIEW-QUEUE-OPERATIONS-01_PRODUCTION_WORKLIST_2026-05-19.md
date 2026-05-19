# REVIEW-QUEUE-OPERATIONS-01

Stand: 2026-05-19  
Issue: #174

## Ziel

Die zentrale Review-Queue sollte nicht nur aggregieren, sondern als echte operatorische Arbeitsliste nutzbar werden:

- Filter nach Typ, Status, Region, Organisation, Prioritaet, Zuweisung und Sichtbarkeit
- Sortierung nach Prioritaet, Neuheit, Typ und Region
- sichtbare Queue-Meta fuer Prioritaet, Status und Scope
- vorbereitete Zuweisung und Notizen
- auditierbare Einzelaktionen ohne neue Queue- oder Persistenzwelt

## Umsetzung

- `features/reviewQueueOperations.ts`
  - kleiner persistenter Operations-Overlay fuer bestehende Review-Items
  - Status: `open`, `in_review`, `request_changes`, `ready`, `archived`, `blocked`
  - Aktionen: `assign`, `unassign`, `add_note`, `request_changes`, `mark_in_review`, `mark_ready`, `archive`, `block`
  - Audit-Events pro Aktion
- `features/reviewQueue.ts`
  - gleiche zentrale Aggregationsquelle wie zuvor
  - Filter-/Sortier-Query fuer `/admin/review` und Dashboard
  - Queue-Prioritaet, Scope-Label, Pending-Hours, Assignment- und Notes-Meta
- `/admin/review`
  - operatorische Arbeitsliste statt reiner Readout-Kartei
  - sichtbare Queue-Status-Badges und sichere Einzelaktionen
- `/account/organization/dashboard`
  - eigene Queue-Zusammenfassung aus derselben Readmodel-Quelle

## Guardrails

- keine Bulk-Approve-Funktion
- kein Auto-Publish
- kein automatisches `public_official`
- keine automatische amtliche Antwort
- keine automatische Dossier-/Anlassraum-Finalisierung
- keine neue AI-/Source-Adapter-Logik
- keine zweite Queue-Architektur

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/review-queue.readmodel.test.ts tests/admin-review.page.test.tsx tests/admin-review-item-ops.route.test.ts tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx`
- `pnpm --filter @vog/web build`

## Ergebnis

Die zentrale Review-Queue ist jetzt operatorisch produktionsnaeher:

- dieselbe Queue bleibt die SSOT fuer Admin und Organisationsdashboard
- Operatoren koennen Queue-Items filtern, sortieren, zuweisen, kommentieren und statusseitig triagieren
- alle neuen Einzelaktionen bleiben explizit, auditierbar und ohne Publikationsautomatismus
