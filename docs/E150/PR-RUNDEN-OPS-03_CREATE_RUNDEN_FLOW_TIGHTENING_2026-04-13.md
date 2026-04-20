# PR-RUNDEN-OPS-03 — /create <-> /runden Flow Tightening (2026-04-13)

## Ziel
`/create` und `/runden` enger als zusammenhaengende Produktkette fuehren:
- `/create` bleibt Start-/Erfassungs-/Analyse-/Routingflaeche.
- `/runden` bleibt laufende Arbeits-/Verteil-/Status-/Ergebnisflaeche.
- Wechsel zwischen beiden Flaechen bleibt kontextstabil und handlungsorientiert.

## Umgesetzt

1. Kontextgebundener Start aus `/runden` nach `/create`
- Beitragsstarts aus `/runden` uebergeben jetzt explizit:
  - `source=runden`
  - `reason=round_inline_contribution` (bzw. `round_first_contribution`)
  - `intent=contribution`
  - `entryIntent=content_companion`
  - `entryMode=direct`
  - `anlassraumId` (falls vorhanden)
  - `returnTo=/runden?view=active&anlassraumId=...`
- Betroffene Stellen:
  - Quick Action "Beitrag verfassen"
  - Inline-Beitragsformular in laufenden Runden
  - Empty-State-CTA "Ersten Beitrag vorbereiten"

2. Rueckkehrpfad aus `/create` in den laufenden Rundenkontext
- `/create` liest nun `returnTo` aus Query und nutzt es als internen, validierten Rueckweg.
- Finalize-Fallback folgt kontextsensitiv:
  - Dossier hat weiterhin Prioritaet.
  - Bei Rundenkontext wird auf `/runden` (inkl. `anlassraumId`) zurueckgefuehrt.
- AnalyzeWorkspace-Meldungen unterscheiden jetzt explizit Dossier-/Runden-/Swipes-Weiterleitung.

3. `/create`-Startflaeche weniger leer, klarer gefuehrt
- Kompakte Leitstruktur oberhalb der Freitextflaeche ergaenzt:
  - Anliegen/Hinweis/Beitrag
  - Ziel/naechster Schritt
  - optionaler Kontext/Quelle/Rueckfrage
- Keine neue Formularwand, keine Pflichtfeld-Explosion.
- Bei Rundenkontext sichtbarer Hinweis "Aus laufender Runde gestartet" plus Rueckkehr-CTA.

4. `/runden` Empty State als operativer 3-Schritte-Flow
- Empty State jetzt klar als Arbeitsstart aufgebaut:
  - Schritt 1: Anlass in `/create` starten
  - Schritt 2: ersten Beitrag/Kontext erfassen
  - Schritt 3: QR-/Teilnahmelogik und Status in laufender Runde nutzen
- CTA-Hierarchie geschaerft:
  - Primaer: neuer Anlass
  - Sekundaer: erster Beitrag
  - Ergebnispfad explizit nachrangig markiert

5. Freundlichere Erwartungsfuehrung beim QR-Gating
- Teilnehmer sehen eine erklaerende Hinweislinie statt versteckter/unklarer Erwartung:
  - QR/Verteilung fuer berechtigte Rollen im laufenden Anlass.
- Manager-Kontext ohne verfuegbaren Share-Target zeigt ebenfalls eine erklaerende Verfuegbarkeitsnotiz.

6. Anlasskopf fuer laufende Arbeit geschaerft
- Featured-Anlass zeigt kompaktere operative Signale:
  - Status
  - Prozesszustand
  - letzte Aktivitaet / letzte Aktion

## Geaenderte Dateien
- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/create/page.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/finalizeRedirect.ts`
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
- `apps/web/tests/runden-page.acceptance.test.ts`
- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/create-analyze.workspace-ui.test.ts`
- `docs/E150/OpenTasks.md`

## Tests
Ausgefuehrt:
- `pnpm -C apps/web exec vitest run tests/runden-page.acceptance.test.ts tests/create-mode.page.test.ts tests/create-intake-context.test.ts tests/create-analyze.workspace-ui.test.ts`
- `pnpm -C apps/web exec tsc --noEmit`
- `pnpm -C apps/web exec eslint src/app/runden/page.tsx src/app/create/page.tsx src/app/create/CreateClient.tsx src/features/create/finalizeRedirect.ts src/components/analyze/AnalyzeWorkspace.tsx tests/runden-page.acceptance.test.ts tests/create-mode.page.test.ts tests/create-analyze.workspace-ui.test.ts`

Ergebnis:
- Alle relevanten Tests gruen.
- Typecheck und gezielter Lint gruen.

## Scope-Grenze
- Keine neue Featurewelt fuer `/create` oder `/runden`.
- Keine Rollen-/Governance-Neudefinition.
- Keine Aufweichung der Surface-Trennung.
