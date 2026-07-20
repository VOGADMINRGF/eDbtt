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
  - Quellenpruefung / externe Quellenanalyse bleibt optional und bestaetigungspflichtig
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
- Nach `So uebernehmen` erscheint der Messenger-nahe Naechster-Schritt-Block mit den CTA-Zielen `Beitrag einreichen`, `Dossier ergaenzen`, `Beteiligungsfrage vorbereiten`, `Redaktionelle Pruefung anfragen` und `Quellenpruefung vorbereiten`.
- Nach `Quellenpruefung vorbereiten` oeffnet sich die eingebettete Analyse real im selben `/create`-Dokument: `Analyse-Szene` plus kompakter Header `Im selben Arbeitsraum`, kein zweiter grosser Hero, keine globale Mobile-Fixed-Bar ueber dem Inhalt.
- Der eingebettete Analysebereich blieb sowohl in Desktop-Breite als auch in schmaler 390px-naher Fensterbreite erreichbar; die CTA-/Info-Fuehrung bleibt inline in derselben Scroll-Hierarchie statt als grosses Bottom-Overlay.

## Rest offen

- `PR-CREATE-WORKFLOW-LIVE-QA-01` bleibt offen fuer den restlichen browsernahen Gesamtmatrixlauf bis in Save-/Finalize-/Rueckweg-Pfade sowie fuer Link-/YouTube-/PDF-/Upload-Faelle.
- Im eingebetteten Pruefmodus wurde im Live-Lauf der Arbeitsraum geoeffnet, aber der volle Analyze->Save->Finalize-Pfad wurde in diesem Slice noch nicht bis zum Ende verprobt.
- Der Materialtransport ist jetzt kontraktisch gehaertet, aber der vollstaendige echte Browserlauf fuer Upload-/PDF-Faelle inkl. spaeterem Speichern/Weiterfuehren steht weiterhin aus.

## Browser-QA Slice E (2026-05-11)

### Gezielte Fixes

- `createPlanner.ts` begrenzt `planner_only` jetzt mit einem harten Fast-Timeout (`CREATE_PLANNER_TIMEOUT_MS`, Default 2200ms), damit `/api/create/intelligent-followup` nicht mehr durch einen offenen OpenAI-Call fuer 40s+ haengt.
- `CreateVisualFollowup.tsx` behandelt offene Fragen nur noch dann als Ortsklaerung, wenn der Text wirklich Ort/Bezirk/Kommune/Stadt/Region/PLZ anspricht. Fachliche Rueckfragen wie `Welche Produkte, Länder, Standards und Kontrollmechanismen sind gemeint?` blockieren dadurch nicht mehr die Bestaetigungs- und Handoff-CTAs.
- Nebenbei wurde ein separater Build-Drift in `apps/web/src/app/dossier/[id]/page.tsx` auf das von Next 16 erwartete `searchParams`-Promise-Shape nachgezogen.

### Echte Browser-Evidence

- Desktop 1440px, normaler Freitext, Tierschutz/Tierhaltung:
  - `pass`
  - Nach `Beitrag strukturieren` erscheint innerhalb von ca. 12s wieder das Follow-up mit `Kern`, `Thema`, `Noch offen`, `Erkannte Bedarfspunkte` und der kompakten Badge-Zeile (`3 / 3 / 1 / 1`).
  - Die falsche Ortsklaerung ist weg; statt `Um welchen Ort geht es?` bleibt die fachliche Rueckfrage `Welche Produkte, Länder, Standards und Kontrollmechanismen sind gemeint?` sichtbar.
- Desktop 1440px, `So übernehmen`:
  - `pass`
  - Nach Bestaetigung erscheinen die echten Next-Step-CTAs: `Beitrag einreichen`, `Anlassraum vorbereiten`, `Als Ergänzung anhängen`, `Neues Dossier vorbereiten`, `Beteiligungsfrage vorbereiten`, `Redaktionell prüfen lassen`, `Faktencheck anfragen`, `Nur speichern`.
- Desktop 1440px, Faktencheck-Handoff:
  - `pass`
  - Klick auf `Faktencheck anfragen` fuehrt auf `/factcheck?...handoffId=...`.
  - Sichtbar: `FACTCHECK-HANDOFF AUS /CREATE`, `Reviewstatus: Faktencheck-Kandidat`, Claim-Preview, offene Fragen, Quellenstatus.
  - Keine automatische DeepSearch, kein Siegel, Claim-Liste ist explizit als `nicht automatisch prüfbar` markiert.
- Desktop 1440px, Dossier-Handoff:
  - `pass`
  - Klick auf `Als Ergänzung anhängen` fuehrt auf `/dossier?...handoffId=...&createAction=append_to_dossier`.
  - Sichtbar: `DOSSIER-HANDOFF`, `Aus deinem Beitrag vorbereitet`, Argumente, prüfbare Behauptungen, offene Fragen, Quellenstatus.
  - Der Warnhinweis `Hier wird nichts automatisch an ein bestehendes Dossier angehängt` bleibt sichtbar.
