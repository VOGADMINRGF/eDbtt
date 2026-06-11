# PUBLIC-LIVE-SURFACE-QA-06

Datum: 2026-06-11

## Geprüfte Routen

- `/live/[campaignId]`
- `/live/[campaignId]/host`
- `/live/[campaignId]/report`
- `/live/[campaignId]/media-kit`
- `/qr/[qrId]`
- `mobileAppShellContract` für `/live/*` und `/qr/*`

## Geprüfte Links

- Live-Einstieg verlinkt jetzt konsistent auf Host-Cockpit, Report-Entwurf und Media-Kit-Vorschau.
- Host-Cockpit verlinkt jetzt zurück auf den Live-Einstieg sowie auf Report-Entwurf und Media-Kit.
- Report-Handoff verlinkt konsistent auf Live-Einstieg, Host-Cockpit und Media-Kit.
- Media-Kit verlinkt klickbar auf Kampagnenlink, QR-/Kurzlink-Ziel, Host-Link und Report-Link und bietet zusätzlich direkte Öffnen-CTAs für Live-Einstieg, QR-Vorschau, Host und Report.
- `/qr/[qrId]` führt bei Kampagnenzielen weiterhin in den richtigen Live-Einstieg; bei unbekannten oder unvollständigen QR-Zielen gibt es jetzt einen sicheren Fallback statt `notFound()`.

## Geprüfte Guardrails

- Kein Auto-Publish.
- Kein Vote aus Draft- oder Live-Surfaces.
- Kein Graph-Write, kein Dossier-Create, kein Anlassraum-Create.
- Keine Factcheck-Ausführung aus Live-, Report- oder Media-Kit-Flächen.
- Keine Drittanbieter-Tracker, kein externes Embed-Skript, kein Newsletter-Versand, kein Posting.
- `Verifiziert` bleibt exklusiv für `sealed_verified`.
- Report und Media-Kit bleiben Entwurf bzw. Vorschau.
- `recommendedNextActions` im Report bleiben guarded.

## UX-/Copy-Befund

- User-facing `Campaign`-Drift war noch auf mehreren öffentlichen Live-Flächen sichtbar und wurde auf `Live-Kampagne`, `Live-Einstieg` und `Kampagnen-QR` harmonisiert.
- Link- und CTA-Hierarchie zwischen Entry, Host, Report und Media-Kit war unvollständig; die Surfaces sind jetzt gegenseitig navigierbar, ohne neue Produktpfade zu eröffnen.
- QR-Fallbacks waren bisher hart an `notFound()` gebunden; das war für öffentliche Live-Einstiege zu spröde und ist jetzt durch eine ehrliche Fallback-Karte ersetzt.
- Die vorhandene Trust-/Guardrail-Sprache blieb konservativ und musste nur lokal ergänzt, nicht fachlich neu entschieden werden.

## Vorgenommene kleine Fixes

- Öffentliche Live-Copy auf konsistentere Kampagnen-/Live-Einstieg-Sprache umgestellt.
- Zusätzliche Cross-Links zwischen Live-Einstieg, Host-Cockpit, Report-Handoff und Media-Kit ergänzt.
- Media-Kit-Linkliste in klickbare lokale Vorschaupfade umgebaut und um eine QR-Vorschau-CTA ergänzt.
- `/qr/[qrId]` auf sichere Fallback-Surface für unbekannte, unvollständige oder nicht unterstützte QR-Ziele gehärtet.
- Neue Contract-Abdeckung für Kampagnen-QR-Landing und QR-Fallback ergänzt.

## Tests und Ergebnis

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/live-campaign-entry.contract.test.tsx tests/live-trust-labels.contract.test.ts tests/live-host-cockpit.contract.test.tsx tests/live-report-handoff.contract.test.tsx tests/live-media-kit.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/start-draft-context.contract.test.ts tests/live-qr-entry.contract.test.tsx`
- Ergebnis: `28/28` Tests grün.

## Verbleibende Nicht-Blocker

- Style-/Rhythmus-/Dark-Light-Polish der öffentlichen Live-Flächen bleibt bewusst separat.
- Restdrift in Create-/Planner-/Followup, Review-/Telemetry-/Orchestrator, `globals.css`/Voxy, Multibranch-/Place-/Street-Registry sowie untracked Create-/Factcheck-/Docs-Dateien wurde inventarisiert, aber in diesem Slice nicht angefasst.
- Die React-Warnungen aus `mobile-entry-routes.contract.test.tsx` zu `fill` und `priority` bestehen weiterhin außerhalb dieses Slices.

## Nächster empfohlener Task

- `PUBLIC-LIVE-STYLE-CLEANUP-07`
