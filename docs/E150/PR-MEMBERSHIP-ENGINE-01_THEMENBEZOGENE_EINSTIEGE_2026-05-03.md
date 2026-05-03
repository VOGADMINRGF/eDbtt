# PR-MEMBERSHIP-ENGINE-01 - Themenbezogene Membership-/Mitmach-Einstiege

Datum: 2026-05-03  
Repo: `VOGADMINRGF/edebatte-org`

## Ziel

Themenradar-Items auf klare, nicht-manipulative Einstiege fuer Mitmachen und
Mitgliedschaft mappen, ohne Wahrheits-/Prioritaetsdrift und ohne Tracking-Ausweitung.

Anforderungen aus OpenTasks:

- themenbezogene CTA-Mappings
- klare Trennung Thema vs. Mitgliedschaft vs. Redaktion
- keine aggressive Conversion-Logik
- keine Lock-in-Regression gegen `/pricing`-/`/order`-Trennung

## Umsetzung

1. Zentraler Membership-Entry-Contract
- Neu: `features/themenradar/membershipCta.ts`
- Deterministisches Mapping pro Themenradar-Item:
  - `Mitmach-Einstieg` -> `/create?entryIntent=issue_signal&entryMode=guided`
  - `Mitgliedschaft ansehen` -> `/pricing`
  - `Paket optional bestellen` -> `/order`
- Guardrails im Contract:
  - `noTrackingFields=true`
  - expliziter Separation-Hinweis (Thema/Mitgliedschaft/Redaktion)
  - kein `/vormerken` als neuer Primärpfad

2. UI-Anbindung Themenradar-Detail
- Datei: `apps/web/src/app/admin/themenradar/[id]/page.tsx`
- Neue Box `Membership-/Mitmach-Einstiege` zeigt:
  - Kontextlabel mit Membership-Signal
  - Separation-Hinweis
  - drei CTA-Links aus dem zentralen Contract

3. Export des Contracts ueber Themenradar-Index
- Datei: `features/themenradar/index.ts`
- `export * from "./membershipCta"`

## Tests

1. Neuer Contract-Test
- `apps/web/tests/themenradar-membership-entry.contract.test.ts`
- Prüft:
  - deterministische CTA-Ziele (`/create`, `/pricing`, `/order`)
  - Signal-Level-Mapping (`low|medium|high`)
  - keine Tracking-/Pixel-/Fingerprint-/Session-Felder
  - kein `/vormerken` im CTA-Pfad

2. Bestehende Guardrail-Tests erweitert
- `apps/web/tests/themenradar-order-path-alignment.contract.test.ts`
- `apps/web/tests/no-primary-vormerken-links-from-themenradar.contract.test.ts`
- Beide schließen jetzt auch `features/themenradar/membershipCta.ts` ein.

## Validierung

1. `pnpm -C apps/web exec sh -lc 'vitest run tests/themenradar-*.test.ts tests/themenradar-*.test.tsx tests/no-primary-vormerken-links-from-themenradar.contract.test.ts tests/themenradar-order-path-alignment.contract.test.ts'`
- Ergebnis: 20 Files, 41 Tests, alles gruen

2. `pnpm -C apps/web run typecheck` -> gruen
3. `pnpm -C apps/web run lint` -> gruen

## Guardrail-Bestaetigung

- Keine neue Wahrheits-/Prioritaetslogik eingefuehrt
- Keine aggressive Conversion-Copy
- Keine Tracking- oder Pixel-Felder eingefuehrt
- Keine neue `/vormerken`-Primärroute im Themenradar
- Trennung von Thema, Mitgliedschaft und Redaktion bleibt explizit

