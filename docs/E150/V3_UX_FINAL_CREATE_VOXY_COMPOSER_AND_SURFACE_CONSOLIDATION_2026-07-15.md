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
- der abschliessende Density-/Hierarchy-Pass reduziert Microcopy, Uppercase-Badges und Card-in-Card-Verschachtelung zusaetzlich, damit der 1216px-Workspace nicht wie ein technisches Mini-Widget wirkt
- der finale Above-the-Fold-Fix macht den Startzustand phasenabhaengig: `CreateWorkspaceShell` kennt jetzt `initial`, `loading`, `result` und `continuation`, damit Assistant-Intro und Composer im ersten Viewport sichtbar bleiben
- im Initialzustand bleiben oberhalb der Falz bewusst nur ein kompakter Header (`Dein Beitrag im Workspace`), die kurze Assistenz-Nachricht und der Composer dominant; Shell-Pipeline und Struktur-Rail werden vor der ersten Eingabe nicht als eigene Leitmodule gezeigt
- Header und Footer wurden gleichzeitig reduziert, damit sie Orientierung bleiben und nicht wie eigene Zusatzmodule wirken
- der alte dominante Ober-Composer wurde zu einer eingebetteten `workspace_shell`-Composer-Bar im selben Shell-Panel reduziert
- Thread und Composer teilen jetzt dieselbe grosse Workspace-Karte; unterhalb haengt keine zweite Formular-Card mehr
- nach dem ersten Submit zeigt die untere Bar keinen duplizierten Ursprungstext mehr, sondern nur noch den Fortsetzungs-Composer
- die Fortsetzungs-Bar spricht jetzt neutraler (`Schreib weiter oder ergänze, was wichtig ist …`) statt wie ein zweites Formular
- die sichtbaren Workspace-Aktionen arbeiten jetzt auf echtem lokalem UI-State:
  - `Themenstruktur bestätigen` markiert den gewaehlten Themenzweig sichtbar und setzt den naechsten Schritt im Rail fort
  - `Aussage schärfen` aktiviert den Composer sichtbar als Anschluss-Editor
  - `Quelle ergänzen` bleibt lokal im Workspace und startet keinen externen Prüfpfad ohne weitere Bestätigung
  - `Entwurf speichern` bleibt review-first und ohne Auto-Publish
- das Transparenzpanel bleibt erhalten, wird initial aber nicht mehr als sichtbarer Block unter dem Workspace gerendert, sondern erst nach explizitem Oeffnen von `Details & Transparenz`

### 2. Nach dem Start zeigt `/create` eine echte Pipeline statt einer Analysewand

