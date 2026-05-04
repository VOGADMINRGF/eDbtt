# PR-UX-JOURNEY-BASELINE-REVIEW-01 – Finaler Regression-/QA-Hardening-Run

Stand: 2026-05-04  
Status: done

## Scope

Geprüft wurde die abgeschlossene öffentliche Journey:
1. Startseite
2. Mobile Burger-Navigation
3. Bottom Navigation
4. Themen / Swipes
5. Dossier
6. Live / Stream
7. Pricing
8. Register -> Redirect `/swipes?welcome=1`
9. Hinweise / vertrauliche Beiträge / Actor-Trust-Guardrails

Keine neuen Produktfeatures. Fokus auf Regressionen, Copy-Konsistenz und mobile UX-Härtung.

## Gefundene und behobene Regressionen

1. Doppelte Register-CTA im mobilen Burger-Menü  
- Befund: Für nicht eingeloggte Nutzer wurde `Registrieren` zweimal gerendert (CTA-Duplikat).
- Fix: Fallback-Register-Button im unteren `user ? ... : ...`-Block entfernt, da der Login/Register-Block bereits vorhanden ist.
- Datei: `apps/web/src/app/(components)/SiteHeader.tsx`
- Test-Härtung: `apps/web/tests/header-mobile-navigation.contract.test.ts` prüft jetzt, dass `cta.register.mobile` nur einmal vorkommt.

2. Swipes-Detailcopy nicht konsistent mit Journey-Wording  
- Befund: In Vertiefungs-UI standen noch `Evidenz`/`Eventualitäten`-Formulierungen, obwohl die Journey auf `Quellenlage`/`mögliche Folgen` harmonisiert wurde.
- Fixes:
  - `Dossier, Evidenz und Varianten` -> `Dossier, Quellenlage und Varianten`
  - `Eventualitäten / Varianten` -> `Varianten / mögliche Folgen`
  - `Quellen & Evidenz` -> `Quellenlage`
  - `Evidenz ansehen` -> `Quellenlage ansehen`
  - `Lade Eventualitäten …` -> `Lade Varianten …`
- Dateien:
  - `apps/web/src/app/swipes/SwipesClient.tsx`
  - `apps/web/src/features/surfaces/swipes/components/SwipeDetailSheet.tsx`
  - `apps/web/src/features/surfaces/swipes/components/SwipeEventualitiesStep.tsx`
- Test-Härtung: `apps/web/tests/swipes-action-hierarchy.contract.test.ts` ergänzt.

3. Öffentliches Alt-Wording `Beteiligungstool`  
- Befund: In der öffentlichen Referenzarchitektur-Seite stand noch `Mehr als ein Beteiligungstool`.
- Fix: Auf neutralere Journey-kompatible Formulierung geändert:
  - `Mehr als ein klassisches Beteiligungsangebot`
- Datei: `apps/web/src/app/[locale]/referenzarchitektur/page.tsx`

4. `Lager`-Wording in Analyse-UI  
- Befund: Öffentliche Analyse-nahe UI enthielt `Lager-Spektrum` / `Erzeuge Lager/Varianten…`.
- Fix:
  - `Lager-Spektrum` -> `Positionen-Spektrum`
  - `Erzeuge Lager/Varianten…` -> `Erzeuge Positions-/Variantenbild…`
- Dateien:
  - `apps/web/src/components/analyze/StanceSpectrum.tsx`
  - `apps/web/src/ui/ContribChatOrchestrator.tsx`

## Guardrail-Revalidierung

Die Actor-Trust-Guardrails bleiben im überprüften Journey-Pfad erhalten:
- keine öffentliche `für Parteien`-Positionierung
- Organisationen klar gekennzeichnet
- Bürgerstimmen getrennt von Organisationspositionen
- vertrauliche Hinweise nicht automatisch an Veranstalter
- keine falschen Whistleblower-Schutzversprechen

## Validierung

- `pnpm -C apps/web run typecheck` ✅
- `pnpm -C apps/web run lint` ✅
- `pnpm -C apps/web run build` ✅  
  - Build erfolgreich; bekannte Umgebungswarnungen (`baseline-browser-mapping` veraltet, `ECONNREFUSED` bei externer Mongo-SRV-Abfrage) ohne Build-Abbruch.

- Gezielte Journey-/Trust-Testläufe ✅
  - `tests/header-mobile-navigation.contract.test.ts`
  - `tests/swipes-action-hierarchy.contract.test.ts`
  - `tests/swipe-topic-step.quick-followup.contract.test.tsx`
  - `tests/swipes-discovery.contract.test.ts`
  - `tests/stream-page-surface-staging.contract.test.tsx`
  - `tests/pricing-page.contract.test.ts`
  - `tests/dossier-evidence-first-ux.test.tsx`
  - `tests/auth-registration-flow.contract.test.ts`
  - `tests/role-routing.contract.test.ts`
  - `tests/ux-actor-trust.contract.test.tsx`
  - `tests/community-contributions.route.actor-trust.test.ts`
  - `tests/community-contributions.route.translation.test.ts`

## Offene Decision Boundaries

Keine neue große Produktentscheidung im QA-Slice erforderlich.  
Weiterhin offen (bestehende Boundary):
- finales Legal-/Security-Wording für vertrauliche Hinweise
- rechtliche Sprache für verbindliche/rechtssichere Abstimmungen
