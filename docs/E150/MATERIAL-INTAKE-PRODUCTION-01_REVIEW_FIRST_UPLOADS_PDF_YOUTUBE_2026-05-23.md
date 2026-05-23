# MATERIAL-INTAKE-PRODUCTION-01 — Review-first Uploads, PDF und YouTube

Datum: 2026-05-23
Status: umgesetzt
Reifestufe: `production_candidate`

## Ziel

Material-Intake fuer Text, Uploads, PDF, Dokument-URLs, YouTube/Video, Audio, Bild und Snapshots wird auf den bestehenden Create-/Analyze-/Organisationspfaden produktionsnaeher gefuehrt, ohne automatische Extraktion, ohne Auto-Research, ohne Auto-Publish und ohne falschen Storage-Claim.

## Umgesetzt

- Neuer typed Contract fuer Material-Intake:
  - `MaterialIntakeType`
  - `MaterialIntakeStatus`
  - `MaterialIntakeRiskFlag`
  - `MaterialIntakeGuardrails`
  - `MaterialIntakeContract`
  - `MaterialIntakeDashboardSummary`
- Statusmodell:
  - `submitted`
  - `scan_needed`
  - `extraction_pending`
  - `review_needed`
  - `internal_usable`
  - `public_referenceable`
  - `rejected`
  - `archived`
- Risiko- und Guardrail-Modell:
  - PII moeglich
  - Copyright-/Authentizitaetspruefung
  - Malware-Scan erforderlich
  - Medienrechte-Review
  - fehlende Extraktion / fehlender Quellenkontext
  - Rohmaterial bleibt privat
- `/api/contributions/analyze` fuehrt Material weiter in derselben `material_grounding`-Lane, aber:
  - `researchMode=auto` startet keine Gemini-/DeepSearch-/OpenAI-Research-Auswertung mehr.
  - YouTube ohne Transkript wird nicht als vorhandenes Transkript ausgegeben.
  - PDF-/Upload-Material ohne Text bleibt scan-/extraktions- und reviewpflichtig.
  - Material-Intake erscheint in `meta.materialIntake`.
- `/api/uploads` gibt einen ehrlichen `local_pending`-/Request-Metadatenzustand zurueck:
  - kein behaupteter produktiver Storage
  - kein Scan ausgefuehrt
  - keine Extraktion ausgefuehrt
  - keine KI-Recherche gestartet
  - keine Veroeffentlichung
- `material_grounding`-Journey-Defaults wurden entschaerft:
  - keine Gemini-Research-Defaultannahme
  - kein OpenAI-Fallback fuer Material-Grounding als Default
  - Mistral/Anthropic bleiben fuer explizite Analyse-Strukturierung moeglich, aber nicht als automatische Extraktions-/Research-Behauptung.
- Organisationsdashboard zeigt `Material & Uploads`:
  - nicht verifizierte Organisation: produktiver Workflow gesperrt
  - verifizierte Organisation ohne Arbeitszugang: limited intake
  - verifizierte Organisation mit passendem Arbeitszugang: Material bewusst einreichen / review-first vorbereiten
  - keine Admin-Sprache in Nutzerflaeche
  - kein NotebookLM/Gemini/DeepSearch/Auto-Publish/public_official-Claim

## Nicht umgesetzt / bewusst offen

- Kein produktiver Datei-Storage.
- Kein Malware-Scanner.
- Keine echte PDF-/Audio-/Video-/Bild-Extraktionspipeline.
- Keine YouTube-Transcript-Integration.
- Keine neue externe Provider- oder NotebookLM-Integration.
- Kein eigener Material-Review-Store.
- Kein automatischer Dossier-/Claim-Anhang.
- Kein Payment-/Checkout-/Billing-Pfad.

## Warum nicht `production_ready`

Der Slice ist `production_candidate`, weil Status, Guardrails, Dashboard-Lesart und No-Auto-Research-Regeln jetzt sauber in Runtime und Tests verankert sind. `production_ready` waere erst ehrlich, wenn Storage, Scan, Extraktion, Material-Review, Audit-Persistenz, Scope-Gates und Dossier-/Claim-Handoffs dauerhaft und wiederholbar produktiv betrieben werden.

## Validierung

- `pnpm -C apps/web exec vitest run tests/material-intake-contract.test.ts tests/uploads-material-intake.route.test.ts tests/create-material-routing.contract.test.ts tests/create-analyze.route.test.ts tests/e150-journey-routing.contract.test.ts tests/e150-verification-presentation.contract.test.ts tests/create-analyze-envelope.verification.test.ts tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx`

## Folgepunkte

- Persistenter Material-Store mit Audit-Events und Retention-Regeln.
- Malware-/PII-/Copyright-/Authentizitaets-Scanner als expliziter Queue-Schritt.
- Extraktionsjobs fuer PDF, Video, Audio und Bild mit Kosten-/Provider-Gates.
- Review-UI fuer Material-Handoffs an Claim, Dossier und Review Queue.
- Browsernahe E2E-QA fuer Upload-Fehlerfaelle, grosse PDFs, fehlende Transkripte und org-scoped Isolation.
