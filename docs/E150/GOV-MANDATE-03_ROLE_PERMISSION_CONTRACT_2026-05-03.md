# Evidence: GOV-MANDATE-03 Role Permission Contract (2026-05-03)

## Scope

Umgesetzt wurde der Slice `GOV-MANDATE-03` als contract-first Rechte-/Rollenmodell für Mandate.

Enthalten:
- typed Rollen-/Berechtigungscontract
- klare Trennung von Lese-, Beitrags-, Pflege- und Admin-Rechten
- Contract-Tests
- OpenTasks-Update auf `done`

Nicht enthalten:
- keine neuen Runtime-Mutationen
- keine neuen Routen
- keine UI-Erweiterung für Write-Flows
- kein Membership-/Register-Handoff (Folgeslice `GOV-MANDATE-04`)

## Umsetzung

### 1) Rollen-/Rechtecontract

Neue Datei:
- `features/mandate/permissions.ts`

Exports:
- `MANDATE_ACTOR_ROLES`
- `MANDATE_PERMISSION_ACTIONS`
- `normalizeMandateActorRole(...)`
- `resolveMandatePermissionMatrix(...)`
- `canPerformMandateAction(...)`

Abgedeckte Rollen:
- `guest`
- `citizen`
- `journalist`
- `fachakteur`
- `organisation_representative`
- `verwaltung_representative`
- `mandate_representative`
- `admin`

Abgedeckte Rechte:
- Public Read (`read_mandate`)
- Beitragseinreichung (`source_hint`, `objection`, `followup_question`, `progress_observation`)
- Factcheck-Hinweise (`submit_factcheck_hint`)
- Mandatspflege (`accept_mandate`, `update_mandate_status`, `update_mandate_responsibility`, `update_mandate_resolution_details`)
- Admin-Gates (`admin_verify_mandate`, `admin_set_visibility`, `admin_mark_conflict`)

Rechteprinzip:
- `guest/public`: lesen ja, schreiben nein
- `citizen`: Beitrags-/Hinweisrechte, keine Status-/Verantwortungsrechte
- `journalist`/`fachakteur`: zusätzlich Factcheck-Hinweise
- verantwortliche Repräsentant:innen: eigene Mandate annehmen/pflegen (gebunden an `actorReferenceIds` -> `mandate.responsibility.holderId`)
- `admin`: Verifikation, Sichtbarkeit, Konfliktmarkierung und Status-/Verantwortungsupdates

### 2) Export-Anbindung

Geändert:
- `features/mandate/index.ts`

`permissions.ts` ist über den Mandate-Entry-Point exportiert.

## Tests

Neue Testdatei:
- `apps/web/tests/mandate-permissions.contract.test.ts`

Testabdeckung:
- Guest Read-only Boundary
- Citizen Contribution-Rechte ohne Statuswrites
- Journalist/Fachakteur Factcheck-Hinweise
- Own-Mandate-Pflege nur für verantwortliche Repräsentant:innen
- Admin-Verifikation/Sichtbarkeit/Konfliktrechte
- Rollen-Normalisierung (Unknown -> `guest`)

## OpenTasks-Update

In `docs/E150/OpenTasks.md`:
- `GOV-MANDATE-03` auf `done` gesetzt
- `Next codex_ready tasks` aktualisiert (Mandate-Folge: `GOV-MANDATE-04`, `GOV-MANDATE-05`)

## Validierung

Ausgeführt:
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/mandate-contract.test.ts tests/mandat-detail-page.contract.test.ts tests/mandate-permissions.contract.test.ts`

Ergebnis:
- alle drei Validierungsschritte grün.
