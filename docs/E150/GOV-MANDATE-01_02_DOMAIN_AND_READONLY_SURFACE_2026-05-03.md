# Evidence: GOV-MANDATE-01 + GOV-MANDATE-02 (2026-05-03)

## Scope

Umgesetzt wurde der E150-Slice `GOV-MANDATE-01` und `GOV-MANDATE-02`:
- Domain-Contract für Mandat / VoiceOpenGov Mandatsregister
- erste öffentliche read-only Surface `/mandat/[id]`
- Fixture-Daten und Contract-/Page-Tests
- OpenTasks-SSOT-Update inklusive klarer Decision-Boundaries für Folgetasks

Nicht umgesetzt in diesem Slice:
- keine Edit-/Statusrechte in der Oberfläche
- keine automatische Zuordnung
- keine automatische VoiceOpenGov-Mitgliedschaft
- kein Consent-/Membership-Handoff (bleibt Folge-Task GOV-MANDATE-04)

## Implementierung

### 1) Domain-Contract (`GOV-MANDATE-01`)

Neue Dateien:
- `features/mandate/contract.ts`
- `features/mandate/index.ts`

Inhalt:
- typed Mandats-SSOT mit `zod` für:
  - `MandateHolderKind` (`person`/`organisation`)
  - `MandateStatus`
  - `MandateVisibility`
  - `ConsentStatus`
  - `VerificationStatus`
  - `Mandate` inkl. `sourceDossierId`, `sourceRoundId`, `sourceAnlassraumId`, `provenance`, `transparency`
- Fixture-Register `MANDATE_REGISTER_FIXTURES` (public read-only)
- Guardrail-Helfer:
  - `supportsMembershipHandoff() => false`
  - `supportsAutomaticAssignment() => false`
  - `supportsMandateEditInPublicSurface() => false`

Wording:
- kein `Parteienbuch`
- Begriffe im Contract und in Fixtures: `Mandatsregister`, `VoiceOpenGov Mandatsregister`, `Mandat`, `Repräsentant:in`, `Verantwortung`, `Status`

### 2) Public read-only Route (`GOV-MANDATE-02`)

Geändert:
- `apps/web/src/app/mandat/[id]/page.tsx`

Die Route ist jetzt eine echte öffentliche read-only Mandatsansicht auf Contract-Basis:
- Titel / Mandatsgegenstand
- Bezug zu Dossier/Runde/Anlassraum (mit stabilen Referenzwerten)
- verantwortliche Person oder Organisation
- Rolle
- Status
- Herkunft / Provenienz
- letzte Aktualisierung
- Transparenzhinweis

Explizite Grenzen in UI-Text und Boundary-Flags:
- keine Bearbeitungsfunktion
- keine automatische Zuordnung
- keine automatische Mitgliedschaftsübernahme

## Tests

Neue Tests:
- `apps/web/tests/mandate-contract.test.ts`
- `apps/web/tests/mandat-detail-page.contract.test.ts`

Abgedeckt werden:
- Contract-Integrität und Normalisierung
- read-only Rendering `/mandat/[id]`
- kein `Parteienbuch`-Wording
- kein Edit-/Auto-Assign-/Auto-Membership-Verhalten
- stabile Dossier/Runde/Anlassraum-Referenzen

## OpenTasks-Update

Geändert in `docs/E150/OpenTasks.md`:
- `GOV-MANDATE-01` -> `done`
- `GOV-MANDATE-02` -> `done`
- `GOV-MANDATE-03` -> `codex_ready`
- `GOV-MANDATE-04` -> `needs_decision`
- `GOV-MANDATE-05` -> `codex_ready`
- `GOV-B2B-01` -> `codex_ready`

Zusätzlich wurde `Next codex_ready tasks` auf den neuen Mandats-Folgestand harmonisiert.

## Validierung

Ausgeführt:
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/*mandat*.test.ts tests/*mandate*.test.ts tests/*mandatsregister*.test.ts`
- (wegen Shell-Glob-Auflösung im Repo-Root anschließend explizit) `pnpm -C apps/web exec vitest run tests/mandat-detail-page.contract.test.ts tests/mandate-contract.test.ts`

Ergebnis:
- `typecheck`: grün
- `lint`: grün
- Mandat-Testsuite (explizite Dateiliste): grün (`2` Files / `7` Tests).
