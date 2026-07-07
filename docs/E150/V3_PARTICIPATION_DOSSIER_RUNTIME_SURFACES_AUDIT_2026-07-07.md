# V3 Participation / Dossier Runtime Surfaces Audit

Stand: 2026-07-07  
Branch: `pr/v3-participation-dossier-runtime-surfaces-01`

Scope: bestehende V3-Readmodels und Review-first Runtime-Wahrheit in vorhandenen
Flächen sichtbar machen. Keine neue Route, keine zweite Queue, keine neue
Persistenz, kein Auto-Publish, keine Public-Aktivierung, kein Social-Trigger,
kein Voxy-Render und keine neue Provider-Runtime.

## Ergebnis

- `operational_basic`: eine gemeinsame `Runtime Surface Map` ist jetzt auf
  bestehenden Flächen sichtbar und nutzt nur vorhandene Readmodels.
- `preview_only`: `/create` zeigt Downstream-Schritte weiterhin als vorbereitete
  Handoffs und Kandidaten, solange keine echte Review- oder Runtime-Wahrheit
  vorliegt.
- `readmodel_only`: Output- und Voxy-Schritte werden in `/create` nicht
  vorgetäuscht, sondern erst auf Dossier-/Review-Flächen sichtbar.
- Keine Reife-Hochstufung auf `endstate_ready`, `production_ready` oder `live`.

## Verwendete Flächen

| Fläche | Status | Datei(en) | aktueller Stand | bleibt bewusst offen |
| --- | --- | --- | --- | --- |
| `/create` | operational_basic / preview_only | `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`, `apps/web/src/features/create/V3RuntimeWorkflowSurface.tsx` | Die bestehende Candidate-/Handoff-/Claim-to-Dossier-Lesart zeigt jetzt denselben Arbeitsfluss über `Create / Handoff`, Review, Dossier, Participation, Output und Voxy. Persistierte Handoffs bleiben sichtbar getrennt von reiner Vorschau. | Keine neue Persistenz, keine automatische Queue-Einbuchung, keine Fake-Output- oder Voxy-Runtime in `/create`. |
| `/admin/review` | operational_basic | `apps/web/src/app/admin/review/page.tsx`, `apps/web/src/features/create/V3RuntimeWorkflowSurface.tsx` | Review-Items mit `v3ReviewContext` zeigen jetzt zusätzlich eine kleine Surface-Map über denselben V3-Arbeitsfluss. Damit werden Create-Handoff, Queue, Dossier, Participation, Output und Voxy auf derselben bestehenden Operator-Fläche sichtbar. | Keine neuen Aktionen, keine zweite Queue, keine Veröffentlichungs- oder Aktivierungslogik. |
| `/dossier/[id]/studio` | operational_basic | `apps/web/src/app/dossier/[id]/studio/page.tsx`, `apps/web/src/features/create/V3RuntimeWorkflowSurface.tsx` | Das bestehende Dossier-Studio trägt jetzt neben dem Review-Kontext auch die kleine Surface-Map für Dossier-, Participation-, Output- und Voxy-Folgen. | Keine Dossier-Finalisierung, kein Social-Publish, kein Voxy-Render, keine neue Studio-Route. |

## Bewusst nicht berührte Flächen

| Fläche | Grund |
| --- | --- |
| Account Resume / Draft Status | Dort fehlt heute noch ein belastbarer, scope-sicherer `v3ReviewContext` für Nutzer. Ein UI-Ausbau ohne diese Wahrheit würde lokale Drafts künstlich wie persistierte V3-Runtime behandeln. Folgepfad: `V3-ACCOUNT-RESUME-WORKFLOW-CONTINUITY-01`. |
| `/atlas/social-review` | Die bestehende Social-Review-Queue bleibt unverändert, weil dieser Slice dieselbe Output-Wahrheit bereits im Dossier-Studio und in `/admin/review` sichtbar macht. Eine zusätzliche Social-Review-Oberfläche sollte erst mit klarer, dedizierter V3-Kontextverdrahtung erweitert werden. |
| Öffentliche Beteiligungsflächen `/beteiligung/*` | Der Slice bleibt bewusst auf internen Arbeitsflächen. Öffentliche Beteiligung bleibt review-first und wird nicht aus Kandidaten- oder Draft-Status automatisch aktiviert. |
| Anlassraum Operations | Die vorhandene Operations-Fläche hat derzeit keinen direkten `v3ReviewContext`. Ein Ausbau ohne diesen Kontext würde nur zweite Wahrheiten oder UI-Hacks erzeugen. |

## Guardrails, die explizit erhalten bleiben

- `publish_ready` ist nicht `published`.
- `review_ready` ist nicht `approved`.
- Draft ist nicht Veröffentlichung.
- Vorschlag ist nicht Entscheidung.
- Preview ist nicht Runtime.
- Keine automatische öffentliche Aktivierung.
- Kein automatisches Social Posting.
- Kein echter Voxy-Render und kein Voxy-Publish ohne Review, Provider und Runtime-Wahrheit.

## Tests

- `pnpm -C apps/web exec vitest run tests/v3-runtime-workflow-surface.test.tsx tests/create-candidate-preview.contract.test.ts tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/v3-review-context-summary.test.tsx`

## Nächster sinnvoller Slice

- `V3-ACCOUNT-RESUME-WORKFLOW-CONTINUITY-01` für eine ehrliche, nutzerseitige
  Wiederaufnahme derselben V3-Arbeitsfluss-Sprache im Account-Resume, sobald dort
  belastbare V3-Handoff- oder Runtime-Wahrheit scope-sicher verfügbar ist.
