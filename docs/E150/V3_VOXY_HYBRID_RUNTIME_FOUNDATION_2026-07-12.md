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

## Strategische Fortsetzung ab 2026-07-13

Der Hybridpfad bleibt der freigegebene Uebergangs- und Fallback-Pfad fuer eine fruehe echte Preview. Das langfristige Produktziel wird jedoch auf einen eigenen eDebatte-Self-Renderer erweitert:

- eDebatte besitzt Script, Evidence, Assets, Templates, Voice-/Motion-Cues, Review und Rendersteuerung.
- Ein externer Adapter darf erste Tests beschleunigen, wird aber nicht zum Produktkern.
- Standard-Voxy-Videos sollen langfristig serverseitig durch eDebatte selbst gerendert werden, um Anbieterabhaengigkeit und wiederkehrende externe Videokosten zu reduzieren.
- Vor der Runtime darf ein kontrollierter Marketing-Pilot mit zehn reproduzierbaren Werbevideo-Briefings und wenigen manuellen Stilprototypen stattfinden.
- Adobe Character Animator oder andere Tools bleiben optionale Pilotwerkzeuge; OBS und eine Webcam sind keine Voraussetzung fuer vorproduzierte Voxy-Videos.
- Kein Auto-Publish und kein Review-Bypass.

Kanonische Roadmap und vorgeschlagener OpenTasks-Block:

- `docs/E150/V3_VOXY_SELF_RENDER_AND_MARKETING_PILOT_ROADMAP_2026-07-13.md`
