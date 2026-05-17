# UX-TERM-HARM-01

Datum: 2026-05-17
Status: done

## Ziel

Sichtbare Produktbegriffe in UX-, Copy- und IA-Surfaces vereinheitlichen, ohne Runtime-Logik, APIs oder Fachpfade zu aendern.

## Nicht-Ziele

- keine Runtime-Logik
- keine neuen APIs
- kein GeoReferenceLayer
- kein Payment
- kein Publishing-Code
- keine automatische Veroeffentlichung
- keine neue Dossier-/Anlassraum-Fachlogik
- keine echten AI-Calls

## Umgesetzt

- `Claim` wurde in sichtbarer Produktcopy zu `Aussage` harmonisiert.
- `Entitlement` wurde in sichtbarer Produktcopy zu `Freischaltung` harmonisiert.
- `OrganizationClaim` wurde in sichtbarer Produktcopy zu `Organisationsantrag` harmonisiert.
- `Public Participation Signal` wurde in sichtbarer Produktcopy zu `Beteiligungssignal` harmonisiert.
- `Pilotdaten`/`Fixture` wurden in sichtbarer Vorschau-Copy zu `kuratierte Startlage` und `Pilotvorschau` harmonisiert.
- Publish-nahe Sprache wurde kontextbezogen geschärft:
  - `einreichen`
  - `sichtbar machen`
  - `veröffentlichen`
- Der Claim `Lass das beste Argument gewinnen.` wurde in FAQ und `/howtoworks/edebatte` integriert.

## Geänderte Dateien

- `apps/web/src/app/faq/faqContent.ts`
- `apps/web/src/app/howtoworks/edebatte/page.tsx`
- `apps/web/src/app/account/organization/page.tsx`
- `apps/web/src/app/account/organization/OrganizationClaimsClient.tsx`
- `apps/web/src/app/admin/organization-claims/page.tsx`
- `apps/web/src/app/admin/organization-claims/AdminOrganizationClaimsClient.tsx`
- `apps/web/src/app/admin/entitlements/page.tsx`
- `apps/web/src/app/admin/entitlements/AdminEntitlementsClient.tsx`
- `apps/web/src/app/admin/region/page.tsx`
- `features/region/regionFeedSignals.ts`
- `features/region/store.ts`
- `apps/web/src/features/demo/statusLanguage.ts`
- `docs/E150/OpenTasks.md`

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/faq-product-narrative.contract.test.ts tests/faq-topic-dossier-claim-vote-glossary.contract.test.ts tests/admin-region-page.render.test.tsx tests/admin-region-cockpit.route.test.ts tests/admin-region-entitlement-ui.test.tsx`

## Ergebnis

- Sichtbare Terminologie ist in den bearbeiteten Kernsurfaces konsistenter.
- Interne Typen, API-Pfade und Runtime-Verhalten bleiben unveraendert.
- Die Harmonisierung ist rein UX-/Copy-/IA-seitig erfolgt.
