# V3 Live Product Contract

Datum: `2026-07-23`
Task: `LIVE-PRODUCT-CONTRACT-01`
Status: Architektur- und Produktvertrag, keine Runtime-Implementierung

## Zweck

Dieses Dokument schließt den Produktvertrag für die Live-Flächen auf Basis des aktuellen Repo-Iststands. Es definiert:

- die fachliche Abgrenzung von `/live`, `/stream`, `/runden` und Dossier,
- die kanonische Daten- und Review-Kette zwischen diesen Flächen,
- die Wiederverwendung bestehender Status- und Rollenwahrheiten,
- die Grenzen für spätere Realtime- und Session-Runtime-Slices.

Dieses Dokument führt keine neue Runtime ein, wählt keinen Realtime-Provider und ändert keine bestehende Review-/Publish-Logik.

## Scope

- Produktvertrag für die Live-Kette zwischen öffentlichem Event, moderierten Eingaben, Anlassraum-/Dossier-Follow-up und öffentlicher Darstellung
- Istinventar der vorhandenen Routen, Modelle und Statuswörter
- Zielbild für spätere Runtime-Slices ohne Parallelwahrheiten

## Non-Goals

- keine neue API
- kein Join-/Voting-/Realtime-Code
- keine neue Datenbank-Collection
- keine Entscheidung für Provider, Socket-Stack oder Streaming-Infrastruktur
- keine Runtime-, Persistenz-, API- oder Publish-Änderung; `OpenTasks.md` wird ausschließlich mit Status und PR-Evidenz synchronisiert

## Evidenzbasis

- `docs/E150/OpenTasks.md`
- `docs/E150/V3_FINAL_OPERATING_PLAN_2026-07-20.md`
- `docs/E150/V3_CORE_RUNDEN_CREATE_HANDOFF_INTEGRITY_2026-07-03.md`
- `apps/web/src/app/live/page.tsx`
- `apps/web/src/app/api/live/route.ts`
- `apps/web/src/app/live/[campaignId]/page.tsx`
- `apps/web/src/app/stream/page.tsx`
- `apps/web/src/app/stream/[slug]/page.tsx`
- `apps/web/src/app/runden/new/page.tsx`
- `apps/web/src/app/dossier/[id]/ui.tsx`
- `apps/web/src/features/surfaces/runden/rundenEntryCanon.ts`
- `features/stream/publicRuntime.ts`
- `features/stream/types.ts`
- `features/campaign/types.ts`
- `apps/web/src/features/campaign/liveCampaignEntryClient.ts`
- `apps/web/src/features/campaign/liveReportHandoff.ts`
- `apps/web/src/features/create/participationSpacePublishWorkflow.ts`
- `apps/web/src/app/api/session/route.ts`
- `apps/web/src/lib/server/auth/roles.ts`
- `apps/web/src/lib/server/auth/anyUser.ts`
- `apps/web/src/models/core/Stream.ts`
- `apps/web/src/models/core/StreamEvent.ts`
- `apps/web/src/lib/services/stream/appendEvent.ts`

## Istinventar

### Flächeninventar

