# V3_VOXY_HYBRID_RUNTIME_FOUNDATION_2026-07-12

Task: `V3-VOXY-HYBRID-RUNTIME-FOUNDATION-03`

## Ziel

Den freigegebenen Pfad `selected_path = hybrid_external_render_adapter` als kleinen Foundation-Slice vorbereiten, ohne echte Runtime zu aktivieren.

## Umgesetzte Foundation

- Provider-neutraler Runtime-Vertrag in `apps/web/src/features/voxyVideo/contracts.ts`
- Austauschbarer, strikt deaktivierter Hybrid-Foundation-Contract in `apps/web/src/features/create/voxyRenderHybridRuntimeFoundationContract.ts`
- Read-only Panel `Hybrid Runtime Foundation` in Create, Account, Admin Review und Dossier Studio
- Requirement-only Config-/Secret-Bedarf fuer spaetere Adapter-, Queue-, Storage- und Upload-Anbindung
- Klare Trennung zwischen `foundation_ready` und `runtimeEnabled = false`

## Guardrails

- Keine Provider-Secrets gelesen
- Keine Provider-Credentials eingetragen
- Keine externen API-Calls
- Kein Render gestartet
- Kein Upload gestartet
- Kein Storage-Write ausgefuehrt
- Kein Scheduling ausgefuehrt
- Kein Publish gestartet
- Kein Social Posting gestartet
- Keine Queue-/Worker-Ausfuehrung gestartet
- Keine Feature-Flags aktiviert

## Tests

- `apps/web/tests/voxy-video-contract.test.ts`
- `apps/web/tests/voxy-render-hybrid-runtime-foundation.contract.test.tsx`
- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

## Offen

- Spaetere Runtime-Aktivierung bleibt separater Decision-/Enablement-Pfad
- Provider-Adapter bleibt bewusst noop/disabled
- Queue-, Storage-, Upload-, Scheduling- und Publish-Ausfuehrung bleiben ausserhalb dieses Slices
