# CREATE-VOXY-SUPPORT-RECOVERY-01 — Review Evidence

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

## Ticket- und Benachrichtigungsfluss

1. Ein endgültig fehlgeschlagener Create-Run übergibt ausschließlich normalisierte
   technische Metadaten an den Ticket-Service.
2. Der Service dedupliziert den Fall über seinen Failure-Fingerprint und liefert
   erst nach erfolgreicher Persistenz Ticketnummer und Account-Verknüpfung zurück.
3. Voxy bestätigt eine IT-Übergabe nur bei diesem erfolgreichen Handoff. Andernfalls
   bleibt die Oberfläche beim ehrlichen technischen Fehlerzustand.
4. Der Nutzer kann sein Ticket ausschließlich über die eigene Account-Zuordnung
   lesen. Der administrative Statuspfad verlangt weiterhin 2FA.
5. Der vorhandene Statuswechsel auf `resolved` erzeugt eine persistente
   Account-Nachricht und versucht danach zusätzlich die vorhandene E-Mail-Zustellung.
   Die konkurrierende Resolution-/Mail-Idempotenz ist mit diesem Review-Follow-up
   ausdrücklich nicht abgeschlossen und bleibt bis zum neuen Delta-Mailvertrag offen.

## Datenschutzgrenzen

- Der Ticketdatensatz enthält keinen Beitrags-, Link- oder Dokumentinhalt und keine
  Prompt-/Completion-Nutzlast.
- Gespeichert werden nur Nutzer- oder anonyme Session-Zuordnung, Route, Phase,
  Korrelation/Trace, normalisierte technische Diagnose, optionale Draft-ID,
  Status und Zeitstempel.
- Die Account-Leseoperation ist an den angemeldeten Nutzer gebunden; fremde oder
  nicht mehr verfügbare Tickets werden nicht offengelegt.
- Voxy leitet nur aus einem plausiblen Anzeigenamen einen Vornamen ab. E-Mail-
  Adressen und technische Identifikatoren werden nicht als Anrede verwendet.
- Die kanonische Draft-Sicherung setzt `autoPublish: false`; der Recovery-Pfad
  erzeugt weder Veröffentlichung noch Dossier-, Anlassraum- oder Graph-Schreibzugriff.

## Preflight und Kollisionsprüfung

- Worktree und Branch
  `fix/create-voxy-support-recovery-01` waren vor diesem Codex-Lauf bereits
  manuell aus dem damaligen `origin/main` erstellt. Es wurde deshalb kein
  nachträglicher erfolgreicher Branch-Preflight behauptet und kein weiterer
  Branch oder Worktree angelegt.
- Der bestehende Draft-PR `#529` und sein bereits gepushter Implementierungscommit
  wurden als Ausgangsstand übernommen.
- Offene PRs wurden auf Datei- und Scope-Kollisionen geprüft. Es gab keine zweite
  `/create`-/Support-Implementierung. Mehrere offene PRs berühren ausschließlich
  zusätzlich `docs/E150/OpenTasks.md`; diese SSOT-Reihenfolge ist auf GitHub
  dokumentiert.
- Gemäß dem verbindlichen Kommentar in PR `#529` wurde der aktuelle
  `origin/main` in denselben Branch integriert. Dabei wurden der gemergte
  Auth-Abschluss aus PR `#519` und der Anlassraum-/Runden-Bootstrap aus PR
  `#532` erhalten; Inhalte aus PR `#520` und `#527` wurden nicht vorweggenommen.

## Verifikation und Regressionskorrektur

- Der erste vollständige GitHub-Contract-Lauf des Draft-PRs war nicht grün:
  Zwei bestehende Create-Interaktionstests belegten, dass der neue
  Voxy-Tickettext die sicheren Zustände `Analyse blockiert` sowie die
  Fetch-/AI-Fehlerdiagnose verdrängte. Die Fehlerblase zeigt nun Ticket-Handoff
  und den datensparsamen fail-closed Analysezustand gemeinsam.
- Fokussierte lokale Revalidierung nach dem Main-Abgleich:
  `19` Testdateien / `129` Tests grün.
- Die Account-Ticket- und Resolution-Flächen folgen nun ebenfalls der vorhandenen
  `uiLocale`-Logik für Deutsch und Englisch.
- Fokussierte Create-/Orchestrierungs-/Support-Matrix:
  `19` Testdateien / `129` Tests grün.
- Gezielter Regressionslauf nach der DE-/EN-Account-Korrektur:
  `3` Testdateien / `17` Tests grün.
- Web-PR-Critical-Guardrails:
  `17` Testdateien / `63` Tests grün.
- Production-Guardrails:
  `12` Testdateien / `36` Tests grün.