| Fläche | Klassifikation | Aktuelle Wahrheit | Vertragliche Einordnung |
| --- | --- | --- | --- |
| `/live` | Admin-/Stub-Surface | Nur bei `LIVE_CHAT_ENABLED`, nur `admin`/`superadmin`, Text: "Skeleton", "Noch keine Realtime-Integration" | Kein öffentliches Live-Produkt; nur Platzhalter für spätere Operator-Steuerung |
| `/api/live` | Stub-API | `GET` und `POST` liefern `501 not_implemented` | Kein produktiver Runtime-Endpunkt |
| `/live/[campaignId]` | öffentliche Entry-/Bridge-Surface | liest Campaign-Daten, erzeugt nur `StartDraftContext` für `/create` oder `/themen` | Einstieg und Kontextgeber, nicht kanonische Live-Session-Runtime |
| `/live/[campaignId]/host` | Host-/Cockpit-Surface | basiert auf `readLiveHostCockpit` | vorbereitender Arbeitsstand, keine Realtime-Wahrheit |
| `/live/[campaignId]/media-kit` | Hilfs-/Distribution-Surface | Medien- und Sharing-Hilfen | nachgelagerte Hilfsfläche, nicht Beteiligungswahrheit |
| `/live/[campaignId]/report` | Review-Handoff-Surface | `draft | ready_for_review | closed`, guarded Next Actions | review-first Report-Entwurf, keine automatische Veröffentlichung |
| `/stream` | kanonische öffentliche Event-Surface | öffentliche Live-/Kommend-/Replay-Liste, Beiträge reviewpflichtig | öffentliche Event- und Beteiligungsoberfläche |
| `/stream/[slug]` | kanonische öffentliche Event-Detailfläche | `StreamPublicRuntime`, Anschluss nach Anlassraum, Dossier, Swipes | primäre öffentliche Live-Surface |
| `/overlay/stream/[id]` | technische Overlay-Surface | streambezogene Overlay-Darstellung | Rendering-/Event-Hilfe, nicht SSOT |
| `/runden/new` | manueller Anlassraum-Draft-Einstieg | erster persistenter Record ist `manual_round_draft` via `/api/drafts/save` | vorgelagerter Draft- und Review-Einstieg, keine Live-Runtime |
| `/runden` | öffentliche Anlassraum-Surface | public/read-orientierte Anlassraum-Einstiege | thematischer Arbeitskontext, nicht Event-Player |
| `/dossier/[id]` | öffentliche Dossier-Surface | öffentlicher Read-Pfad mit `review_only`-Grenze | strukturierte Verdichtung, nicht primäre Event-Eingabe |
| `/streams` | Legacy-/Demo-Überhang | ältere Themenstrom-Surface | nicht kanonische öffentliche Live-Surface |
| `/dashboard/streams/*` | Creator-/Admin-Surface | CRUD und Settings für `stream_sessions` | Bedienoberfläche für interne/Creator-Flows, nicht öffentlicher Pfad |

### Persistenz- und Modellinventar

| Bereich | Heutige Collections / Record-Familien | Bedeutung |
| --- | --- | --- |
| Stream | `stream_sessions`, `stream_agenda_items`, `stream_moderation_queue`, `stream_callins`, `stream_public_inputs` | belastbarste vorhandene Live-/Event-Runtime-Basis |
| Campaign/Live-Entry | `campaigns`, `campaign_sessions`, `campaign_participants` | separates Campaign-/Join-System für `/live/[campaignId]` |
| Runden-Entry | `drafts` plus Browser-Handoff-States | erster manueller Draft vor Anlassraum-/Dossier-/Participation-Runtime |
| Dossier | `dossiers`, `dossierClaims`, `dossierSources`, `dossierFindings`, `openQuestions`, Publication-Records | öffentliche Verdichtungs- und Review-/Publish-Wahrheit |
| Participation | Participation-Space-Runtime plus Publish-Workflow | eigenständige review-first Beteiligungs- und Veröffentlichungslogik |

### Aktuelle Statusvokabulare

| Domäne | Heutige Status |
| --- | --- |
| `StreamSessionStatus` | `draft`, `scheduled`, `live`, `ended`, `cancelled` |
| `StreamAgendaStatus` | `queued`, `live`, `archived`, `skipped` |
| `StreamFollowUpStatus` | `submitted`, `in_review`, `accepted`, `partial`, `rejected` |
| `CampaignStatus` | `draft`, `active`, `paused`, `ended` |
| `CampaignSessionDoc.status` | `planned`, `live`, `ended` |
| `LiveCampaignEntryStatus` | `draft`, `live`, `closed` |
| `LivePublicationStatus` | `draft`, `review_pending`, `published`, `closed` |
| `LiveReviewStatus` | `none`, `recommended`, `pending`, `accepted`, `rejected` |
| `LiveReportHandoffStatus` | `draft`, `ready_for_review`, `closed` |
| `ParticipationSpacePublishStatus` | `draft`, `queued_for_review`, `approved_for_activation`, `activated`, `approved_for_publication`, `published`, `rejected`, `blocked`, `archived` |

### Ist-Drift und Überlappungen

1. `/live` ist heute fachlich gespalten:
   - `/live` selbst ist ein Admin-Stub ohne Runtime.
   - `/live/[campaignId]` ist eine öffentliche Campaign-Entry-Surface mit separatem Campaign-Modell.
