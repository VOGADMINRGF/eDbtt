# POST-MERGE-PRODUCTION-SMOKE-22

## Geprüfter Stand

- Branch: `main`
- Geprüfter Commit: `bf1446f6`
- Commit-Titel: `fix(build): split account client server imports`
- Kontext: PR `#223` (`Recover and isolate eDebatte live/create/review restdrift`) ist gemerged

## PR-223-Merge-Stand

Der gemergte Stand enthält insbesondere:

- den Live-Campaign Client/Server-Split
- den Account Graph-Merge Client/Server-Split
- den Account Editorial-Review Client/Server-Split
- den davor bereits bereinigten Planner-/Retry-Contract-Fix

Ziel dieses Slices war kein neues Feature, sondern ein produktionsnaher Nachlauf auf `main`.

## Lokale Checks

Ausgeführt:

```bash
git status --short
git log --oneline -10
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web run build
pnpm -C apps/web exec vitest run \
  tests/live-campaign-entry.contract.test.tsx \
  tests/live-media-kit.contract.test.tsx \
  tests/account-graph-candidate.contract.test.tsx \
  tests/graph-merge-candidates.contract.test.ts \
  tests/account-editorial-review.contract.test.tsx \
  tests/admin-editorial-review.page.test.tsx \
  tests/admin-editorial-review.route.test.ts \
  tests/admin-review.page.test.tsx \
  tests/account-factcheck-jobs.contract.test.tsx \
  tests/create-planner-routing.contract.test.ts \
  tests/create-planner-no-domain-heuristic-expansion.contract.test.ts \
  tests/create-degraded-followup-actions.contract.test.tsx \
  tests/voxy-guide.render.test.tsx
```

## Ergebnis

- `git status --short`: sauber vor dem Docs-Update
- `typecheck`: grün
- `lint`: grün
- `build`: grün
- fokussierte Smoke-Suite: grün (`13/13` Dateien, `41/41` Tests)

## Build-Bewertung

Der produktionsnahe `next build` lief vollständig durch. Damit bleiben die zuvor in PR #223 adressierten Client/Server-Grenzen auf `main` intakt:

- kein `triMongo`-/`mongodb`-Pfad mehr im Live-Campaign-Client
- kein `triMongo`-/`mongodb`-Pfad mehr im Account-Graph-Merge-Clientpfad
- kein `triMongo`-/`mongodb`-Pfad mehr im Account-Editorial-Review-Clientpfad

## Smoke-Test-Bewertung

Die fokussierte Suite deckt die Merge-relevanten Flächen ab:

- Live Campaign Entry
- Live Media Kit
- Account Graph Merge
- Graph Merge Repository-/Guardrail-Verhalten
- Account Editorial Review
- Admin Editorial Review Page/Route
- Admin Review Oberfläche
- Account Factcheck Jobs
- Planner Routing / no-domain heuristic expansion / degraded follow-up actions
- Voxy Guide Render

Es traten lokal keine Regressionen in diesen Kernflächen auf.

## Guardrail-Bewertung

Bestätigt:

- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Vote
- kein Auto-Graph
- kein versteckter DeepSearch-/Kostenpfad
- Factcheck bleibt review-first
- Graph Merge bleibt review-first
- Editorial Review bleibt review-first
- Live Campaign bleibt draft-/review-first
- I18N bleibt offen und wurde nicht halb implementiert

## Offene Follow-ups

Der Merge-Stand ist stabil, aber die bereits dokumentierten Folgeblöcke bleiben offen:

- `CREATE-PLACE-STREET-FOLLOWUP`
- `CREATE-PLANNER-CORE-FOLLOWUP`
- `CREATE-CLIENT-CLEANUP`
- `GLOBALS-CSS-REST-CLEANUP`
- `I18N-BILINGUAL-PRODUCT-SHELL-01`

## Empfehlung für den nächsten PR

Empfohlen als nächster Follow-up-PR:

- `CREATE-PLANNER-CORE-FOLLOWUP`

Begründung:

- der produktionskritische Build-/Client-Server-Drift ist jetzt geschlossen
- Planner-Core betrifft weiterhin zentrale Create-Pfade
- der Block ist fachlich enger und riskoärmer als ein früher Wiedereinstieg in Place/Street oder ein breiter `CreateClient`-Cleanup

Danach folgen sinnvollerweise:

1. `CREATE-CLIENT-CLEANUP`
2. `CREATE-PLACE-STREET-FOLLOWUP`
3. `GLOBALS-CSS-REST-CLEANUP`
4. `I18N-BILINGUAL-PRODUCT-SHELL-01`
