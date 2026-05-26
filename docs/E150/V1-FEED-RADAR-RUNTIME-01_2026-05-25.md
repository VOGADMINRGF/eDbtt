# V1-FEED-RADAR-RUNTIME-01

Stand: 2026-05-25
Status: done
Typ: Runtime-/Surface-Hardening auf bestehenden Feed-Pfaden

## Ziel

Den Feed-Radar als ehrlichen V1-Runtime-Pfad schließen:

- `Feeds -> Pull/Import -> StatementCandidate -> Analyze -> Draft/Cluster -> Review`
- Andockung an bestehende Folgeflächen:
  - `/admin/feeds`
  - `/admin/feeds/drafts`
  - `/admin/feeds/anlassraum`
  - `/swipes`
  - `/runden`
  - `/dossier`

Ohne Auto-Publish, ohne neue Parallelarchitektur und ohne Scheduler-Behauptung.

## Umgesetzte Schwerpunkte

### 1. Shared Feed-Runtime-Statusvertrag

Neue gemeinsame Statussprache für den Feed-Radar:

- `source_registered`
- `pulled`
- `candidate_created`
- `analyzing`
- `analyzed`
- `draft_created`
- `clustered`
- `needs_review`
- `accepted`
- `attached_to_anlassraum`
- `attached_to_dossier`
- `published_update`
- `rejected`
- `error`

Verankert in:

- `features/feeds/statusContract.ts`

Die Begriffe bleiben technisch intern nutzbar, werden aber im UI in einfache deutsche Lesefassungen übersetzt.

### 2. Laufhistorie und Runtime-Readmodel

Neue Runtime-Laufhistorie:

- `feed_runtime_runs`

Verankert in:

- `features/feeds/runtimeLog.ts`
- `features/feeds/runtimeReadModel.ts`

Erfasst werden jetzt manuell ausgelöste Läufe für:

- Pull
- Batch-Import
- Analyze-Pending
- Cluster-Run

Mit:

- Start-/Endzeit
- Erfolg/Dry-Run/Fehler
- Zählern
- Fehlerhinweis

### 3. `/admin/feeds` als produktnaher Leitstand

Nachgeschärft:

- `apps/web/src/app/admin/feeds/page.tsx`
- `apps/web/src/app/api/admin/feeds/runtime/route.ts`

Ergebnis:

- echte Runtime-Zähler statt nur Konfiguration
- sichtbare letzte Läufe
- ehrliche Fehlerhinweise
- nächste sinnvolle Aktion
- sichtbarer B2C-Anschluss auf bestehende Flächen
- expliziter Hinweis, dass der Pfad manuell/cron-ready ist, aber kein laufender Scheduler behauptet wird

### 4. Feed-Drafts können an `/swipes` andocken

Nachgeschärft:

- `apps/web/src/features/swipes/service.ts`
- `apps/web/src/features/swipes/types.ts`
- `apps/web/src/app/swipes/SwipesClient.tsx`
- `apps/web/src/features/surfaces/swipes/components/SwipeDetailSheet.tsx`

Ergebnis:

- wenn `statement_proposals` leer oder nicht tragfähig sind, können review- bzw. published-Feed-Drafts als bestehender Fallback dienen
- `fromDraft` bleibt ehrlich: keine Fake-Matches
- Feed-Vorschläge werden als Vorschlag/Update gerahmt, nicht als Wahrheit
- Dossier-Link nutzt, wenn vorhanden, den echten Dossier-Anschluss statt eines generischen Blindflugs

### 5. `/runden` markiert feed-/clusterbasierte Anlässe lesbar

Nachgeschärft:

- `apps/web/src/app/runden/page.tsx`

Ergebnis:

- feed- und clusterbasierte Anlässe zeigen jetzt explizit einen Quellenhinweis
- Anlassraum bleibt öffentlicher Bürgerraum, ohne aus Feed-Signalen automatisch Wahrheit oder Amtlichkeit abzuleiten

## Geänderte Dateien

- `features/feeds/statusContract.ts`
- `features/feeds/runtimeLog.ts`
- `features/feeds/runtimeReadModel.ts`
- `features/feeds/publicHandoff.ts`
- `apps/web/src/app/api/feeds/pull/route.ts`
- `apps/web/src/app/api/feeds/batch/route.ts`
- `apps/web/src/app/api/feeds/analyze-pending/route.ts`
- `apps/web/src/app/api/admin/feeds/cluster/run/route.ts`
- `apps/web/src/app/api/admin/feeds/runtime/route.ts`
- `apps/web/src/app/admin/feeds/page.tsx`
- `apps/web/src/features/swipes/service.ts`
- `apps/web/src/features/swipes/types.ts`
- `apps/web/src/app/swipes/SwipesClient.tsx`
- `apps/web/src/features/surfaces/swipes/components/SwipeDetailSheet.tsx`
- `apps/web/src/app/runden/page.tsx`
- `apps/web/tests/feed-radar-status-contract.test.ts`
- `apps/web/tests/feeds-analyze-to-draft-runtime.contract.test.ts`
- `apps/web/tests/feed-anlassraum-cluster-review.contract.test.ts`
- `apps/web/tests/admin-feeds-runtime-dashboard.contract.test.tsx`
- `apps/web/tests/feed-radar-public-handoff.contract.test.ts`
- `apps/web/tests/v1-feed-radar-runtime.contract.test.ts`
- `apps/web/tests/swipes-feed.arrival.test.ts`
- `docs/E150/OpenTasks.md`

## Validierung

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/feed-radar-status-contract.test.ts tests/feeds-analyze-to-draft-runtime.contract.test.ts tests/feed-anlassraum-cluster-review.contract.test.ts tests/admin-feeds-runtime-dashboard.contract.test.tsx tests/feed-radar-public-handoff.contract.test.ts tests/v1-feed-radar-runtime.contract.test.ts`

Zusätzlich revalidiert:

- `pnpm -C apps/web exec vitest run tests/swipes-feed.arrival.test.ts tests/admin-feed-drafts.page.test.tsx tests/runden-public-anlassraum-status.contract.test.tsx tests/dossier-public-handoff-linking.contract.test.tsx`

## Guardrails weiterhin aktiv

- keine automatische Veröffentlichung
- keine automatische amtliche Wahrheit
- keine automatische Social-Ausleitung
- kein automatisches Siegel
- keine stille zweite Review-Queue
- kein behaupteter Scheduler- oder Vollcrawler-Betrieb

## Offen / bewusst nicht Teil dieses Slices

- Social-Live-Posting
- Stream-Runtime
- Billing-/Checkout-Ausbau
- breite externe Quellenautomatisierung über die bestehenden expliziten Verbindungen hinaus
- neue öffentliche Radar-Produktfläche

## Kurzfazit

Der Feed-Radar ist jetzt als V1-Runtime-Pfad deutlich ehrlicher und geschlossener lesbar:

- Abrufe, Analyse, Drafts und Cluster werden sichtbar als Laufkette protokolliert
- Reviewpflichtige Folgepfade bleiben auf derselben Architektur
- `/admin/feeds` ist vom Konfigurationsscreen zum Leitstand aufgewertet
- `/swipes` und `/runden` können Feed-Ergebnisse anschließen, ohne Auto-Publish oder Wahrheitsprivileg zu behaupten
