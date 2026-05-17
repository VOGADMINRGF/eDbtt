# PUBLIC-OFFICIAL-REVIEW-01

Datum: 2026-05-17
Issue: #155

## Ziel

`public_official` darf nie automatisch entstehen. Amtliche Freigabe braucht einen expliziten menschlichen Schritt, eine berechtigte Rolle und einen Audit-Trail.

## Umsetzung

- Bestehende Visibility-/Publication-Ladder wiederverwendet, keine Parallel-Ladder gebaut.
- `publication_approved` oder Admin-/Betreiber-Fallback sind jetzt harte Freigabevoraussetzung.
- `organization_verified` allein reicht nicht.
- `unit_verified` allein reicht nicht.
- Participation-Signale haben jetzt einen expliziten Freigabe-/Widerrufspfad fuer `public_official`.
- Dossier-Studio-Workspaces haben jetzt einen expliziten Freigabe-/Widerrufspfad fuer `public_official`.
- Jede Freigabe und jeder Widerruf erzeugt ein Audit-Event.
- Studio-/Output-/Dashboard-Surfaces zeigen amtliche Freigabe sichtbar, aber weiterhin ohne Social Publishing, automatische amtliche Antwort oder automatische Finalisierung.

## Wiederverwendete Bausteine

- `Membership Runtime`
- `Organization Claims`
- `Publication Risk Ladder`
- `DossierStudioWorkspace`
- `RegionParticipationSignalReviewRuntime`
- `RegionSignalDrafts`
- `OutputEngine`
- `Runden` / Public Input
- `Create Handoffs`
- `Organization Dashboard`

## Guardrails

- kein Social Publishing
- keine automatische amtliche Antwort
- keine automatische Dossier-Finalisierung
- keine automatische Anlassraum-Finalisierung
- keine rechtliche Bewertung
- kein Payment
- kein GeoReferenceLayer

## Sichtbare Auswirkungen

- Regionale Beteiligungssignale koennen nach expliziter menschlicher Freigabe `amtlich freigegeben` anzeigen.
- Dossier-Studio kann einen serverseitigen Workspace als `amtlich freigegeben` ausweisen.
- Organisationsbereich zeigt den naechsten Schritt `Amtliche Freigabe prüfen`, wenn die Rolle dafuer ueberhaupt berechtigt ist.

## Validierung

- `pnpm -C apps/web exec vitest run tests/participation-signal-review-runtime.test.ts tests/admin-participation-signal-review.route.test.ts tests/dossier-studio-workspace.route.test.ts tests/dossier-studio-server-persistence-ui.test.tsx tests/organization-dashboard.readmodel.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/runden-public-input.route.test.ts tests/participation-signal-review-runtime.test.ts tests/admin-participation-signal-review.route.test.ts tests/dossier-studio-workspace.route.test.ts tests/dossier-studio-server-persistence-ui.test.tsx tests/organization-dashboard.readmodel.test.ts tests/dossier-output-studio.page.contract.test.ts`
- `pnpm --filter @vog/web build`

## Offene Punkte

- Vollstaendige End-to-end-Freigabequeue ueber weitere Domains bleibt offen.
- Create-Handoffs und Region-Drafts bleiben bewusst reviewpflichtige Vorstufen und werden in diesem Slice nicht selbst zu `public_official` erhoben.
