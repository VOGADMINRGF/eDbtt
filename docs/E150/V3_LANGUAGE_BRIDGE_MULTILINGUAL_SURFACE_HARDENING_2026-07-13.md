# V3 Language Bridge Multilingual Surface Hardening 2026-07-13

## Scope

- `V3-LANGUAGE-BRIDGE-MULTILINGUAL-SURFACE-HARDENING-01`
- Cluster: Language Bridge / Multilingual Surfaces / Original-vs-Reading Truth

## Umsetzung

- Eine gemeinsame sichtbare Sprachbruecken-Wahrheit wurde unter `apps/web/src/features/i18n/languageBridgeSurfaceTruth.ts` eingefuehrt.
- Die neue Quelle harmonisiert:
  - `uiLocale`
  - Originalsprache
  - Lesefassung / reading language
  - menschliche Uebersetzungsstatus-Labels
  - einen gemeinsamen Trust-Hinweis fuer Original-vs-Uebersetzung
- `LocalizedContentDisplay` kann diese Sprach- und Trust-Metazeile jetzt optional ueber `showLanguageBridgeMeta` einblenden, statt lokale Einzeltexte zu duplizieren.
- `V3ReviewContextSummary` zeigt dieselbe Wahrheit jetzt sichtbar fuer Review-/Handoff-Surfaces: `uiLocale`, Originalsprache, Lesefassung, Status und Trust-Hinweis laufen ueber denselben shared Helper statt ueber rohe Sprachcodes oder lokale Sondercopy.

## Gepruefte aktive Surfaces

- `/create`
  Die Review-Kontext-Zusammenfassung transportiert jetzt dieselbe Sprach- und Trust-Wahrheit wie andere produktive Surfaces.
- `/admin/review`
  Die bestehende review-first Kontextdarstellung bleibt aktiv und wurde gegen die gemeinsame Sprachwahrheit revalidiert.
- `/dossier/[id]/studio`
  Die vorhandene Studio-/Review-Kontextdarstellung wurde gegen dieselbe Original-vs-Lesefassung-Semantik geprueft.
- `/account`
  Lokalisierte Beitrags- und Nachrichteninhalte zeigen jetzt dieselbe Sprachmetazeile und denselben Trust-Hinweis statt still unterschiedlicher Teilinformationen.
- `/community/contributions`
  Die oeffentliche Leseflaeche nutzt die shared Sprachbruecke statt einer zusaetzlichen lokalen Uebersetzungsstatus-Zeile.
- `/admin/contributions`
  Die Admin-Leseflaeche nutzt dieselbe shared Sprachbruecke wie die oeffentliche Beitraegesicht.
- `/profile/[shareId]`
  Die Share-/Profilansicht nutzt dieselbe Sprachmetazeile und denselben Trust-Hinweis fuer lokalisierte Inhalte.

## Doppelstrukturen reduziert

- Sprach- und Uebersetzungswahrheit lag bisher verteilt in:
  - `V3ReviewContextSummary`
  - `LocalizedContentDisplay`
  - oeffentlichen Contribution-Surfaces
  - Admin-Contribution-Surfaces
  - Account-/Share-Nachrichtenansichten
- Diese Oberflaechen ziehen die sichtbare Sprachbruecke jetzt aus `languageBridgeSurfaceTruth.ts`, statt mehrere leicht abweichende Kombinationen aus Sprachlabel, Statuszeile und Trust-Copy zu pflegen.
- Die zusaetzlichen lokalen Uebersetzungsstatus-Zeilen in `/community/contributions` und `/admin/contributions` wurden entfernt, weil die neue gemeinsame Meta-Zeile dieselbe Produktwahrheit bereits zentral liefert.

## Produktwahrheit

- `uiLocale` bleibt Bedien- und Lesesprache, nicht Evidenz.
- Originalsprache bleibt erhalten und bleibt Quelle bzw. Evidenz.
- Lesefassung / Uebersetzung bleibt Hilfsfassung fuer Verstehen und Review.
- Uebersetzung ist nie Quelle, Verifikation oder stiller Ersatz fuer das Original.
- `review_ready`, `approved` oder andere Review-States werden durch eine Uebersetzung nicht implizit erreicht.
- Es gibt weiterhin keine externe Translation-API, keine Auto-Uebersetzung, kein automatisches Ueberschreiben der Originalsprache und keine neue Sprach-Runtime.

## Legacy- und Fallback-Pfade

- In diesem Slice wurden keine Routen entfernt, keine Redirects eingefuehrt und keine neue Sprachsurface eroefnet.
- Bestehende Surfaces ohne lokalisierte Inhaltsdarstellung blieben unberuehrt; der Cluster zentralisiert nur die bereits aktiven multilingualen Renderpfade.

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/content-translation-rendering.test.tsx tests/v3-review-context-summary.test.tsx tests/admin-review.page.test.tsx tests/admin-editorial-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/account-resume-workbench.contract.test.tsx tests/operator-surfaces.locale-render.test.tsx`
  Ergebnis: `7` Testdateien gruen, `25/25` Tests gruen.
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`
  Ergebnis: lokal weiter nur die bekannte `.next/types/**/*.ts`-Drift mit `TS6053`-Fehlern fuer fehlende generierte Dateien; nicht als Slice-Regression gewertet, weil Build, Lint und die relevanten Sprach-/Surface-Tests gruen sind.

## Offene Punkte

- `V3-AI-TRACE-USER-FACING-ORCHESTRATION-HARDENING-01` ist der naechste unabhaengige `codex_ready` Cluster nach Merge, weil er dieselben produktiven Review-/Dossier-/Operator-Pfade beruehrt, aber fachlich auf Orchestrierungs-Transparenz statt Sprachbruecken abzielt.
- Wenn spaeter weitere multilingual aktive Surfaces hinzukommen, sollen sie dieselbe Meta- und Trust-Wahrheit ueber `languageBridgeSurfaceTruth.ts` oder `LocalizedContentDisplay` anbinden statt neue Sondercopy einzufuehren.
