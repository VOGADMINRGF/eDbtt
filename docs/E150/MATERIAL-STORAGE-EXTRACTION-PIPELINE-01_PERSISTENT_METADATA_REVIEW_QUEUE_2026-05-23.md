# MATERIAL-STORAGE-EXTRACTION-PIPELINE-01 — Persistente Material-Metadaten und Review-State

Datum: 2026-05-23
Status: umgesetzt
Reifestufe: `production_candidate`

## Ziel

Den Material-Intake nach `MATERIAL-INTAKE-PRODUCTION-01` weiter haerten: Einreichungen sollen nicht nur als Request-Metadaten erscheinen, sondern als scope-sichere Material-Metadaten mit Review-State und Audit-Events registriert werden. Rohdatei-Storage, Malware-Scanner und Extraktionsanbieter werden dabei nicht vorgetaeuscht.

## Umgesetzt

- Neue `MaterialIntakeRepository`-Schnittstelle:
  - `MaterialIntakeRecord`
  - `MaterialIntakeAuditEvent`
  - `MaterialIntakePersistenceState`
  - `MaterialIntakeWorkflowState`
  - Scan-/Extraktions-/Review-State als getrennte Felder
- Persistenzmodell:
  - Mongo/Core-Collections fuer produktive Runtime: `edebatte_material_intake_records`, `edebatte_material_intake_audit`
  - In-Memory-Fallback nur fuer Test-/Build-/Dev-Faelle, explizit nicht Produktionswahrheit
  - Persistenzzustand nennt `metadataDurable`, `reviewStateDurable`, `rawObjectStorageDurable`, `scanProviderConfigured`, `extractionProviderConfigured`
- `/api/uploads` registriert Material jetzt review-first:
  - Material-Metadaten-Record
  - Audit-Events fuer `submitted`, `review_queued`, bei Bedarf `scan_required` und `extraction_required`
  - Workflow-State je Scope: `verification_required`, `limited_intake`, `review_queue_ready`
  - RequestScope wird lazy aufgeloest; ohne Auth-/Session-Kontext bleibt der Pfad sicher begrenzt
- Organisationsdashboard liest Material-Records scope-sicher:
  - Organisationen sehen Material aus ihrem Organisationsscope
  - Nutzer ohne Organisation sehen keine fremden Organisationsdaten
  - Dashboard unterscheidet bereit vs. pending review
- Guardrails bleiben hart:
  - kein Rohmaterial wird direkt oeffentlich
  - kein automatischer Malware-Scan
  - keine automatische PDF-/YouTube-/Audio-/Video-/Bild-Extraktion
  - kein NotebookLM/Gemini/OpenAI/DeepSearch-Auto-Research
  - kein Auto-Publish
  - kein automatisches `public_official`

## Nicht umgesetzt / bewusst offen

- Kein produktiver Object Storage fuer Rohdateien.
- Kein Malware-/PII-/Copyright-/Authentizitaets-Scanner als echter Provider.
- Keine Extraktionsjob-Queue fuer PDF, Audio, Video, Bild oder YouTube-Transkripte.
- Kein Material-Review-UI mit Entscheidung `approved_internal` / `approved_public_reference`.
- Kein automatischer Claim-/Dossier-Handoff.
- Keine Retention-/Loeschfristen-Policy fuer Rohdateien, weil Rohdateien noch nicht gespeichert werden.

## Warum weiter nicht `production_ready`

Die dauerhafte Metadaten-, Review-State- und Audit-Registrierung ist produktionsnah und beseitigt die reine Request-/Local-Pending-Luecke. `production_ready` fuer Material Intake waere aber erst ehrlich, wenn Rohdatei-Storage, Scanner, Extraktionsjobs, Review-UI, Retention und Handoffs zusammen betrieben und browsernah getestet sind.

## Validierung

- `pnpm -C apps/web exec vitest run tests/material-intake-contract.test.ts tests/material-intake-repository.test.ts tests/uploads-material-intake.route.test.ts tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx`

## Folgepunkte

- `MATERIAL-OBJECT-STORAGE-SCAN-01`: Object Storage, Malware-/PII-/Copyright-/Authentizitaets-Scan und Retention.
- `MATERIAL-EXTRACTION-JOBS-01`: explizite, kosten- und provider-gated Extraktionsjobs fuer PDF, Video, Audio, Bild und YouTube.
- `MATERIAL-REVIEW-HANDOFF-01`: Review-UI und bewusste Handoffs an Claim, Dossier und Review Queue.
