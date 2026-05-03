# Evidence: GOV-MANDATE-05 Workbench Family (2026-05-03)

## Scope

Umgesetzt wurde `GOV-MANDATE-05` als Workbench-Familien-Slice.

Enthalten:
- gemeinsamer Contract für Dossier-/Runden-/Mandats-Workbench
- klare Guardrails gegen Kommentarspalten-Drift im Mandat
- Pflicht-Kennzeichnung von Mockup-/Broschürenansichten als Beispiel
- Kompatibilitätsanker zum parallel laufenden `GOV-REGIONAL-ANLASSRAUM`
- OpenTasks-Update auf `done`

Nicht enthalten:
- keine neue Route
- keine Routing-Migration
- keine neue Debattenlogik auf `/mandat`

## Umsetzung

### 1) Workbench-Familien-Contract

Neue Datei:
- `features/mandate/workbenchFamily.ts`

Contract-Inhalt:
- feste Family: `Dossier-Runde-Mandat Workbench Familie`
- Shared-Visual-Language (card radius, subtle border, status chips, evidence hint placement)
- drei Pflicht-Surfaces (`dossier`, `runde`, `mandat`) je genau einmal
- Guardrails:
  - Mandat darf nicht als Kommentarspalte auftreten
  - Mockup-/Brochure-Bezüge müssen als Beispiel markiert sein
  - keine Routing-Kanon-Änderung in diesem Slice
- Regional-Kompatibilität:
  - `/runden` bleibt operative Surface
  - regionaler Anlassraum darf angebunden werden
  - Fluss bleibt `anlassraum_to_dossier_to_runde_to_mandat`

### 2) Produktnahe Mockup-Kennzeichnung

Geändert:
- `apps/web/src/app/howtoworks/edebatte/mandat/page.tsx`

Ergänzt:
- sichtbares Label `Beispielhafte Produktansicht`
- Hinweis auf Mockup-Stand (nicht identisch zur Live-Workbench)
- Guardrail-Text: Mandat als Nachweis-/Umsetzungsraum, nicht als Kommentarspalte/neue Debattenfläche

### 3) Export-Anbindung

Geändert:
- `features/mandate/index.ts`

`workbenchFamily.ts` ist über den Mandate-Entry-Point exportiert.

## Tests

Neue Datei:
- `apps/web/tests/mandate-workbench-family.contract.test.ts`

Abgedeckt:
- vollständige Dossier-/Runden-/Mandat-Familie
- Mandat-Guardrail gegen Kommentarspalten-Verhalten
- Regional-Anlassraum-Kompatibilität ohne Routing-Kanonwechsel
- Schema-Validierung inkl. Pflichtblock `regionalAnlassraumCompatibility`

## OpenTasks-Update

In `docs/E150/OpenTasks.md`:
- `GOV-MANDATE-05` auf `done`
- `Next codex_ready tasks` entsprechend angepasst

## Validierung

Ausgeführt:
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/mandate-contract.test.ts tests/mandate-permissions.contract.test.ts tests/mandate-handoff.contract.test.ts tests/mandate-workbench-family.contract.test.ts tests/mandat-detail-page.contract.test.ts`

Ergebnis:
- alle Schritte grün.
