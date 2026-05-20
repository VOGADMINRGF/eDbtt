# PRODUCTION-DEMO-E2E-01

Stand: 2026-05-20
Scope: Demo-/QA-Journey-Härtung auf bestehenden Organisations-, Regions-, Review-, Studio- und Anlassraum-Flächen

Technischer Arbeitsname im Umsetzungsslice: `REVIEW-TO-VISIBLE-JOURNEY-01`

## Ziel

Die bestehende Produktkette sollte nicht nur fachlich vorhanden sein, sondern auch als nachvollziehbare Demo-/QA-Journey sichtbar bleiben:

`Organisation -> First Run -> Quelle oder Snapshot -> Review Queue -> Dossier/Anlassraum vorbereiten -> Vorschau -> bewusst sichtbar machen -> Public URL / QR / Share -> Sichtbarkeit zurücknehmen / archivieren`

## Umgesetzte Flächen

- `/account/organization/dashboard`
  - geführter Einstieg bleibt Start der Journey
  - Publish-Summary erklärt jetzt explizit Vorschau, Sichtbarkeit, Link/QR und Widerruf/Archivierung
- `/admin/regions`
  - neue Demo-/QA-Journey-Einordnung als Überblick
  - verweist auf Review Queue und Organisations-Journey
- `/admin/region`
  - erklärt den Übergang von Quelle/Snapshot zu Review und späterer Sichtbarkeit
- `/admin/review`
  - erklärt Review-to-Visible als denselben Pfad für Vorschau, Sichtbarkeit, Public URL, QR, Share und Widerruf
- `/dossier/[id]/studio`
  - erklärt, dass Public URL/Share/QR nicht im Studio automatisch entstehen, sondern erst nach bewusster Sichtbarkeit im Review-to-Publish-Workspace
- `/runden`
  - Sharing-Copy erklärt sichtbare Zustände sowie das Verschwinden von Link/QR nach Widerruf oder Archivierung

## Guardrails bleiben unverändert

- kein Auto-Publish
- kein automatisches `public_official`
- kein Social Publishing
- kein Payment/Checkout
- kein GeoReferenceLayer
- keine neue AI-/Source-Adapter-Logik
- keine neue Persistenzarchitektur

## Testabdeckung

- `apps/web/tests/admin-region-page.render.test.tsx`
- `apps/web/tests/admin-regions-page.render.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- `apps/web/tests/dossier-output-studio.page.contract.test.ts`
- `apps/web/tests/runden-public-sharing-guide.contract.test.tsx`
- `apps/web/tests/runden-qr-participation-language.contract.test.tsx`

## Validation

- `pnpm -C apps/web exec vitest run tests/admin-region-page.render.test.tsx tests/admin-regions-page.render.test.tsx tests/admin-review.page.test.tsx tests/account-organization-dashboard.page.test.tsx tests/dossier-output-studio.page.contract.test.ts tests/runden-public-sharing-guide.contract.test.tsx tests/runden-qr-participation-language.contract.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`

## Offene Folgepunkte

- spätere echte End-to-End-Browser-Journey kann zusätzlich auf diese Copy-/Render-Contracts aufsetzen
- Social Publishing und Official Release bleiben bewusst separate Folgepfade
