# V3 Public QA / Mobile / Debug-Leak Audit

Datum: 2026-07-13
Task: `V3-PUBLIC-QA-MOBILE-DEBUG-LEAK-PASS-01`
Cluster: Public QA / Mobile / Debug-Leak / CTA-Integritaet

## Gepruefte aktive Surfaces

- `/`
  - Sichtbarer Hero-H1 liegt jetzt in `HomeSplitVoxyLanding`.
  - `app/page.tsx` und `app/start/page.tsx` delegieren die H1-Pruefung explizit statt versteckte Doppel-H1s zu tragen.
- `/pricing`
  - Bleibt kurzer Entscheidungs- und Direktstartpfad mit sichtbarem H1.
- `/order`
  - Bleibt kanonischer Paketstartpfad.
  - Versteckter Wrapper-H1 entfernt; sichtbarer H1 kommt aus der gemeinsamen Surface.
- `/register`
  - Wrapper-H1 entfernt; sichtbarer H1 bleibt in `RegisterPageClient`.
- `/themen`
  - Sichtbarer H1 und direkte CTA-Hierarchie unveraendert produktiv.
- `/beteiligung` und `/beteiligung/[slug]`
  - Oeffentliche Participation-Surfaces nutzen jetzt weniger technische Source-/Statussprache.
  - `Runtime-basiert`, `Fixture-basiert` und `Runtime-Published` wurden aus der oeffentlichen Lesart entfernt.
- `/vormerken`
  - Bleibt erreichbare Legacy-/Fallback-Surface.
  - Keine Aufwertung zum Primaerfunnel.

## Harmonisierung

- Doppel-H1s wurden nicht durch neue Wrapper-Logik ersetzt, sondern ueber den bestehenden `page-contract: delegated-h1`-Mechanismus sauber markiert.
- Die institutionelle Pricing-Surface spricht jetzt oeffentlich vom direkten Paketstart statt von `Startpaket vormerken`.
- Die Participation-Public-Surfaces lesen ihre Source-Labels ueber einen kleinen shared Helper statt ueber doppelte ad-hoc-Texte.

## Produktwahrheit nach dem Slice

- Direktstart bleibt: anmelden, registrieren, Paketstart, Thema einordnen, Beteiligungsraum oeffentlich lesen.
- `/vormerken` bleibt Legacy/Fallback, nicht Zukunftsfunnel.
- Oeffentliche Beteiligungsrouten zeigen Freigabe-, Vorschau- und Read-only-Wahrheit in buergernaher Sprache statt in Runtime-/Enum-Begriffen.
- Keine neue Produktlogik, kein neuer Funnel, keine externen APIs, kein Auto-Publish.

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/landing-clarity.contract.test.tsx tests/order-entry.contract.test.ts tests/v1-production-ready-public-routes.contract.test.tsx tests/participation-space-public-route-runtime.test.tsx tests/participation-space-public-detail-runtime.test.tsx tests/public-participation-space-shell.page.test.tsx tests/public-route-h1-visibility.contract.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`