- `pnpm -C apps/web run typecheck`: grün.
- `pnpm -C apps/web run lint`: grün.
- `node scripts/ci/check-web-critical-guardrails.mjs`: grün.
- `pnpm -C apps/web run build`: Der erste secret-freie Lauf kompilierte und
  typprüfte erfolgreich, stoppte aber erwartungsgemäß am Pflicht-ENV-Gate bei der
  Page-Data-Ermittlung. Der Abschlusslauf mit der kanonischen
  `apps/web/.env.example`-Konfiguration ist grün.
- `git diff --check`: grün.

Der lokale Lauf nutzt Node `25.9.0`, obwohl das Repository Node `20.x` verlangt;
pnpm meldet dies als Engine-Warnung. GitHub CI verwendet die kanonische
Node-Version `20.19.0`.

## Nicht überlappender Review-Follow-up — 2026-07-30

- Die zentrale Planner-Provider-Identität akzeptiert validierte Ergebnisse von
  `openai`, `anthropic` und `mistral` nur dann, wenn `source`, `plannerSource`
  und `plannerProvider` auf denselben Provider aus der kanonischen Allowlist
  zeigen. Die Dialog-Bridge enthält keinen OpenAI-only-Check mehr.
- Der vollständige technische Fehlerchat ist für Deutsch und Englisch
  sprachrein; unbekannte Sprachen fallen kontrolliert auf Deutsch zurück. Der
  Nutzerabsender lautet im englischen Chat `You` statt `Du`. Rohe
  Providerfehler werden weiterhin nicht gerendert.
- Planner- und Candidate-Trace führen den tatsächlich eingesetzten oder zuletzt
  versuchten Provider, den tatsächlichen Modellnamen, die Provider-Versuchsnummer
  und den Ergebnisstatus. Prompts, Completions und Secrets sind nicht Teil
  dieser Metadaten.
- Fokussierte Provider-/Planner-/Dialog-/Sprach-/Provenienzmatrix:
  `6` Testdateien / `37` Tests grün.
- Nicht konkurrierende Create-/Support-Gesamtmatrix:
  `19` Testdateien / `105` Tests grün; der eine Resolution-/Mail-Test wurde
  bewusst übersprungen und nicht als grün gewertet.
- Repo-kanonischer Focused-Create-CI-Satz:
  `10` Testdateien / `85` Tests grün.
- Web-PR-Critical-Guardrails:
  `17` Testdateien / `63` Tests grün.
- Production-Guardrails:
  `12` Testdateien / `36` Tests grün.
- Typecheck, Lint, Critical-Guardrail-Skript und `git diff --check`: grün.
- Build mit den eingecheckten Werten aus `apps/web/.env.example`: grün;
  `322/322` statische Seiten wurden erzeugt. Es wurden keine Preview- oder
  Production-Secrets gelesen.
- Die veraltete Candidate-Preview-Fixture führt nun die bereits kanonisch
  erforderliche validierte `meta.analysis.state` und die vollständige
  Provideridentität. Die Suite
  `create-candidate-preview.contract.test.ts` ist mit `3/3` Tests grün.
- Das konkurrierende Resolution-/Mail-Idempotenz-Finding wurde weder im Code
  noch in Tests oder Mail-Evidence verändert und bleibt bis zum neuen
  Delta-Mailvertrag offen.

## Nicht überlappende Härtung — 2026-07-30

- Das externe Planner-Budget zählt jeden tatsächlichen Modellaufruf. Zwei
  OpenAI-Modellkandidaten verbrauchen damit beide verfügbaren Plätze; danach
  startet kein Anthropic-/Mistral-Drittversuch. Alternativprovider teilen
  dasselbe harte Zwei-Aufruf-Budget.
- Die zentrale Provideridentität validiert gemeinsam `source`,
  `plannerSource`, `plannerProvider`, `providerPlan.plannerProvider`,
  `plannerDebug`, Modell, Versuch und die vollständige Attempt-Provenienz.
  Sämtliche Create-, Dialog-, Candidate-, Connection- und Trace-Consumer
  behandeln nur diesen vollständigen Allowlist-Vertrag als validierten
  Providererfolg.
- Planner-Ergebnisse enthalten auch in Entwicklung und Test keine rohen
  Providerfehler, Prompts oder Completions mehr. Persistiert beziehungsweise
  serialisiert werden nur normalisierte Fehlercodes sowie
  Provider-/Modell-/Versuchs-/Status-, Längen- und Hash-Metadaten.
- `/api/create/intelligent-followup` verwendet vor dem Plannerlauf einen
  persistenten Mongo-Claim mit eindeutigem Schlüssel aus verifiziertem Nutzer
  oder serverseitig verifizierter anonymer Session, Draft, Korrelation und
  Orchestrierungstyp. Parallele Requests teilen Ergebnis und Ticket-Handoff.
  Fehlgeschlagene Claims vor dem externen Start sind wiederholbar; abgelaufene
  Claims nach markiertem externem Start werden ohne zweiten Provideraufruf in
  einen sichtbaren technischen Fallback überführt.
