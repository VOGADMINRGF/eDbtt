# SHARED-CONVERSATION-INVENTORY-01 — Ist-Audit und Kollisionsmatrix

Stand: 2026-08-07

Bezug: Issue #604 `SHARED-CONVERSATION-CORE-01`

## Zweck

Dieser Slice ist ausschließlich ein read-only Governance- und Architektur-Audit. Er aktiviert keinen neuen Chat, keine neue Persistenz, keine neue API und keinen VoiceOpenGov-spezifischen Messaging-Kern.

Ziel ist die belastbare Soll-vs.-Ist-Abgrenzung vor einem späteren typed Contract. Die bestehende eDebatte-Infrastruktur wird ausdrücklich wiederverwendet, wo sie bereits tragfähig ist.

## Governance

- `AGENTS.md` macht `docs/E150/OpenTasks.md` zur operativen SSOT.
- Issue #604 ist auf aktuellem `main` noch nicht im kanonischen Operativteil von `OpenTasks.md` auffindbar.
- Daher ist **kein Implementierungsslice freigegeben** und es wird kein positiver taskbezogener Preflight behauptet.
- Dieser Audit ersetzt weder OpenTasks-Serialisierung noch Preflight.
- Voxy-reservierte Stränge und PRs #588/#589/#590 bleiben unberührt.

## Bestätigter Ist-Stand auf `main`

### 1. Soziale Beziehung und Direct-Messaging-Capability

Vorhanden ist `apps/web/src/lib/social/relationshipState.ts`.

Der Contract modelliert bereits:

- `connected`
- `incoming_pending`
- `outgoing_pending`
- `none`

und leitet servernah eine Messaging-Capability ab. `canMessage` wird nur bei bestätigter Verbindung wahr; Self-Messaging, unbekannte Ziele und offene Requests bleiben blockiert.

**Wiederverwendung:** Diese Ableitung ist eine geeignete Grundlage für Direct-Conversation-Eligibility. Sie ist jedoch noch kein allgemeiner Conversation-Capability-Contract für Gruppen, Themen, Regionen oder Projekte.

### 2. Reale Direct-Message-Persistenz und Thread-Route

Vorhanden ist `apps/web/src/app/api/account/social-thread/route.ts` mit:

- Authentifizierung über bestehende Session;
- `social_friend_requests` als Beziehungsgrundlage;
- `social_messages` als reale Nachrichtenpersistenz;
- paarweiser Thread-Auflösung;
- serverseitiger Absender-/Zielauflösung;
- Read-Markierung;
- Original-/Übersetzungstrennung über vorhandene i18n-Contracts;
- Messaging-Freigabe über `deriveMessagingCapability(...)`.

**Wiederverwendung:** Die bestehende `social_messages`-Welt darf nicht parallel durch eine neue VoiceOpenGov-Message-Collection dupliziert werden, bevor klar ist, ob sie additiv zu einem allgemeinen Conversation-Modell migriert werden kann.

**Reale Lücke:** Das vorhandene Modell ist paarbezogen (`fromUserId`/`toUserId`) und besitzt nach dem Audit keine kanonische `conversationId`, keinen allgemeinen Scope und keine allgemeine Participant-/Moderation-/Retention-Policy.

### 3. Community-/Gruppen-Kontext

Vorhanden ist `apps/web/src/features/community/groupSurface.ts`.

Der bestehende Community-Surface modelliert bereits:

- Interest-/Topic-Kontext;
- `regional_group`;
- Dossierbezug;
- Founder-/System-Kontext;
- regionale/überregionale Scopes;
- Mitgliederableitung aus vorhandenem Profil-/Interessen-/Regionskontext;
- Messaging-Fähigkeit pro sichtbarem Mitglied aus dem bestehenden Relationship-Contract.

**Wiederverwendung:** Gruppen-, Topic-, Dossier- und Regional-Origin-Identitäten müssen im Conversation-Core als Referenz wiederverwendet werden; sie dürfen nicht als kopierte Domänenobjekte in eine Chat-Datenwelt geschrieben werden.

**Reale Lücke:** Community-Gruppen sind im aktuellen Surface Discoverability-/Kontextmodelle, noch kein nachgewiesener persistenter Multi-Participant-Conversation-Kern.

### 4. Dialog-/Handoff-Infrastruktur

Vorhandene Flächen unter `apps/web/src/features/dialog/*` sowie Create-Handoff-Contracts zeigen bereits einen reviewgebundenen Übergabepfad. Insbesondere existieren Dialog-Result-Handoff-UI, Create-Handoff-Drafts und Unified-Review-Queue-Tests.

**Wiederverwendung:** Ein späterer Conversation-Handoff zu Frage, Quelle, Perspektive, Gegenposition oder Arbeitsstand muss an diese vorhandene Review-/Handoff-Architektur anschließen und darf keine zweite Review-Queue erzeugen.

### 5. Testbasis

Bereits auffindbare angrenzende Tests umfassen unter anderem:

