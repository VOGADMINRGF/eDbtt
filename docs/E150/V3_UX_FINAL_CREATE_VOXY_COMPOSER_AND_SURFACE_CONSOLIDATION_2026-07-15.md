# V3 UX Final Create Voxy Composer And Surface Consolidation 2026-07-15

## Scope

- Task: `V3-UX-FINAL-CREATE-VOXY-COMPOSER-AND-SURFACE-CONSOLIDATION-01`
- Branch: `fix/create-chat-native-smoke-direct-01`
- PR: `#391`
- Typ: finaler UX-Konsolidierungs-Slice ohne Runtime-, Provider-, Secret-, Notification- oder Publish-Aktivierung

## Ziel

`/create` soll wie ein moderner chat-nativer Workspace wirken: kurzer Einstieg, danach sofort sichtbarer Arbeitsdialog statt Formular + Analysewand, mit klarer Themenwahl, sichtbaren Themen und deep-on-demand Transparenz.

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
- die Shell nutzt jetzt sichtbar mehr Monitorbreite und Mindesthoehe; ChatThread, Composer und Footer sitzen in einer grossen durchgehenden Workspace-Maske statt in einer schmalen Mittelkarte
- der finale Finish-Pass vergroessert Shell-Breite auf eine breitere Desktop-Maske, vergroessert Typo, Pipeline und Struktur-Rail nochmals sichtbar und zieht den Chat-Thread staerker auf die Hauptbuehne
- Header und Footer wurden gleichzeitig reduziert, damit sie Orientierung bleiben und nicht wie eigene Zusatzmodule wirken
- der alte dominante Ober-Composer wurde zu einer eingebetteten `workspace_shell`-Composer-Bar im selben Shell-Panel reduziert
- Thread und Composer teilen jetzt dieselbe grosse Workspace-Karte; unterhalb haengt keine zweite Formular-Card mehr
- nach dem ersten Submit zeigt die untere Bar keinen duplizierten Ursprungstext mehr, sondern nur noch den Fortsetzungs-Composer
- die Fortsetzungs-Bar spricht jetzt neutraler (`Schreib weiter oder ergänze, was wichtig ist …`) statt wie ein zweites Formular
- die sichtbaren Workspace-Aktionen arbeiten jetzt auf echtem lokalem UI-State:
  - `Hauptthema wählen` markiert den gewaehlten Themenzweig sichtbar und setzt den naechsten Schritt im Rail fort
  - `Beitrag weiterentwickeln` aktiviert den Composer sichtbar als Anschluss-Editor
  - `Quellen ergänzen` bleibt lokal im Workspace und startet keinen externen Prüfpfad ohne weitere Bestätigung
  - `Entwurf speichern` bleibt review-first und ohne Auto-Publish
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
  - `Entwurf`
- die Pipeline nutzt kuerzere, ruhigere Lead-Texte und dezentere Verbindungen statt eines technischen Steppers
- direkt unter dieser Pipeline steht eine kompakte Struktur-Leiste fuer:
  - `Prioritäten`
  - `Themen`
  - `Offene Fragen`
  - `Nächster Schritt`
- die Struktur-Leiste zeigt fuer den naechsten Schritt jetzt einen echten Arbeitsimpuls wie `Beitrag prüfen` oder `Hauptthema wählen` statt nur einen generischen Statussatz
- im sichtbaren Hauptflow wurden die zusaetzlichen `offen`-/`neu`-Badges der Rail bewusst reduziert, damit die Orientierung ruhiger wirkt
- der eigentliche Dialog erscheint als Chat-Thread:
  - vor Submit mit einer echten Assistenz-Intro-Nachricht plus Beispielchips
  - nach Submit mit `Du`-Bubble, `Assistent`-Antwort und sofort sichtbaren Themenkarten
- erkannte Themen erscheinen sofort als drei sichtbare Branch-Cards statt tief im Scrollbereich
- die Branch-Map spricht oeffentlich nur noch von `Themen`, zeigt `aus deinem Beitrag erkannt` als Ursprungshinweis und vermeidet die alte technische `Themenzweige`-/`Themenäste`-Sprache im Hauptflow
- Fragen- und degraded-Fallback-Bloecke wurden farblich von dominanten gelb/braun-Warnflaechen auf ruhigere Workspace-Tones zurueckgenommen; `Einordnung erneut versuchen` bleibt nur in Details
- bei langsamer oder fehlgeschlagener Planner-Einordnung erscheinen sofort lokale Fallback-Themenkarten statt einer Retry-dominierten Warteflaeche:
  - `Verkehr`
  - `Sicherheit/Rechtsstaat`
  - `Kommunale Finanzen`
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
- der letzte PR-391-Follow-up schuetzt den bekannten Rahnsdorf/Kita/Querung/Haushalt-Smoke lokal mit civic-intuitiven Fallback-Branches (`Verkehrssicherheit`, `Kita-/Schulweg & Barrierefreiheit`, `Stadtplanung & Finanzierung`), reduziert die Branch-Card-Verschachtelung und deckt `Hauptthema wählen`, `Als Zweig parken`, `Beitrag weiterentwickeln`, `Quellen ergänzen`, `Entwurf speichern`, `Anlassraum vorbereiten` und `Details ansehen` per Interaction-Test ab
- naechster operativer Schritt bleibt der reale manuelle Preview-Smoke auf den konsolidierten Surfaces

## Validierung

- `git diff --check`
- fokussierte Vitest-Suite fuer Create/Runden/Themen plus neue Workspace-Interaktions-Tests
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

Ergebnis dieser Remediation:

- fokussierte Create-Contracts inkl. Workspace-Aktionen: `25/25` Tests gruen
- Lint: gruen
- Typecheck: gruen
- Build: gruen
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
