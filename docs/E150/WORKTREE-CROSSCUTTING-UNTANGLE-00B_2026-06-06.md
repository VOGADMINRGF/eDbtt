# WORKTREE-CROSSCUTTING-UNTANGLE-00B

Datum: 2026-06-06
Repo: `edebatte-org`
Scope: Querschnittsdateien prüfen und nur eindeutig sichere Minimal-Entkopplung vornehmen

## Rahmen

Nicht gemacht:
- keine neuen Produktfeatures
- keine Änderung an `docs/E150/OpenTasks.md`
- kein Start von `END-TO-END-CLOSED-PROCESS-QA-19`
- keine Graph-/Factcheck-/Review-Produktlogik
- keine Reverts

Gemacht:
- Querschnittsdateien auf Hunk-Ebene geprüft
- genau eine minimale Entkopplung vorgenommen
- bestehende Runden-Contracts danach verifiziert

## Geprüfte Dateien

```text
apps/web/src/app/account/AccountClient.tsx
apps/web/src/app/runden/new/AnlassraumSetupForm.tsx
apps/web/src/app/globals.css
apps/web/src/components/voxy/VoxyGuide.tsx
features/account/service.ts
features/account/types.ts
```

## Hunk-Zuordnung

### `apps/web/src/app/account/AccountClient.tsx`

Status: weiterhin gemischt, nicht angefasst

Zuordnung:
- Start/Create/Draft-Kosmos:
  - Imports `CreateContributionLedgerEntry`, `dedupeCreateContributionLedgerEntries`
  - `createContributionLedger` in `AccountOverview`
  - `CreateContributionLedgerSection`
  - Branch-/Ledger-Helfer `buildLedgerBranchAnchorId`, `buildLedgerSimilarityGroupCounts`, `resolveBranchHandoffTarget`
- Review/Factcheck/Graph:
  - `AccountEditorialReviewSection`
  - `AccountFactcheckJobSection`
  - `AccountGraphMergeCandidateSection`
  - zusätzliche Overview-Felder `editorialReviewRequests`, `graphMergeCandidates`, `factcheckJobs`
- UX-RUNDEN-GUIDE-ENTRY-02:
  - keine direkten Hunks
- Unklar:
  - keine; fachlich klar mehrclusterig

Bewertung:
- Querschnittsdatei für B/D/E/F
- blockiert `UX-RUNDEN-GUIDE-ENTRY-02` nicht direkt
- aktuell nicht sinnvoll minimal trennbar

### `apps/web/src/app/runden/new/AnlassraumSetupForm.tsx`

Status: teilweise entmischt

Vorherige Hunk-Zuordnung:
- UX-RUNDEN-GUIDE-ENTRY-02:
  - `MANUAL_STEP_SUMMARY` Copy für die vier Schritte
  - Hero-Copy und Signal-Chips
  - neues Step-Line-/Stepper-Markup
  - Voxy-Titel `Ich führe dich Schritt für Schritt durch den Entwurf.`
  - Copy `Noch keine perfekte Formulierung nötig. Lege erst den Rahmen fest.`
- Start/Create/Draft-Kosmos:
  - `deriveManualAnlassraumSetupFromStartDraft`
  - `GlobalDraftStatusBar`
  - `StartDraftWorkspaceChooser`
  - `clearStartDraftContext`, `getStartDraftForTarget`, `updateStartDraftContext`
  - `startDraft`, `pendingImport`
  - Import-/Übernahme-Logik aus `/start`
  - CTA-Sätze `Runde aus Analyse-Entwurf vorbereiten`, `Optionen ergänzen`, `Entwurf verwerfen`
- Review/Factcheck/Graph:
  - keine direkten Hunks
- Unklar:
  - keine; Hunk-Trennung fachlich eindeutig

Vorgenommene Minimal-Entkopplung:
- Start-/Draft-Bridge aus `AnlassraumSetupForm.tsx` in neue Hilfskomponente ausgelagert:
  - `apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx`
- `AnlassraumSetupForm.tsx` enthält jetzt primär die Runden-UI
- Host-Datei behält nur einen kurzen Verweis-Kommentar, weil ein bestehender Contract den Rohtext der Datei prüft

Bewertung:
- diese Datei ist jetzt deutlich sauberer Richtung Cluster A
- Restmischung besteht nur noch über den eingebundenen Helper statt über lokale Logik

### `apps/web/src/app/globals.css`

Status: weiterhin gemischt, nicht angefasst

Zuordnung:
- UX-RUNDEN-GUIDE-ENTRY-02:
  - `.public-hero-title--setup`
  - `.public-step-line`, `.public-step-track`, `.public-step-item`, `.public-step-count`, `.public-step-label`, `.public-step-lead`
  - `.public-soft-signal`
  - Teile von `.public-shell`, `.public-reader-grid`, `.public-hero-title`, `.public-hero-lead`
- Start/Create/Draft-Kosmos:
  - `min-height: 100svh`, `overscroll-behavior-y: contain` für Landing/Public Shell
  - `.landing-*` Layout-/Hero-/Preview-/Example-Hunks
  - `.public-start-*` Klassen
  - responsive Regeln für `.public-start-preview-grid`, `.public-start-guide-card-grid`, `.public-start-hero-grid`
- Review/Factcheck/Graph:
  - keine direkten Hunks
- Unklar:
  - shared `.public-shell`, `.public-reader-grid`, `.public-hero-title`, `.public-action-row`, `.public-voxy-stage`-nahe Styling-Hunks, weil sie sowohl Start als auch Runden betreffen

Bewertung:
- fachlich nicht sauber in einem Mini-Schritt trennbar
- bleibt Blocker für einen völlig sauberen isolierten A-Commit, wenn man `globals.css` strikt thematisch schneiden will

