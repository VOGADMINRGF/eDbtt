# ANLASSRAUM-PUBLIC-SHARING-01

Datum: 2026-05-17
Status: done
Task: `ANLASSRAUM-PUBLIC-SHARING-01`

## Ziel

`/runden` als oeffentlichen, teilbaren Anlassraum schaerfen:

- Anlassraum = oeffentlicher Themenraum zu einem konkreten Anlass
- Share-/QR-Einstieg sichtbar machen
- Veranstaltung-/Workshop- und Medien-/Artikel-Weiterfuehrung erklaeren
- Beteiligungssignal- und Visibility-/Review-Sprache aus bestehenden Pfaden wiederverwenden

## Umgesetzter Schnitt

Bestehende Anlassraum-Flaechen wurden wiederverwendet:

- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/runden/RundenShareActions.tsx`
- `apps/web/src/app/runden/demo/page.tsx`
- bestehende Visibility-/Risk-Ladder aus `features/region/publicationRiskLadder.ts`

Neu hinzu kam nur ein praesentationaler Guide-Baustein:

- `apps/web/src/app/runden/RundenPublicSharingGuide.tsx`

Die oeffentliche Surface erklaert jetzt explizit:

- `Anlassraum`
- `Ein oeffentlicher Themenraum zu einem konkreten Anlass.`
- `Lass das beste Argument gewinnen.`
- `Sichtbar heisst nicht automatisch geprueft oder amtlich.`
- `Dossier/Faktenstatus bleibt reviewpflichtig.`
- `Amtliche Antworten nur durch verifizierte Rollen.`

Share-/QR-Copy ist sichtbar:

- `Teile diesen Anlassraum mit Nachbarn, Freunden oder deiner Initiative.`
- `Nutze den QR-Code fuer Buergerdialoge, Veranstaltungen oder Workshops.`

Event-/Medien-Einstiege sind sichtbar vorbereitet:

- `Fuer Veranstaltungen nutzen`
- `Fuer Artikel oder Berichte nutzen`

Oeffentliche Beitragsarten sind als Surface-/Contract-Sprache sichtbar:

- Frage
- Quelle
- Perspektive
- Option
- Hinweis

Visibility-/Review-Sprache wurde aus der bestehenden Ladder uebernommen:

- `public_unverified` -> ungepruefter oeffentlicher Hinweis
- `internal_review` -> reviewpflichtig
- `public_reviewed` -> geprueft
- `public_official` -> amtlich freigegeben
- `blocked` -> blockiert

## Guardrails

Nicht hinzugefuegt:

- kein Social Publishing
- kein Posting auf externe Kanaele
- keine automatische amtliche Antwort
- keine automatische Dossier-Finalisierung
- keine automatische Anlassraum-Finalisierung
- keine neue Risk-Ladder-Runtime
- keine neue API
- kein Payment
- kein GeoReferenceLayer
- kein Live-Crawler
- kein Scraping
- keine neue AI-Kostenlogik

Die oeffentliche Input-Anbindung bleibt in diesem Slice prepare-only ueber bestehende `/create`-Handoffs und sichtbare Beitragsarten.

## Geaenderte Dateien

- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/runden/RundenPublicSharingGuide.tsx`
- `apps/web/src/app/runden/RundenShareActions.tsx`
- `apps/web/src/app/runden/demo/page.tsx`
- `apps/web/tests/runden-page.acceptance.test.ts`
- `apps/web/tests/runden-qr-participation-language.contract.test.tsx`
- `apps/web/tests/runden-demo.page.contract.test.tsx`
- `apps/web/tests/runden-public-sharing-guide.contract.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Validierung

Gruen ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/runden-page.acceptance.test.ts tests/runden-qr-participation-language.contract.test.tsx tests/runden-demo.page.contract.test.tsx tests/runden-public-sharing-guide.contract.test.tsx tests/regional-anlassraum-contract.test.ts tests/feed-anlassraum-surface-composition.test.ts tests/create-anlassraum-handoff.contract.test.tsx tests/create-anlassraum-routing.contract.test.ts tests/region-participation-signals.contract.test.ts`

## Offen

- Kein dedizierter oeffentlicher POST-Endpoint fuer Anlassraum-Eingaben in diesem Slice
- Keine automatische Ueberfuehrung in amtliche Antworten, Dossiers oder finale Anlassraeume
- Naechster groesserer Organisations-/B2G-Schnitt bleibt `ORG-DASHBOARD-01`
