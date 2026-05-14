# GOV-ACTOR-REGISTER-02 / GOV-COMMUNITY-SIGNAL-02 / GOV-ADMIN-REGION-02

Datum: 2026-05-11
Status: done

## Ziel

Die regionale Verortung sollte fuer Anlassraeume nicht nur auf wenigen Fixtures beruhen. Die offizielle Verwaltungsadressliste musste als belastbare Basis fuer Verwaltungseintraege, regionale Signalsicht und ein erstes read-only Verwaltungscockpit operationalisiert werden.

## Umgesetzt

- `features/region/contracts.ts` um echte Verwaltungstypik erweitert:
  - `administrativeUnitType`
  - amtliche Directory-Referenz
  - Verwaltungsadressdaten an Actor-/Region-Eintraegen
- Neues offizielles Directory-Readmodel in `features/region/directory.ts`:
  - liest `apps/web/public/Listen/Anschriften_der_Gemeinde_und_Stadtverwaltungen_Stand_31012023_final.xlsx`
  - normalisiert u. a. `Kreisfreie Stadt`, `Landkreis`, `Amt`, `Verbandsgemeinde`, `Samtgemeinde`, `Verwaltungsgemeinschaft`, `Verwaltungsverband`, `Markt`, `Große Kreisstadt`
  - baut daraus verortbare Regions- und Verwaltungsakteurseintraege
- Neues Repo-/Store-Layer:
  - `features/region/server/repo.ts`
  - `features/region/store.ts`
  - offizielles Directory bleibt read-only Baseline
  - manuelle Admin-Eintraege und Community-Signale werden persistent daruebergelegt
- Neue Admin-Routen:
  - `/api/admin/region/actors`
  - `/api/admin/region/signals`
  - `/api/admin/region/signals/[id]/review`
  - `/api/admin/region/cockpit/[regionId]`
- Neue Admin-Surface:
  - `/admin/region`
  - read-only Lagebild mit Region, Actor-/Signal-Counts und Pflichtmodulen

## Guardrails

- Keine automatische politische Zuordnung
- Keine automatische VoiceOpenGov-Mitgliedschaft
- Kein Auto-Publish
- Kein Auto-Mandat
- Keine Citizen-/Vereins-Scores
- Keine automatisierte Enforcement-/Priorisierungslogik

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/regional-official-directory.contract.test.ts tests/regional-actor-register.route.test.ts tests/community-signal-intake.route.test.ts tests/admin-region-cockpit.route.test.ts tests/admin-region-page.render.test.tsx tests/regional-actor-register.contract.test.ts tests/community-signal-inbox.contract.test.ts tests/regional-admin-cockpit.contract.test.ts`

## Ergebnis

- Anlassraum-nahe Verortung kann jetzt echte Verwaltungslagen und -strukturen referenzieren, statt nur wenige Demo-Faelle.
- Verwaltung, Akteursregister und Signal-Inbox teilen sich dieselbe region-scoped Grundlage.
- Die Admin-Surface ist erstmal read-only und review-first; keine versteckte Governance-Automatik wurde eingefuehrt.