- Desktop 1440px, Rueckweg aus Handoff:
  - `pass`
  - `In /create weiter bearbeiten` fuehrt auf `/create?resume=create_handoff&handoffId=...`.
  - Sichtbar: `Handoff-Arbeitsstand zur Weiterbearbeitung geladen.`

### Noch offen / nicht abgeschlossen

- Anlassraum-Handoff wurde in diesem Slice nicht erneut browsernah durchgeklickt; nur die vorhandenen Contracts bleiben dafuer gruen.
- Mobile-390px-Revalidierung fuer den neuen Tierschutz-/Tierhaltungs-Pfad steht noch aus.
- Die echten Materialmatrix-Faelle `Link`, `YouTube`, `PDF / Upload` wurden in diesem Slice nicht bis Save/Finalize browsernah durchgeprueft.

## Browser-QA Slice F (2026-05-11)

### Zusätzliche echte Browser-Evidence

- Desktop 1440px, `Anlassraum vorbereiten`:
  - `pass`
  - Nach `So übernehmen` führt der CTA nicht mehr zurück in `/create`, sondern browsernah auf `/runden?view=active&from=create&topic=...&handoffId=...&createAction=prepare_anlassraum`.
  - Sichtbar: `AUS /CREATE IN DEN ANLASSRAUM ÜBERNOMMEN`, Handoff-Kontext, `Keine automatische Veröffentlichung`, `kein stiller Themen- oder Graph-Merge`.
- Mobile 390px, normaler Tierschutz-Freitext:
  - `pass`
  - Follow-up, kompakte Badge-Zeile und Next-Step-CTAs bleiben im einspaltigen Flow erreichbar.
  - Kein grosses Bottom-Overlay; die Aktionsgruppe bleibt inline im Arbeitsraum.
- Desktop 1440px, `Nur speichern`:
  - `pass`
  - Nach `Beitrag strukturieren` -> `So übernehmen` -> `Nur speichern` bleibt der Nutzer auf `/create`.
  - Sichtbar: `Arbeitsstand gespeichert.` als direktes Feedback im Follow-up-Arbeitsraum.
- Desktop 1440px, `Beitrag einreichen`:
  - `pass`
  - Handoff führt auf `/community/contributions?...&createAction=submit_draft`.
  - Sichtbar: `AUS /CREATE VORBEREITET`, reviewbarer Arbeitsstand mit Kern, Anschlüssen, Argumenten und prüfbaren Behauptungen.
  - `In /create weiter bearbeiten` lädt denselben Handoff-Arbeitsstand wieder über `/create?resume=create_handoff&handoffId=...`.
- Desktop 1440px, Textlink:
  - `pass`
  - Ein normaler Artikel-Link bleibt bis ins Dossier-Handoff erhalten.
  - Im Abschnitt `QUELLENSTATUS` ist die URL als Herkunft sichtbar.
- Desktop 1440px, YouTube-Link:
  - `pass`
  - Factcheck-Handoff führt auf `/factcheck?...&createAction=request_factcheck`.
  - Sichtbar: `YouTube-Link (link_reference)` im Quellenstatus, Claim-Preview, `Recherche startet nicht automatisch`.
  - Kein Auto-DeepSearch, kein Factcheck-Siegel.
- Desktop 1440px, PDF-Upload:
  - `pass`
  - Bereits im Composer erscheint nach dem Dateisetzen `Anhänge anzeigen (1)`.
  - Nach `Als Ergänzung anhängen` zeigt das Dossier-Handoff im `QUELLENSTATUS` die hochgeladene Herkunft (`create-tierwohl.pdf`, `pdf_document`).
  - Damit bleibt die Upload-Provenienz bis in den reviewbaren Arbeitsstand erhalten.

### Neue Blocker in diesem Slice

- Keine neuen Produkt- oder Workflow-Blocker.
- Ein zwischenzeitlicher Fehlalarm im Upload-Fall kam aus dem ersten Prüfskript: Es suchte nach Dateiname oder offenem Disclosure-Text, obwohl die Oberfläche korrekt nur `Anhänge anzeigen (1)` renderte, solange das Disclosure nicht aufgeklappt ist.

### Weiterhin offen

- Der eingebettete Analyze->Save->Finalize-Endpfad wurde weiterhin nicht vollständig browsernah bis zum finalen Redirect durchgeklickt.
- Die Materialfälle `Link`, `YouTube`, `PDF / Upload` sind jetzt in ihren Handoff-/Provenienzpfaden live bestätigt, aber noch nicht jeweils separat auf genau diesem eingebetteten Analyze->Finalize-Endpfad wiederholt.

## Browser-QA Slice G (2026-05-11)

### Gezielte Fixes

