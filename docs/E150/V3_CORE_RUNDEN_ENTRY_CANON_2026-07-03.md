# V3 Core Runden Entry Canon

## Ziel des Slices

Die heutige Runtime-Wahrheit fuer `/runden/new` explizit machen, ohne neue
Persistenz, keine neue Orchestrierung und keine stille Produktumdeutung.

## Analyse

### 1. Welche Konzepte heute wirklich existieren

- `Draft`
  - serverseitig ueber `apps/web/src/app/api/drafts/save/route.ts`
  - lokal/browserseitig ueber `StartDraftContext` und `localStorage`
- `StartDraftContext`
  - browserseitiger Resume-/Handoff-Zustand fuer `/start`, `/create`, `/themen`
    und `/runden/new`
  - Guardrails `noAutoPublish`, `noAutoDossier`, `noAutoAnlassraum`,
    `noAutoDeepSearch`, `noAutoGraphWrite`
- `Create Handoff`
  - expliziter review-first Handoff aus `/create`
  - serverseitig persistierbar als `create_handoff_review_items`
- `Anlassraum Runtime`
  - echte review-approved Creation aus bestehenden Handoffs
  - nicht direkter Seiteneffekt von `/runden/new`
- `Dossier Runtime`
  - echte review-approved Creation aus bestehenden Handoffs
  - Claims, offene Fragen, Quellen, Findings und spaetere Studio-/Output-Pfade
    haengen hieran
- `Participation Space Runtime`
  - echte review-approved Creation aus bestehenden Handoffs
  - traegt spaetere oeffentliche Intake-/Feedback-Pfade
- `Dossier Studio Workspace`
  - review-first Traeger fuer Social-/Output-Drafts

### 2. Was heute persistent ist

Erster persistenter Record fuer `/runden/new`:

- `drafts`-Collection ueber `/api/drafts/save`
- `source = runden_manual_anlassraum`
- eingebettetes `manualAnlassraumDraft`-Schema

Spaetere persistente Runtime-Objekte:

- Anlassraum erst ueber `/api/admin/anlassraum-runtime/[sourceHandoffId]`
- Dossier erst ueber `/api/admin/dossier-runtime/[sourceHandoffId]`
- Participation Space erst ueber
  `/api/admin/participation-space-runtime/[sourceHandoffId]`

### 3. Was heute nur Browser-/Context-/Handoff-Zustand ist

- `sessionStorage:start-draft-context.v1`
- `localStorage:manual-anlassraum-setup.v1`
- `/create`-Prefill-/Resume-Kontext
- lokaler `CreateHandoffDraft`, bis ein expliziter serverseitiger Handoff
  geschrieben wird

### 4. Kanonische Lesart fuer `/runden/new`

`/runden/new` ist heute fachlich ein manueller, review-first
Anlassraum-Entwurfsraum.

Das bedeutet explizit:

- `Ohne KI speichern`
  - erzeugt einen echten serverseitigen `drafts`-Record
  - erzeugt keinen Anlassraum
  - erzeugt kein Dossier
  - erzeugt keinen Participation Space
  - startet keinen KI-Lauf
  - schreibt kein AI-Usage-Event
  - startet keinen DeepSearch-/Research-Lauf
- `Mit KI in /create weiter`
  - erzeugt auf `/runden/new` keinen neuen serverseitigen Fach-Record
  - bereitet nur den Wechsel in die bestehende `/create`-Surface vor
  - dort koennen spaeter Analyze-/Planner-/Handoff-Pfade folgen
- Anlassraum, Dossier und Participation Space
  - entstehen erst spaeter ueber bestehende review-first Handoffs und Runtimes

### 5. Welche Struktur spaetere Folgepfade traegt

- Claims, offene Fragen, Quellen, Findings:
  - `Dossier`
- Oeffentliche Fragen, Umfragen, Feedback, Beteiligungsstatus:
  - `Participation Space`
- Feed-Anreicherung, Anlassraum-Kontext, Output-Seeds:
  - `Anlassraum`
- Social Output Drafts:
  - `Dossier Studio Workspace`
- Voxy Video Briefing:
  - noch kein eigener belastbarer persistenter Traeger
  - aktuell nur als spaetere Folgefrage ueber bestehende
    Dossier-/Output-Draft-Kontexte anschliessbar

### 6. Gefundene Drift

- `/runden/new` spricht fachlich ueber Anlassraum, persistiert aber zuerst nur
  einen Draft
- `/create` und `/runden/new` teilen sich denselben StartDraft-Handoff, aber
  nicht denselben ersten serverseitigen Persistenzpfad
- Anlassraum-, Dossier- und Participation-Space-Runtimes sind vorhandene
  review-first Folgesysteme, aber keine direkten Seiteneffekte des manuellen
  Runden-Einstiegs
- alter `draftStore`-/`/api/drafts`-Pfad und neuer `/api/drafts/save`-Pfad
  bleiben getrennte Draft-Wahrheiten

## Umsetzung

- Neuer getypter Kanon-Contract:
  - `apps/web/src/features/surfaces/runden/rundenEntryCanon.ts`
- `/runden/new` rendert jetzt eine kompakte, sichtbare Zusammenfassung
  desselben Kanons
- neue Contract-Tests sichern:
  - erster persistenter Record = `draft`
  - No-AI-Pfad bleibt no-AI/no-usage/no-deepsearch
  - KI-Pfad ist nur `/create`-Vorbereitung
  - Anlassraum/Dossier/Participation Space bleiben review-first Folgeobjekte

## Wiederverwendbare Kurzfassung

### Was `/runden/new` fachlich ist

`/runden/new` ist heute ein manueller, review-first Anlassraum-Entwurfsraum. Der
erste persistente Record ist ein Draft, nicht bereits ein Anlassraum oder
Dossier.

### Wie Draft, Anlassraum, Dossier und Participation Space zusammenspielen

Der Draft ist der Pre-Record. Aus ihm kann spaeter bewusst nach `/create`
gewechselt werden. Echte Anlassraum-, Dossier- und Participation-Space-Records
entstehen erst spaeter ueber explizite review-first Handoffs und bestehende
Runtimes.

### Warum Frontend-KI-Orchestrierungs-Transparenz danach als eigener Slice kommt

Erst nachdem der fachliche Einstieg klar ist, laesst sich sauber zeigen, wann
KI wirklich startet, welche Nutzerentscheidung davor liegt und welche
Guardrails fuer Review, Nicht-Autonomie und Nicht-Amtlichkeit gelten. Diese
Transparenz soll auf bestehende Analyze-/Planner-/Handoff-Pfade aufsetzen und
nicht auf Vermutungen.

### Welche AI-Act-/Transparenzanforderungen spaeter relevant sind

Spaetere KI-bezogene Folgepfade muessen mindestens sichtbar machen:

- wer den KI-Schritt bewusst ausloest
- ob es nur Vorbereitung oder echte Analyse ist
- welche Reviewpflicht bleibt
- dass daraus keine automatische Amtlichkeit, kein Auto-Publish und keine
  automatische Runtime-Erstellung entsteht
- welche Provider-/Planner-Rolle heute wirklich belegt ist und welche noch
  nicht

## Nicht gebaut

- kein neuer Persistenzpfad
- kein direkter Anlassraum-/Dossier-/Participation-Space-Write aus `/runden/new`
- kein KI-Lauf im No-AI-Pfad
- kein AI-Usage-Event im No-AI-Pfad
- keine neue DeepSearch-Automation
- keine Produktparallelwelt
