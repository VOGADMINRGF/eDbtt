# V1-B2C-PRODUCTION-CLOSURE-01

Stand: 2026-05-25
Status: done
Typ: Runtime-/Surface-Hardening auf bestehenden V1-Pfaden

## Ziel

Die B2C-Kernreise fuer V1 auf bestehenden Pfaden schliessen:

- `/create`
- `/swipes`
- `/runden` beziehungsweise `/anlassraum`
- `/dossier`

Ohne neue Parallelarchitektur, ohne neue Produktvision und ohne falsche Automationsbehauptungen.

## Umgesetzte Schwerpunkte

### 1. Shared B2C-Status-/Copy-Contract

Neue gemeinsame Statussprache fuer die Buergerreise:

- `eingereicht`
- `in Prüfung`
- `als Vorschlag sichtbar`
- `an Anlassraum angehängt`
- `im Dossier-Kontext`
- `für Swipes vorbereitet`
- `veröffentlicht`
- `archiviert / abgelehnt`

Verankert in:

- `apps/web/src/features/b2cJourney/statusContract.ts`

Verwendet in:

- `CreateHandoffPanel`
- `/swipes` Handoff-Shell
- `/runden`
- `/dossier/[id]`

### 2. Create -> Handoff -> Folgefläche geschlossen

`CreateHandoffPanel` zeigt jetzt konsistent:

- was verstanden wurde
- wohin der Beitrag jetzt weitergeht
- ob Review bzw. Bestätigung nötig ist
- was der nächste sinnvolle Schritt ist
- direkte Folge-Links auf bestehende Flächen

Es wurden keine neuen Zielrouten eingeführt. Handoffs bleiben auf:

- `/runden`
- `/dossier`
- `/swipes`
- bestehende Review-/Pruefpfade

### 3. Swipes-Ankunft produktnah lesbar

Nachgeschärft:

- `SwipesHandoffShell`
- Arrival-Copy in `apps/web/src/features/surfaces/swipes/arrival.ts`
- `FinalizeArrivalBanner` in `apps/web/src/app/swipes/SwipesClient.tsx`

Ergebnis:

- Ankünfte aus Create/Handoff sind als passender Beteiligungsmodus lesbar
- No-match-Fälle bleiben ehrlich
- keine künstlichen Seed-Treffer im Handoff-/fromDraft-Kontext

### 4. Anlassraum/Runden als öffentlicher Bürgerraum

Nachgeschärft:

- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/runden/RundenPublicSharingGuide.tsx`
- `features/topicRound/entrySource.ts`

Ergebnis pro Entry:

- Status sichtbar
- Beteiligungsmöglichkeit sichtbar
- Dossier-/Ergebnisbezug sichtbar
- Link/QR nur bei sinnvoller Sichtbarkeit
- Review-Hinweis bei ungeprüften Eingaben

`/anlassraum` bleibt Alias auf `/runden`.

### 5. Dossier-Anschluss sichtbar und ehrlich

Nachgeschärft:

- `apps/web/src/app/dossier/[id]/ui.tsx`

Ergebnis:

- Dossier als Kontextfläche erklärt
- Quellenlage, offene Fragen, Perspektiven, Stand/Update als Einrahmung sichtbar
- keine Demo-/Admin-Ersatzbehauptung auf produktnahen Routen

## Geänderte Dateien

- `apps/web/src/features/b2cJourney/statusContract.ts`
- `apps/web/src/features/create/CreateHandoffPanel.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/surfaces/swipes/SwipesHandoffShell.tsx`
- `apps/web/src/features/surfaces/swipes/arrival.ts`
- `apps/web/src/app/swipes/SwipesClient.tsx`
- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/runden/RundenPublicSharingGuide.tsx`
- `features/topicRound/entrySource.ts`
- `apps/web/src/app/dossier/[id]/ui.tsx`
- `apps/web/tests/create-b2c-handoff-closure.contract.test.tsx`
- `apps/web/tests/swipes-handoff-arrival.contract.test.tsx`
- `apps/web/tests/runden-public-anlassraum-status.contract.test.tsx`
- `apps/web/tests/dossier-public-handoff-linking.contract.test.tsx`
- `apps/web/tests/v1-b2c-production-journey.contract.test.ts`
- `apps/web/tests/runden-public-sharing-guide.contract.test.tsx`
- `apps/web/tests/social-review-queue-readmodel.test.ts`
- `docs/E150/OpenTasks.md`

## Validierung

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-b2c-handoff-closure.contract.test.tsx tests/swipes-handoff-arrival.contract.test.tsx tests/runden-public-anlassraum-status.contract.test.tsx tests/dossier-public-handoff-linking.contract.test.tsx tests/v1-b2c-production-journey.contract.test.ts`

Zusätzlich revalidiert:

- `pnpm -C apps/web exec vitest run tests/create-anlassraum-handoff.contract.test.tsx tests/runden-public-sharing-guide.contract.test.tsx tests/dossier-public-route.contract.test.tsx`

## Guardrails weiterhin aktiv

- keine automatische Veröffentlichung
- keine automatische Stimme
- kein stiller Themen-/Graph-Merge
- keine automatische `public_official`-Setzung
- keine Auto-Social- oder Auto-Seal-Behauptung

## Offen / bewusst nicht Teil dieses Slices

- Layout-/`global.css`-Themen ausserhalb direkter Kernreise-Blocker
- Social-Media-Live-Posting
- Stream-Runtime-Hardening
- Payment-/Billing-Ausbau
- neue Produktflächen oder neue Routenfamilien

## Kurzfazit

Die B2C-Kernreise ist auf bestehenden V1-Pfaden jetzt deutlich geschlossener lesbar:

- `Create` endet nicht mehr als isolierter Sackgassen-Arbeitsstand
- `Swipes` liest sich als echter Beteiligungsanschluss statt als loses Deck
- `Runden` erklaert Anlassraum-Status und Beteiligung oeffentlich verstaendlich
- `Dossier` erklaert seine Rolle als Kontext- und Quellenflaeche ohne Wahrheitsbehauptung
