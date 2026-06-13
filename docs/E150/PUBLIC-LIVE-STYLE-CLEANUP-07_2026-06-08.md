# PUBLIC-LIVE-STYLE-CLEANUP-07

Datum: 2026-06-11

## Geprüfte Flächen

- `/live/[campaignId]`
- `/qr/[qrId]`
- `/live/[campaignId]/host`
- `/live/[campaignId]/report`
- `/live/[campaignId]/media-kit`

## Konkrete Copy-/UX-/Style-Fixes

- Mobile CTA-Blöcke auf allen fünf öffentlichen Live-Flächen auf gestapelte `w-full`-Buttons für kleine Viewports umgestellt, damit Primär- und Sekundäraktionen lesbarer bleiben.
- Linktexte zwischen den Flächen konsistenter gemacht:
  - `Live-Einstieg öffnen`
  - `Host-Cockpit öffnen`
  - `Report-Entwurf öffnen`
  - `Media-Kit ansehen`
- Im Live-Einstieg `Media-Kit-Vorschau ansehen` auf das kanonische `Media-Kit ansehen` reduziert und `Report-Entwurf ansehen` auf `Report-Entwurf öffnen` harmonisiert.
- Im Host-Cockpit die Copy `Media-Kit-Vorschau` auf das kanonische `Media-Kit` reduziert und die Sekundär-CTAs mobiler lesbar gestapelt.
- Im Report-Handoff die erläuternde Copy von technischem `Report-Handoff` auf `Report-Entwurf` geschärft; die Guardrail-Zeile bei `recommendedNextActions` liest jetzt natürlich statt `guarded=true`.
- Im Media-Kit den Guardrail-Text `Entwurf / Live Entry / Review-first` auf `Entwurf / Live-Einstieg / Review-first` harmonisiert.
- Im QR-Einstieg und QR-Fallback dieselbe CTA-Hierarchie wie auf den übrigen Live-Flächen verwendet, statt einer eigenen Button-Optik.

## Was bewusst nicht angefasst wurde

- Keine Produktlogik.
- Keine neuen Routen, APIs, Persistenzpfade oder Actions.
- Kein `globals.css`.
- Kein `VoxyGuide.tsx`.
- Kein `voxyCopy.ts`.
- Keine Create-/Planner-/Followup-Restdrift.
- Keine Review-/Telemetry-/Orchestrator-Restdrift.
- Keine Multibranch-/Place-/Street-Registry-Restdrift.

## Guardrails

- Kein Auto-Publish.
- Kein Posting.
- Kein Newsletter-Versand.
- Kein externes Embed-Script.
- Kein Tracking-/Cookie-Zwang.
- Kein Vote.
- Kein Graph-Write.
- Kein Dossier-Create.
- Kein Anlassraum-Create.
- Keine Factcheck-Ausführung.
- Keine Verifikation ohne `sealed_verified`.
- Report und Media-Kit bleiben Entwurf bzw. Vorschau.
- `recommendedNextActions` bleiben guarded.
- Trust Labels bleiben konservativ.

## Tests und Ergebnis

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/live-campaign-entry.contract.test.tsx tests/live-trust-labels.contract.test.ts tests/live-host-cockpit.contract.test.tsx tests/live-report-handoff.contract.test.tsx tests/live-media-kit.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/live-qr-entry.contract.test.tsx`
- Ergebnis: `21/21` Tests grün.

## Verbleibende Nicht-Blocker

- Die bekannte React-Warnung in `tests/mobile-entry-routes.contract.test.tsx` zu `fill` und `priority` bleibt außerhalb dieses Slices bestehen.
- Die große Restdrift im Worktree bleibt unverändert und wurde bewusst nicht mit in diesen Style-Slice aufgenommen.

## Nächster empfohlener Task

- `WORKTREE-RESTDRIFT-AUDIT-08`
