# V3 UX Final Create Voxy Composer And Surface Consolidation 2026-07-15

## Scope

- Task: `V3-UX-FINAL-CREATE-VOXY-COMPOSER-AND-SURFACE-CONSOLIDATION-01`
- Branch: `fix/create-chat-native-smoke-direct-01`
- PR: `#391`
- Typ: finaler UX-Konsolidierungs-Slice ohne Runtime-, Provider-, Secret-, Notification- oder Publish-Aktivierung

## Ziel

`/create` soll wie ein moderner Voxy-Composer wirken: kurz beim Einstieg, chat-nativ im Fokus und zugleich tief genug fuer Themen-Erkennung, Mehrthemen-Steuerung, Anschluss an Debatten/Dossiers/Beteiligung und review-first Guardrails.

Leitsatz:

> Create feels like a modern Voxy composer: short at first glance, deep on demand.

## Eingangsquellen

- `AGENTS.md`
- `.codex/prompts/lean-continuous-slice-runner.md`
- `docs/E150/OpenTasks.md`
- `docs/E150/V3_PREVIEW_SMOKE_RESULTS_AFTER_AGENTIC_2026-07-14.md`
- `docs/E150/V3_PREVIEW_SMOKE_RESULTS_2026-07-13.md`
- `docs/E150/V3_AGENTIC_CIVIC_E2E_PILOT_2026-07-14.md`
- `docs/E150/V3_VOXY_EXPERIENCE_SHELL_MOBILE_AGENTIC_INTEGRATION_2026-07-14.md`
- `docs/E150/V3_CIVIC_PRINCIPLES_GOV_LIGHT_MUNICIPAL_HANDOFF_DECISION_2026-07-14.md`
- `docs/E150/V3_RELEASE_READINESS_REGRESSION_MATRIX_2026-07-13.md`

## Umgesetzte Konsolidierung

### Update innerhalb von PR #391

Die erste Konsolidierung wurde im bestehenden PR-Branch weitergezogen, ohne neuen Task und ohne neuen PR:

- `/create` ist jetzt staerker als zentraler Voxy-Workspace gebuendelt
- `/runden` und `/themen` teilen sich einen kleinen wiederkehrenden Voxy-Dock statt weiterer grosser Hinweisflaechen
- die Surface-Sprache bleibt ueber Create, Themen und Runden hinweg konsistent review-first

### 1. `/create` ist jetzt klar composer-first

Geaendert:

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/features/create/FrontendAiTransparencyPanel.tsx`

Ergebnis:

- oberhalb der ersten Eingabe bleiben nur noch kurze Voxy-Fuehrung, wenige Chips und die explizite Safety-Line sichtbar
- Start-Copy:
  - `Schreib frei. Ich sortiere Thema, Kontext und nächste Schritte — nichts wird automatisch veröffentlicht.`
- sichtbare Chips:
  - `Beitrag sortieren`
  - `Frage schärfen`
  - `Quelle prüfen`
  - `Direkt Entwurf`
- Voxy erscheint inline im Composer statt als grosses Seitenfenster
- die Textarea bleibt der klare visuelle Hauptanker
- das Transparenzpanel bleibt erhalten, startet aber kompakt mit `Warum sehe ich das?`

### 2. Nach dem Start bleibt die Deutung kompakt und steuerbar

Geaendert:

- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/ExistingTopicMatchesPanel.tsx`
- `apps/web/src/features/create/existingTopicMatches.ts`

Ergebnis:

- erste Voxy-Deutung wird kuerzer und dialogischer
- der Ergebnisbereich traegt den Pilotpfad jetzt direkt im Chat-Kopf:
  - `Voxy Pilotpfad`
  - Eingabe -> Einordnung -> Vorschlag -> Bestaetigung -> Naechste Aktion
- oberhalb der Detailarbeit gibt es jetzt eine kleine KPI-Leiste fuer:
  - `Prioritäten`
  - `Themenäste`
  - `Offene Fragen`
  - `Nächster Schritt`
