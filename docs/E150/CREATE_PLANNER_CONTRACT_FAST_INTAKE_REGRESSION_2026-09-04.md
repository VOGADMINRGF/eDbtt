# Create-Planner-Contract und Fast Intake – Regression 2026-09-04

## Status und Abgrenzung

Lokaler, ungemergter Fix auf `fix/create-mobile-runtime-polish-01`. Es wurde weder
veröffentlicht noch gemergt. Die Save-/Resume-Reihenfolge aus PR #713 bleibt
erhalten: Der Entwurf wird vor dem Planner-Aufruf gespeichert. Die von PR #682
belegten Citizen-Context-Hunks wurden nicht ersetzt.

`docs/E150/OpenTasks.md` wurde bewusst nicht parallel geändert. Laut aktuellem
Repository-Stand ist Issue #447 der alleinige SSOT-Writer; auch PR #713 hält diese
Abgrenzung ausdrücklich fest.

Die vier Überschneidungen mit PR #682 (`CreateClient.tsx`,
`SharedCreateComposer.tsx`, `intelligentFollowup.ts`,
`intelligentFollowupContract.ts`) wurden hunk-genau gegen `origin/main`, den
#713-Remote-Head und #682-Head `6fce98c0` geprüft. Die Planner-Laufzeitmessung
liegt im nicht kollidierenden Planner-Contract; eine synthetische Drei-Wege-
Zusammenführung ist konfliktfrei und enthält anschließend sowohl den Citizen-/
Regionskontext von #682 als auch die #713-Contract- und Latenzhärtung.

## Befund

Die Regression hatte vier zusammenwirkende Ursachen:

1. `asStringArray` konvertierte beliebige Array-Einträge mit `String(...)` und
   machte aus Objekten dadurch den öffentlichen Text `[object Object]`.
2. Der Planner übergab zwar ein JSON-Schema, der OpenAI-Adapter durfte bei
   Schemafehlern aber still auf `json_object` zurückfallen und damit einen zweiten
   physischen Provider-Call auslösen.
3. Das vorherige Strict-Schema war beim Provider ungültig: Das optionale Feld
   `stance` stand in `properties`, aber nicht in `required`. OpenAI meldete
   `invalid_json_schema`.
4. `plannerClusters` (Aspekte) wurden zusätzlich zu `topicCandidates`
   (eigenständige Hauptthemen) als Themenkarten und teilweise als Zählerbasis
   verwendet.

## Umgesetzter Contract

- Der Provider-Input wird vor jeder Normalisierung mit einem strikten Zod-Contract
  geprüft. Öffentliche Strings sind echte, nicht-leere Strings; Arrays akzeptieren
  ausschließlich echte Strings bzw. die vorgesehenen Enums.
- `[object Object]`, `[object Array]`, `undefined`, `null`, `NaN` und `Infinity`
  werden als öffentliche technische Sentinel-Werte abgewiesen.
- Nicht-konforme JSON-Payloads enden fail-closed als
  `invalid_provider_payload` mit einem sicheren `contract_violation_*`-Code. Es
  gibt danach keinen alternativen Provider-Versuch.
- Der Planner setzt `allowJsonFormatFallback: false`. Der Call-Pfad wurde bis zum
  Requests-API-Body geprüft: `callOpenAIJson` reicht das Schema an `callOpenAI`
  durch; der Provider sendet `text.format.type = json_schema`, den Schemanamen,
  `strict: true` und das Schema an `/v1/responses`.
- Das verkleinerte Intake-Schema enthält nur die für die erste Antwort nötigen
  Felder. Alle Properties sind required; alle Array-Items sind Strings. Interne
  Alias-, Such- und Lane-Felder werden danach deterministisch abgeleitet.
- Ein gemeinsamer Kern erzeugt genau einen `topicCandidate`; `plannerClusters`
  bleiben Aspekte. `CreateVisualFollowup`, Debattenstand und Themenzähler leiten
  ihre Anzahl aus derselben deduplizierten `understanding.topics`-Struktur ab.
- Die explizite Formulierung „ich bin für“ korrigiert ein Provider-Ergebnis
  `open`/`unclear` auf `pro`, sofern keine explizite Gegenposition vorliegt.
- Für den Werkstatt-/Teilhabe-Fall stabilisiert eine deterministische semantische
  Reconciliation die ausdrücklich vorgegebene Hauptanliegen-/Aspekt-Struktur,
  ohne einen zweiten Runtime-Pfad oder Provider-Call einzuführen.

## Citizen-first und Latenz

- Kurze Texte ohne URL nutzen einen Fast-Intake-Pfad mit einem Provider-Versuch,
  400 Output-Tokens und 4.200 ms Provider-Timeout.
- Die Client-seitige harte Grenze startet beim Submit und bricht nach 5.000 ms den
  Planner-Fetch ab. Der vorangehende Save bleibt absichtlich nicht abortierbar,
  damit die UX-Grenze die Save-/Resume-Sicherheit nicht beschädigt; verbraucht der
  Save das Budget, erscheint danach der sichere gespeicherte Fehlerzustand.
- AI-Usage-Telemetrie blockiert die sichtbare Planner-Antwort nicht mehr.
- Graph-Matches, Research und Source-Enrichment bleiben vor der Bestätigung leer;
  der bestehende Topic-Match-Runtime-Aufruf startet erst nach `isConfirmed`.