2. `/stream` ist bereits die belastbarste öffentliche Event- und Beteiligungsfläche.
3. `/campaigns` bzw. `campaign_participants` bilden heute ein eigenes Join-System. Dieses darf nicht still zur zweiten kanonischen Beteiligungswahrheit für Live werden.
4. Die alte Stream-Infrastruktur unter `apps/web/src/models/core/Stream.ts`, `apps/web/src/models/core/StreamEvent.ts` und `apps/web/src/lib/services/stream/appendEvent.ts` ist Legacy bzw. Stub und kein belastbarer Realtime-Kern.
5. `/runden/new` spricht fachlich über Anlassraum, erzeugt aber zuerst nur einen Draft-Record. Die echte Anlassraum-/Dossier-/Participation-Wahrheit entsteht erst in späteren review-first Runtimes.

## Produktgrenzen

### `/stream`

`/stream` ist die kanonische öffentliche Event- und Live-Beteiligungsfläche. Dort werden:

- laufende, kommende und vergangene Events öffentlich dargestellt,
- öffentliche Eingaben reviewpflichtig angenommen,
- Anschlusswege zu Anlassraum, Dossier und Swipes sichtbar gemacht,
- Status wie "live", "kommend" und "rückblick" öffentlich lesbar gemacht.

`/stream` ist nicht:

- automatische Veröffentlichung von Beiträgen,
- Dossier-SSOT,
- Anlassraum-SSOT,
- Graph-/Factcheck-/Social-Execution-Surface.

### `/live`

`/live` ist im Zielbild die Operator-/Host- und Produktionshülle für Live-Sessions. Im aktuellen Repo ist diese Fläche noch nicht implementiert. Vertraglich gilt:

- die spätere `/live`-Runtime darf keine zweite öffentliche Beteiligungsoberfläche neben `/stream` eröffnen,
- die spätere `/live`-Runtime darf Session-Steuerung, Moderation, Overlay und Host-Funktionen bündeln,
- öffentliche Zuschauer- und Input-Pfade bleiben auf `/stream` zentriert,
- Campaign-basierte `/live/[campaignId]`-Einstiege sind bis zu einer späteren Migration nur Bridge-/Entry-Flächen.

### `/runden`

`/runden` bleibt der thematische Arbeits- und Anlassraumkontext. Dort liegt:

- der manuelle Anlassraum-Draft,
- der spätere thematische Diskussions- und Beteiligungsraum,
- die review-first Vorbereitung öffentlicher Beteiligung.

`/runden` ist nicht:

- der primäre öffentliche Event-Player,
- die alleinige Dossier-Wahrheit,
- die Realtime-Session-Steuerung.

### Dossier

Das Dossier bleibt die strukturierte Verdichtung. Es bündelt:

- Claims,
- Quellen,
- Findings,
- offene Fragen,
- publizierbare Verdichtungen nach Review.

Das Dossier ist nicht:

- die Live-Input-Surface,
- die Session-Steuerung,
- ein stiller Autohandoff aus `/stream`, `/live` oder `/runden`.

## Kanonische Datenkette

Die verbindliche Kette für spätere Live-Runtime-Arbeit lautet:

1. Ein Einstieg entsteht als vorhandener Draft- oder Startkontext aus `/create`, `/runden/new` oder einer Campaign-/Live-Entry-Surface.
2. Ein öffentlicher Event läuft auf `/stream` als kanonischer Public-Read- und Public-Input-Pfad.
3. Öffentliche Fragen, Quellen, Perspektiven, Optionen und Korrekturen werden nur als reviewpflichtige Eingaben gespeichert.
4. Eine Host-/Moderations-Surface darf diese Eingaben sichten, priorisieren und für Follow-up markieren, ohne sie automatisch öffentlich oder amtlich zu machen.
5. Review-approved Folgepfade dürfen daraus Anlassraum-, Participation-Space- oder Dossier-Arbeitsstände vorbereiten.
6. Öffentliche Darstellung entsteht erst in den jeweils vorhandenen Publish-/Visibility-Workflows.

### Verbindliche Guardrails

- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Publish
- kein Auto-Merge
- kein zweites ID-System für dieselbe öffentliche Beteiligung
- kein zweiter persistenter Join-/Participation-Kern parallel zu `stream_public_inputs` und den vorhandenen review-first Follow-up-Systemen
- keine Gleichsetzung von Zuschauerzahl, Mehrheiten oder ungeprüften Community-Signalen mit Wahrheit

## Rollenvertrag

Die heutigen Session-Endpunkte beweisen nur grobe Actor-Buckets. Die späteren Server-Gates pro Runtime bleiben maßgeblich. Der Vertrag lautet:

| Zielrolle | Darf sehen / tun | Heutige Codebasis | Vertragsregel |
| --- | --- | --- | --- |
| Öffentlichkeit | Event sehen, öffentliche Dossierstände lesen, reviewpflichtige Inputs abgeben, wenn Surface offen ist | `/stream` öffentlich; Dossier nur bei publizierter Runtime; Session-API kennt anonym `member` | Public kann lesen und begrenzt einspeisen, aber nichts veröffentlichen |
| registriertes Mitglied | wie Öffentlichkeit plus konto- oder verifizierungsabhängige Beteiligung | `actorRole: member`; einzelne Stream-/Vote-Routen prüfen Login/Verifikation | Mitglied bleibt Input-Rolle, nicht Review-/Publish-Rolle |
| Redaktion / Moderator / Staff | reviewen, kuratieren, Host-/Moderationswerkzeuge nutzen, Follow-ups vorbereiten | `actorRole: editor`; Rollenmenge in Session-/AnyUser-Route; Stream-CRUD erlaubt Creator/Staff | Editorische Rollen dürfen sichten und vorbereiten, aber nur explizite Publish-Pfade veröffentlichen |
| Admin / Superadmin | Operator-/Admin-Steuerung, Runtime-Freigaben, Dashboard-Sichten | `/live`-Root aktuell nur `admin`/`superadmin`; `userIsAdminDashboard` | Admin bleibt höchste Produktbetriebsrolle, ersetzt aber nicht Review-Audit-Kontext |
| Governance-/Amt-/Org-Kontexte | gesonderte Freigaben in spezialisierten Scopes | separate Governance- und Request-Scope-Logik existiert | spätere Live-Runtime darf diese Scopes nur konsumieren, nicht neu erfinden |

### Rollenregeln

1. `actorRole` aus `/api/session` ist nur eine grobe Experience-/API-Klassifikation.
2. Serverseitige Spezialrechte für Review, Governance, Publish und Runtime-Steuerung bleiben je Fachroute die eigentliche Wahrheit.
3. Eine spätere Live-Runtime darf keine vereinfachte globale "Host darf alles"-Abkürzung einführen.

## Statusvertrag

### 1. Kanonische Session-Wahrheit

Für die spätere eigentliche Live-Session-Runtime wird `StreamSessionStatus` als kanonisches Session-Vokabular wiederverwendet:

- `draft`
- `scheduled`
- `live`
- `ended`
- `cancelled`

Begründung:

- dieses Vokabular existiert bereits in `features/stream/types.ts`,
- es deckt öffentliche Event-Flows ab,
- es vermeidet ein drittes Session-Vokabular neben Stream und Campaign.

### Mapping-Regeln

| Heutige Quelle | Ziel-Mapping |
| --- | --- |
| `CampaignSessionDoc.status = planned` | auf Session-Ebene nach `scheduled` mappen |
| `CampaignSessionDoc.status = live` | nach `live` mappen |
| `CampaignSessionDoc.status = ended` | nach `ended` mappen |
| `LiveCampaignEntryStatus = draft` | Entry-/Shell-Zustand, nicht Session-SSOT |
| `LiveCampaignEntryStatus = live` | Entry-Label kann `live` anzeigen, darf aber keine zweite Session-Wahrheit erzeugen |
| `LiveCampaignEntryStatus = closed` | Entry-/Shell-Zustand; im Runtime-Kern als `ended` oder `cancelled` auflösen |

### Konsequenz

Campaign-Statuswörter bleiben vorerst Kompatibilitäts- und Entry-Hilfen. Die spätere Live-Runtime soll keine neue persistente Session-Collection mit eigenem Statuswortschatz einführen, wenn `stream_sessions` denselben fachlichen Zweck trägt.

