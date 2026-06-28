# DIALOG-RESULTS-HANDOFF-UI-02

Datum: 2026-06-28
Status: done

## Ziel

Den Ergebnisstand aus `DIALOG-INTELLIGENCE-RESULTS-01` sichtbar in den bestehenden Create-/Voxy-Follow-up holen, ohne neue AI-Runtime, ohne Wizard-Neubau und ohne automatische Handoff-Logik.

## Bezug auf #240

PR #240 hat den reinen Dialog-Outcome-Contract eingeführt. Dieser Slice macht ihn erstmals als kleine UI sichtbar:

- erkannter Standpunkt
- Bestätigung/Klärung
- offene Rückfragen
- optionale Perspektiven
- neue Zweige
- review-first Handoff-Kandidaten

## Was sichtbar gemacht wurde

Neu ist `apps/web/src/features/dialog/DialogResultsHandoffPanel.tsx`.

Die Komponente zeigt:

- Überschrift `Was eDebatte bisher aus deinem Beitrag erkennt`
- Standpunkt-Zusammenfassung
- Statushinweis je Ergebnisstatus
- Rückfragen aus `getDialogNextQuestions(...)`
- Perspektivangebote aus `getPerspectivePrompts(...)`
- neue Zweige aus `getNewBranchSuggestions(...)`
- review-first Handoff-Kandidaten aus `getDialogHandoffCandidates(...)`

Zusätzlich gibt es `apps/web/src/features/dialog/dialogIntelligenceFixtures.ts` mit:

- `countOnlyOpinion`
- `clarifyStandpoint`
- `reviewReadySourceBlocked`

und einen kleinen Preview-Adapter `buildDialogOutcomePreviewFromCreateFollowup(...)`, damit das Panel ohne neue Backend-/AI-Laufzeit im bestehenden Create-Follow-up gerendert werden kann.

## Wie Meinung-zählen-ohne-Ausarbeitung sichtbar wird

`count_only` bzw. `low openness` bleibt explizit als kleinerer Pfad sichtbar:

- `Meinung zählen` ist als vorbereitender Schritt da
- Perspektiven werden nicht erzwungen
- Dossier-/Anlassraum-/Participation-Space-Handoffs erscheinen nicht als schon erstellt

## Wie Perspektiven und Rückfragen angeboten werden

Das Panel bietet Perspektiven und Zweige nur optional an:

- Perspektiven erscheinen als Angebot, nicht als Pflicht
- Zweige bleiben Vorschläge oder Parkzustände
- offene Rückfragen bleiben sichtbar, ohne schon eine neue Runtime zu behaupten

## Wie Handoffs nur vorbereitet werden

Alle Handoff-Karten bleiben review-first:

- kein Auto-Create
- kein Auto-Publish
- keine implizite Dossier- oder Anlassraum-Erstellung
- `needs_source`-Claims verweisen sichtbar auf Quellenprüfung statt auf direkte Übernahme

Die kleine Create-Integration sitzt in `apps/web/src/features/create/CreateVisualFollowup.tsx`. Sie nutzt nur den vorhandenen Follow-up-Stand und blendet das Panel als Preview unterhalb des bestehenden Arbeitsstands ein. `CreateClient.tsx` musste dafür nicht breit umgebaut werden.

## Guardrails

Unverändert explizit:

- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Graph
- kein automatisches Erstellen von Branches
- keine automatische Faktenbehauptung
- kein DeepSearch-/Kostenpfad
- keine externe Recherche
- keine echte Personalisierung oder User-Memory
- keine Membership-/Payment-Gates
- keine `routeAccess`-Änderung
- kein `globals.css`

## Tests / Build

Lokal validiert mit:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/dialog-intelligence-contract.test.ts tests/dialog-results-handoff-panel.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx`
- `pnpm -C apps/web run build`

## Bewusst nicht erledigt

- echte AI-Runtime
- externe Recherche
- DeepSearch
- echte Dossier-Erstellung
- echte Anlassraum-Erstellung
- echte Participation-Space-Erstellung
- echte User-Memory-/Personalisierungsruntime
- Payment/Membership
- I18N
- vollständiger Wizard