- `apps/web/tests/social-thread.route.translation.test.ts`
- `apps/web/tests/community-groups.route.test.ts`
- `apps/web/tests/community-page.states.test.ts`
- `apps/web/tests/dialog-results-handoff-panel.test.tsx`
- `apps/web/tests/create-handoff-drafts.test.ts`
- `apps/web/tests/create-handoff-review-queue.test.ts`
- `apps/web/tests/unified-review-queue-contract.test.ts`

Der spätere Contract-/Runtime-Slice soll diese Muster erweitern statt eine zweite Testinfrastruktur aufzubauen.

## Soll-vs.-Ist-Matrix

| Fähigkeit | Ist | Bewertung |
| --- | --- | --- |
| Direct Relationship Gate | vorhanden | wiederverwenden |
| Direct Messages | vorhanden | wiederverwenden/migrationsfähig halten |
| Serverseitige Actor-/Target-Auflösung | vorhanden | wiederverwenden |
| Übersetzungs-/Lesesprache für Nachrichten | vorhanden | wiederverwenden |
| Community Topic/Region/Dossier Origins | vorhanden | als Referenzen wiederverwenden |
| Reviewgebundener Handoff | vorhanden | kanonischen Reviewpfad wiederverwenden |
| kanonische `Conversation`-ID | nicht belegt | echte Contract-Lücke |
| Scope `direct/group/topic/regional/project` | nicht zentral belegt | echte Contract-Lücke |
| allgemeine Participant Policy | nicht zentral belegt | echte Contract-Lücke |
| allgemeine Visibility Policy | nicht zentral belegt | echte Contract-Lücke |
| Conversation Lifecycle | nicht zentral belegt | echte Contract-Lücke |
| Retention Policy pro Conversation | nicht zentral belegt | echte Contract-Lücke |
| Moderation Policy pro Conversation | nicht zentral belegt | echte Contract-Lücke |
| Group/Regional Multi-Participant Runtime | nicht belegt | erst nach Contract-Audit entscheiden |
| Report/Block/Mute im gemeinsamen Core | nicht belegt | separater Folge-Slice |
| Auto-Handoff/Public Projection | nicht zulässig | dauerhaft fail-closed |

## Kollisionsgrenzen

### eDebatte

Nicht parallel neu bauen:

- Relationship-/Friend-State;
- Direct-Message-Persistenz;
- Community-Origin-Semantik;
- Dialog/Create-Handoff;
- Unified Review Queue;
- bestehende i18n-Übersetzungswahrheit.

### VoiceOpenGov

VoiceOpenGov darf später ausschließlich Adaptersemantik ergänzen:

- bestätigte Mitgliedschaft;
- RegionalCircle/MemberRegionHub-Origin;
- Consent/Visibility;
- VOG-spezifische Moderations-/Retention-Regeln.

Es darf keine zweite Messaging-SSOT oder eigenständige allgemeine Message-Runtime entstehen.

## Empfohlener nächster ausführbarer Slice

Nach sicherer OpenTasks-Serialisierung und positivem Preflight:

`SHARED-CONVERSATION-CONTRACT-01`

Minimaler Scope:

- typed `Conversation`- und `Message`-Contract;
- Origin-Reference statt kopierter Domänenobjekte;
- serverseitige Capability-Matrix (`canRead`, `canPost`, `canReply`, `canEditOwn`, `canDeleteOwn`, `canModerate`, `canInvite`, expliziter Handoff);
- Fixtures für direct/group/topic/regional/project;
- negative Fixtures für fremde, blockierte, ausgetretene und nicht eingeladene Actors;
- keine DB-, API-, UI- oder Produktaktivierung.

Der Runtime-Slice `SHARED-CONVERSATION-RUNTIME-01` bleibt danach weiterhin `blocked`, bis der Contract anhand der vorhandenen `social_messages`-Persistenz beweist, welche minimale Migration oder additive Persistenz tatsächlich notwendig ist.

## Preflight-Gate

Vor jeder Implementierung auf sauberem aktuellem `main`:

```bash
node scripts/codex-task-preflight.mjs SHARED-CONVERSATION-CONTRACT-01
```

Nur bei:

```text
status: codex_ready
executable: true
branchCreationAllowed: true
```

darf ein Implementierungsbranch entstehen.

## Harte Invarianten

- keine zweite Chat-Datenwelt pro Produkt;
- keine Chatnachricht wird automatisch Claim, Gruppenposition, Dossier oder öffentliches Ergebnis;
- kein Auto-Handoff und kein Auto-Publish;
- Actor-/Rollen-/Visibility-Wahrheit ausschließlich serverseitig;
- keine E2E-Verschlüsselungsbehauptung ohne reale technische Grundlage;
- Original-/Lese-/Bedien-/Ausgabesprache sauber trennen;
- Consent, AuthZ, Moderation, Retention und Löschung sind Produktanforderungen;
- vorhandene Architektur erweitern statt parallele Wahrheiten schaffen.

## Abschluss dieses Audits

`SHARED-CONVERSATION-INVENTORY-01` ist als Governance-/Ist-Audit dokumentiert. Es wurde keine Produkt- oder Runtimeänderung vorgenommen. Der nächste technische Schritt bleibt durch fehlende kanonische OpenTasks-Freigabe und taskbezogenen Preflight blockiert.