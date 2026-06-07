# WORKTREE-ISOLATE-RUNDEN-UX-00C

Datum: 2026-06-06
Repo: `edebatte-org`
Scope: `UX-RUNDEN-GUIDE-ENTRY-02` isolierbar machen, ohne neue Produktlogik

## Geprüfte Dateien

```text
apps/web/src/app/globals.css
apps/web/src/components/voxy/VoxyGuide.tsx
apps/web/src/app/runden/page.tsx
apps/web/src/app/runden/new/AnlassraumSetupForm.tsx
apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx
apps/web/src/app/runden/new/AnlassraumOptionEditor.tsx
apps/web/src/app/runden/new/AnlassraumVisibilitySettings.tsx
apps/web/src/app/runden/new/AnlassraumSupportSettings.tsx
apps/web/src/app/runden/new/AnlassraumPrePublishCheck.tsx
apps/web/src/app/runden/RundenPublicInputPanel.tsx
apps/web/src/app/runden/RundenPublicSharingGuide.tsx
apps/web/src/features/voxy/voxyCopy.ts
apps/web/src/features/voxy/rundenVoxyCopy.ts
apps/web/tests/runden-page.acceptance.test.ts
apps/web/tests/runden-manual-create.page.contract.test.tsx
apps/web/tests/runden-working-surface-copy.contract.test.ts
```

## `globals.css` Hunk-Zuordnung

### Runden-UX

Eindeutig Runden-/Anlassraum-spezifisch und jetzt bewusst benannt:

```text
.runden-hero-title
.anlassraum-hero-title
.anlassraum-soft-signal
.runden-step-line
.anlassraum-step-track
.anlassraum-step-item
.anlassraum-step-count
.anlassraum-step-body
.anlassraum-step-label
.anlassraum-step-lead
@media-Regeln für .anlassraum-step-track und .anlassraum-step-item
```

Status:
- Source geändert
- Runden-Markup auf diese Selektoren umgestellt
- diese Hunks sind jetzt für einen Runden-Isolationscommit sauber zuordenbar

### Start/Create/Draft

Nicht angefasst, klar fremd zum Runden-Slice:

```text
.landing-*
.public-start-*
```

Zusätzlich im selben Diff fremd:

```text
min-height: 100svh / overscroll-behavior-y auf Landing/Public-Shell
Landing-Layout-, Hero- und Preview-Hunks
```

### Voxy allgemein

Shared/übergreifend, nicht nur Runden:

```text
.public-voxy-stage
.public-voxy-aura
.public-voxy-marker
```

### Unklar / shared

Weiterhin nicht rein Runden-spezifisch:

```text
.public-shell
.public-reader-grid
.public-hero-title
.public-hero-lead
.public-section-title
.public-color-rail
.public-action-row
.public-canvas p, li
```

Bewertung:
- `globals.css` ist nicht als ganze Datei sauber rein Runden
- aber die Runden-relevanten Hunks sind jetzt deutlich abgegrenzt
- für einen echten Isolationscommit dürften nur die klaren `runden-*` / `anlassraum-*` Hunks mitgenommen werden

## `VoxyGuide.tsx` Hunk-Zuordnung

### Runden-Guide

Keine eindeutigen Runden-spezifischen Hunks.

### Start-Guide

Keine ausschließlich Start-spezifischen Hunks, aber Start ist direkt mitbetroffen.

### Allgemeiner Voxy-Guide

Alle Diff-Hunks sind allgemein:

```text
Avatar-Breiten für hero/panel
Hero-Min-Height
Marker-Typografie
```

Diese Änderungen wirken auf Start, Runden, Create und ggf. weitere Voxy-Surfaces gleichzeitig.

### Unklar

Keine zusätzliche Unklarheit über die Generalität hinaus; die Datei ist einfach shared.

Bewertung:
- `VoxyGuide.tsx` ist für den Runden-Slice nicht sauber
- keine Source-Änderung in diesem Slice
- `VoxyGuide.tsx` darf beim Runden-Isolationscommit nicht mit rein

## Weitere Entkopplung in diesem Slice

### Runden-Copy aus `voxyCopy.ts` herausgelöst

Neu:
```text
apps/web/src/features/voxy/rundenVoxyCopy.ts
```

Zweck:
- Runden nutzt jetzt nur noch eine eigene Copy-Datei
- `apps/web/src/features/voxy/voxyCopy.ts` bleibt gemischt mit Start/Create-Copy und muss nicht mehr in den Runden-Commit

Status:
- Source geändert
- keine neue Logik, nur importseitige Isolation

## Gehört jetzt eindeutig zu `UX-RUNDEN-GUIDE-ENTRY-02`

Dateien:
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
```

Mit Einschränkung:
```text
apps/web/src/app/globals.css
```

Nur die klaren `runden-*` / `anlassraum-*` Hunks gehören hinein. Nicht die shared oder Start-Hunks.

## Darf beim Runden-Isolationscommit NICHT mit rein

```text
apps/web/src/components/voxy/VoxyGuide.tsx
apps/web/src/features/voxy/voxyCopy.ts
apps/web/src/app/account/AccountClient.tsx
features/account/service.ts
features/account/types.ts
alle Factcheck-/Graph-/ReviewQueue-/TruthGuard-Dateien
alle Start/Create/Draft-Dateien außerhalb der bereits isolierten AnlassraumStartDraftPanel-Komponente
```

Zusätzlich:
- aus `globals.css` dürfen die shared `landing-*`, `public-start-*`, `public-*` Querschnittshunks nicht in den Runden-Isolationscommit

## Wurde Source geändert?

Ja.

Geändert:
```text
apps/web/src/app/globals.css
apps/web/src/app/runden/page.tsx
apps/web/src/app/runden/new/AnlassraumSetupForm.tsx
apps/web/src/app/runden/new/AnlassraumPrePublishCheck.tsx
apps/web/src/features/voxy/rundenVoxyCopy.ts
```

Bereits aus 00B vorhanden und weiter relevant:
```text
apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx
```

## Wurde `OpenTasks.md` geändert?

Nein.

## Ist `UX-RUNDEN-GUIDE-ENTRY-02` jetzt isoliert commitbar?

Ja, mit klarer Grenze:
- die Runden-Dateien oben
- `rundenVoxyCopy.ts`
- nur die expliziten `runden-*` / `anlassraum-*` Hunks aus `globals.css`

Nicht sauber commitbar wären dagegen:
- die gesamte `globals.css` als Voll-Datei
- `VoxyGuide.tsx`
- `voxyCopy.ts`

## Verbleibende Risiken

- `globals.css` bleibt als Gesamtdatei gemischt; der Isolationscommit muss dort hunk-genau geschnitten werden
- `VoxyGuide.tsx` bleibt shared und gehört nicht in den Runden-Slice
- andere Cluster im Repo sind weiterhin offen; dieser Slice löst nur die Runden-Isolation

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

## Fazit

- `VoxyGuide.tsx` ist nicht Teil des Runden-Slices
- `voxyCopy.ts` ist nicht mehr Teil des Runden-Slices
- die Runden-spezifischen Styles in `globals.css` sind jetzt klar benannt
- `UX-RUNDEN-GUIDE-ENTRY-02` ist dadurch separat isolierbar, sofern `globals.css` hunk-genau statt als Voll-Datei behandelt wird
- `END-TO-END-CLOSED-PROCESS-QA-19` darf weiterhin nicht gestartet werden, bis alle Cluster sauber isoliert sind