- Anonyme Create-Sessions werden serverseitig persistiert und über ein
  signiertes, `HttpOnly`-Cookie gebunden. Clientgewählte oder manipulierte
  Session-IDs werden nicht akzeptiert. Support-Tickets verlangen immer genau
  eine Nutzer- oder anonyme Session-Bindung; Gasttickets erzeugen keinen
  Account-Link und können nach einem späteren Login nicht übernommen werden.
- Fokussierte Provider-/Planner-/Dialog-/Provenienz-/Single-Flight-Matrix:
  `12` Testdateien / `79` Tests grün.
- Nicht konkurrierende Create-/Support-Gesamtmatrix:
  `19` eindeutige Testdateien / `120` Tests grün. Die zwei vorhandenen
  Resolution-/Mail-Tests wurden ausdrücklich übersprungen und nicht als grün
  gewertet.
- Candidate-Preview-Baseline: `1` Testdatei / `3` Tests grün.
- Web-PR-Critical-Guardrails:
  `17` Testdateien / `63` Tests grün.
- Production-Guardrails:
  `12` Testdateien / `36` Tests grün.
- Typecheck, Lint, Critical-Guardrail-Skript und `git diff --check`: grün.
- Build in einer bereinigten Umgebung ausschließlich mit der eingecheckten
  `apps/web/.env.example`-Konfiguration: grün; `322/322` statische Seiten
  wurden erzeugt. Preview- oder Production-Secrets wurden nicht gelesen.
- Ein zusätzlicher explorativer Lauf enthält vier sachfremde rote
  Heuristik-Assertions in
  `create-planner-complex-civic-input.contract.test.ts`,
  `create-planner-no-domain-heuristic-expansion.contract.test.ts`,
  `create-graph-match-after-planner.contract.test.ts` und
  `create-connection-suggestions.no-domain-fallback.contract.test.ts`.
  Diese Testdateien sind bytegleich zu `origin/main` und erwarten semantische
  Heuristikdaten, obwohl der kanonische Main-Planner bereits den technischen
  Fallback liefert. Sie wurden nicht sachfremd umgeschrieben und sind in keiner
  grünen Matrix enthalten.
- `docs/E150/OpenTasks.md` bleibt in diesem Follow-up unverändert. Das
  Resolution-/Mail-Idempotenz-Finding bleibt bis zum neuen Delta-Mailvertrag
  ausdrücklich offen.

## Geänderte Dateien

- Create-UI und Draft-Handoff:
  `apps/web/src/app/create/CreateClient.tsx`,
  `apps/web/src/features/create/CreateVisualFollowup.tsx`,
  `apps/web/src/features/create/CreateWorkspaceShell.tsx` und die betroffenen
  Preview-/Connection-/Dialog-Contracts unter
  `apps/web/src/features/create/`.
- Orchestrierung und Provider-Grenzen:
  `apps/web/src/app/api/create/intelligent-followup/route.ts`,
  `apps/web/src/app/api/create/link-analysis/route.ts`,
  `apps/web/src/features/create/createPlanner.ts`,
  `apps/web/src/features/create/createPlannerProviderContract.ts`,
  `apps/web/src/features/create/intelligentFollowup.ts`,
  `apps/web/src/features/create/intelligentFollowupContract.ts`,
  `apps/web/src/features/create/aiOrchestrationProvenanceTrace.ts` und
  `apps/web/src/features/agenticRuntime/agenticCivicE2EPilotContract.ts`.
- Support, Account und Admin:
  `apps/web/src/features/support/createSupportTicketContract.ts`,
  `apps/web/src/features/support/createSupportTickets.ts`,
  `apps/web/src/app/api/admin/support-tickets/[ticketNumber]/route.ts`,
  `apps/web/src/app/account/CreateSupportNotifications.tsx`,
  `apps/web/src/app/account/CreateSupportTicketAccountCard.tsx` und
  `apps/web/src/app/account/page.tsx`.
- Tests:
  die zugehörigen Create-, Planner-, Route-, Support-, Admin- und Voxy-Contracts
  unter `apps/web/tests/`.
- SSOT und Evidenz:
  `docs/E150/OpenTasks.md` und dieses Dokument.

## Bekannte Restpunkte

- Kein echter externer Provider-, Mongo- oder SMTP-Produktions-Smoke wurde in
  diesem Slice ausgeführt.
- Desktop-/Mobile-Browser-Sichtprüfung und die reale Zustellung einer
  Resolution-Mail bleiben Bestandteil der produktionsnahen Abnahme.
- Keine automatische Veröffentlichung, kein Auto-Dossier, kein Auto-Anlassraum,
  kein Graph-Write und kein DeepSearch wurden ergänzt.
