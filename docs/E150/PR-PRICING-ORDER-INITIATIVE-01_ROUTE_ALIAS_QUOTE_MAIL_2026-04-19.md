# PR-PRICING-ORDER-INITIATIVE-01

Datum: 2026-04-19  
Status: done

## Ziel

Pricing-/Order-Führung nachschärfen, ohne neue Parallelwelt:

- kanonischer Folgepfad auf `/order` ziehen
- `/vormerken` als kompatiblen Altpfad weiter nutzbar lassen
- Initiative-/HowToWorks-Verlinkung auf `/howtoworks/initiative` + `/howtoworks/edebatte` klarziehen
- institutionellen Kostenvoranschlag-Download nur nach Pflichtangaben und als separaten Mail-Link-Flow führen
- doppelte Paketanzeige im Order-Flow reduzieren

## Umsetzung

1. Routing & Link-Harmonisierung
- Neue Route: `apps/web/src/app/order/page.tsx` (nutzt denselben Order-Client wie `/vormerken`)
- `/pricing`, `/pricing/institutionen`, Domain-CTAs und Register-/Account-Weiterleitungen auf `/order` umgestellt
- `buildContinueRoute` in `apps/web/src/app/api/edebatte/preorder/route.ts` auf `/order` umgestellt
- Wrapper-/Shell-Contracts erweitert, sodass `/order` und `/vormerken` beide sauber klassifiziert bleiben

2. Initiative-/HowToWorks-Pfade
- Neue Route: `apps/web/src/app/howtoworks/initiative/page.tsx`
- `apps/web/src/app/howtoworks/page.tsx` redirectet auf `/howtoworks/initiative`
- Header, Footer und Referenzarchitektur-Links auf `/howtoworks/initiative` aktualisiert
- `/pricing` ergänzt einen zusätzlichen Hinweis auf `/howtoworks/edebatte`

3. Order-UX-Feinschliff
- Doppelte Zwischenbox „Ausgewähltes Paket“ im Hauptfluss entfernt (Auswahlzustand bleibt farblich sichtbar)
- Auswahl bleibt trotz Vorbelegung (`?paket=...`) weiterhin frei umschaltbar

4. Kostenvoranschlag als separater Mail-Link
- Lokalen Direktdownload in `/vormerken` ersetzt durch „Downloadlink per E-Mail anfordern“
- Neuer API-Endpoint: `POST /api/edebatte/preorder/quote-download-link`
  - erzwingt Pflichtangaben (Organisation, Ansprechpartner, Telefon, E-Mail, Zustimmungen)
  - versendet separaten Downloadlink an Anfragende
  - informiert parallel `sales@edebatte.org`
- Neuer API-Endpoint: `GET /api/edebatte/preorder/quote-download`
  - liefert den angeforderten Kostenvoranschlag als Textdatei

## Geänderte Kernpfade

- `apps/web/src/app/pricing/page.tsx`
- `apps/web/src/app/pricing/institutionen/page.tsx`
- `apps/web/src/app/vormerken/page.tsx`
- `apps/web/src/app/order/page.tsx`
- `apps/web/src/app/howtoworks/page.tsx`
- `apps/web/src/app/howtoworks/initiative/page.tsx`
- `apps/web/src/app/api/edebatte/preorder/{route.ts,quote-download-link/route.ts,quote-download/route.ts}`
- `features/pricing/domain/{plans.de.ts,plans.en.ts,journey.de.ts,institutionalPricing.de.ts}`
- `apps/web/src/features/wrapper/{mobileAppShellContract.ts,mvpSurfaceContract.ts,productSurfaceLayoutContract.ts}`

## Tests / Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/institutional-quote-download-link.route.test.ts tests/pricing-page.contract.test.ts tests/pricing-institutionen-page.contract.test.ts tests/pricing-i18n.contract.test.ts tests/pricing-institutionen-i18n.contract.test.ts tests/institutional-pricing-link.contract.test.tsx tests/institutional-quote-download-requires-contact-fields.contract.test.tsx tests/register-preorder.redirect.test.ts tests/auth-registration-flow.contract.test.ts tests/vormerken-package-logic-aligned-with-pricing.contract.test.tsx tests/navigation-initiative-label.contract.test.ts tests/product-surface-shell.contract.test.tsx tests/mobile-app-shell-contract.test.ts tests/wrapper-mvp-surface-contract.test.ts tests/pricing-cta-targets.contract.test.ts`

## Ausstehend / Nachschärfpotenzial (für nächste Ausbaustufe)

1. Downloadlink-Härtung: signierte, ablaufende One-Time-Links statt transportierter Quote-Payload im Query-Parameter.
2. Kanonisierung abschließen: `/vormerken` als reiner Redirect-Alias auf `/order` umstellen, sobald alle externen Abhängigkeiten migriert sind.
3. Telemetrie ergänzen: strukturiertes Event für Quote-Link-Anforderung und Download-Funnel (aggregiert, Part12-konform).
4. Dokumentationsbereinigung: historische Evidenzdokumente mit `/vormerken`-Nennung als Legacy markieren, ohne Historie umzuschreiben.