- `AnalyzeWorkspace.tsx` baut den Save-Payload jetzt schema-sicher auf: beim ersten Embedded-Save wird `draftId` nicht mehr als `null`, sondern nur bei vorhandenem serverseitigem Draft gesendet.
- `/api/contributions/analyze/route.ts` behandelt `ANALYZE_TIMEOUT` jetzt als fallback-faehigen Fehler. Statt eines nackten `504 Analyze timed out` liefert die Route denselben heuristischen Analyze-Fallback wie andere degrade-/provider-nahe Fehler.

### Verifikation

- `pnpm -C apps/web exec vitest run tests/create-analyze.route.test.ts tests/create-analyze.workspace-ui.test.ts tests/create-mode.save.route.test.ts`
- `pnpm -C apps/web run typecheck`

### Echte Browser- und API-Evidence

- Embedded-Prüfpfad, `/create?intent=check`, Desktop 1440px:
  - `pass` fuer den Save-Fix
  - Nach `Dialog starten` und Öffnen des eingebetteten Prüfmodus bestätigt `Speichern` jetzt sichtbar `Entwurf gespeichert.` statt des früheren `Invalid input: expected string, received null`.
- Direkter `/api/create/analyze`-Payload im selben Tierschutz-Fall:
  - `pass`
  - Die Route antwortet nach Timeout jetzt mit `ok: true`, `fallback: true`, `errorCode: ANALYZE_TIMEOUT` und heuristischen Claims statt mit einem leeren 504.
  - Im Fallback werden wieder Claims, Fragen und `createAnalyze`-Metadaten geliefert.

### Offener Restblocker

- Der eingebettete `?intent=check`-Pfad ist browsernah noch nicht vollständig stabil bis `Claims sichtbar -> auswählen -> Einreichen -> Redirect`.
- Im Live-Lauf kippt die Surface inkonsistent zwischen Embedded-Prüfmodus und planner-first-Follow-up, sodass der finale Verify-Schritt noch nicht als stabil `pass` markiert werden kann.
- Deshalb bleibt `PR-CREATE-WORKFLOW-LIVE-QA-01` bewusst weiter `in_progress`.

## Abschlussslice 2026-05-21

### Ziel dieses Rest-Slices

- den verbleibenden `/create`-Rest nicht mit einer neuen UI, sondern durch Scope-, Save- und Handoff-Haertung auf den bestehenden Pfaden schliessen
- Request-/Org-/Region-Kontext im echten Arbeitsraum sichtbar machen
- sicherstellen, dass reviewfaehige Handoffs ohne bereits gewaehlten Dossier-/Anlassraum-Zielkontext nicht scope-arm in der Queue landen

### Umgesetzt

- `apps/web/src/lib/server/auth/requestScope.ts` bietet jetzt zusaetzlich einen requestlosen Resolver fuer Server-Pages sowie ein serialisierbares `RequestScopeSummary`.
- `apps/web/src/app/create/page.tsx` loest den aktuellen Scope bereits serverseitig auf und reicht ihn in denselben `/create`-Arbeitsraum weiter.
- `apps/web/src/app/create/CreateClient.tsx` zeigt den bestaetigten Organisations-/Regionscope oder Betreiber-Modus sichtbar im bestehenden Composer-Kontext; Save- und Handoff-Feedback bleiben explizit review-first und markieren bei vorhandenem Scope, dass der Arbeitsstand im Scope der Organisation bleibt.
- `apps/web/src/app/api/contributions/save/route.ts` antwortet jetzt ebenfalls mit dem aufgeloesten `requestScope`, damit der Save-Schritt keine scope-blinde Blackbox mehr ist.
- `apps/web/src/app/api/create/handoffs/route.ts` nutzt fuer reviewfaehige Handoffs ohne bereits gewaehlten Dossier-/Anlassraum-Kontext den bestaetigten Organisations-/Regionscope als persistente Fallback-Einordnung statt scope-arme Records zu schreiben.

### Guardrails bestaetigt

- kein Auto-Publish
- kein automatisches `public_official`
- Link-Intake bleibt Quellenhinweis und behauptet kein Scraping
- Quellenpruefung / externe Quellenanalyse bleibt bestaetigungspflichtig und ohne automatische Kostenbuchung
- Mobile-CTA-Flow bleibt inline und ohne grosses Overlay

### Verifikation 2026-05-21

- `pnpm -C apps/web exec vitest run tests/create-mode.page.test.ts tests/create-mode.save.route.test.ts tests/create-handoff.persistence.route.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-analyze.workspace-ui.test.ts tests/create-link-intake-clarification.contract.test.tsx tests/create-anlassraum-handoff.contract.test.tsx tests/create-factcheck-handoff.contract.test.ts tests/review-queue.readmodel.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`

### Schluss

- Der `/create`-Pfad bleibt derselbe kanonische Einstieg; es wurde keine neue Produktparallelwelt eingefuehrt.
- Fuer den generischen Organisations-/Regionen-Rollout ist `/create` damit produktionsnah genug gehaertet: Scope ist sichtbar, Save/Handoff bleiben reviewfaehig, und reviewrelevante Arbeitsstaende verlieren ihren Organisations-/Regionsbezug nicht mehr still.
