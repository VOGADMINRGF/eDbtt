# RELEASE-GATE-LONGRUN-QA-01

Stand: 2026-05-24

## Ziel

Den Production-v1-Releasepfad fuer `apps/web` auf einen reproduzierbaren, lokalen und Vercel-paritaetsnahen Freigabelauf verdichten, ohne neue Produktlogik.

## Kanonischer Release-Command

```bash
pnpm run release:validate:production
```

Der Command startet `scripts/release/validate-production.mjs`.

## Was der Gate-Lauf verbindlich macht

1. Node-Runtime wird gegen `.nvmrc` und `package.json#engines` geprueft.
2. Wenn der Aufruf nicht unter Node 20.x laeuft, startet sich das Gate ueber `nvm use` selbst unter `.nvmrc` neu.
3. pnpm wird gegen `package.json#packageManager` geprueft.
4. Lokales `NODE_ENV` wird fuer Child-Commands neutralisiert, damit Build-/Lint-/Test-Lauf nicht von einem zufaelligen Shell-Zustand abhaengen.
5. Ein Lockfile (`apps/web/.release-validation.lock`) verhindert parallele Gate-Laeufe.
6. Page Contracts laufen vor den teureren Schritten.
7. Die definierte Smoke-Matrix laeuft seriell.
8. `apps/web/.next` wird vor dem Release-Build immer geloescht.
9. Der frische Web-Build laeuft vor dem expliziten Web-Typecheck, damit `.next/types` nicht durch Reihenfolge oder Parallelitaet driftet.
10. Web-Typecheck und Web-Lint laufen anschliessend explizit noch einmal.

## Smoke-Matrix

Der Gate-Lauf buendelt die produktkritischen Produktionspfade:

- `/create` Surface und Handoff-Persistenz
- Organisationsdashboard
- Betreiber-Review
- Source Connections
- Material Intake
- Factcheck/Seal-Request
- Dossier Public Route
- Topic Public Page
- Runden Public Input
- Billing/Pricing Orders
- Auth/Request Scope

Aktuell konkret:

```bash
pnpm -C apps/web exec vitest run \
  tests/create-mode.page.test.ts \
  tests/create-handoff.persistence.route.test.ts \
  tests/account-organization-dashboard.page.test.tsx \
  tests/admin-review.page.test.tsx \
  tests/admin-region-source-connections.route.test.ts \
  tests/uploads-material-intake.route.test.ts \
  tests/factcheck-enqueue.auth.route.test.ts \
  tests/dossier-public-route.contract.test.tsx \
  tests/topic-public-page.contract.test.tsx \
  tests/runden-public-input.route.test.ts \
  tests/admin-pricing-orders.route.test.ts \
  tests/request-scope-context.test.ts
```

## Releasable vs. Nicht releasable

Ein Commit gilt als releasable, wenn:

- `pnpm run release:validate:production` komplett gruen ist
- der Lauf unter Node 20.x und dem festgelegten pnpm erfolgt
- der frische Web-Build nach `.next`-Reset gruen ist
- der anschliessende Web-Typecheck gruen ist
- der anschliessende Web-Lint gruen ist
- der Vercel-Deploy fuer denselben Commit ohne lokale Sondergriffe gruen bleibt

Nicht pushen / nicht freigeben, wenn:

- der Gate-Lauf rot ist
- Node oder pnpm nicht zur Repo-Definition passen
- ein paralleler Gate-Lauf oder ein stale Lock ungeprueft im Weg steht
- `.next` nur durch Nebenlaeufe oder manuelle Reihenfolge gruen wird
- der Commit lokal nur mit nicht dokumentierten Zusatz-ENV oder Sonderkommandos baut

## Tag-Konventionen

Vor dem Deploy:

```bash
git tag -a release-check/web-v1-YYYYMMDD-HHMM-SHA7 -m "local release gate green"
```

Nach gruenem Vercel-Deploy:

```bash
git tag -a release-ready/web-v1-YYYYMMDD-HHMM-SHA7 -m "vercel ready"
```

## Vercel Ready Check

Ein Commit ist erst `Vercel Ready`, wenn:

- der lokale Release-Gate-Lauf gruen war
- der Web-Build lokal ohne `.next`-Altzustand gruen war
- der Vercel-Build fuer denselben Commit gruen ist
- keine zusaetzlichen lokalen Patches, ENV-Tricks oder Retry-Sonderwege noetig waren

## Rollback-Anker

- Der letzte `release-ready/web-v1-*`-Tag ist der primaere Rollback-Anker.
- Vor einem neuen produktiven Push sollte immer ein neuer `release-check/web-v1-*`-Tag gesetzt werden.
- Rollback bedeutet: auf den letzten gruenen `release-ready`-Commit zurueckgehen und denselben Release-Gate-Lauf erneut bestaetigen.

## Umgang mit roten Builds

- Nie rote Gates pushen, nur weil einzelne Teiltests lokal schon einmal gruen waren.
- Zuerst Runtime-Mismatch, Lockfile, `.next`-Zustand und die erste rot markierte Stufe klaeren.
- Danach den kompletten Gate-Command erneut laufen lassen, nicht nur den zuletzt roten Einzelbefehl als alleinige Freigabebasis.

## Umgang mit `.next`-Lock oder Node-Mismatch

- Bei aktivem `apps/web/.release-validation.lock` zuerst klaeren, ob noch ein Gate-Lauf aktiv ist.
- Nur stale Locks entfernen, wenn sicher kein anderer Lauf mehr aktiv ist.
- Bei Node-Mismatch nicht mit der falschen Runtime weiterpruefen; der Gate-Command wechselt ueber `.nvmrc` auf Node 20.x.
- Wenn `nvm` fehlt, ist der Lauf nicht release-faehig, bis Node 20.x bewusst hergestellt ist.

## Ergebnis

`RELEASE-GATE-LONGRUN-QA-01` ist damit fuer v1 als interner Releasepfad geschlossen:

- ein kanonischer Command
- eine fest verdrahtete Smoke-Matrix
- kein paralleler `.next`-Race im Gate selbst
- frischer Build als Pflicht
- dokumentierte Vercel-/Tag-/Rollback-Lesart

Nicht Ziel dieses Slices:

- neue Produktlogik
- neue CI-Pipeline
- automatische Tagging- oder Deploy-Automation
- Auto-Publish, Checkout oder neue AI-Logik
