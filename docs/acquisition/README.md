# Acquisition Engine scaffold

Ziel: ein generischer, reviewbarer Discovery-/Akquise-Stack fuer Regionen, Kommunen, Verbaende, Medien und weitere Zielgruppen.

## Architektur

- `features/regions`: geografischer und administrativer Kontext
- `features/entities`: adressierbare Organisationen und Ansprechpartner
- `features/signals`: oeffentliche Signale aus Webseiten, News und Bekanntmachungen
- `features/opportunitySpaces`: Anlassraum-/Pilot-Kandidaten
- `features/acquisition`: Discovery, Adapter, Import, Run-Scoring, Review/Approve

## Guardrails

- kein Auto-Outreach
- kein Auto-Apply in produktive Dossiers
- alles zunaechst review-first
- Quellen und Confidence werden pro Kandidat gespeichert

## PR-00 bis PR-09

- PR-00 Datenmodell und Feature-Schnitt
- PR-01 Seed-Import
- PR-02 Region/Entity Discovery
- PR-03 Rollen und Kontakte
- PR-04 Signals und Opportunity Seeding
- PR-05 Scoring und Candidate Build
- PR-06 Review-UI
- PR-07 Approve/Apply-Hooks
- PR-08 Zielgruppen-Adapter erweitern
- PR-09 Produktionsanbindung an echte DB/Queues/Auth

## Bewusste Einschraenkungen dieses Scaffolds

- In-Memory-Repositories statt produktiver DB
- HTTP/HTML-Fetch statt Playwright, damit das Repo ohne neue Pflicht-Dependency kompilierbar bleibt
- keine Auth-Gates in den neuen Admin-Routen
- keine globale Scheduler-/Queue-Anbindung

Damit ist der Patch ein sauberer produktiver Einstiegspunkt, aber noch nicht der finale produktive Betriebszustand.