# ISSUE-PR-HYGIENE-V1-CLOSURE-01

Datum: 2026-05-26
Status: done

## Ziel

Nach `V1-PRODUCTION-READY-RUNTIME-PARITY-AUDIT-01` die offenen GitHub-Issues und Alt-PRs gegen den aktuellen SSOT (`OpenTasks.md`, `ProductionReadinessMatrix.md`) und die vorhandenen V1-Evidence-Dateien synchronisieren.

## Entscheidungslogik

- Erledigte V1-Slices bleiben nicht als offene GitHub-Issues stehen.
- Echte Post-V1-Themen bleiben bewusst Post-V1 oder out of scope, aber nicht als V1-Blocker.
- Alte PRs werden nicht gemergt, wenn sie vom dokumentierten `production_ready-v1`-Stand fachlich überholt sind.
- Keine neue Runtime- oder Produktlogik in diesem Slice.

## Tabelle

| Eintrag | GitHub-Status vor Hygiene | Status laut OpenTasks / Matrix | Entscheidung |
| --- | --- | --- | --- |
| Issue #208 | open | `done` via `SELF-PROVISIONING-PRODUCTION-01` | mit Kommentar schließen |
| Issue #209 | open | `done` via `ENTITLEMENT-PROVISIONING-PRODUCTION-01` | mit Kommentar schließen |
| Issue #210 | open | `done` via `SOURCE-CONNECTIONS-PRODUCTION-01` | mit Kommentar schließen |
| Issue #211 | open | `done` via `MATERIAL-INTAKE-PRODUCTION-01` | mit Kommentar schließen |
| Issue #212 | open | `done` via `AUTH-MEMBERSHIP-DIRECTORY-MANUAL-VERIFICATION-PRODUCTION-01` | mit Kommentar schließen |
| Issue #213 | open | `done` via `ANLASSRAUM-RUNTIME-PRODUCTION-01` | mit Kommentar schließen |
| Issue #214 | open | `done` via `FACTCHECK-SEAL-PRODUCTION-01` | mit Kommentar schließen |
| Issue #215 | open | `done` via `RELEASE-GATE-LONGRUN-QA-01` | mit Kommentar schließen |
| Issue #216 | open | `done` via `SOCIAL-PUBLISHING-CI-PRODUCTION-01` und `V1-SOCIAL-DISTRIBUTION-QUEUE-01` | mit Kommentar schließen |
| Issue #217 | open | `done` via `PARTNER-MEDIA-PACKAGES-PRODUCTION-01` | mit Kommentar schließen |
| Issue #218 | open | `done` via `PRODUCTION-READY-V1-CLOSURE-01` | mit Kommentar schließen |
| Issue #219 | open | `done` via `UX-GO-LIVE-SIMPLIFICATION-01` | mit Kommentar schließen |
| Issue #220 | open | `done` via `UX-QUICK-ACTION-CENTER-01` | mit Kommentar schließen |
| Issue #221 | open | `done` via `UX-FIRST-RUN-RETURNING-USER-01` | mit Kommentar schließen |
| PR #165 | open draft | nicht im aktuellen V1-Versprechen; Reinickendorf-spezifischer Demo-/Seed-Pfad ist vom generischen `production_ready-v1`-Stand überholt | kommentieren und als `superseded` schließen |
| PR #125 | open draft | `/create`-Safety-/UX-Stand wurde auf `main` über spätere Slices und V1-Härtung anders geschlossen; Branch nicht mergebar in den aktuellen V1-Stand | kommentieren und als `superseded` schließen |
| PR #121 | open | frühe `/create`-Mobile-/Focus-Card-Arbeit wurde durch spätere `/create`- und UX-Slices überholt | kommentieren und als `superseded` schließen |

## Evidence-Zuordnung der geschlossenen Issues