### 2. Öffentliche Eingaben und Moderation

Für öffentliche Live-Beiträge wird kein neues Statussystem erfunden. Es wird wiederverwendet:

- Eingabe-/Review-Semantik aus `stream_public_inputs`
- regionale Review-/Visibility-States für Sichtbarkeit
- bestehende `StreamFollowUpStatus` für Follow-up-Updates

Vertraglich gilt:

- ein eingehender Public Input ist zuerst immer reviewpflichtig,
- öffentliche Sichtbarkeit ist ein Ergebnis von Review, nicht der Default,
- "live angekommen" ist kein Publikationsstatus.

### 3. Report-/Handoff-Arbeitsstand

`LiveReportHandoffStatus` bleibt ein begrenzter Arbeitsstand für Host-/Review-Handoffs:

- `draft`
- `ready_for_review`
- `closed`

Dieser Status ist kein Ersatz für:

- Dossier-Publication-Status,
- Participation-Publish-Status,
- Session-Status.

### 4. Öffentliche Beteiligungs- und Publish-Freigabe

Sobald aus einem Live-/Stream-Kontext ein öffentlicher Participation Space entsteht, bleibt die kanonische Freigabekette der vorhandene Participation-Publish-Workflow:

- `draft`
- `queued_for_review`
- `approved_for_activation`
- `activated`
- `approved_for_publication`
- `published`
- `rejected`
- `blocked`
- `archived`

Der Live-Vertrag führt hierfür kein vereinfachtes Parallelmodell wie "open/public/closed" ein.

### 5. Dossier-Publication

Dossier-Veröffentlichung bleibt in den vorhandenen Dossier-Publication- und Export-Grenzen verankert. `dossier_review_only` bleibt eine reale und erwartete Schranke.

## Realtime-Adapter-Grenze

Eine spätere Realtime-Schicht ist nur Adapter, nie die fachliche Wahrheit. Sie darf:

- Session-Snapshots aus bestehender Runtime verteilen,
- Host-/Agenda-/Moderationsänderungen zustellen,
- Overlay-Updates transportieren,
- Connectivity- und Präsenzsignale anzeigen.

Sie darf nicht:

- den einzigen Persistenzpfad bilden,
- Review-/Publish-Entscheidungen ohne bestehende Fachroute schreiben,
- ein eigenes Statusmodell neben `stream_sessions` und vorhandenen Follow-up-Systemen etablieren.

### Minimaler Adaptervertrag

Ein späterer Adapter darf fachlich nur folgende Klassen transportieren:

| Klasse | Bedeutung |
| --- | --- |
| `session_snapshot` | abgeleiteter Zustand einer bestehenden Session-Wahrheit |
| `agenda_update` | Änderung an Agenda-/Overlay-Daten |
| `moderation_queue_delta` | Hinweis auf neue oder veränderte Review-Eingaben |
| `followup_hint` | Hinweis, dass reviewfähige Folgearbeit vorliegt |
| `connection_state` | rein technischer Online-/Reconnect-Status |

Keine dieser Klassen ist ohne vorhandene Persistenz- oder Reviewroute selbst autoritativ.

## Fehler- und Recovery-Vertrag

1. Fällt Realtime aus, bleibt die Fachwahrheit über bestehende Server-Reads und -Writes erreichbar.
2. Public Inputs dürfen bei Verbindungsproblemen nicht lokal als "übernommen" bestätigt werden, wenn keine serverseitige Persistenz vorliegt.
3. Ein Reconnect darf UI-Zustände erneuern, aber keine verdeckten Folgeschritte nachholen.
4. Bei fehlender Runtime gilt fail-closed:
   - `/live` bleibt verborgen oder Admin-Stub,
   - `/api/live` bleibt `not_implemented`,
   - öffentliche Flächen zeigen ehrliche Lade-, Offline- oder Review-Hinweise.
5. Alte Stub-/Legacy-Pfade wie `StreamEvent` oder `appendEvent()` gelten nicht als Recovery-Backbone.

## Sicherheits- und Review-Grenzen