Geaendert:

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`

Ergebnis:

- nach der ersten Eingabe bleibt genau eine kompakte Workspace-Pipeline mit fuenf Schritten sichtbar:
  - `1 · Beitrag aufgenommen`
  - `2 · Themen erkannt`
  - `3 · Entscheidung offen`
  - `4 · Quellen optional`
  - `5 · Entwurf`
- diese Pipeline bleibt im Workspace und wird im Chat nicht noch einmal als kompletter Stepper wiederholt; Chat-Events bleiben nummeriert, aber ohne Pipeline-Duplikat
- `Deine Struktur` erscheint im Hauptflow als kompakte In-Chat-Zusammenfassung bei den Themenkarten statt als dominante eigene Rail ueber dem Chat
- die In-Chat-Strukturzusammenfassung zeigt weiterhin die fuer den naechsten Schritt relevanten Signale wie Prioritaeten, Themen, offene Fragen und den aktuellen Arbeitsimpuls
- der eigentliche Dialog erscheint als Chat-Thread:
  - vor Submit mit einer echten Assistenz-Intro-Nachricht plus Beispielchips
  - nach Submit mit `Du`-Bubble, `Assistent`-Antwort und sofort sichtbaren Themenkarten
- im Initialzustand bleibt der Thread bewusst kuerzer und rutscht naeher an die Composer-Bar; die groessere scrollbare Thread-Hoehe wird erst fuer Loading-, Result- und Continuation-Zustaende aktiviert
- `Details & Transparenz` bleibt im normalen Ergebniszustand standardmaessig geschlossen; `Einordnung erneut versuchen` taucht erst nach explizitem Oeffnen der Details auf und bleibt damit sichtbar sekundär
- der letzte Ergebnis-Pass kuerzt den sichtbaren Arbeitsdialog nochmals: im Hauptflow bleiben nach der Analyse nur noch die kurze Assistenz-Zusammenfassung, die drei Themenkarten und wenige direkte Folgeaktionen; Fragen-, Quellen- und Runtime-/Handoff-Erklaerungen liegen nur noch hinter Details
- erkannte Themen erscheinen sofort als drei sichtbare Branch-Cards statt tief im Scrollbereich
- fuer den aktuellen Bus-/Hauptstrasse-Smoke werden die Themen kontextbezogen aus dem Beitrag abgeleitet statt aus alten Preview-/Statisch-Mappings:
  - `ÖPNV und Mobilität`
  - `Straßenraum und Radverkehr`
  - `Parkraum und kommunale Planung`
  - optional als viertes Thema `Pendler- und Anschlussmobilität`
- wenn vier Themen erkannt werden, bleibt die Darstellung konsistent: `Ich habe 4 Themen erkannt. 3 zeige ich dir kompakt.`, drei sichtbare Karten plus CTA `Weiteres Thema anzeigen`
- fuer den bekannten Rahnsdorf/Kita/Querung/Haushalt-Smoke bleiben die lokalen Fallback-Kandidaten civic-intuitiv:
  - `Verkehrssicherheit`
  - `Kita-/Schulweg & Barrierefreiheit`
  - `Stadtplanung & Finanzierung`
- die Branch-Map spricht oeffentlich nur noch von `Themen`, zeigt `aus deinem Beitrag erkannt` als Ursprungshinweis und vermeidet die alte technische `Themenzweige`-/`Themenäste`-Sprache im Hauptflow
- Fragen- und degraded-Fallback-Bloecke wurden farblich von dominanten gelb/braun-Warnflaechen auf ruhigere Workspace-Tones zurueckgenommen; `Einordnung erneut versuchen` bleibt nur in Details
- bei langsamer oder fehlgeschlagener Planner-Einordnung erscheinen sofort diese lokalen Fallback-Themenkarten statt einer Retry-dominierten Warteflaeche
- der Hauptflow fuehrt von Themenwahl zu Quellen- und Entwurfsarbeit, nicht zu einer Retry-/Analyse-Primaraktion
- `Einordnung erneut versuchen` ist nicht mehr primaerer CTA
- `Einordnung erneut versuchen` liegt im degraded Pfad nur noch in `Details ansehen`
- wenn mehr Themen oder ein Link erkannt werden, stellt der Chat eine bewusste Folgefrage zur erweiterten Themenvorschau bzw. Link-Auswertung; keine externe Suche oder Deep-Research startet dabei automatisch
- die oeffentliche Kontingentfrage bleibt frei von Provider-/Runtime-/Policy-Sprache und nennt nur noch `Recherche-Kontingent`, z. B. `Die vollständige Quellenprüfung nutzt 1 Recherche-Kontingent.`
- vor der Themenbestaetigung gibt es genau einen primaeren CTA `Themenstruktur bestätigen`; `Themen ändern` und `Weiteres Thema anzeigen` bleiben sekundär
- `Aussage schärfen`, `Quelle ergänzen`, `Entwurf speichern` und `Anlassraum vorbereiten` erscheinen erst nach der Themenbestaetigung als naechste Phase
- der Composer folgt jetzt der Arbeitsphase:
  - vor Themenbestaetigung: `Möchtest du ein Thema ändern, ergänzen oder zusammenführen?`
  - nach Themenbestaetigung: `Welche Aussage möchtest du schärfen?`
  - im Quellenmodus: `Füge eine Quelle, einen Beschluss oder ein Beispiel hinzu …`
- waehrend die Einordnung laeuft, erscheint sofort ein sichtbarer Chat-Zwischenzustand:
  - User-Bubble mit dem Beitrag
  - Assistant-Bubble `Ich ordne deinen Beitrag gerade …`
  - aktive Pipeline-Stufe `Verstehen`
- Dialog Intelligence, Handoff, Match-Kandidaten und weitere Systemtransparenz bleiben erhalten, liegen aber hinter genau einem Accordion `Details & Transparenz`
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
- oeffentliche Research-/Provider-Sprache folgt fuer PR #391 jetzt zusaetzlich `docs/E150/V3_AI_ORCHESTRATION_AND_RESEARCH_CREDIT_POLICY_2026-07-18.md`
- der letzte PR-391-Follow-up schuetzt den bekannten Rahnsdorf/Kita/Querung/Haushalt-Smoke lokal mit civic-intuitiven Fallback-Branches (`Verkehrssicherheit`, `Kita-/Schulweg & Barrierefreiheit`, `Stadtplanung & Finanzierung`), reduziert die Branch-Card-Verschachtelung, verlegt die sichtbare Themenwahl vollstaendig auf die BranchCards und deckt `Themenstruktur bestätigen`, `Thema parken`, `Aussage schärfen`, `Quelle ergänzen`, `Entwurf speichern`, `Anlassraum vorbereiten` und `Details & Transparenz` per Interaction-Test ab
- der abschliessende Layout-Fix hebt `/create` aus der schmalen Mittelspaltenwirkung: der Workspace-Host laeuft jetzt ohne enge Public-Shell-Max-Width, die Shell markiert sich ueber `data-create-workspace-size="wide-screen"` und nutzt `max-w-[min(92vw,96rem)]`, waehrend Thread-Bubbles und BranchCards sichtbar mehr Monitorbreite ausnutzen
- der letzte UI-Pass haelt dieselben funktionalen Pfade bei, vergroessert aber Chat-Bubbles, Rail-Karten, BranchCards und Composer-Bedienelemente sichtbar und entschlackt die sichtbare Badge-/Pill-Dichte
- Abschluss-Pass am 2026-07-17: initiale Assistant-Bubble und Pipeline sprechen oeffentlich neutraler (`createGuideLight`, `Assistenzpfad` statt `miniAvatar`/`Voxy Pilotpfad`), CTA-Copy bleibt entlang von UI und Tests konsistent bei `Themenstruktur bestätigen`, `Aussage schärfen` und `Quelle ergänzen`; zusaetzlich wurden Kontingentfrage und Quellenpruefungs-Wording auf die generische KI-Orchester-/Recherche-Kontingent-Sprache umgestellt
- Abschluss-Pass am 2026-07-18: die Pipeline bleibt nach Submit genau einmal als kompakte Workspace-Leiste sichtbar und wird im Chat nicht dupliziert; der Bus-/Hauptstrasse-Smoke mappt jetzt stabil auf `ÖPNV und Mobilität`, `Straßenraum und Radverkehr`, `Parkraum und kommunale Planung` plus optional `Pendler- und Anschlussmobilität`; `4 erkannt / 3 kompakt sichtbar / 1 weiteres Thema` bleibt ueber Text, Karten und CTA konsistent; oeffentliche Provider-/Runtime-/Policy-Sprache verschwindet aus dem Hauptflow; vor der Themenbestaetigung bleibt `Themenstruktur bestätigen` der einzige primaere CTA; Composer-Placeholder und `Details & Transparenz` folgen sauber der Arbeitsphase
- Follow-up am 2026-07-18 fuer denselben PR-391-Slice: die interne Themeninventur bleibt jetzt auch fuer laengere Texte und Links vollstaendig und wird nur in der UI auf drei Startkarten verdichtet; `+1` Ueberlauf nutzt explizit `Weiteres Thema anzeigen`, waehrend groessere Inventuren `Alle Themen öffnen` behalten. Persistente Arbeitsstaende (`topic_candidate`, `question_candidate`, `source_list`, `internal_note`, `community_candidate`, `deferred_work`, `parked_topic`) werden ueber `/api/create/workstates` gespeichert und im Account unter `Meine Arbeitsstände` in den Gruppen `Gespeicherte Beiträge`, `Vorgemerkte Themen`, `Eigene Fragen`, `Geparkte Themen`, `Quellenlisten`, `Noch nicht veröffentlichte Entwürfe` sowie admin-only `Interne Arbeitsstände` sichtbar. Fuer Linkanalyse bleibt `Linkinhalt prüfen` eine bewusste Nutzeraktion ohne Auto-Load; Header, Chat und Workspace nutzen in `/create` jetzt konsistent das hochaufgeloeste kanonische `presenting`-Asset statt hochskalierter `createGuideLight`-Thumbnails.
- Runtime-Hardening am 2026-07-18: der alte Candidate-Preview-/Transparency-Fallback baut ohne validierte semantische Meta keinen Create-Handoff mehr; technische Zustände wie `link_detected`, `entitlement_required`, `fetch_failed`, `ai_failed` und selbst validierte Dokumentdiagnosen ohne Planner-Meta bleiben ehrlich bei `analysis_unavailable` statt Claims, Handoffs oder Graph-Matches zu behaupten. Gleichzeitig bleiben die sichtbaren Start-CTAs auf `/start` reine direkte Links ohne vorgelagerte Analyse oder Pending-Blocker, und die `/create`-Avatar-Surfaces sind erneut per Contract auf das kanonische hochaufgeloeste `presenting`-Asset mit `object-contain` fixiert.
- Dokumentthemen-Fix am 2026-07-18 im selben PR-391-Slice: validierte Dokumentläufe nutzen `documentAnalysis.topics` jetzt als einzige kanonische Themenquelle; inkonsistente `topicCount`-Antworten werden auf die real vorhandenen Topic-Objekte normalisiert; `Themenübersicht öffnen` zeigt danach unmittelbar alle validierten Dokumentthemen statt einer zweiten 3er-Vorschau; Rail, Diagnose, Themenüberschrift und Kartenzaehlung bleiben damit konsistent. Die Branch-Map skaliert fuer Dokumente responsiv mit `1 / 2 / 3` Spalten, die Fokus-/Park-Aktionen tragen den jeweiligen Themennamen im Accessible Name, und die Dokumentkarten wiederholen keine `0 Claims`-/`0 Vorhaben`-Chips im Hauptflow.
- naechster operativer Schritt bleibt der reale manuelle Preview-Smoke auf den konsolidierten Surfaces

## Validierung

- `git diff --check`
- fokussierte Vitest-Suite fuer Create/Runden/Themen plus neue Workspace-Interaktions-Tests
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

Ergebnis dieser Remediation:

- fokussierte Create-Contracts inkl. Workspace-Aktionen: `29/29` Tests gruen
- fokussierte Dokumentthemen-/Workspace-Regressionssuite: `30/30` Tests gruen
- fokussierte Create-/Account-/Auth-/Asset-Suite fuer den Follow-up-Slice: `57/57` Tests gruen
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
