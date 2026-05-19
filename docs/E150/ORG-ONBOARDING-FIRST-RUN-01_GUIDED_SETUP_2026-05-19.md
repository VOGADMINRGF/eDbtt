# ORG-FIRST-RUN-01

Stand: 2026-05-19  
Issue: #176

## Ziel

Neue Organisationen sollen im bestehenden Organisationsbereich nicht nur Rohdaten sehen, sondern einen geführten Einstieg:

- Organisation anmelden
- Region wählen
- Freischaltung und Status verstehen
- Quelle oder Snapshot starten
- erste Review-Aufgaben sehen
- Dossier oder Anlassraum vorbereiten
- bewusst Sichtbarkeit vorbereiten

## Umsetzung

- `features/region/organizationDashboard.ts`
  - neuer `OrganizationFirstRunReadModel`
  - Schrittstatus: `locked`, `available`, `done`, `needs_review`, `optional`
  - Schrittableitung aus bestehender Membership-, Claim-, Freischaltungs-, Snapshot-, Review- und Draft-Lage
- `/account/organization/dashboard`
  - neuer Block `Erste Schritte`
  - klare CTA-Fuehrung auf vorhandene Surfaces:
    - `Organisation vervollständigen`
    - `Region auswählen`
    - `Freischaltung/Status verstehen`
    - `Quelle auswerten`
    - `Beispiel-Snapshot laden`
    - `Review Queue öffnen`
    - `Dossier vorbereiten`
    - `Anlassraum vorbereiten`
    - `Sichtbarkeit vorbereiten`

## Guardrails

- keine neue Onboarding-Parallelwelt
- kein Payment oder Checkout
- kein Auto-Publish
- kein automatisches `public_official`
- keine automatische amtliche Antwort
- keine automatische Dossier-/Anlassraum-Finalisierung
- kein Social Publishing
- kein GeoReferenceLayer
- keine neue AI-/Source-Adapter-Logik

## Sicherheits- und Scope-Verhalten

- Pending oder Unverified sehen weiter keine fremden Reviewdaten
- Verified sehen nur eigene Region und eigene reviewpflichtige Aufgaben
- Admin-Modus bleibt sichtbar als Betreiber-Fallback markiert

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`
