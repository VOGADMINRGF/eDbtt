# UX Anlassraum Manual Create Persist

Datum: 2026-07-03
Slice: `UX-ANLASSRAUM-MANUAL-CREATE-PERSIST-01`

## Ziel

Den vorhandenen no-AI-Entwurfspfad auf `/runden/new` von einer rein lokalen
UX-Stuetze zu einem echten serverseitigen Draft-/Startpfad fortschreiben,
ohne direkten Anlassraum-, Dossier-, KI- oder DeepSearch-Start zu erfinden.

## Analyse vor Umsetzung

1. Vorhandene Server-/Runtime-Strukturen

- Anlassraum-Runtime:
  `features/anlassraum/service.ts`,
  `apps/web/src/features/create/anlassraumRuntime.ts`,
  `apps/web/src/features/create/anlassraumRuntimeServer.ts`
- Review-first Create-Handoffs:
  `apps/web/src/app/api/create/handoffs/route.ts`,
  `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
- Contribution-Drafts fuer `/create`:
  `apps/web/src/app/api/contributions/save/route.ts`,
  Collection `contribution_drafts`
- Bestehender generischer serverseitiger Draft-Store:
  `apps/web/src/app/api/drafts/save/route.ts`,
  Collection `drafts`
- Browser-/Resume-Kontext:
  `apps/web/src/features/start/startDraftContext.ts`

2. Bereits vorhandene API-/Persistenzpfade

- `/api/drafts/save` erstellt oder aktualisiert bestehende serverseitige
  `drafts`-Records mit `draftId`, `source`, `text`, `textPrepared` und
  `analysis`.
- `/api/create/handoffs` ist fuer review-first Create-Handoffs gedacht und
  setzt eine `CreateHandoffDraft`-Struktur voraus.
- Anlassraum- und Dossier-Erstellung existieren bereits, aber nur in
  bestaetigten Review-/Admin-/Runtime-Pfaden.

3. Warum kein direkter Anlassraum-/Dossier-Record der kleinste Slice ist

- Ein echter Anlassraum-Record auf `/runden/new` wuerde heute fachlich
  nahtlos an die vorhandenen Review-/Runtime-Freigaben anschliessen muessen.
- Derselbe Pfad traegt bereits Guardrails fuer `approved_for_creation`,
  Aktivierung und spaetere Veroeffentlichung; das waere groesser als ein
  sauberer Persistenz-Slice.
- Ein Dossier-Record waere noch weiter weg vom aktuellen manuellen
  Anlassraum-Entwurf.
- Der vorhandene `drafts`-Store ist deshalb der kleinste ehrliche Zieltyp.

4. Richtiger Zieltyp fuer `Ohne KI speichern`

- Nicht: direkter Anlassraum
- Nicht: direkter Dossier-Eintrag
- Nicht: Beteiligungsraum
- Ja: serverseitiger Draft-Record auf der bestehenden `drafts`-Struktur

5. Warum der bisherige lokale Save-Pfad nicht ausreicht

- `localStorage` und `StartDraftContext` sind browser- und
  sessiongebunden.
- Daraus entsteht kein serverseitig referenzierbarer Record fuer Resume,
  Review, Admin oder spaetere Runtime-Handoffs.
- Dossier-, Claim-, Fragen-, Feed-, Social- und Video-Folgepfade koennen
  lokale Browserdaten nicht belastbar als gemeinsame Wahrheit nutzen.

6. Welche bestehende Struktur spaeter mehr tragen kann

- Fuer spaetere Claims, Fragen, Umfragen, Feed-Anreicherung, Review,
  Social-Output-Drafts und Voxy-Video-Briefings bleibt heute vor allem die
  bestehende Create-/Handoff-/Review-/Runtime-Kette relevant.
- Der neue serverseitige Draft ist nur der minimale review-first
  Persistenzanker fuer `/runden/new`, nicht die Antwort auf die offene
  Einstiegskanon-Frage.

## Umsetzung

- `/runden/new` schreibt `Ohne KI speichern`, `Intern starten` und
  `Öffentlich nach Review einreichen` jetzt ueber den vorhandenen
  `/api/drafts/save`-Pfad in einen serverseitigen `drafts`-Record.
- Der Record nutzt:
  - `source = runden_manual_anlassraum`
  - `text`, `textOriginal`, `textPrepared` als lesbare
    Anlassraum-Prefill-Zusammenfassung
  - `analysis.manualAnlassraumDraft` als eingebettete Setup-Wahrheit
- Dieselbe Struktur traegt weiter:
  - `noAiRunStarted: true`
  - `noAiUsageEvent: true`
  - `noDeepSearchStarted: true`
  - `reviewFirstOnly: true`
- `/runden/new?draftId=...` kann den gespeicherten serverseitigen Draft fuer
  denselben angemeldeten Nutzer wieder laden.
- Lokale Entwurfssicherung und `StartDraftContext` bleiben bewusst als
  UX-Stuetzen erhalten.

## Ehrliche Runtime-Wahrheit nach diesem Slice

Was jetzt wirklich entsteht:

- ein serverseitiger `drafts`-Record
- ein lokal fortgefuehrter Browser-/StartDraft-Arbeitsstand

Was bewusst weiterhin nicht entsteht:

- kein direkter Anlassraum-Record
- kein Dossier-Record
- kein KI-Lauf
- kein AI-Usage-Event
- kein DeepSearch-/Research-Lauf
- kein Auto-Publish

## Offene Folgepfade

- `V3-CORE-RUNDEN-ENTRY-CANON-02`
  klaert weiter, ob `/runden/new` spaeter fachlich ueber den
  Anlassraum-Entwurfsstart hinaus der kanonische Ersteinstieg fuer
  Dossier-, Claim-, Feed- und Output-Folgepfade sein soll.
- `DRAFTS-LEGACY-SSOT-ALIGN-01`
  bleibt offen, weil aeltere `draftStore`-/`/api/drafts`-Pfade noch nicht
  auf dieselbe Draft-Wahrheit harmonisiert wurden.

## Tests

Gruen in diesem Slice:

- `apps/web/tests/manual-anlassraum-setup.contract.test.ts`
- `apps/web/tests/manual-anlassraum-server-draft.test.ts`
- `apps/web/tests/runden-manual-create.page.contract.test.tsx`
- `apps/web/tests/start-draft-context.contract.test.ts`
- `apps/web/tests/create-anlassraum-handoff.contract.test.tsx`
- `apps/web/tests/branch-workspace-handoff.contract.test.ts`
- `apps/web/tests/runden-page.acceptance.test.ts`
- `apps/web/tests/anlassraum-runtime-creation.test.ts`

Zusatzvalidierung laut Task:

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- fokussierte Vitest-Suite fuer `/runden/new`, manual Anlassraum setup,
  no-ai-save, StartDraftContext, Anlassraum runtime creation, Create
  handoff und branch workspace handoff
- `pnpm -C apps/web run build`
