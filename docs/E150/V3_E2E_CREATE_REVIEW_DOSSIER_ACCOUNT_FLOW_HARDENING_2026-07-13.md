# V3 E2E Create Review Dossier Account Flow Hardening 2026-07-13

## Scope

- `V3-E2E-CREATE-REVIEW-DOSSIER-ACCOUNT-FLOW-HARDENING-01`
- Cluster: Create / Review / Dossier / Account / Organization End-to-End Flow

## Umsetzung

- Eine gemeinsame, user-facing Label-Quelle wurde unter `apps/web/src/features/review/e2eFlowUserFacingLabels.ts` eingeführt.
- `/create` nutzt diese Quelle jetzt für Handoff-, Arbeitsstand-, Persistenz- und Anschluss-Semantik statt rohe Enum- und Runtime-Begriffe in `CreateCandidatePreviewPanel.tsx`.
- `/account` nutzt dieselbe Quelle für Linkage-, Arbeitsstand- und Korrelations-Chips in `AccountResumeWorkbenchSection.tsx`.
- `/admin/review` nutzt dieselbe Korrelationsbasis-Lesart statt einer abweichenden lokalen Kopie.
- `V3RuntimeWorkflowSurface.tsx` leakt in HTML-Attributen keine rohe `missing_runtime_truth`-Semantik mehr.

## Geprüfte aktive Surfaces

- `/create`
  Die Kandidatenvorschau bleibt preview-first. Review-Handoff, Dossier-Handoff und Beteiligungs-Handoff werden sichtbar, aber nicht als aktive Runtime oder Veröffentlichung behauptet.
- `/admin/review`
  Die zentrale Review-Oberfläche behält ihre Review-first Guardrails und nutzt für Account-Linkage dieselbe Herkunftssemantik wie `/account`.
- `/dossier/[id]/studio`
  Keine neue Produktlogik nötig. Die bestehende Studio-Lesart bleibt konsistent und wurde über die geteilten Workflow-Komponenten regressionsgetestet.
- `/account`
  Verknüpfte Arbeitsstände zeigen jetzt eine verständliche E2E-Semantik statt lokaler Runtime-/Readmodel-Begriffe.
- `/account/organization/dashboard`
  Auditiert, aber in diesem Slice nicht geändert. Die dortige Statussprache war bereits konsistent mit review-first, Freigabe- und Sichtbarkeitsgrenzen.

## Doppelstrukturen reduziert

- Lokale Label-Funktionen für Account-Linkage und Korrelation wurden zentralisiert.
- Die Create-Vorschau zeigt keine rohen `missing_*`, `planned_handoff`, `create_handoff_review_queue` oder `target_*_id`-Begriffe mehr als Nutzertext.
- Admin- und Account-Surface teilen sich jetzt dieselbe Korrelationsbasis-Lesart.

## Produktwahrheit

- Create-Handoff bleibt ein vorbereiteter Review-Arbeitsstand.
- Dossier-, Beteiligungs- und Output-Folgeschritte bleiben getrennte Folgepfade.
- `review_ready` bleibt getrennt von `approved`.
- `publish_ready` bleibt getrennt von `published`.
- Keine neue Runtime, keine neue Persistenzarchitektur, kein Auto-Publish, kein Scheduling, kein Social Posting.

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/v3-review-context-summary.test.tsx tests/v3-runtime-workflow-surface.test.tsx tests/review-surface-status-labels.test.ts tests/dossier-studio-server-persistence-ui.test.tsx`

## Offene Punkte

- `V3-DOSSIER-EXPORT-SHARE-PUBLISH-READY-GUARD-01` bleibt als nächster, aber separater Dossier-/Export-/Share-Cluster offen.
- Die weiterhin technischen Voxy-Foundation-Panels wurden in diesem Slice nicht fachlich erweitert; sie bleiben review-first/noop und außerhalb der aktuellen Produktpfad-Härtung.