- erkannte Schwerpunkte erscheinen sofort als sichtbare Themenast-Karten statt erst tiefer im Detailmodus
- Mehrthemen-Faelle bleiben explizit Nutzerentscheidung
- sichtbare Folgeaktionen wurden auf steuerbare, review-first Sprache umgestellt:
  - `Zusammen lassen`
  - `Aufteilen`
  - `Schwerpunkt wählen`
  - `Nebenthema parken`
  - `An Debatte anknüpfen`
  - `Dossier prüfen`
  - `Beteiligung vorbereiten`
- Kandidaten bleiben Kandidaten:
  - `multi_topic_detected` ist nicht gleich automatische Aufteilung
  - `dossier_candidate` ist nicht gleich Dossier-Erstellung
  - `participation_candidate` ist nicht gleich Start
  - `agent_suggestion` ist nicht gleich Nutzerentscheidung
- tiefe Anschluss- und Preview-Module bleiben erhalten, sind aber eingeklappt und damit deep-on-demand

### 3. Landing-, Themen- und Rundenflaechen sprechen dieselbe UX-Sprache

Geaendert:

- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/features/home/HomeSplitVoxyLanding.tsx`
- `apps/web/src/app/runden/RundenPublicSharingGuide.tsx`
- `apps/web/src/app/themen/page.tsx`
- `apps/web/src/app/themen/ThemenStartDraftAssistant.tsx`

Ergebnis:

- Landing fuehrt persoenlicher und ruhiger in den Voxy-Composer
- `/runden` benennt den Einstieg explizit als Voxy-Vorbereitung
- `/themen` erklaert Anschluss an bestehende Debatten review-first statt als Ja/Nein-Mechanik
- `/runden` und `/themen` teilen jetzt denselben kleinen Voxy-Dock als wiederkehrende Assistenzschicht:
  - bottom-right / mobile-bottom angedockt
  - kurze Guardrails statt eines zweiten grossen Workspaces
  - klare CTA in Richtung `/create`, ohne Auto-Publish oder Auto-Split
- der Uebergang vom Voxy-Entwurf in Themen-/Debattenlogik bleibt bearbeitbar und ohne automatische Zusammenfuehrung

### 4. Contract-Sync fuer die Surface-Wahrheit

Geaendert:

- `apps/web/src/features/voxy/voxyExperienceShellContract.ts`
- `apps/web/src/components/voxy/VoxyFloatingDock.tsx`

Ergebnis:

- `themen` ist jetzt Teil des Voxy-Experience-Shell-Contracts
- der Surface-Hinweis fuer Themen beschreibt explizit Andocken, Themenzweige und review-first naechste Schritte
- der neue Floating-Dock bleibt reine UX-Fassade:
  - keine Runtime
  - keine Provider
  - kein Auto-Publish
  - kein Auto-Split

## Guardrails

- keine neue Runtime
- keine Provider
- keine Secrets
- keine externe Notification
- kein Auto-Publish
- keine automatische Entitlement-Aktivierung
- keine automatische Themenaufteilung ohne Nutzerentscheidung
- keine Fake-Analyse
- keine Fake-Daten
- keine Fake-Quellen
- keine neue native App

## OpenTasks-Sync

- `V3-UX-FINAL-CREATE-VOXY-COMPOSER-AND-SURFACE-CONSOLIDATION-01` in `docs/E150/OpenTasks.md` auf `done` dokumentiert
- naechster operativer Schritt bleibt der reale manuelle Preview-Smoke auf den konsolidierten Surfaces

## Validierung

- `git diff --check`
- fokussierte Vitest-Suite fuer Create/Landing/Runden/Themen
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

Die exakten Ergebnisse werden im PR festgehalten.

## Manuell zu pruefen

- `/create`
  - composer-first Eindruck
  - Voxy inline statt Seitenfenster
  - Pilotpfad, KPI-Rail und Themenaeste direkt im Chat pruefen
  - Transparenz kompakt und einklappbar
  - Mehrthemen-Steuerung ohne Auto-Aufteilung
- `/`
  - Landing fuehrt logisch und ruhig in den Create-Flow
- `/runden`
  - Voxy-Dock bleibt klein, verstaendlich und review-first
- `/themen` und Dossier-/Debattenanschluesse
  - Voxy-Dock, Anschluss, Bearbeitbarkeit und Kandidaten-Semantik bleiben klar
