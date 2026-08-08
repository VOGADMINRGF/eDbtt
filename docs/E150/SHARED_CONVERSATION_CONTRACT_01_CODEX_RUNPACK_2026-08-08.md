# SHARED-CONVERSATION-CONTRACT-01 — Codex Run-Pack

Stand: 2026-08-08

Bezug: Issue #604 `SHARED-CONVERSATION-CORE-01`, gemergter Ist-Audit `SHARED-CONVERSATION-INVENTORY-01`

## Zweck

Dieser Run-Pack definiert ausschließlich den nächsten kleinen Contract-/Fixture-Slice für den gemeinsamen, produktneutralen Conversation-Kern von eDebatte und VoiceOpenGov. Er aktiviert keine neue Chat-Runtime, keine neue Persistenz, keine neue API, keine UI und keinen VoiceOpenGov-spezifischen Messaging-Kern.

`docs/E150/OpenTasks.md` bleibt alleinige operative SSOT. Dieser Run-Pack ersetzt weder die verlustfreie OpenTasks-Serialisierung noch den taskbezogenen Preflight.

## Verbindlicher Start-Gate

Vor Produkt- oder Runtimecode auf sauberem aktuellem `main`:

```bash
node scripts/codex-task-preflight.mjs SHARED-CONVERSATION-CONTRACT-01
```

Nur wenn der Preflight nach kanonischer OpenTasks-Serialisierung nachweislich liefert:

```text
status: codex_ready
executable: true
branchCreationAllowed: true
```

darf exakt ein Implementierungsbranch entstehen. Existiert bereits ein Branch/PR, wird ausschließlich dieser wiederverwendet.

## Bestätigte Wiederverwendung aus dem Ist-Audit

Nicht parallel neu bauen:

- `apps/web/src/lib/social/relationshipState.ts` als bestehende Direct-Messaging-Eligibility;
- `apps/web/src/app/api/account/social-thread/route.ts` und `social_messages` als bestehende Direct-Message-Wahrheit;
- `apps/web/src/features/community/groupSurface.ts` für Topic-/Region-/Dossier-Origin-Kontext;
- vorhandene Dialog-/Create-Handoff-Flächen;
- bestehende Unified Review Queue;
- vorhandene i18n-/Translation-Verträge;
- bestehende angrenzende Contract-/Route-/Review-Tests.

Der Slice darf keine zweite Message-Collection, keine zweite Review-Queue und keine zweite Produkt-SSOT einführen.

## Erlaubter Implementierungsscope

### Typed `Conversation`

Mindestens:

- stabile `conversationId`;
- `scope`: `direct | group | topic | regional | project`;
- kanonische Origin-Referenz statt kopierter Domänenobjekte;
- Participant-/Membership-Policy als Contract;
- Visibility-Policy als Contract;
- Lifecycle: `active | read_only | archived | closed`;
- Retention-Policy als Contract;
- Moderation-Policy als Contract;
- ausdrücklich kein Repräsentativitäts-, Wahrheits- oder Publishstatus.

### Typed `Message`

Mindestens:

- stabile `messageId`;
- `conversationId`;
- serverseitige Actor-/Author-Referenz;
- serverseitiger `createdAt`;
- Edit-/Delete-Lifecycle nur als Contractzustand;
- keine clientseitig behauptete Autorität, Rolle, Public-, Claim- oder Publishwahrheit.

### Serverseitige Capability-Matrix

Mindestens deterministisch ableiten:

- `canRead`;
- `canPost`;
- `canReply`;
- `canEditOwn`;
- `canDeleteOwn`;
- `canModerate`;
- `canInvite`;
- `canRequestHandoff` ausschließlich als bewusster, später reviewgebundener Übergang.

Capability-Ergebnisse dürfen nicht aus ungeprüften Requestfeldern oder UI-Zuständen übernommen werden.

## Pflicht-Fixtures

Positive/strukturierende Fixtures:

1. bestätigte Direct-Conversation zwischen zwei messaging-berechtigten Actors;
2. Group-Conversation mit expliziter Participant-Policy;
3. Topic-Conversation mit kanonischer Topic-Origin-Referenz;
4. Regional-Conversation mit Region-Origin ohne kopiertes Regionsobjekt;
5. Project-Conversation mit begrenzter Visibility;
6. `read_only` blockiert neue Nachrichten, erlaubt aber berechtigtes Lesen;
7. `archived` und `closed` bleiben deterministisch getrennt;
8. expliziter Handoff-Request bleibt Kandidat und wird nie direkt öffentlich.

Negative Gegenproben:

