# REGION-DASHBOARD-PRODUCTION-CUT-08

## Scope

Serverseitige Studio-Persistenz fuer reviewpflichtige Dossier-/Behoerdenpfade.

Nicht Teil dieses Slice:

- kein Social Publishing
- keine automatische Veroeffentlichung
- kein Public Publish
- kein Mandat / kein Voting
- kein GeoReferenceLayer
- kein Payment / Billing / Checkout
- keine neuen Public Participation Features

## Was gebaut wurde

### 1. Persistente Studio-Workspace-Runtime

Neue Runtime:

- `features/dossier/server/studioPersistence.ts`

Typed Runtime fuer:

- `DossierStudioWorkspace`
- `DossierStudioWorkspaceStatus`
- `DossierStudioWorkspaceSource`
- `DossierStudioWorkspacePatch`
- `DossierStudioWorkspaceAuditEvent`
- `DossierStudioWorkspaceGuardrails`

Persistente Collections / Runtime-Konvention:

- `dossier_studio_workspaces`
- `dossier_studio_workspace_audit_events`

Server-Funktionen:

- `createOrGetDossierStudioWorkspace`
- `getDossierStudioWorkspace`
- `updateDossierStudioWorkspace`
- `archiveDossierStudioWorkspace`
- `lockDossierStudioWorkspace`
- `unlockDossierStudioWorkspace`
- `listDossierStudioWorkspacesForDossier`
- `appendDossierStudioWorkspaceAuditEvent`

## 2. Workspace-API

Neue Route:

- `/api/dossier/[id]/studio/workspace`

Unterstuetzte Operationen:

- `GET`
- `POST`
- `PATCH`

Verhalten:

- laedt serverseitigen Workspace
- erstellt Workspace on demand nur fuer berechtigte Rollen
- erlaubt nur `draft` / `needs_review`
- blockiert published/public-artige Payloads
- fuehrt keine Veroeffentlichung aus

## 3. Zugriff ueber Membership + Entitlement

Die Workspace-API nutzt dieselbe serverseitige Access-Grundlage wie die Region-Pfade:

- Admin = `adminFallback`
- `organization_verified` = read-only
- `unit_verified + aktives Entitlement + passende AllowedActions` = editierbar
- `pending_review` / `email_verified` / unverified = blockiert
- falsche Region / falsche Organisation = blockiert

Fuer Region-Draft-Dossiers wird die Region ueber den bestehenden Region-Signal-Draft-Record aufgeloest.

## 4. Studio-UI minimal angebunden

Erweitert:

- `apps/web/src/app/dossier/[id]/studio/page.tsx`
- `apps/web/src/components/outputEngine/MasterPostActions.tsx`
- `apps/web/src/components/outputEngine/SocialDistributionPanel.tsx`

Neue Wirkung:

- Studio zeigt, ob bereits ein serverseitiger Workspace vorliegt
- Master-Post-/Distribution-Aktionen speichern jetzt zusaetzlich serverseitig
- Erfolgshinweis:
  - `Arbeitsstand serverseitig gespeichert, reviewpflichtig, nicht veröffentlicht`
- `localStorage` bleibt sichtbar lokal und nicht produktiv

## 5. Guardrails bleiben hart

Serverseitig und im UI erhalten:

- `noAutoPublish = true`
- `noSocialPublishing = true`
- `noAutoMandate = true`
- `noAutoVote = true`
- `reviewRequired = true`
- `localStorageIsNotProduction = true`

Demo-/Fixture-Kontexte bleiben markiert ueber Provenance:

- `notProductionData`
- `fixture`

## Warum localStorage nicht produktiv ist

`localStorage` bleibt nur Komfort-/Fallback-Cache fuer den Browser.

Es ersetzt nicht:

- serverseitige Arbeitsstand-Persistenz
- Ownership-/Rollenpruefung
- Auditierbarkeit
- reviewfaehige Behoerdenpfade

## Welche bestehenden Bausteine wiederverwendet wurden

- bestehende Studio-Surface `/dossier/[id]/studio`
- bestehende Output-Engine-Typen:
  - `MasterPost`
  - `SocialDistributionDraft`
  - `SocialCarouselOutput`
- bestehende Region-/Membership-/Entitlement-Access-Schicht
- bestehende Region-Signal-Draft-Records zur Region-Aufloesung von Draft-Dossiers
- bestehende CUT-05 Guardrails gegen stille Demo-/Seed-/Local-Fallbacks

## Tests

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/dossier-output-studio.page.contract.test.ts tests/studio-distribution-panel.contract.test.tsx tests/dossier-route.runtime-guard.test.ts tests/runtime-data-guardrails.test.ts tests/dossier-studio-workspace.contract.test.ts tests/dossier-studio-workspace.route.test.ts tests/dossier-studio-server-persistence-ui.test.tsx`

## Bewusst offen

- keine serverseitige Publish-/Release-Queue
- keine echte Social-Ausspielung
- keine Checkout-/Billing-Logik
- keine breite Ownership-/Isolation ueber alle Dossier-/Admin-Pfade
- keine grosse Studio-Neugestaltung
- keine weitergehende Moderations-/Locking-UI, nur Runtime-Grundlage

## Ergebnis

CUT-08 schliesst die zentrale Luecke aus CUT-05:

Studio-Arbeitsstaende haengen fuer produktnahe Dossier-/Behoerdenpfade nicht mehr nur an `localStorage`, sondern koennen serverseitig, reviewpflichtig und rollen-/ownership-geprueft gespeichert werden.