- #208 -> `docs/E150/SELF-PROVISIONING-PRODUCTION-01_ORG_ONBOARDING_PROVISIONING_2026-05-23.md`
- #209 -> `docs/E150/ENTITLEMENT-PROVISIONING-PRODUCTION-01_ACCESS_GRANTS_AFTER_ORG_APPROVAL_2026-05-23.md`
- #210 -> `docs/E150/SOURCE-CONNECTIONS-PRODUCTION-01_ORG_SCOPED_SOURCE_SNAPSHOTS_2026-05-23.md`
- #211 -> `docs/E150/MATERIAL-INTAKE-PRODUCTION-01_REVIEW_FIRST_UPLOADS_PDF_YOUTUBE_2026-05-23.md`
- #212 -> `docs/E150/AUTH-MEMBERSHIP-DIRECTORY-MANUAL-VERIFICATION-PRODUCTION-01_OPERATOR_VERIFIED_DIRECTORY_2026-05-23.md`
- #213 -> `docs/E150/ANLASSRAUM-RUNTIME-PRODUCTION-01_ROOM_ROUND_LIFECYCLE_2026-05-24.md`
- #214 -> `docs/E150/FACTCHECK-SEAL-PRODUCTION-01_RESEARCH_VERIFICATION_SEAL_WORKFLOW_2026-05-24.md`
- #215 -> `docs/E150/RELEASE-GATE-LONGRUN-QA-01_PRODUCTION_VALIDATION_RUNBOOK_2026-05-24.md`
- #216 -> `docs/E150/SOCIAL-PUBLISHING-CI-PRODUCTION-01_REVIEW_FIRST_DISTRIBUTION_2026-05-24.md`
- #217 -> `docs/E150/PARTNER-MEDIA-PACKAGES-PRODUCTION-01_PROJECT_PACKAGES_TRANSPARENCY_2026-05-24.md`
- #218 -> `docs/E150/PRODUCTION-READY-V1-CLOSURE-01_FINAL_LAUNCH_READINESS_2026-05-25.md`
- #219 -> `docs/E150/UX-GO-LIVE-SIMPLIFICATION-01_NAV_ONBOARDING_CORE_ACTIONS_2026-05-25.md`
- #220 -> `docs/E150/UX-QUICK-ACTION-CENTER-01_TASK_FIRST_ENTRY_2026-05-25.md`
- #221 -> `docs/E150/UX-FIRST-RUN-RETURNING-USER-01_CONTEXTUAL_START_WORKSPACE_2026-05-25.md`

## PR-Befund

### PR #165

- branch: `pr/rathaus-demo-graph-seed-01`
- Typ: demo-/seed-nahe Reinickendorf-Spezifik
- Befund: passt nicht mehr zum generischen `production_ready-v1`-Versprechen und ist nicht Teil des aktuellen SSOT-Pfads fuer `Source Connections`, Feed-Radar oder V1-Closure
- Entscheidung: nicht mergen, sondern als `superseded` schließen

### PR #125

- branch: `pr/create-safety-quality-gate-05`
- Befund: enthält frühere `/create`-Safety- und Mobile-Arbeit, die im aktuellen `main` durch spätere `/create`-, UX- und V1-Härtungsslices überholt wurde
- Entscheidung: nicht mergen, sondern als `superseded` schließen

### PR #121

- branch: `feat/create-mobile-focus-cards-sticky-actions`
- Befund: frühe `/create`-Mobile-/Focus-Card-Arbeit; die Richtung ist im SSOT aufgegangen, aber der PR-Zustand ist gegenüber dem aktuellen `main` fachlich überholt
- Entscheidung: nicht mergen, sondern als `superseded` schließen

## GitHub-Aktionen

- Issues #208–#221 kommentiert und geschlossen
- PRs #165, #125, #121 kommentiert und als `superseded` geschlossen

## Geänderte Dateien

- `docs/E150/OpenTasks.md`
- `docs/E150/ISSUE-PR-HYGIENE-V1-CLOSURE-01_2026-05-26.md`

## Fazit

GitHub spiegelt nach diesem Slice den lokalen `production_ready-v1`-Stand ehrlicher: erledigte V1-Issues bleiben nicht offen, Post-V1-Themen werden nicht als V1-Blocker missverstanden, und alte PRs werden nicht versehentlich in einen bereits anders geschlossenen V1-Stand hineingemergt.
