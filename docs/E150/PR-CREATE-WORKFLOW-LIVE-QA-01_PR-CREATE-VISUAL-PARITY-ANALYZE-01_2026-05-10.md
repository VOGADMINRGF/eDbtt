# PR-CREATE-WORKFLOW-LIVE-QA-01 / PR-CREATE-VISUAL-PARITY-ANALYZE-01

Datum: 2026-05-10

## Ziel

Den eingebetteten Analyze-/Finalize-Teil von `/create` als denselben Arbeitsraum weiterfuehren statt als zweite, visuell schwerere Produktoberflaeche. Gleichzeitig sollen Save-/Finalize-Aktionen im Create-Pfad sichtbar bleiben, ohne auf Mobile als grosses globales Overlay ueber dem Inhalt zu liegen.

## Umfang

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
- `apps/web/tests/create-analyze.workspace-ui.test.ts`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`

## Umgesetzt

- `CreateInlineAnalysisScene` wurde von einer dunklen, heroartigen Buehne auf eine ruhigere Card-Surface mit derselben Card-/Border-Sprache wie der vorherige `/create`-Follow-up umgestellt.
- Der eingebettete `AnalyzeWorkspace` rendert im `analysisEntryVariant="single_button"` keinen zweiten grossen Hero-Kopf mehr, sondern einen kompakten Header `Im selben Arbeitsraum` mit kleinerer Typografie, derselben Meta-Chip-Logik und denselben Sprach-/Locale-Kontrollen.
- Der globale fixe Finalize-Balken in `AnalyzeWorkspace` bleibt fuer den generischen Workspace erhalten, schaltet im eingebetteten Create-Pfad aber auf `inline + lg:sticky` um. Dadurch ist Mobile erreichbar, aber nicht mehr von einem grossen Overlay verdeckt.
- Die Abschlussleiste im eingebetteten Create-Pfad zeigt Save-/Finalize-Feedback im selben Arbeitsblock statt nur getrennt weiter oben im Workspace.
- Die obere Save-CTA wird im eingebetteten Create-Pfad ausgeblendet, sobald unten die Abschlussleiste aktiv ist; dadurch entsteht kein doppelter Primaer-/Sekundaerblock fuer denselben Schritt.
- Composer-Link-/Materialkontext wird jetzt auch in den eingebetteten Analyse- und Save-Pfad uebergeben: `CreateClient` leitet erkannte `sourceUrls` plus angehaengte PDF-/Upload-Metadaten an `AnalyzeWorkspace` weiter, und `/api/create/save` schreibt diesen Kontext als `analysis.inputContext` in den Draft statt ihn nur lokal im Composer zu halten.
- Derselbe Link-/Materialkontext wird jetzt auch in `CreateHandoffDraft.sourceGrounding` gespiegelt. Factcheck- und Dossier-Handoffs zeigen damit im Reviewpanel direkt, ob der Arbeitsstand auf Link-, PDF- oder anderem Material beruht, statt die Herkunft erst spaeter aus dem Draft rekonstruieren zu muessen.

## Workflow-QA-Findings aus diesem Slice

- Vorher entstanden im eingebetteten `/create`-Pfad zwei konkurrierende Hero-Ebenen: erst `Analyse-Szene`, danach direkt ein grosser `AnalyzeWorkspace`-Kopf. Das wirkte wie ein Szenenbruch statt wie Weiterfuehrung.
- Die feste untere Finalize-Leiste war im eingebetteten Create-Pfad besonders auf Mobile zu dominant und stand im Widerspruch zur vorher entschlackten `/create`-Follow-up-CTA-Fuehrung.
- Save-/Finalize-Feedback war zwar vorhanden, aber im eingebetteten Pfad nicht immer im direkt sichtbaren Aktionskontext gebuendelt.

## Bewusst nicht geaendert

- keine neue Fachlogik
- keine neue Taxonomie
- keine Aenderung der Save-/Finalize-API-Vertraege
- keine Aenderung der Match-/CTA-/Analyze-Orchestrierung
- kein Auto-Publish, kein Silent-Merge, kein Auto-Attach

## State Machines / Publish Gates / bewusst nicht automatisiert

- Keine neue State Machine eingefuehrt; bestehende Analyze-/Save-/Finalize- und CTA-Handoff-Pfade bleiben unveraendert.
- Publish Gates bleiben aktiv:
  - kein Auto-Publish
  - kein Silent-Merge
  - kein Auto-Attach
  - Faktencheck / Deep Search bleibt optional und bestaetigungspflichtig
- Bewusst nicht automatisiert:
  - kein echter browsergesteuerter Matrixlauf fuer alle Link-/YouTube-/PDF-/Upload-Faelle
  - keine Screenshot-Automation fuer 390px/Desktop

## Verifikation

- `pnpm -C apps/web exec vitest run tests/create-analyze.workspace-ui.test.ts`
- `pnpm -C apps/web exec vitest run tests/analyze-workbench-hidden-until-start.test.ts`
- `pnpm -C apps/web exec vitest run tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `pnpm -C apps/web run typecheck`

## Browsernahe Revalidierung

- Lokaler Chrome-Run auf `/create` mit echtem Login-Flow, kommunalem Beispieltext und echter Folgekette bis in den eingebetteten Pruefmodus.
- Im Follow-up auf `/create` wird der breite kommunale Text nicht mehr generisch als `Kern: Fragestellung` gerahmt, sondern als konkreter Bedarf `Du benennst Handlungsbedarf zu verkehr.` mit sichtbarem Block `Erkannte Bedarfspunkte`.
- `Deine Struktur auf einen Blick` steht im realen Browserlauf weiter ganz oben als kompakte Zaehlerzeile; fuer den Beispieltext wurden `Prioritaeten`, `Themencluster`, `Fragen & Abstimmung` und `Naechste Schritte` jeweils mit `NEU` und Zaehler `1` gezeigt.
- Nach `So uebernehmen` erscheint der Messenger-nahe Naechster-Schritt-Block mit den CTA-Zielen `Beitrag einreichen`, `Dossier ergaenzen`, `Beteiligungsfrage vorbereiten`, `Redaktionelle Pruefung anfragen` und `Faktencheck / Deep Search`.
- Nach `Faktencheck / Deep Search` oeffnet sich die eingebettete Analyse real im selben `/create`-Dokument: `Analyse-Szene` plus kompakter Header `Im selben Arbeitsraum`, kein zweiter grosser Hero, keine globale Mobile-Fixed-Bar ueber dem Inhalt.
- Der eingebettete Analysebereich blieb sowohl in Desktop-Breite als auch in schmaler 390px-naher Fensterbreite erreichbar; die CTA-/Info-Fuehrung bleibt inline in derselben Scroll-Hierarchie statt als grosses Bottom-Overlay.

## Rest offen

- `PR-CREATE-WORKFLOW-LIVE-QA-01` bleibt offen fuer den restlichen browsernahen Gesamtmatrixlauf bis in Save-/Finalize-/Rueckweg-Pfade sowie fuer Link-/YouTube-/PDF-/Upload-Faelle.
- Im eingebetteten Pruefmodus wurde im Live-Lauf der Arbeitsraum geoeffnet, aber der volle Analyze->Save->Finalize-Pfad wurde in diesem Slice noch nicht bis zum Ende verprobt.
- Der Materialtransport ist jetzt kontraktisch gehaertet, aber der vollstaendige echte Browserlauf fuer Upload-/PDF-Faelle inkl. spaeterem Speichern/Weiterfuehren steht weiterhin aus.