- Die erste Ansicht zeigt einen gemeinsamen Kern, alle drei verständlichen Aspekte
  und danach die Bestätigung. Tiefere Struktur bleibt eingeklappt.
- Save-, Access-, Planner-, Context-, Route-Total- und Client-
  `submitToResultMs`-Zeiten sind getrennt instrumentiert.

## Regressionsergebnis

Eingabe:

> ich bin für mindestlohn bei behindertenwerkstätten, für mehr integration innerhalb der wirtschaft aber auch für stärkere kontrollen der vorstände der jeweiligen akteure

Kanonisches Ergebnis:

- Themenzahl: `1`
- Hauptanliegen: `Arbeitsbedingungen und Teilhabe in Behindertenwerkstätten`
- Aspekte:
  - `Faire Entlohnung / Mindestlohn`
  - `Integration in den allgemeinen Arbeitsmarkt`
  - `Kontrolle / Governance der Träger bzw. Vorstände`
- Haltung: `pro`
- Provider: `openai`
- Modell: `gpt-4.1-mini-2025-04-14`
- Provider-Attempts: `1`

Revalidierter Live-Smoke am 2026-09-05 mit echtem Provider und anschließendem sichtbaren
Headless-Chromium-Render:

| Viewport | Planner | Post-Planner bis sichtbar | Fast Intake bis sichtbar | Contract |
| --- | ---: | ---: | ---: | --- |
| Desktop 1440 × 900 | 4.061 ms | 114 ms | 4.175 ms | grün |
| Mobile 390 × 844 | 1.891 ms | 42 ms | 1.933 ms | grün |

Beide Läufe hatten genau einen Provider-Attempt, dieselbe kanonische Themenzahl,
dieselben drei Aspekte, Haltung `pro` und keinen technischen Sentinel im
gerenderten Output. Der Mobile-Lauf erreichte das Ziel von unter drei Sekunden;
der Desktop-Lauf blieb unter der harten Fünf-Sekunden-Grenze, verfehlte das
Zielbudget aber um 1.175 ms. Der größte verbleibende Anteil ist die einzelne
Provider-Antwort; für dieses Performance-Ziel wurde keine riskante zweite
Runtime oder aggressive Architekturänderung eingeführt.

Der Live-Smoke startet am Fast-Intake-Aufruf und enthält Provider, Context,
React-Render und die Sichtbarkeitsprüfung im Browser. Ein vollständiger
authentifizierter `/create`-Submit einschließlich realer Save-/Access-Netz- und
Datenbanklatenz konnte lokal nicht seriös gemessen werden, weil keine
`EDEBATTE_E2E_EMAIL`/`EDEBATTE_E2E_PASSWORD` für ein freigegebenes Wegwerf-Konto
gesetzt sind. Die Produktionspfade geben diese Werte nun getrennt aus; die
Route-Contract-Tests prüfen `accessMs`, `contextMs`, `saveMs`, `plannerMs` und
`totalMs`. Der vollständige Submit-zu-sichtbar-Wert bleibt deshalb vor Merge ein
manueller Gate-Punkt.

## Verifikation

- Live: `CREATE_LIVE_REGRESSION_SMOKE=1 node --env-file=.env.local node_modules/vitest/vitest.mjs run tests/create-planner-live-responsive.smoke.test.tsx --reporter=verbose`
- Live-Smoke: 2 Tests mit echtem Provider und Headless Chromium grün.
- Kombinierte Planner-, Provider-, Routing-, Responsive-, Save-,
  Follow-up-, Single-Flight-, Locale- und Debattenstand-Suite: 128 Tests in 24 Dateien
  grün; die 2 kostenpflichtigen Live-Smokes waren im normalen Lauf wie vorgesehen
  übersprungen.
- Vollständiger CI-Block `Focused Create runtime contracts`: 215 Tests in
  26 Dateien grün. Der Locale-Vertrag wurde dabei auf die aktuelle deutsche und
  englische Create-Einstiegscopy synchronisiert.
- CI-konfigurierter isolierter Save-/Safety-Harness: 25 Tests in 2 Dateien grün.
- Synthetisch zusammengeführter #713-/#682-Stand: 23 Citizen-, Regions-,
  Anonymous-Intake-, Counterposition- und Existing-Topic-Tests in 5 Dateien grün.
- Web-Critical: 192 Tests in 28 Dateien grün.
- Production Guardrails: 36 Tests in 12 Dateien grün.
- `pnpm -C apps/web run typecheck`, `pnpm -C apps/web run lint`,
  `pnpm -C apps/web run build` und `git diff --check`: grün.

Zwei zusätzlich mit der allgemeinen Vitest-Konfiguration geprüfte, von #713
unveränderte Baseline-Dateien bleiben in genau dieser nicht-kanonischen
Ausführung rot: `create-save.safety-gate.test.ts` (fehlender Security-Mock,
6 Tests; mit dem CI-eigenen isolierten Security-Harness grün) und
`start-shared-create-composer.contract.test.tsx` (veraltete Homepage-Copy,
2 Tests). Der identische 8-Test-Fehler wurde in einem isolierten Worktree direkt
auf `origin/main` `5a7dcadf` reproduziert; diese fremde Drift wurde nicht in den
#713-Scope aufgenommen.

Der Live-Smoke ist standardmäßig deaktiviert und läuft nur mit
`CREATE_LIVE_REGRESSION_SMOKE=1`, damit normale Testläufe keine externen Kosten
oder Provider-Aufrufe auslösen.
