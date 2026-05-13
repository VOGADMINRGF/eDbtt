# PR-CREATE-CHAT-FIRST-MOBILE-DIALOG-02

Datum: 2026-05-09

## Ziel

Die visuelle Hierarchie des lightweight `/create`-Follow-ups naeher an das definierte mobile-native Zielbild bringen, ohne neue Begriffe, Logikpfade oder Backendverhalten einzufuehren.

## Umfang

- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/app/create/CreateClient.tsx`

## Umgesetzt

- Die vier Fokusbereiche in `CreateVisualFollowup` wurden von einer dashboardartigen Grid-Zeile zu einer klareren vertikalen Fokus-Rail umgebaut.
- Die aktive Focus Card wurde vergroessert und entdichtet: Titel, Status, kurzer Bedarf und wichtigste Frage tragen die Hauptlast; weitere Details bleiben nachgeordnet.
- Sekundaere Bereiche wie Hilfetext, Details und Fortsetzungskomponist wurden visuell zurueckgenommen.
- Der Desktop-CTA-Block bleibt erhalten, ist aber auf Mobile nicht mehr der konkurrierende Hauptblock; dort sitzt das Aktionspanel direkt unter dem aktiven Arbeitsstand statt als grosses Overlay ueber dem Inhalt.
- Das obere Composer-Chrome fuer Modus, Kontext und Orientierung wurde in nachgeordnete, kompaktere Disclosures verschoben.
- Die Kontingent-/Zugriffszeile in `CreateClient` bleibt fuer Desktop verfuegbar, wird aber aus dem mobilen Hauptflow herausgenommen.

## Revalidierung PR #121 Mobile-QA

- Mobile Follow-up bleibt jetzt einspaltig: breite swipebare Selector-Karten wurden auf kompakte Tabs mit einer aktiven Detailkarte reduziert, und der Workspace clippt keine Inhalte mehr seitlich.
- Die mobile Primaeraktion sitzt jetzt inline direkt unter dem aktiven Arbeitsstand; dadurch braucht der Follow-up kein grosses Fixed-Overlay und kein zusaetzliches Bottom-Padding mehr.
- `Kontingente und Zugriff` wird im Mobile-Hauptflow nicht gerendert; die Detailverwaltung bleibt sekundär ueber `/account` und auf Desktop sichtbar.
- Fokusbereiche und Strukturäste sind nun auch semantisch als Tabs/Panel verkabelt (inkl. Keyboard-Navigation via Pfeiltasten/Home/End), damit die mobile Shell nicht nur visuell, sondern auch in der Bedienlogik wie ein sauberer App-Flow funktioniert.
- Mobile- und Desktop-CTA nutzen dieselbe Save-Statuslogik (`Speichert …` / `Gespeichert` / `Speichern`), damit keine Text-/State-Drift zwischen den Shell-Varianten entsteht.
- Web-/Desktop-Hintergründe im `/create`-Follow-up und in der Startvorschau wurden von hartem Weiss auf gedämpfte Card-/Slate-/Cyan-Mischungen umgestellt, damit der Flow auch ausserhalb der Mobile-Shell ruhiger und weniger grell wirkt.
- Der mobile Startbereich im eingebetteten Composer wurde kompakter gemacht (weniger vertikale Abstaende, kuerzeres Meta-Chrome, geringere Textarea-Minimalhoehe).
- Die aktive Focus-Fläche und der aktive Strukturast werden bei neuem Follow-up-Ergebnis wieder auf den aktuellen Default zurueckgesetzt, damit kein alter Tabzustand haengen bleibt.

## Finales UX-Glattziehen (2026-05-10)

- Die Seitenheadline `Was möchtest du einbringen?` wurde visuell unter die Compose-Card abgestuft, damit `Deinen Beitrag verfassen` die staerkere Mobile-Ebene bleibt.
- Der Alternate-Mode-Disclosure ist fuer den Minimal-Composer explizit als nachgeordneter Desktop-Hinweis markiert und bleibt aus dem mobilen Hauptfluss heraus.
- Der Mobile-Vertrag ist testseitig auf den gewollten Zustand nachgeschaerft: einspaltige Strukturkarten, keine dominanten Meta-/Kontingent-Chips im Hauptfluss, keine offene Korrekturbox vor explizitem `Ändern`, und keine Detailmodule im Haupt-DOM solange `Details ansehen` geschlossen ist.
- Die Safety-/Quality-Gate-Trennung bleibt fuer diesen UX-Slice bestehen: keine Rueckkehr zu `result.clarifications`, `qualityGate` oder `editorial_review_*`; Ortsrueckfragen bleiben an `result.understanding.openQuestion` gebunden.

## Bewusst nicht geaendert

- keine neue Taxonomie
- keine neuen E150-Begriffe
- keine Backend-, Routing- oder Analyze-Logik
- keine Aenderung an Link-Intake-, Save-, Finalize- oder Factcheck-Vertraegen

## Verifikation

- `pnpm -C apps/web exec vitest run tests/create-curated-dialog-workspace.contract.test.tsx tests/analyze-workbench-hidden-until-start.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-entry-hierarchy.contract.test.tsx tests/create-i18n-no-mixed-locale.contract.test.tsx tests/create-no-chip-overload.contract.test.tsx tests/create-entry-i18n.render.test.tsx tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/create-attachment-layout.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts`

## PR-124 Scope Reality Check (2026-05-12)

Der aktuelle Diff gegen `origin/main` ist kein schmaler Mobile-Shell-PR mehr.

Nach Klassifikation umfasst der Branch mindestens diese Bloecke:

- Mobile UX
  - `CreateVisualFollowup`, `SharedCreateComposer`, `CreateClient`, zugehoerige Mobile-/Entry-Contracts
- Planner / Graph
  - `createPlanner`, `intelligentFollowup`, `createConnectionSuggestions`, Planner-/Graph-Contracts
- Handoff
  - `createHandoff`, `CreateHandoffPanel`, Dossier-/Factcheck-/Anlassraum-/Contribution-Handoffs
- Material
  - `materialRouting`, `AnalyzeWorkspace`, Analyze-/Save-Routen, Notebook-/Source-Grounding-Nachzug
- Live-QA / Hardening
  - Live-Click-, Save-/Analyze-, Browser- und Follow-up-Contracts
- Region / Admin
  - `public/Listen/*.xlsx`, Region-Directory, Region-Admin-Routen, Regional-Contracts

Bewertung:

- PR #124 sollte nicht mehr als reiner `Mobile Shell`-PR bezeichnet werden.
- Ehrlicher Zustand ist ein Integrations-PR ueber mehrere dokumentierte E150-Slices.
- `apps/web/public/Listen/Anschriften_der_Gemeinde_und_Stadtverwaltungen_Stand_31012023_final.xlsx` ist nur dann im PR plausibel, wenn der Region-/Admin-Slice bewusst mit enthalten bleibt.
- `apps/web/next-env.d.ts` sollte nur im PR bleiben, wenn der aktuelle Build es tatsaechlich braucht; es ist kein fachlicher Bestandteil des Mobile-Slices.

Empfehlung:

- nicht als schmalen Mobile-PR mergen
- entweder in mehrere sachliche PRs splitten
- oder PR #124 ehrlich als Integrations-PR umbenennen und den PR-Body nach Slice-Gruppen aktualisieren

Kanonische `/create`-Pipeline fuer diesen Branch:

`SharedCreateComposer -> createPlanner -> intelligentFollowup -> CreateVisualFollowup -> createHandoff -> Zielsurface/AnalyzeWorkspace -> Save/Finalize/Rueckweg`

Statushinweis:

- `PR-CREATE-WORKFLOW-LIVE-QA-01` bleibt bewusst `in_progress`, bis der echte Browser-Matrixlauf fuer Save / Finalize / Rueckwege / Link / YouTube / PDF / Upload vollstaendig dokumentiert ist.
