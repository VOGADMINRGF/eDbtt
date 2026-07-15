# V3 UX Final Create Voxy Composer And Surface Consolidation 2026-07-15

## Scope

- Task: `V3-UX-FINAL-CREATE-VOXY-COMPOSER-AND-SURFACE-CONSOLIDATION-01`
- Branch: `fix/create-chat-native-smoke-direct-01`
- PR: `#391`
- Typ: finaler UX-Konsolidierungs-Slice ohne Runtime-, Provider-, Secret-, Notification- oder Publish-Aktivierung

## Ziel

`/create` soll wie ein moderner chat-nativer Workspace wirken: kurzer Einstieg, danach sofort sichtbarer Arbeitsdialog statt Formular + Analysewand, mit klarer Themenwahl, sichtbaren Themenaesten und deep-on-demand Transparenz.

Leitsatz:

> Create feels like a modern Voxy composer: short at first glance, deep on demand.

## Eingangsquellen

- `AGENTS.md`
- `.codex/prompts/v3-ux-target-voxy-chat-workspace-remediation.md`
- `docs/E150/OpenTasks.md`
- `docs/E150/V3_UX_TARGET_VOXY_CHAT_WORKSPACE_REFERENCE_2026-07-15.md`
- `docs/E150/V3_PREVIEW_SMOKE_RESULTS_AFTER_AGENTIC_2026-07-14.md`
- `docs/E150/V3_PREVIEW_SMOKE_RESULTS_2026-07-13.md`
- `docs/E150/V3_AGENTIC_CIVIC_E2E_PILOT_2026-07-14.md`
- `docs/E150/V3_VOXY_EXPERIENCE_SHELL_MOBILE_AGENTIC_INTEGRATION_2026-07-14.md`
- `docs/E150/V3_CIVIC_PRINCIPLES_GOV_LIGHT_MUNICIPAL_HANDOFF_DECISION_2026-07-14.md`
- `docs/E150/V3_RELEASE_READINESS_REGRESSION_MATRIX_2026-07-13.md`

## Umgesetzte Konsolidierung

### Remediation innerhalb von PR #391

Der erste Stand von PR `#391` blieb visuell zu nah an Formular + Analysewand. Diese Remediation zieht denselben PR gezielt auf das dokumentierte Zielbild nach, ohne neuen Task und ohne neuen PR:

- `/create` ist jetzt als klarer Workspace-Dialog statt als lange vertikale Analyseflaeche aufgebaut
- `/runden` und `/themen` zeigen nur noch einen kleinen Assistant-Dock unten rechts, keinen zentralen Chat
- die sichtbare Assistenten-Sprache bleibt ueber Create, Themen und Runden hinweg konsistent review-first, ohne das Maskottchen staendig oeffentlich als `Voxy` auszuschreiben

### 1. `/create` startet kurz und wechselt dann in einen sichtbaren Chat-Workspace

Geaendert:

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/CreateWorkspaceShell.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`

Ergebnis:

- `CreateWorkspaceShell` ist jetzt die sichtbare Hauptstruktur von `/create`
- die Shell bleibt von Seitenstart an sichtbar und haelt dieselben Zonen vor und nach Submit an derselben Stelle:
  - `WorkspaceHeader`
  - `ProgressPipeline`
  - `StructureRail`
  - `ChatThread`
  - `ComposerBar`
- der alte dominante Ober-Composer wurde zu einer eingebetteten `workspace_shell`-Composer-Bar im selben Shell-Panel reduziert
- Thread und Composer teilen jetzt dieselbe grosse Workspace-Karte; unterhalb haengt keine zweite Formular-Card mehr
- nach dem ersten Submit zeigt die untere Bar keinen duplizierten Ursprungstext mehr, sondern nur noch den Fortsetzungs-Composer
- das Transparenzpanel bleibt erhalten, wird initial aber nicht mehr als sichtbarer Block unter dem Workspace gerendert, sondern erst nach explizitem Oeffnen von `Details & Transparenz`

### 2. Nach dem Start zeigt `/create` eine echte Pipeline statt einer Analysewand

Geaendert:

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`

Ergebnis:

- der obere Arbeitsfluss ist jetzt eine echte Pipeline:
  - `Eingabe`
  - `Verstehen`
  - `Themen ordnen`
  - `Quellen prüfen`
  - `Entwurf vorbereiten`
