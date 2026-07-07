# V3 Review Context Surface Touchpoints Audit

Stand: 2026-07-07  
Branch: `pr/v3-review-context-surface-touchpoints-01`

Scope: additive UI-/Readmodel-Touchpoints auf bestehenden Admin-, Review- und
Dossier-Flächen. Keine neue Route, keine zweite Queue, keine neue Runtime-Welt.

## Ausgangslage

Mit `V3-UNIFIED-REVIEW-QUEUE-01` und `V3-DOSSIER-WORKSPACE-REVIEW-SURFACE-01`
war `v3ReviewContext` bereits an bestehende Queue-Items und Dossier-Workspace-
Readmodels verdrahtet, aber in den Oberflächen noch nicht direkt sichtbar.

Relevante bestehende Flächen:

- `/admin/review` als zentrale globale Review-Queue
- `/dossier/[id]/studio` als bestehender Dossier-/Output-/Social-/Voxy-Arbeitsraum

Bewusst nicht neu gebaut:

- keine neue V3-Review-Route
- keine zweite Queue oder Parallel-Persistenz
- keine neue Anlassraum-/Participation-Surface
- kein neuer Output- oder Voxy-Workflow

## Umgesetzter Slice

### 1. Wiederverwendbarer Presenter

`apps/web/src/features/create/V3ReviewContextSummary.tsx` rendert eine kleine,
verständliche Zusammenfassung aus bestehendem `v3ReviewContext`.

Sichtbar sind jetzt:

- Prüftyp
- erforderliche Rolle
- review-first Status
- Guardrails
- Sprach-/Lesefassung
- Quellen-, Evidenz- und Trust-Lage
- Participation-/Social-/Voxy-Kandidaten
- Blocker
- nächster sinnvoller Review-Schritt

Wichtig:

- `publish_ready` wird als "Bereit für Freigabe" gezeigt, nicht als veröffentlicht.
- `review_ready` wird als "Bereit für Prüfung" gezeigt, nicht als approved.
- rohe technische Enum-Namen wie `blocked_by_provider` werden nicht direkt
  in user-facing Copy ausgegeben.

### 2. Existing Review Queue Integration

`/admin/review` zeigt den Presenter jetzt additiv pro Item, wenn ein
`item.v3ReviewContext` vorhanden ist.

Eigenschaften:

- Items ohne `v3ReviewContext` bleiben unverändert.
- Bestehende Queue-Details, Actions und Content-Release-Workbench bleiben bestehen.
- Keine Änderung an Queue-Aufbau, Persistenz oder Review-Operationen.

### 3. Dossier / Workspace Touchpoint

`/dossier/[id]/studio` zeigt denselben Presenter jetzt für vorhandene
serverseitige Studio-Workspaces.

Die Seite nutzt dafür nur bestehende Runtime-Wahrheit:

- vorhandener `DossierStudioWorkspace`
- optionaler `sourceDraftId` aus `workspace.provenance`
- bestehendes `buildDossierWorkspaceV3ReviewContext`

Sichtbar werden damit im Studio kompakt:

- Review-/Freigabezustand des Workspace
- Quellen-/Trust-Lage
- Social-Draft-Kandidaten
- Voxy-Briefing-Kontext
- nächster Review-Schritt

## Bewusst nicht angefasst

- `/admin/editorial/queue`
- Participation- oder Anlassraum-eigene Runtime-Surfaces
- Public-/Bürger-Flächen
- echte Social-Posting-Runtime
- echte Voxy-Render-/Publish-Runtime

Begründung: Für diese Flächen lag in diesem Slice entweder kein bestehender
`v3ReviewContext` direkt auf dem Surface vor oder der UI-Eingriff wäre größer
gewesen als für einen kleinen additiven Touchpoint vertretbar.

## Tests

- `apps/web/tests/v3-review-context-summary.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

Abgedeckt sind insbesondere:

- `publish_ready` bleibt review-first und wird nicht als `published` dargestellt
- `review_ready` bleibt review-first und wird nicht als `approved` dargestellt
- Items ohne `v3ReviewContext` bleiben stabil
- Admin-Review-Items mit `v3ReviewContext` zeigen Reviewpflicht und nächsten Schritt
- Sprach-/Lesefassung werden getrennt angezeigt
- Voxy-/Provider-Blocker werden menschlich lesbar gezeigt, ohne Enum-Leak

## Nicht gebaut

- keine neue Route
- keine zweite Queue
- keine neue Runtime-Persistenz
- kein Auto-Publish
- kein Social API Trigger
- kein Voxy-Render
- kein DeepSearch-Autostart
- kein Auto-Graph-Write

## Nächster sinnvoller Slice

Weiter offen innerhalb der bestehenden V3-Queue-/Workspace-Arbeit:

- breitere Anlassraum-/Participation-Runtime-Touchpoints auf denselben
  `v3ReviewContext` ziehen, ohne neue Queue-Welt zu bauen

