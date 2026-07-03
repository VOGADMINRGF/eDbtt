# V3 Frontend KI-Orchestrierungs-Transparenz

Stand: 2026-07-03
Task: `V3-FRONTEND-KI-ORCHESTRIERUNGS-TRANSPARENZ-03`

## Warum dieser Slice wichtig ist

Nach `V3-CORE-RUNDEN-ENTRY-CANON-02` war fachlich klar, dass `/runden/new`
zuerst nur einen Draft erzeugt und `/create` der bestehende Analyze-/Planner-
Folgeschritt bleibt. Für Nutzer war aber noch nicht sichtbar, welche KI
aktuell wirklich greift, welche Schritte nur vorbereitet sind und welche
Guardrails weiter gelten.

Dieser Slice schließt genau diese Lücke mit einer kleinen Frontend-Readmodel-
und Panel-Struktur, ohne neue KI-Orchestrierung, neue Persistenz oder neue
Billing-/Debit-Logik zu erfinden.

## Betroffene Flächen

- `/runden/new`
- `/create`
- später relevant, aber in diesem Slice noch nicht umgesetzt:
  - Dossier-Folgeflächen
  - Anlassraum-Folgeflächen
  - Beteiligungsraum-Folgeflächen

## Was jetzt sichtbar ist

### `/runden/new`

- `Ohne KI speichern` ist explizit als `skipped_no_ai` markiert.
- Nutzer sehen:
  - Keine KI aktiv
  - Entwurf wird gespeichert
  - Kein AI-Usage-Event
  - Kein DeepSearch
  - Review-first
  - Nichts wird automatisch veröffentlicht
- `Mit KI in /create weiter` ist bewusst nur als `planned_not_active` sichtbar.
- Es wird klar gesagt, dass Anlassraum, Dossier und Beteiligungsraum erst über
  spätere bewusste Review-/Runtime-Pfade entstehen.

### `/create`

- Der bestehende Planner-/Follow-up-Start wird als:
  - `not_started`
  - `running`
  - `completed`
  sichtbar gemacht.
- Die bestehende Analyze-Fläche wird nur dann als aktiv markiert, wenn sie
  wirklich geöffnet ist; sonst bleibt sie `planned_not_active`.
- Reviewpflicht und No-Auto-Publish bleiben sichtbar als
  `review_required`.
- Spätere Claims-, Fragen-, Feed-, Social- oder Voxy-Folgepfade werden nur als
  spätere, nicht aktive Schritte benannt.

## Welche KI-Schritte sichtbar sein dürfen

- bewusster Start des Planner-/Follow-up-Schritts auf `/create`
- bewusster Start der Analyze-Fläche auf `/create`
- No-AI-Trennung des Draft-Pfads auf `/runden/new`
- Reviewpflicht
- No-Auto-Publish
- No-Auto-DeepSearch

## Welche Informationen bewusst nicht sichtbar sein dürfen

- keine Provider-Namen im Standard-UI
- keine Prompt-Inhalte
- keine Token-, Secret- oder Stacktrace-Details
- keine internen Debuglogs
- keine Fake-AI-Usage-, Fake-Debit- oder Fake-Billing-Behauptungen

## Verhältnis von No-AI, AI-assisted, Review und No-Auto-Publish

- `skipped_no_ai` bedeutet: Der gewählte Schritt bleibt bewusst ohne KI,
  AI-Usage und DeepSearch.
- `not_started`, `running`, `completed` gelten nur für echte bestehende
  Planner-/Analyze-Schritte.
- `review_required` markiert sichtbare Guardrails, nicht einen versteckten
  Autoprozess.
- `planned_not_active` markiert nur spätere oder vorbereitete Folgepfade.

## Zusammenspiel mit späteren Folgepfaden

- Claims und offene Fragen hängen weiter primär an Dossier-Kontexten.
- Fragen/Umfragen und öffentlicher Feedbackraum hängen weiter an
  Beteiligungsraum-/Participation-Space-Kontexten.
- Feed-Anreicherung hängt weiter an Anlassraum-/Dossier-Folgepfaden.
- Social Output Drafts hängen weiter an Dossier-/Studio-Kontexten.
- Ein eigener persistenter Voxy-Video-Briefing-Träger bleibt weiter offen.

Dieser Slice markiert diese Folgepfade absichtlich nur als später oder nicht
aktiv. Er behauptet nicht, dass sie bereits als sichtbare Frontend-KI-Kette
geschlossen wären.

## AI-Act-/Transparenzbezug ab August 2026

Ohne Rechtsberatung zu behaupten, wird für spätere Slices voraussichtlich
relevant bleiben:

- sichtbares Startsignal für KI-unterstützte Schritte
- klare Trennung zwischen Nutzertext, KI-Vorschlag und Review-Entscheidung
- keine stillen Autonomie- oder Amtlichkeitsclaims
- nachvollziehbare Handoff-Grenzen zwischen Entwurf, Review und späterer
  Veröffentlichung
- keine versteckte Kosten-, Provider- oder DeepSearch-Eskalation

## Was bewusst offen bleibt

- downstream KI-Transparenz auf Dossier-, Anlassraum- und
  Beteiligungsraum-Folgeflächen
- echte Debit-/Billing-Wahrheit
- zusätzliche AI-Usage- oder Cost-Wahrheit im Frontend jenseits der bereits
  vorhandenen Admin-/V3-Sichten
- jede neue KI-Orchestrierung, DeepSearch-Automation oder Auto-Publish-Logik

## Geänderte Dateien

- `apps/web/src/features/create/frontendAiTransparency.ts`
- `apps/web/src/features/create/FrontendAiTransparencyPanel.tsx`
- `apps/web/src/app/runden/new/page.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/tests/frontend-ai-transparency.contract.test.ts`
- `apps/web/tests/runden-manual-create.page.contract.test.tsx`
- `apps/web/tests/create-mode.page.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/V3_TEST_RESULTS_REGRESSION_MATRIX_2026-07-02.md`

## Runtime-Wahrheit

- No-AI auf `/runden/new` bleibt weiterhin ohne KI-Lauf, ohne AI-Usage-Event
  und ohne DeepSearch.
- Der Slice ergänzt nur Frontend-Transparenz über bestehende Zustände.
- Es wurde keine neue Runtime-Orchestrierung, kein neues Billing und keine
  neue Debit-Logik ergänzt.