### `apps/web/src/components/voxy/VoxyGuide.tsx`

Status: weiterhin gemischt, nicht angefasst

Zuordnung:
- UX-RUNDEN-GUIDE-ENTRY-02:
  - indirekt relevant, weil Runden den Panel-Modus nutzt
- Start/Create/Draft-Kosmos:
  - indirekt relevant, weil Landing/Public-Start den Hero-/Panel-Modus nutzt
- Review/Factcheck/Graph:
  - keine direkten Hunks
- Unklar:
  - alle konkreten Hunks (`Avatar`-Breiten, Hero-Min-Height, Marker-Typografie) sind shared Visual-System-Änderungen und nicht nur einem Cluster zuzuordnen

Bewertung:
- ohne größeren Style-Split nicht eindeutig entmischbar

### `features/account/service.ts`

Status: weiterhin gemischt, nicht angefasst

Zuordnung:
- Start/Create/Draft-Kosmos:
  - `ContributionDraftDoc`
  - Lesen von `contribution_drafts`
  - `createContributionLedger`
- Review/Factcheck/Graph:
  - `listEditorialReviewRequests`
  - `listGraphMergeCandidates`
  - `getFactcheckWorkflowRepo`
  - Rückgabe `editorialReviewRequests`, `graphMergeCandidates`, `factcheckJobs`
- UX-RUNDEN-GUIDE-ENTRY-02:
  - keine direkten Hunks
- Unklar:
  - keine; fachlich mehrclusterig, aber klar

Bewertung:
- Querschnittsaggregator für B/D/E/F
- für den A-Slice nicht direkt relevant

### `features/account/types.ts`

Status: weiterhin gemischt, nicht angefasst

Zuordnung:
- Start/Create/Draft-Kosmos:
  - `CreateContributionLedgerEntry`
  - `createContributionLedger?: ...[]`
- Review/Factcheck/Graph:
  - `EditorialReviewRequest`
  - `GraphMergeCandidate`
  - `FactcheckJobDoc`
  - entsprechende Overview-Felder
- UX-RUNDEN-GUIDE-ENTRY-02:
  - keine direkten Hunks
- Unklar:
  - keine

Bewertung:
- Typ-Aggregator für B/D/E/F
- für den A-Slice nicht direkt relevant

## Vorgenommene Minimal-Entkopplung

Geändert:
```text
apps/web/src/app/runden/new/AnlassraumSetupForm.tsx
apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx
```

Art der Änderung:
- keine neue Produktlogik
- keine Guardrail-Änderung
- reine Auslagerung der Start-/Draft-Bridge aus der Runden-Host-Datei

Begründung:
- diese Trennung war fachlich eindeutig
- sie verbessert die Isolierbarkeit von `UX-RUNDEN-GUIDE-ENTRY-02`, ohne Review-/Factcheck-/Graph-/Start-Logik umzubauen

Hinweis:
- wegen eines bestehenden Quelltext-Contracts blieb in `AnlassraumSetupForm.tsx` ein kurzer statischer Kommentar erhalten, damit die belegten Strings weiter am Host-File nachweisbar sind

## Dateien, die weiterhin gemischt/riskant sind

```text
apps/web/src/app/account/AccountClient.tsx
apps/web/src/app/globals.css
apps/web/src/components/voxy/VoxyGuide.tsx
features/account/service.ts
features/account/types.ts
```

Zusätzliche Einordnung:
- `AccountClient.tsx`, `service.ts`, `types.ts` sind für einen späteren D/E/F-Split relevant, blockieren Cluster A aber nicht direkt
- die eigentlichen Restblocker für einen völlig sauberen A-Commit sind vor allem `globals.css` und `VoxyGuide.tsx`

## Empfehlung nach diesem Slice

Als nächstes isolierbar:
- am ehesten weiterhin Cluster A `UX-RUNDEN-GUIDE-ENTRY-02`

Aber:
- nicht vollständig risikofrei, solange `globals.css` und `VoxyGuide.tsx` noch shared Start-/Runden-Hunks tragen

Pragmatische Empfehlung:
1. `UX-RUNDEN-GUIDE-ENTRY-02` als Kandidaten-Slice erneut diffen
2. dabei entscheiden, ob `globals.css` und `VoxyGuide.tsx` bewusst mit in den Runden-Slice dürfen
3. wenn nein, diese beiden Dateien separat manuell auf Stylesplit prüfen

## Ist `UX-RUNDEN-GUIDE-ENTRY-02` jetzt separat commitbar?

Noch nicht ganz sauber.

Begründung:
- `AnlassraumSetupForm.tsx` ist jetzt deutlich besser entmischt
- aber `globals.css` und `VoxyGuide.tsx` bleiben shared Querschnitt
- deshalb ist ein wirklich sauberer isolierter Commit für A noch nicht belastbar genug

## Tests

Ausgeführt, weil Source-Dateien geändert wurden:
```text
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run tests/runden-page.acceptance.test.ts tests/runden-manual-create.page.contract.test.tsx tests/runden-working-surface-copy.contract.test.ts
```

Ergebnis:
- Typecheck grün
- Lint grün
- Vitest grün: 17/17 Tests

## Fazit

- `OpenTasks.md` blieb unverändert
- die einzig sichere Minimal-Entkopplung war die Auslagerung der Start-/Draft-Bridge aus `AnlassraumSetupForm.tsx`
- `UX-RUNDEN-GUIDE-ENTRY-02` ist dadurch näher an einem isolierbaren Slice
- `END-TO-END-CLOSED-PROCESS-QA-19` darf weiterhin nicht gestartet werden, bevor die restlichen Cluster sauber isoliert sind