1. Öffentliche Inputs sind standardmäßig reviewpflichtig.
2. Review-Etiketten, Vertrauenshinweise und Quellenhinweise sind keine automatische Verifikation.
3. Dossier, Anlassraum und Participation-Space entstehen nur über explizite vorhandene Review-Handoffs.
4. Eine Live-Host-Surface darf keine Factcheck-, Graph- oder Publish-Aktion still auslösen.
5. QR-, Share- oder Event-Einstiege dürfen denselben Beteiligungspfad öffnen, aber keine Sonderrechte oder Sonderpersistenz anlegen.
6. Campaign-Join-Daten und Stream-Public-Inputs sind fachlich verschiedene Systeme; eine spätere Vereinheitlichung muss bewusst migrieren statt still zu duplizieren.

## Zukunftsslices

### `LIVE-SESSION-RUNTIME-02`

Ziel:

- Operator-/Host-Runtime für echte Session-Steuerung
- Wiederverwendung von `stream_sessions` als Session-Kern
- klare Trennung zwischen Public `/stream` und Operator `/live`

Nicht Teil:

- kein zweites Public-Input-System
- kein neuer Statuswortschatz

### `LIVE-MODERATION-HANDOFF-03`

Ziel:

- Sichtung, Priorisierung und Weitergabe von Live-Inputs in vorhandene Review-/Follow-up-Pfade
- Anbindung an Dossier-, Anlassraum- und Participation-Handoffs

Nicht Teil:

- keine automatische Veröffentlichung
- keine automatische Dossier- oder Anlassraumerzeugung

### `LIVE-REPORTING-04`

Ziel:

- belastbarer Review-Report aus Host-/Moderationskontext
- klare Abgrenzung zwischen Arbeitsstand, Review-Freigabe und öffentlicher Verdichtung

Nicht Teil:

- kein Ersatz für Dossier-Publication

## Dateigrenzen für spätere Runtime-Arbeit

Die spätere Umsetzung soll entlang der vorhandenen Architektur geschnitten werden:

| Bereich | Vorrangige Orte |
| --- | --- |
| öffentliche Event-Runtime | `features/stream/*`, `apps/web/src/app/stream/*` |
| Operator-/Host-Surface | `apps/web/src/app/live/*` |
| Campaign-Kompatibilität / Bridge | `apps/web/src/features/campaign/*` |
| Anlassraum-/Participation-/Dossier-Handoffs | vorhandene `features/create/*`, `features/participation/*`, `features/dossier/*`, `features/anlassraum/*` |
| Realtime-Adapter | neue isolierte Adapter-Schicht, nicht als neue fachliche Kernruntime |

`apps/web/src/models/core/Stream.ts`, `apps/web/src/models/core/StreamEvent.ts` und `apps/web/src/lib/services/stream/appendEvent.ts` werden dabei nicht als kanonischer Zielkern behandelt, solange sie nur Legacy-/Stub-Charakter haben.

## Konkrete Vertragsentscheidungen

1. Öffentliche Live-Beteiligung bleibt kanonisch auf `/stream`.
2. `/live` ist Zielbild für Operator-/Host-Runtime, heute aber noch kein produktiver Public-Pfad.
3. `/runden` bleibt thematischer Arbeitskontext und Anlassraum-Follow-up, nicht Event-Player.
4. Dossier bleibt strukturierte Verdichtung und Publish-/Read-Grenze.
5. `stream_sessions` ist die bevorzugte spätere Session-Wahrheit; Campaign-Session-Status wird darauf gemappt, nicht parallel ausgebaut.
6. Review- und Publish-Systeme werden wiederverwendet, nicht neu erfunden.
7. Realtime bleibt austauschbarer Adapter über bestehender Fachwahrheit.

## Akzeptanzkriterien für `LIVE-PRODUCT-CONTRACT-01`

Dieser Task ist fachlich erfüllt, wenn dieses Dokument:

- die aktuellen Flächen und Überlappungen korrekt inventarisiert,
- `/live`, `/stream`, `/runden` und Dossier sauber gegeneinander abgrenzt,
- einen kanonischen Flow ohne Auto-Publish und ohne Parallel-IDs festlegt,
- Rollen- und Statusmapping auf vorhandene Codewahrheiten zurückbindet,
- die Realtime-Grenze als Adapter statt als neue SSOT festlegt,
- die alten Stream-Stubs explizit nicht als kanonischen Runtime-Kern behandelt.