1. fremder/nicht eingeladener Actor darf nicht lesen oder posten;
2. blockierter Actor verliert Messaging-Capability fail-closed;
3. ausgetretener Participant behält keine implizite Post-Berechtigung;
4. clientseitig gesetzte Actor-/Moderatorrolle wird ignoriert;
5. Direct-ID darf nicht als Group-/Regional-ID umgedeutet werden;
6. Origin-Mismatch fail-closed;
7. gelöschte/geschlossene Conversation erzeugt keinen Public-/Claim-Status;
8. fehlende Policy-/Origin-Daten führen zu `deny/review_required`, nicht zu permissivem Fallback;
9. Auto-Handoff, Auto-Publish und Auto-Projektion sind technisch nicht darstellbare Erfolgswege im Contract.

## Empfohlene Dateigrenze

Der Implementierungsslice soll möglichst klein bleiben, beispielsweise:

- genau ein produktneutraler Contract unter einer bestehenden passenden Feature-/Lib-Grenze;
- genau ein fokussierter Contract-Test mit Fixtures;
- optional eine kleine additive Export-/Adapterdatei, wenn für Wiederverwendung bestehender Relationship-/Community-Typen erforderlich;
- keine Route-, DB-, Schema-, Migration-, UI- oder Provideränderung.

Vor Dateiwahl sind `AGENTS.md` und alle für die Zielpfade geltenden untergeordneten `AGENTS.md` erneut zu lesen.

## Pflicht-Gegenprobe vor Review

Auf demselben Exact Head mindestens:

- fokussierter Contract-/Fixture-Test vollständig grün;
- bestehende angrenzende Social-/Community-/Handoff-Contract-Tests unverändert grün, soweit durch den Slice berührt;
- Typecheck;
- Lint;
- Build;
- Security-/Production-Guardrails;
- `git diff --check`;
- Exact-Head GitHub CI;
- Vercel Preview, sofern der Repository-Workflow sie für den PR erzeugt;
- keine offenen Reviewthreads;
- Scope-Vergleich gegen aktuellen `main` belegt, dass keine Persistenz/API/UI/Provider/Publish-Fläche verändert wurde.

Keine grünen Browser-Smokes oder Systemtests behaupten, die in diesem Contract-only-Slice nicht real ausgeführt wurden.

## Status nach Implementierung

Auch bei vollständig grünen technischen Gates bleibt `SHARED-CONVERSATION-CONTRACT-01` zunächst höchstens `review`, bis Scope und Contract gegen Issue #604 sowie den gemergten Ist-Audit gegengeprüft sind.

`SHARED-CONVERSATION-RUNTIME-01` bleibt weiterhin `blocked`, bis der Contract belegt, welche minimale additive Migration oder Persistenzänderung gegenüber `social_messages` tatsächlich erforderlich ist.

## VoiceOpenGov-Grenze

VoiceOpenGov darf später nur Adaptersemantik ergänzen:

- bestätigte Mitgliedschaft;
- RegionalCircle/MemberRegionHub-Origin;
- explizite Visibility und Consent;
- VOG-spezifische Moderations-/Retention-Regeln;
- Report/Block/Mute;
- bewusster eDebatte-Handoff.

Kein zweiter allgemeiner Messaging-Kern und keine eigene parallele Message-SSOT.

## Harte Invarianten

- keine zweite Chat-Datenwelt pro Produkt;
- keine automatische öffentliche Projektion;
- keine Chatnachricht wird automatisch Claim, Dossier, Position, Abstimmung oder Gruppenmeinung;
- kein Auto-Handoff;
- kein Auto-Publish;
- keine politische Profilbildung;
- Actor-, Rechte- und Visibility-Wahrheit serverseitig;
- keine E2E-Verschlüsselungsbehauptung ohne reale technische Grundlage;
- Translation bleibt Lesefassung und keine Evidenz;
- Retention/Moderation werden nicht stillschweigend als implementiert behauptet, solange dieser Slice nur Contracts liefert;
- reservierte Voxy-Stränge #583, #584, #580, #569, #567, #568, #570, #578, #579 sowie PRs #588/#589/#590 bleiben unberührt.

## Nächster Governance-Schritt

Der nächste zulässige Schritt ist eine sichere, verlustfreie Single-Writer-Serialisierung von `SHARED-CONVERSATION-CONTRACT-01` in den kanonischen operativen Kopf von `docs/E150/OpenTasks.md`. Erst danach darf der taskbezogene Preflight ausgeführt und bei positivem Ergebnis der Implementierungsbranch gestartet werden.
