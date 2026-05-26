# V1-STREAM-PUBLIC-RUNTIME-01

Stand: 2026-05-25  
Repo: `VOGADMINRGF/edebatte-org`

## Ziel

Den bestehenden Stream-Pfad als öffentliche V1-Beteiligungsruntime schließen:

- `Anlassraum/Event -> Stream-Seite -> QR/Share -> Fragen/Hinweise -> Review -> Dossier-/Anlassraum-Nachbereitung`
- kein Video-/Encoding-Neubau
- kein unmoderierter Chat
- kein Auto-Publish
- keine zweite Review- oder Operator-Parallelwelt

## Umgesetzter Slice

### 1. Gemeinsamer Stream-Statusvertrag

Neu:

- `features/stream/statusContract.ts`

Status und deutsche Lesefassung:

- `planned` -> `Geplant`
- `open_for_questions` -> `Fragen möglich`
- `live` -> `Läuft gerade`
- `collecting_input` -> `Hinweise werden gesammelt`
- `review_required` -> `In Prüfung`
- `recap_in_progress` -> `Nachbereitung läuft`
- `dossier_update_suggested` -> `Dossier-Update vorgeschlagen`
- `closed` -> `Abgeschlossen`
- `archived` -> `Archiviert`
- `cancelled` -> `Abgesagt`
- `error` -> `Fehler`

### 2. Reviewpflichtige Stream-Inputs auf bestehendem Participation-Stack

Neu:

- `features/stream/publicInput.ts`
- `features/stream/server/publicInputSubmission.ts`
- `apps/web/src/app/api/stream/public-input/route.ts`
- `apps/web/src/app/stream/StreamPublicInputPanel.tsx`

Öffentliche Input-Typen:

- `question`
- `source_hint`
- `perspective`
- `option`
- `concern`
- `correction`
- `support`

Wesentliche Guardrails:

- `origin = stream`
- Stream-Input bleibt reviewpflichtig
- kein Auto-Publish
- kein Auto-Dossier-Update
- kein Auto-Anlassraum-Update
- kein Auto-Social

Persistenz:

- neue Eingabequelle `stream_public_inputs`
- Review und Sichtbarkeit bleiben auf dem bestehenden Participation-Review-Stack

### 3. Derived Public Runtime Readmodel

Neu:

- `features/stream/publicRuntime.ts`

Das Readmodel verbindet:

- Stream-Session
- zugehörigen öffentlichen Anlassraum
- zugehörigen Dossier-Kontext
- Stream-Inputs
- Dossier-Update-Hinweise
- Social-Queue-Hinweise nur als Entwurf / Review

Explizit nicht behauptet:

- keine Videoplattform
- keine veröffentlichte Wahrheit
- kein Live-Chat
- keine externe Veröffentlichung

### 4. Öffentliche Flächen

Geändert:

- `apps/web/src/app/stream/page.tsx`
- `apps/web/src/app/stream/[slug]/page.tsx`
- `apps/web/src/app/api/streams/public/route.ts`

Ergebnis:

- `/stream` liest Stream als öffentliche Event-Beteiligung statt nur als Live-/Replay-Verzeichnis
- `/stream/[slug]` erklärt:
  - worum es geht
  - was Bürger beitragen können
  - was mit dem Beitrag passiert
  - wo Anlassraum und Dossier anschließen
  - wo spätere Ergebnisse sichtbar werden
- Video bleibt optional
- QR/Share erscheinen nur in sinnvollen öffentlichen Zuständen

### 5. Anlassraum-Anschluss

Geändert:

- `features/topicRound/entrySource.ts`
- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/runden/RundenShareActions.tsx`

Ergebnis:

- `/runden` zeigt bei passendem Thema jetzt `Live-/Event-Beteiligung`
- Anlassraum-Einträge können auf die öffentliche Stream-Seite verlinken
- der Stream verweist zurück auf denselben Anlassraum- und Dossierpfad

## Validierung

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/stream-status-contract.test.ts tests/stream-public-runtime.contract.test.tsx tests/stream-public-input-review.contract.test.ts tests/stream-anlassraum-linking.contract.test.tsx tests/stream-dossier-recap-handoff.contract.test.ts tests/v1-stream-public-runtime.contract.test.ts`

Zusätzliche Revalidierung:

- `pnpm -C apps/web exec vitest run tests/stream-page-surface-staging.contract.test.tsx tests/runden-public-anlassraum-status.contract.test.tsx`

## Neue / aktualisierte Tests

- `apps/web/tests/stream-status-contract.test.ts`
- `apps/web/tests/stream-public-runtime.contract.test.tsx`
- `apps/web/tests/stream-public-input-review.contract.test.ts`
- `apps/web/tests/stream-anlassraum-linking.contract.test.tsx`
- `apps/web/tests/stream-dossier-recap-handoff.contract.test.ts`
- `apps/web/tests/v1-stream-public-runtime.contract.test.ts`
- aktualisiert: `apps/web/tests/stream-page-surface-staging.contract.test.tsx`

## Guardrails bestätigt

- kein Auto-Publish
- kein Auto-Social
- kein Auto-Seal
- kein Auto-Merge
- kein unmoderierter Chat
- keine Fake-Video- oder Streaming-Behauptung
- keine zweite Queue-Architektur

## Offen / bewusst nicht Teil dieses Slices

- echtes Video-Encoding / WebRTC / Streaming-Infrastruktur
- externes Live-Posting oder OAuth-Connectoren
- tieferes separates Stream-Moderator-Dashboard jenseits der bestehenden Review-/Anlassraum-/Dossier-/Social-Pfade
- Billing-/Wrapper-/Social-Live-Ausbau