- direkt unter dieser Pipeline steht eine kompakte Struktur-Leiste fuer:
  - `Prioritäten`
  - `Themenäste`
  - `Offene Fragen`
  - `Nächster Schritt`
- der eigentliche Dialog erscheint als Chat-Thread:
  - `Du` zeigt den echten Beitrag direkt als Bubble
  - `Assistent` zeigt die erste Einordnung als Antwort-Bubble
- erkannte Themen erscheinen sofort als drei sichtbare Branch-Cards statt tief im Scrollbereich
- der Hauptflow fuehrt von Themenwahl zu Quellen- und Entwurfsarbeit, nicht zu einer Retry-/Analyse-Primaraktion
- `Einordnung erneut versuchen` ist nicht mehr primaerer CTA
- `Einordnung erneut versuchen` liegt im degraded Pfad nur noch in `Details ansehen`
- primaere CTAs sind jetzt:
  - `Hauptthema wählen`
  - `Beitrag weiterentwickeln`
  - `Quellen ergänzen`
  - `Entwurf speichern`
- waehrend die Einordnung laeuft, erscheint sofort ein sichtbarer Chat-Zwischenzustand:
  - User-Bubble mit dem Beitrag
  - Assistant-Bubble `Ich ordne deinen Beitrag gerade …`
  - aktive Pipeline-Stufe `Verstehen`
- Dialog Intelligence, Handoff, Match-Kandidaten und weitere Systemtransparenz bleiben erhalten, liegen aber hinter `Details ansehen`
- Kandidaten bleiben Kandidaten:
  - Mehrthemen-Erkennung fuehrt nicht zu Auto-Split
  - Dossier-/Beteiligungs-/Review-Hinweise fuehren nicht zu Auto-Start
  - Assistenten-Vorschlaege bleiben Nutzerentscheidung

### 3. `/runden` und `/themen` behalten nur den kleinen Assistant-Dock

Geaendert:

- `apps/web/src/app/runden/RundenPublicSharingGuide.tsx`
- `apps/web/src/app/themen/page.tsx`
- `apps/web/src/components/voxy/VoxyFloatingDock.tsx`

Ergebnis:

- `/runden` und `/themen` behalten keinen zentralen Chat
- beide Surfaces teilen jetzt denselben kleinen Assistant-Dock als wiederkehrende Assistenzschicht:
  - bottom-right / mobile-bottom angedockt
  - reduzierte Groesse und visuelle Dominanz
  - kurze Guardrails statt eines zweiten grossen Workspaces
  - CTA `Chat öffnen` in Richtung `/create`
- Haupt-CTAs sprechen von `Assistenz` statt von `Voxy`, das Maskottchen bleibt aber als Figur erhalten
- der Uebergang vom Assistenten-Entwurf in Themen-/Debattenlogik bleibt bearbeitbar und ohne automatische Zusammenfuehrung

### 4. Contract-Sync fuer die Surface-Wahrheit

Geaendert:

- `apps/web/src/components/voxy/VoxyFloatingDock.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`

Ergebnis:

- die sichtbare Assistenten-Sprache wurde in den oeffentlichen Einstiegen zurueckgenommen, ohne das Maskottchen zu entfernen
- der kleine Floating-Dock bleibt reine UX-Fassade:
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

- `V3-UX-FINAL-CREATE-VOXY-COMPOSER-AND-SURFACE-CONSOLIDATION-01` bleibt `done`, die Evidence wurde fuer die PR-391-Remediation auf den tatsaechlichen Chat-Workspace-Zustand nachgezogen
- naechster operativer Schritt bleibt der reale manuelle Preview-Smoke auf den konsolidierten Surfaces

## Validierung

- `git diff --check`
- fokussierte Vitest-Suite fuer Create/Runden/Themen
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

Ergebnis dieser Remediation:

- fokussierte Create-Contracts: `49/49` Tests gruen
- Lint: gruen
- Typecheck: gruen
- Build: gruen

## Manuell zu pruefen

- `/create`
  - nicht mehr wie Formular + Analysewand
  - Pipeline, Struktur-Leiste, Chat-Thread und drei Themenkarten sofort sichtbar
  - primaere CTA-Hierarchie nach Themenwahl / Weiterentwicklung / Quellen / Speichern
  - Transparenz und Dialog Intelligence nur sekundär / einklappbar
- `/runden`
  - kein zentraler Chat
  - kleiner Assistant-Dock unten rechts
- `/themen`
  - kein zentraler Chat
  - kleiner Assistant-Dock unten rechts
