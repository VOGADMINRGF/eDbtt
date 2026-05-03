# Evidence: GOV-MANDATE-04 Consent Register Handoff Contract (2026-05-03)

## Scope

Umgesetzt wurde `GOV-MANDATE-04` als docs-/contract-first Slice.

Enthalten:
- typed Handoff-Contract für VoiceOpenGov Register-/Membership-Handoff aus eDebatte-Mandaten
- explizite Consent-Pflicht
- sichtbare Rolle/Provenienz/Widerrufbarkeit
- Guardrails gegen stille oder automatische Übernahme
- Contract-Tests
- OpenTasks-Update auf `done`

Nicht enthalten:
- keine UI-/Route-Implementierung
- keine Datenbank-/Adapter-Integration
- keine automatische Mitgliedschaftsaktivierung
- keine automatische Rollenableitung

## Umsetzung

### 1) Handoff-Contract

Neue Datei:
- `features/mandate/handoff.ts`

Contract-Inhalt:
- Statusmodell: `draft`, `ready_for_review`, `accepted`, `rejected`, `withdrawn`
- Rollenmodell für Register-Handoff: `organisation_representative`, `verwaltung_representative`, `mandate_representative`, `admin_delegate`
- Provenienzmodell: `origin`, Source-IDs (`mandate`/`dossier`/`round`/`anlassraum`), vorbereitende Rolle/Referenz
- Consentmodell:
  - `optInGranted` ist strikt `true` (expliziter Opt-in)
  - versionierter Consent-Text + Timestamp
  - `revocable: true`
- Membership-/Registermodell:
  - `createMembershipEntry` explizit
  - `registerVisibility` (`public`/`restricted`)
  - `implicitTransfer: false`
  - `implicitRoleInference: false`
- Widerrufsmodell (`withdrawn` nur mit Revocation-Payload)

Hilfsfunktionen:
- `canPrepareMandateRegisterHandoff(...)`
- `buildMandateRegisterHandoff(...)`
- `withdrawMandateRegisterHandoff(...)`
- `parseMandateRegisterHandoff(...)`
- Guardrail-Flags:
  - `supportsAutomaticMandateRegisterTransfer() => false`
  - `supportsImplicitMembershipActivationFromMandate() => false`
  - `supportsAutomaticRoleInferenceFromMandateBehavior() => false`
- Sichtbarkeits-Helper:
  - `buildMandateRegisterHandoffDisclosure(...)` für Consent/Role/Provenienz/Widerrufbarkeit

### 2) Export-Anbindung

Geändert:
- `features/mandate/index.ts`

## Tests

Neue Datei:
- `apps/web/tests/mandate-handoff.contract.test.ts`

Abgedeckt:
- Handoff darf nur durch verantwortliche Repräsentant:innen oder Admin vorbereitet werden
- expliziter Opt-in ist verpflichtend
- Consent/Rolle/Provenienz/Widerrufbarkeit sind sichtbar ableitbar
- Withdraw-Pfad ist strukturiert und statusgebunden
- Auto-Transfer-/Auto-Membership-/Auto-Role-Inference bleibt hart deaktiviert

## OpenTasks-Update

In `docs/E150/OpenTasks.md`:
- `GOV-MANDATE-04` von `codex_ready` auf `done`
- Abschnitt `Next codex_ready tasks` entsprechend angepasst

## Validierung

Ausgeführt:
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/mandate-contract.test.ts tests/mandate-permissions.contract.test.ts tests/mandate-handoff.contract.test.ts tests/mandat-detail-page.contract.test.ts`

Ergebnis:
- alle Schritte grün.
