# V2-SOURCE-FEED-AUTOMATION-01

## Ziel

Bestehende Quellen und Feeds als guarded automation betreiben: health-aware, backoff-fähig, cron-ready und review-first, ohne Vollcrawler, ohne Auto-Publish und ohne ungesteuerten Scheduler-Dauerbetrieb.

## Umsetzung

- Neue per-Source-Automation-Schicht in `features/feeds/sourceAutomation.ts`
  - Contract mit `sourceId`, `organizationId`, `regionId`, `sourceType`, `healthStatus`, `lastPullAt`, `nextSuggestedPullAt`, `errorCount`, `backoffUntil`, `signalCount`, `reviewCandidateCount`, `automationMode`
  - per-Source-State für Feed-Referenzen
  - gemeinsames Readmodel über Feed-Refs und manuelle Source-Connections
  - Health-Klassen: signalstark, rauschanfällig, fehlerhaft, still, im Backoff, noch nicht abgerufen, nur manuell geprüft, deaktiviert
- Pull-Route `apps/web/src/app/api/feeds/pull/route.ts`
  - schreibt nach jedem Feed-Lauf pro Quelle einen Guarded-Automation-Status
  - Fehler erhöhen sichtbaren Backoff statt still weiterzulaufen
  - neue Signale bleiben review-first
- Feed-Runtime `features/feeds/runtimeReadModel.ts`
  - erweitert um `sourceAutomation`
  - Themenradar-Handoff bleibt derived/readmodel und verweist auf `/admin/themenradar?mode=autonomous`
- Admin-Feed-Leitstand `apps/web/src/app/admin/feeds/page.tsx`
  - neuer Block „Quellen-Health“
  - zeigt Signal-Lieferanten, Rauschen, Stille, Fehler/Backoff, Themenradar-Anschluss und nächste Aktion
  - auch im Lade-/Placeholder-Zustand ehrliche Guarded-Automation-Copy

## Geänderte Dateien

- `features/feeds/sourceAutomation.ts`
- `features/feeds/runtimeReadModel.ts`
- `apps/web/src/app/api/feeds/pull/route.ts`
- `apps/web/src/app/admin/feeds/page.tsx`
- `apps/web/tests/source-feed-automation-test-helpers.ts`
- `apps/web/tests/source-feed-automation-contract.test.ts`
- `apps/web/tests/source-feed-health-readmodel.contract.test.ts`
- `apps/web/tests/source-feed-backoff.contract.test.ts`
- `apps/web/tests/source-feed-review-first-snapshot.contract.test.ts`
- `apps/web/tests/source-feed-themenradar-handoff.contract.test.ts`
- `apps/web/tests/admin-feeds-runtime-dashboard.contract.test.tsx`
- `docs/E150/OpenTasks.md`

## Tests und Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/source-feed-automation-contract.test.ts tests/source-feed-health-readmodel.contract.test.ts tests/source-feed-backoff.contract.test.ts tests/source-feed-review-first-snapshot.contract.test.ts tests/source-feed-themenradar-handoff.contract.test.ts`
- `pnpm -C apps/web exec vitest run tests/admin-feeds-runtime-dashboard.contract.test.tsx`
- `pnpm run release:validate:production`

## Ergebnis

- Feed-Referenzen haben jetzt einen sichtbaren Automationsstatus statt nur globaler Laufhistorie.
- Fehler führen zu sichtbarem Backoff, nicht zu unehrlichem „läuft schon irgendwie weiter“.
- Source-Connections bleiben ehrlich manuell/review-first und werden nicht als aktiver Scheduler ausgegeben.
- Neue Signale bleiben Vorschläge für Review, Dossier, Anlassraum oder Themenradar; es gibt keinen Auto-Publish- oder Amtlichkeitsclaim.
- `FEED-CRAWLER-SCALE-V2-01` bleibt bewusst separater Folge-Slice für spätere breitere Crawler-/Scale-Logik.
