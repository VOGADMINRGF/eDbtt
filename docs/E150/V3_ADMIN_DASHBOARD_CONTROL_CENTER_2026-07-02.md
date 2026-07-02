# V3 Admin Dashboard Control Center

## Was gebaut wurde

- `/admin` wurde um einen sichtbaren Abschnitt `V3 Control Center` erweitert.
- Ein neues Readmodel `apps/web/src/features/admin/v3ControlCenterReadModel.ts`
  liefert die kanonischen V3-Capabilities, ihren aktuellen Reality-Status,
  den Zielstatus `endstate_ready`, offene Gaps, Guardrails, echte Links und den
  naechsten Slice.
- Der bestehende Operator-Console-Ansatz bleibt erhalten: keine neue
  Admin-Welt, keine neue Route-Pflicht, kein neues Backend fuer Fake-Metriken.
- Der Control-Center-Abschnitt zeigt Statuszaehlungen, einzelne Capability-
  Karten, naechste empfohlene Schritte und den Hinweis, dass
  `partially_built` kein Endstand ist.

## Welche bestehenden Flaechen gebuendelt oder verlinkt wurden

- `/admin`
- `/admin/review`
- `/admin/region`
- `/admin/telemetry`
- `/admin/telemetry/ai/orchestrator`
- `/admin/telemetry/ai/usage`
- `/admin/entitlements`
- `/admin/pricing/orders`
- `/admin/errors`
- `/admin/system`
- `/admin/reports/assets`
- `/admin/themenradar`
- `/admin/newsletter`
- `/admin/graph/health`
- `/admin/create/attach-drafts/history-maintenance`
- `/admin/feeds`
- `/admin/campaigns`
- `/account/organization/dashboard`
- `/qr-studio`

## Was ausdruecklich nicht gebaut wurde

- keine zweite Admin-Welt
- keine neue Runtime-Migration
- keine Fake-Actions
- keine Auto-Publish-Funktion
- keine Auto-Activation
- keine Auto-Factcheck- oder Auto-Verification-Logik
- keine Auto-Graph-Writes
- keine Auto-Merge-Logik
- keine hidden DeepSearch
- keine hidden Cost Paths
- keine echten Social-Posts
- keine echten Meeting-Connectoren
- keine neue Billing- oder Checkout-Integration

## Warum keine Fake-Actions

Das Control Center soll zuerst sichtbar machen, buendeln und verlinken.
Wenn fuer eine Capability noch keine einheitliche Admin-Flaeche existiert,
bleibt sie als `partially_built` oder `docs_only` markiert und zeigt
`Noch nicht als Admin-Flaeche vorhanden` statt eines Platzhalter-Buttons.

## Welche Capabilities weiter offen bleiben

Das Control Center macht V3-Reife sichtbar, schliesst aber die einzelnen
Capabilities nicht auf `endstate_ready`.

Offen bleiben insbesondere:

- `V3-HANDOFF-INTEGRITY-AND-LINKAGE-MAP-01`
- `V3-TEST-RESULTS-REGRESSION-MATRIX-01`
- `V3-VOXY-GUIDED-EXPERIENCE-01`
- `V3-PRICING-CREDITS-LIMITS-01`
- `V3-ROLES-PERMISSIONS-ENTITLEMENTS-01`
- `V3-NOTIFICATIONS-REALTIME-MAIL-01`
- `V3-INCIDENT-RECOVERY-MAINTENANCE-01`
- `V3-IMAGE-GENERATION-VOXY-ASSETS-DOSSIER-OUTPUTS-01`
- `V3-QR-SHARING-PUBLIC-ENTRY-01`
- `V3-PROGRAMM-GROWTH-APPROVAL-PIPELINE-01`

## Tests und Validierung

- `apps/web/tests/v3-control-center-readmodel.contract.test.ts`
- `apps/web/tests/v3-control-center-admin.page.test.tsx`
- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/v3-control-center-readmodel.contract.test.ts tests/v3-control-center-admin.page.test.tsx`
- `pnpm -C apps/web run build`
