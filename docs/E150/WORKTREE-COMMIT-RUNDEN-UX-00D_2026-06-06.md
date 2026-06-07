# WORKTREE-COMMIT-RUNDEN-UX-00D

Datum: 2026-06-06
Repo: `edebatte-org`
Scope: isolierten Commit-Slice für `UX-RUNDEN-GUIDE-ENTRY-02` vorbereiten

## Status-Snapshot

Ausgeführt:
- `git status --short`
- `git diff --name-status`
- `git diff --stat`

Befund:
- Worktree weiterhin breit dirty
- Runden-Dateien sind nur ein Teil eines deutlich größeren offenen Zustands
- `OpenTasks.md` wurde nicht verändert

## Dateien, die fachlich zum Runden-Slice gehören

Eindeutig Runden:
```text
apps/web/src/app/runden/page.tsx
apps/web/src/app/runden/new/AnlassraumSetupForm.tsx
apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx
apps/web/src/app/runden/new/AnlassraumOptionEditor.tsx
apps/web/src/app/runden/new/AnlassraumVisibilitySettings.tsx
apps/web/src/app/runden/new/AnlassraumSupportSettings.tsx
apps/web/src/app/runden/new/AnlassraumPrePublishCheck.tsx
apps/web/src/app/runden/RundenPublicInputPanel.tsx
apps/web/src/app/runden/RundenPublicSharingGuide.tsx
apps/web/src/features/voxy/rundenVoxyCopy.ts
apps/web/tests/runden-page.acceptance.test.ts
apps/web/tests/runden-manual-create.page.contract.test.tsx
apps/web/tests/runden-working-surface-copy.contract.test.ts
docs/E150/UX-RUNDEN-GUIDE-ENTRY-02_2026-06-06.md
docs/E150/WORKTREE-CROSSCUTTING-UNTANGLE-00B_2026-06-06.md
docs/E150/WORKTREE-ISOLATE-RUNDEN-UX-00C_2026-06-06.md
docs/E150/WORKTREE-COMMIT-RUNDEN-UX-00D_2026-06-06.md
```

Bedingt relevant:
```text
apps/web/src/app/globals.css
```

Nur diese Hunks wären zulässig:
- `.runden-hero-title`
- `.anlassraum-hero-title`
- `.anlassraum-soft-signal`
- `.runden-step-line`
- `.anlassraum-step-track`
- `.anlassraum-step-item`
- `.anlassraum-step-count`
- `.anlassraum-step-body`
- `.anlassraum-step-label`
- `.anlassraum-step-lead`
- die zugehörigen Media-Query-Hunks für `.anlassraum-step-track` und `.anlassraum-step-item`

## Ausdrücklich ausgeschlossen

```text
apps/web/src/components/voxy/VoxyGuide.tsx
apps/web/src/features/voxy/voxyCopy.ts
apps/web/src/app/account/AccountClient.tsx
features/account/service.ts
features/account/types.ts
alle Factcheck-Dateien
alle GraphCandidate-Dateien
alle ReviewQueue-Dateien
alle TruthGuard-Dateien
alle Start/Create/Draft-Dateien außerhalb AnlassraumStartDraftPanel.tsx
```

Zusätzlich ausgeschlossen in `globals.css`:
- alle `landing-*` Hunks
- alle `public-start-*` Hunks
- alle allgemeinen shared `public-*` Hunks

## Wie `globals.css` behandelt wurde

`globals.css` wurde nicht staged und nicht committed.

Grund:
- die Datei bleibt als Ganzes gemischt
- ein sauberer Commit wäre nur hunk-genau möglich
- in diesem Slice wurde nur dokumentiert, welche Hunks zum Runden-Scope gehören

## Staging-/Commit-Entscheidung

Ergebnis:
- nichts staged
- nichts committed

Grund:
- der geforderte Runden-Slice ist unter der vorgegebenen Dateiliste noch nicht eigenständig baubar

Konkreter Blocker:
`apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx` hängt weiterhin an untracked Start-Helfern außerhalb des erlaubten Commit-Scope:

```text
apps/web/src/features/start/GlobalDraftStatusBar.tsx
apps/web/src/features/start/StartDraftWorkspaceChooser.tsx
apps/web/src/features/start/startDraftContext.ts
```

Diese Dateien sind für den Build des aktuellen Runden-Slices erforderlich, dürfen laut Vorgabe aber nicht mit in diesen Commit.

Zusätzlicher positiver Befund:
- die frühere Abhängigkeit auf `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts` wurde lokal in `AnlassraumStartDraftPanel.tsx` zurückgezogen und ist damit kein Commit-Blocker mehr

## Tests

Ausgeführt:
```text
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run tests/runden-page.acceptance.test.ts tests/runden-manual-create.page.contract.test.tsx tests/runden-working-surface-copy.contract.test.ts
```

Ergebnis:
- Typecheck grün
- Lint grün
- Vitest grün: `17/17` Tests

## Verbleibender Worktree-Drift

Breiter Drift bleibt bestehen:
- Account
- Start/Create/Draft
- TruthGuard
- Editorial Review
- Factcheck
- Graph/Merge
- Docs/OpenTasks

Dieser Slice löst nur die Runden-Isolation und hat dafür die Compile-/Commit-Grenze sichtbar gemacht.

## Nächster Cluster zur Isolation

Kein neuer Produktcluster.

Der nächste sichere Schritt wäre stattdessen:
- entweder die explizite Entscheidung, ob die drei Start-Helfer mit in den Runden-Commit dürfen
- oder die Runden-Start-Draft-Brücke vor einem Commit wieder aus dem Slice herauszunehmen

Ohne diese Entscheidung ist ein sauberer isolierter Commit für `UX-RUNDEN-GUIDE-ENTRY-02` unter den aktuellen Commit-Regeln nicht belastbar.
