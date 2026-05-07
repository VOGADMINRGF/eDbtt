# PR-CREATE-REAL-CHAT-WORKSPACE-LAYOUT-01

## Ziel
`/create` nach dem Absenden als echtes Chat-Workspace-Erlebnis rendern: Composer und Follow-up sollen wie ein gemeinsames Arbeitsfenster wirken, nicht wie Formular plus separater Ergebniscontainer.

## Scope
- Layout und Interaktion.
- Keine neue Analyse-, Graph- oder AI-Logik.
- Keine automatische Stimme.
- Keine automatische Veröffentlichung.
- Keine automatische Kostenbuchung.

## Umsetzung
- `CreateClient` rahmt Composer und Follow-up als `create-dialog-workspace`.
- `SharedCreateComposer` unterstützt `embeddedWorkspace`, damit der Composer im gemeinsamen Chatrahmen nicht als eigenständige große Karte dominiert.
- `CreateVisualFollowup` nutzt eine vertikale `create-chat-spine` mit Rollen:
  - `Du`
  - `eDebatte`
  - `Nächster Schritt`
- Der `Vorgeschlagener Arbeitsstand` liegt innerhalb der eDebatte-Antwort.
- Details, Sinnabschnitte, Anschlussoptionen und Zusatzservices bleiben sekundär als Accordions.
- Die Action-Leiste ist als Chat-Folgeaktion formuliert.

## Guardrails
- `Ja, Struktur übernehmen` bleibt die Primäraktion.
- Keine automatische Stimme.
- Keine automatische Veröffentlichung.
- Keine automatische Kostenbuchung.
- Dossier-/Claim-/Abstimmungs-Hierarchie bleibt unverändert.

## Geänderte Dateien
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `docs/E150/OpenTasks.md`

## Validierung
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/create-curated-dialog-workspace.contract.test.tsx`
