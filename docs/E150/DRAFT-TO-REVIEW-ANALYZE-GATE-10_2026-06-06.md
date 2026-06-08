# DRAFT-TO-REVIEW-ANALYZE-GATE-10

## Was wurde umgesetzt?

- Ein zentraler Gate-Contract in `apps/web/src/features/start/draftNextActionGate.ts` beschreibt pro Draft-Arbeitsstand, welche nächsten Schritte möglich sind und welche Guardrails gelten.
- `Light Analysis / planner_only` ist jetzt explizit als kostenfreier Draft-Schritt modelliert.
  Status:
  `Analyse-Entwurf · Noch nicht veröffentlicht · Keine Quellenprüfung gestartet`
- `CreateClient` wertet den optionalen Query-Parameter `nextAction` aus und zeigt für `factcheck` bewusst erst eine Bestätigungs-/Pricing-Stufe statt still einen teuren Prüfpfad zu starten.
- `AccountResumeWorkbenchSection` zeigt pro Arbeitsstand sinnvolle nächste Schritte wie `Leichte Einordnung starten`, `Thema suchen`, `Runde weiter vorbereiten`, `Zur redaktionellen Prüfung geben` oder `Faktencheck später starten`.

## Verbindliche Guardrails

### Light Analysis / planner_only

- nur nach explizitem Nutzerklick
- kostenfreier Draft-Schritt
- keine vertiefte Recherche
- keine Quellenprüfung
- kein externer Kosten-Orchestrator
- kein Auto-Publish
- kein Graph-Write
- Ergebnis bleibt Analyse-Entwurf / Preview

### Redaktionelle Prüfung

- nur nach explizitem Nutzerklick
- loginpflichtig oder geschützter Kontaktpfad
- Status:
  `Zur manuellen Prüfung vorgemerkt`
- keine Veröffentlichung
- kein Graph-Write
- kein Dossier
- keine vertiefte Recherche
- kein Vote

### Faktencheck / Quellenprüfung

- nur nach explizitem Nutzerklick
- loginpflichtig
- entitlement-/pricing-gated
- vor Start klare Bestätigung
- keine stillen Kosten
- keine automatische Veröffentlichung
- kein automatischer Graph-Merge
- Status vor Freigabe:
  `Vertiefte Prüfung benötigt Bestätigung`

### Pricing-Grenzen

- kein Pricing beim einfachen Draft-Handoff
- kein Pricing beim normalen Beitrag ausarbeiten
- kein Pricing auf `/start -> /create`, `/themen`, `/runden`
- Pricing nur für vertiefte Quellenprüfung/Faktencheck, Dossier, produktiven Anlassraum, Organisationsmodus oder Deep Research

## Warum dieser Pfad existiert

Der Draft-/Resume-Kosmos braucht einen sauberen Übergang zwischen:

- leichtem, kostenfreiem Verstehen
- manueller redaktioneller Prüfung
- vertiefter, potentiell kostenpflichtiger Prüfung

Ohne diesen Gate-Slice würden Nutzer aus einem Entwurf zu leicht in kosten- oder organisationsnahe Prozesse rutschen, ohne dass klar ist:

- was jetzt wirklich startet
- was noch Draft ist
- was Login braucht
- was Bestätigung oder Pricing benötigt

## Welche Klassifikationen/Wege erlaubt sind

- `public_relevant`:
  leichte Einordnung, Thema suchen, Runde vorbereiten, redaktionelle Prüfung, später ggf. Faktencheck
- `needs_reframe` / `personal_only`:
  öffentliche Relevanz klären, redaktionelle Prüfung
- `spam_suspected` / `abusive_or_empty`:
  kein normaler nächster Schritt aus dem Gate

## Was bewusst nicht passiert

- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-DeepSearch
- kein Auto-Graph-Write
- kein Auto-Vote

## Tests / Validierung

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-draft-context.contract.test.ts tests/start-create-light-entry.contract.test.tsx tests/global-draft-status-bar.contract.test.tsx tests/branch-workspace-handoff.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/analyze-workbench-hidden-until-start.test.ts tests/manual-anlassraum-setup.contract.test.ts tests/draft-to-review-analyze-gate.contract.test.ts`

Ergebnis:

- Typecheck grün
- Lint grün
- `8/8` Testdateien grün
- `57/57` Tests grün

## Offen / Folge-Slices

- echte Review-/Factcheck-Backoffice-Bearbeitung
- spätere Entitlement-/Pricing-Oberflächen jenseits des Draft-Gates
- produktive Dossier-/Anlassraum-/Deep-Research-Starts bleiben separat gated
