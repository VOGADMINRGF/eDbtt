# CREATE-VOXY-SUPPORT-RECOVERY-01 — Closure Evidence

Stand: 2026-07-29

## Root Cause

Der bisherige `/create`-Planner besaß zwei OpenAI-Modellkandidaten, wechselte aber nur
bei `model_not_found` zwischen diesen Modellen. Bei Timeout, Rate Limit,
Providerfehler, ungültigem JSON oder nicht ausreichender Antwortqualität endete der
Lauf direkt im technischen lokalen Fallback. Ein alternativer Provider wurde nicht
aufgerufen.

Der API-Pfad gab diesen degradierten Zustand ohne persistente Support-Übergabe
zurück. Im Client wurde der Beitrag erst durch spätere, ausdrücklich ausgelöste
Save-/Review-Aktionen serverseitig gespeichert. Damit waren die Zusagen „gespeichert“
und „an IT übergeben“ bei einem frühen Analysefehler nicht belastbar. Der
React-State `isStarting` war außerdem kein hinreichender synchroner Schutz gegen
zwei sehr schnell ausgelöste Runs.

Die Startoberfläche führte Voxy noch nicht konsistent: Ein generischer
„Assistent“-Einstieg, ein zusätzlicher oberer Workspace-Header und die frühe
Progress-Pipeline konkurrierten mit dem eigentlichen Chat.

## Umsetzung

- Vor jedem ersten Text-/Link-Analyselauf wird der Beitrag über den kanonischen,
  authentifizierten `/api/create/save`-Pfad als Server-Draft gesichert. Der
  Persistenzschritt setzt ausdrücklich `autoPublish: false`.
- Eine synchrone In-Flight-Referenz verhindert parallele Start-, Retry- und
  Linkanalyse-Runs. Jeder bewusste neue Run erhält eine neue Korrelations-ID und
  führt die gespeicherte Draft-ID mit.
- Nach einem fehlgeschlagenen OpenAI-Run wird höchstens ein weiterer, in der
  zentralen Runtime-Policy aktivierter Provider (`anthropic` oder `mistral`)
  versucht. Es gibt keine unbeschränkte Retry-Kaskade; `providerAttemptCount`
  dokumentiert höchstens zwei Provider-Versuche.
- Validierte Ergebnisse der drei erlaubten Planner-Provider durchlaufen denselben
  Qualitäts-, Provenance-, Handoff- und No-Mutation-Vertrag.
- Ein endgültig fehlgeschlagener Run erzeugt idempotent anhand von
  Korrelation, Phase und Fehlercode höchstens ein persistentes Ticket. Gespeichert
  werden Nutzer-/anonyme Session-Zuordnung, Route, Phase, Korrelation/Trace,
  normalisierte technische Diagnose, Draft-ID, Status und Zeitstempel — nicht der
  Beitragsinhalt.
- Eine Ticketnummer und IT-Übergabe werden nur nach erfolgreicher Persistenz
  angezeigt. Scheitert die Übergabe selbst, sieht der Nutzer nur eine ehrliche
  technische Referenz.
- Tickets sind nutzergebunden im Account aufrufbar. Der 2FA-geschützte
  Admin-API-Pfad kann Status lesen und ändern. Der Übergang auf `resolved` erzeugt
  eine persistente Account-Nachricht und versucht zusätzlich die vorhandene
  Mail-Infrastruktur.
- Voxy ist im Start- und Fehlerchat konsistent sichtbar. Die Begrüßung verwendet
  nur einen plausiblen Vornamen; E-Mail-Adressen, technische Werte und ungeeignete
  Namen fallen auf „Hallo Nachbar,“ zurück. Der obere Doppel-Header und die
  initiale Pipeline sind entfernt; `Kein Auto-Publish` bleibt direkt am Composer.

## Preflight und Kollisionsprüfung

- Worktree und Branch waren bereits korrekt:
  `fix/create-voxy-support-recovery-01`.
- Der Worktree war vor Beginn sauber und auf demselben Ausgangs-Commit wie
  `origin/main`.
- Offene PRs wurden auf Quellkollisionen geprüft. Es gab keine konkurrierende
  `/create`-/Support-Implementierung; nur `docs/E150/OpenTasks.md` wird auch von
  einem anderen offenen PR berührt und muss beim Merge normal aufgelöst werden.

## Verifikation

- `pnpm -C apps/web exec vitest run ...`: 12 Dateien, 51 Tests, alle grün.
- `pnpm -w run typecheck`: grün.
- Fokussierter ESLint-Lauf über alle geänderten Runtime-Dateien: grün.
- `pnpm -C apps/web run build` mit der repo-kanonischen
  `apps/web/.env.example`-Konfiguration: grün; 322 statische Seiten erzeugt.
- `git diff --check`: grün.

Der lokale Lauf nutzte Node `25.9.0`, obwohl das Repository Node `20.x` verlangt;
pnpm meldete dies als Engine-Warnung. Der Build selbst war erfolgreich.

## Bewusst offen

- Kein echter externer Provider-, Mongo- oder SMTP-Produktions-Smoke wurde in
  diesem Slice ausgeführt.
- Desktop-/Mobile-Browser-Sichtprüfung und die reale Zustellung einer
  Resolution-Mail bleiben Bestandteil der produktionsnahen Abnahme.
- Keine automatische Veröffentlichung, kein Auto-Dossier, kein Auto-Anlassraum,
  kein Graph-Write und kein DeepSearch wurden ergänzt.
