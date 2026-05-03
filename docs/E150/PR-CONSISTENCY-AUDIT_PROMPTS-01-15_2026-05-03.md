# Konsistenz-Audit Prompt 1-15 (2026-05-03)

## Ziel

Tiefe Revalidierung der in den 15 Codex-Prompts genannten Slices gegen:

- `docs/E150/OpenTasks.md` (SSOT)
- bestehende Implementierung
- vorhandene Tests

Zusätzlich: fehlende Testabdeckung sinnvoll ergänzen.

## Ergebnisübersicht

### Bereits erledigt (bestätigt)

- PR-CHAT-BACKLOG-01
- PR-CONVERSION-HARM-03
- PR-PRICING-TAGS-ANNUAL-01
- PR-PRICING-HANDOFF-CLICK-01
- PR-LANDING-CLARITY-01
- PR-CREATE-CONTEXT-01
- PR-OUTPUT-STUDIO-01
- PR-OUTPUT-STUDIO-02
- PR-OUTPUT-STUDIO-03
- PR-OUTPUT-ENGINE-02
- PR-OUT-POST-GENERATOR-01
- PR-OUT-STUDIO-CHANNELS-01
- PR-OUT-ENGINE-05
- PR-OUT-ENGINE-06
- PR-OUT-ENGINE-07
- PR-OUT-ENGINE-08
- PR-OUT-ENGINE-09
- PR-OUT-EXPORT-01
- PR-OUT-TELEMETRY-01
- PR-DOSSIER-EVIDENCE-FIRST-01

### In diesem Audit auf done harmonisiert

- PR-DOSSIER-NUMBERS-AUDIT-01
- PR-DOSSIER-PARTICIPATION-AUDIT-01
- PR-DEMO-MASTER-DOSSIER-02

Begründung:

- Zahlen-/Beteiligungs-Audit-Sektionen waren bereits in `DossierViewer` vorhanden und aus `note-zahlen-audit`/`note-beteiligungs-audit` gespeist.
- Deep-Research-Quellenmatrix war bereits im Master-Dossier-Datensatz vorhanden (MiD 2023, ULEZ, ZTL, Superblocks, Congestion Pricing, ERP, DLR, OECD/IEEP, DfT).
- OpenTasks war hier hinter dem tatsächlichen Implementierungsstand.

### Nicht erledigt / bewusst offen

- PR-THEMENRADAR-03 (`codex_ready`)
- PR-SHARE-DIST-01 (`codex_ready`)
- PR-MEMBERSHIP-ENGINE-01 (`codex_ready`)
- PR-EDITORIAL-SERIES-01 (`open`)
- PR-AI-ORCH-POLICY-01 (`codex_ready`)

Diese bleiben im Backlog, weil kein belastbarer Nachweis für vollständige Endabnahme als `done` im Scope dieses Audits vorlag.

### Decision-boundary (korrekt nicht implementiert)

- GOV-CIVIC-ECON-01 (`needs_decision`)
- PR-BETEILIGUNGSRADAR-00 (`needs_decision`, docs-only)
- DOMAIN-HARM-01C (`needs_decision`)

## Neu ergänzte Tests

1. `apps/web/tests/dossier-demo-master-content.test.ts`
   - Quellenmatrix-Einträge prüfen jetzt zusätzlich auf:
     - `cluster`
     - `takeaway`
     - `criticalCaveat`
     - `transferability`
     - `evidenceStatus`
   - Prozent-Kontext-Guardrail ergänzt:
     - Bei `%` in `measured` müssen `denominator` und `transferabilityCaveat` substanziell vorhanden sein.

2. `apps/web/tests/dossier-evidence-first-ux.test.tsx`
   - Neutralitäts-/Guardrail-Test ergänzt:
     - verbietet Truth-Claim-Wording (`KI sagt Wahrheit`, `KI bestätigt`, `unumstößlich bewiesen`)
     - verlangt sichtbare Caveat-/Ableitbarkeitshinweise.

## OpenTasks-Sync

`docs/E150/OpenTasks.md` aktualisiert:

- PR-DOSSIER-NUMBERS-AUDIT-01 -> `done`
- PR-DOSSIER-PARTICIPATION-AUDIT-01 -> `done`
- PR-DEMO-MASTER-DOSSIER-02 -> `done`
- Next-codex-ready-Abschnitt bereinigt.

## Guardrails bestätigt

- Kein Beteiligungsradar-Build.
- Keine harte `/anlassraum`-Migration.
- Keine stillen Policy-Entscheide bei needs_decision-Tasks.
