# V1-PRODUCTION-FINAL-QA-LOCK-01

Stand: 2026-05-26  
Repo: `VOGADMINRGF/edebatte-org`

## Ziel des QA-Locks

Den lokal umgesetzten V1-Gesamtstand vor dem Commit als ehrlichen `production_candidate` fuer einen kontrollierten oeffentlichen B2C-/Pilotbetrieb absichern:

- keine neue Produktwelt
- keine Live-Connector-Behauptung
- kein Auto-Publish
- kein Streaming-Encoding- oder Billing-Ausbau
- keine grossen Layout-/`global.css`-Umbauten ausser bei echtem Blocker

## Gepruefte V1-Slices

- `V1-B2C-PRODUCTION-CLOSURE-01`
- `V1-FEED-RADAR-RUNTIME-01`
- `V1-DOSSIER-UPDATE-ENGINE-01`
- `V1-SOCIAL-DISTRIBUTION-QUEUE-01`
- `V1-STREAM-PUBLIC-RUNTIME-01`

## Worktree- und Artefaktpruefung

- `git status --short` geprueft
- keine `.next/`, `node_modules/`, `.env.local`, Logs oder offensichtlichen Secret-Artefakte zum Commit vorgesehen
- die offenen Aenderungen gehoerten zum V1-Gesamtstand und wurden nicht zurueckgesetzt
- keine bewusst commitpflichtigen Screenshots/Binaries festgestellt

## Geaenderte Dateien im QA-Lock

QA-Lock-Doku:

- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/V1-PRODUCTION-FINAL-QA-LOCK-01_2026-05-25.md`

Kleiner Runtime-/Build-Fix im Zuge des QA-Locks:

- `apps/web/src/components/outputEngine/SocialDistributionPanel.tsx`
- `apps/web/tests/social-distribution-queue-readmodel.contract.test.ts`
- `apps/web/tests/v1-social-distribution-queue.contract.test.ts`

Hinweis:

- der Gesamtcommit enthaelt daneben die bereits lokal umgesetzten V1-Slice-Aenderungen aus Create, Feed-Radar, Dossier, Social-Queue und Stream

## Routen-/Surface-Befund

Gepruefte oeffentliche/B2C-Pfade:

- `/start`
- `/create`
- `/swipes`
- `/runden`
- `/anlassraum`
- `/dossier/[id]`
- `/stream`
- `/pricing`
- `/pricing/institutionen`

Gepruefte arbeits-/adminnahe Pfade:

- `/admin/feeds`
- `/admin/review`
- `/admin/dossiers/[id]`
- `/atlas/social-review`
- `/dossier/[id]/studio`
- `/account/organization/dashboard`

Befund:

- keine Auto-Publish- oder Auto-`public_official`-Behauptung im V1-Hauptpfad gefunden
- keine Fake-Social-Connectoren oder Fake-Live-Posting-Claims im oeffentlichen Hauptpfad gefunden
- `/swipes`, `/runden`, `/dossier/[id]` und `/stream/[slug]` rahmen Review-first weiterhin sichtbar
- Dossier-, Runden- und Stream-Pfade blocken generische Demo-Ersatzbehauptungen im produktnahen Pfad bewusst
- `/admin/feeds` und `/account/organization/dashboard` enthalten weiterhin explizite Demo-/Test-Hinweise, aber in operatorischen Kontexten und nicht als irrefuehrende Public-CTA
- kein offensichtlicher oeffentlicher Haupt-CTA wurde auf einen Admin-, Demo- oder 404-Fallback umgebogen

## Demo-/Seed-/Live-Trennung

- Demo-Flachen bleiben als Demo gekennzeichnet
- Seed-/Fallback-Copy in produktnahen Handoff-/Review-Kontexten wurde nicht als reale Produktwahrheit behauptet
- Social Distribution bleibt Queue-/Export-/Planungsruntime ohne externe Connectoren
- Stream bleibt Beteiligungsruntime mit optionalem Embed, nicht Videoplattform
- Feed-Radar bleibt manuell beziehungsweise cron-ready, aber ohne behaupteten Scheduler-Dauerbetrieb

## Gelaufene Commands

Pflichtchecks:

- `pnpm -w -r typecheck`
- `pnpm -w -r lint`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/v1-b2c-production-journey.contract.test.ts tests/v1-feed-radar-runtime.contract.test.ts tests/v1-dossier-update-engine.contract.test.ts tests/v1-social-distribution-queue.contract.test.ts tests/v1-stream-public-runtime.contract.test.ts tests/create-b2c-handoff-closure.contract.test.tsx tests/swipes-handoff-arrival.contract.test.tsx tests/runden-public-anlassraum-status.contract.test.tsx tests/dossier-public-handoff-linking.contract.test.tsx tests/feed-radar-public-handoff.contract.test.ts tests/dossier-public-update-context.contract.test.tsx tests/social-review-queue-v1.contract.test.tsx tests/stream-public-runtime.contract.test.tsx`

Zusaetzlich:

- `pnpm --filter @vog/web build`

Hinweis zum Laufbild:

- ein paralleler Build-/Typecheck-Versuch erzeugte einmalig ein `.next/types`-Race (`TS6053` auf fehlende `.next/types/...` Dateien), waehrend `next build` die Types neu schrieb; der relevante Typecheck wurde danach seriell erneut ausgefuehrt und war gruen

## Testergebnisse

Gruen:

- Workspace-Typecheck
- Workspace-Lint
- Web-Typecheck
- Web-Lint
- V1-Contract-Bundle: `13` Testdateien, `15` Tests, alle gruen
- Web-Build

Gefundener und behobener QA-Lock-Fix:

- `v1-social-distribution-queue.contract.test.ts` scheiterte zunaechst an einem ungueltigen In-Memory-Repo-Import
- der Fix blieb bewusst klein:
  - Tests fuer `createInMemorySocialDistributionRepo` und `setSocialDistributionRepoForTests` auf den bestehenden direkten Runtime-Import zurueckgelegt
  - `SocialDistributionPanel` von serverseitigen Re-Exporten aus `@features/outputEngine/index.ts` auf client-sichere Direktimporte umgestellt

## Build-Ergebnis

- `pnpm --filter @vog/web build` erfolgreich
- page-contract check vor dem Build erfolgreich

## Bewusst offene Post-V1-Punkte

- `SOCIAL-LIVE-CONNECTORS-POST-V1`
- `BILLING-CHECKOUT-POST-V1`
- `STREAM-VIDEO-ENCODING-POST-V1`
- `WRAPPER-STORE-RELEASE-POST-V1`
- `ADVANCED-SOURCE-AUTOMATION-POST-V1`

Diese Punkte bleiben bewusst offen, sind aber keine aktuellen V1-Blocker.

## Finale ehrliche Go-live-Aussage

V1 ist als `production_candidate` fuer einen kontrollierten oeffentlichen B2C-/Pilotbetrieb lesbar. Die Kernkette aus Create, Swipes, Anlassraum/Runden, Dossier, Feed-Radar, Dossier-Updates, Social-Queue und Stream-Beteiligung ist review-first geschlossen. Nicht enthalten sind echtes Social-Live-Posting, externe Social-Connectoren, Billing-Finalisierung, echtes Video-Encoding und vollautomatische amtliche Veroeffentlichung.
