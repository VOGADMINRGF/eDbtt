# V3 Downstream KI Transparenz Handoff Audit

Stand: 2026-07-07

## Scope

Umgesetzt wurde `V3-DOWNSTREAM-KI-TRANSPARENZ-HANDOFF-04`.

Der Slice erweitert die bestehende V3-Transparenz von `/runden/new` und `/create`
auf reale Downstream- und Handoff-Surfaces:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

Nicht erweitert wurden:

- keine neue Queue
- keine neue Runtime-Persistenz
- keine neue KI-Orchestrierung
- kein neuer Provider- oder DeepSearch-Lauf
- kein Auto-Publish
- kein Social Posting
- kein Voxy-Render

## Wiederverwendete Wahrheit

Der Slice baut nur auf bestehenden Readmodels und Runtime-Kontexten auf:

- `CreateCandidatePreviewReadModel`
- `V3RuntimeWorkflowSurface`
- `V3ReviewContextSummary`
- `V3ReviewQueueWiringContext`
- `V3AccountResumeWorkflow`
- bestehende Draft-/Ledger-Wahrheit im Account

Es wurde bewusst keine zweite Produkt- oder Statuswelt eingefuehrt.

## Neu verdrahtet

Neue typed Schicht:

- `apps/web/src/features/create/V3DownstreamKiTransparency.tsx`

Die Schicht bildet pro Surface dieselben ehrlichen Downstream-Schritte ab:

- Beitrag aufgenommen
- Sprache und Übersetzung
- Thema und Einordnung
- Formatvorschlag
- Quellen- und Evidence-Pack
- Claims, Gegenpositionen und Fragen
- Dossier-Kandidat
- Anlassraum oder Beteiligungsformat
- Social- und Output-Drafts
- Voxy-Briefing und Skriptkandidat
- Review und menschliche Prüfung
- Betrieb, Kosten und Freigaben

Der Statuswortschatz bleibt klein und testbar:

- `done`
- `prepared`
- `in_review`
- `blocked`
- `failed`
- `not_started`

User-facing Copy zeigt diese Werte nur humanisiert:

- sichtbar
- vorbereitet
- in Prüfung
- blockiert
- fehlgeschlagen
- noch nicht aktiv

## Surface-Wahrheit

### `/create`

- nutzt den neuen Layer aus `CreateCandidatePreviewReadModel`
- zeigt vorbereitete Downstream-Schritte fuer Claims, Fragen, Dossier- und Participation-Kandidaten
- markiert Quellen-, Kosten- und Runtime-Freigaben ehrlich als offen oder blockiert
- startet weiterhin keine Downstream-Runtime

### `/account`

- nutzt nur vorhandene Draft-/Ledger-Wahrheit
- zeigt vorbereitete Folgepfade ehrlich als Arbeitsstand
- markiert fehlende user-scoped Review-/Dossier-/Participation-Linkage bewusst als offene Runtime-Luecke
- behauptet weiterhin keine Admin-Queue- oder Dossier-Wahrheit im Nutzerkonto

### `/admin/review`

- erweitert bestehende `v3ReviewContext`-Items um einen zusaetzlichen Downstream-Transparenzblock
- zeigt Review-Rollen, Quellen-/Sprachpruefung, Dossier-/Participation-Kandidaten, Output-/Voxy-Kandidaten sowie Provider-/Runtime-Blocker
- veraendert keine Actions und startet keinen technischen Folgepfad

### `/dossier/[id]/studio`

- erweitert den bestehenden Studio-Review-Kontext um denselben Downstream-Block
- zeigt den Unterschied zwischen Dossier-Workspace, Output-Drafts, Voxy-Briefing und weiter offenen Review-/Provider-Gates
- behaelt die bestehende review-first Trennung zu Sichtbarkeit und Distribution bei

## Ehrlich offen bleibende Luecken

Bewusst `missing_runtime_truth` bzw. nur humanisiert als offen/blockiert markiert bleiben:

- echte user-scoped Review-/Dossier-/Participation-Linkage im Account
- echte Downstream-Kosten-/Entitlement-Wahrheit auf User-Surfaces
- eine belastbare Sprach-/Übersetzungsruntime auf `/create` und im Account
- echte Voxy-Render- oder Publish-Runtime
- echte Social-Connector-Ausfuehrung

Der relevante Folgepfad bleibt:

- `V3-ACCOUNT-USER-SCOPED-REVIEW-RUNTIME-LINKAGE-02`

## Keine neue Runtime

Runtime-Logik wurde in diesem Slice nicht erweitert im Sinn von:

- kein neuer Provider-Call
- kein neuer Queue-Write
- kein neuer Persistenzpfad
- kein neuer AI-Usage-Write
- kein Billing- oder Debit-Pfad

Geaendert wurde nur die Sichtbarkeit bestehender Wahrheit.

## Tests

Neu oder fortgeschrieben:

- `apps/web/tests/v3-downstream-ki-transparency.test.tsx`
- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

Validiert in diesem Slice:

- fokussierte Vitest-Suite fuer Downstream-KI-Transparenz, Create, Account, Admin Review und Dossier Studio
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `git diff --check`

## Abgrenzung

Dieser Slice schliesst den echten Transparenz-Handoff fuer bestehende
Downstream-Surfaces.

Nicht Teil dieses Slices:

- neue Claims-/Feeds-/Social-/Voxy-Runtime
- neue Anlassraum- oder Participation-Persistenz
- neue Kosten-/Debit-Logik
- neue `/runden/new`-Transparenz, weil diese bereits in den vorherigen V3-Slices
  fuer den Entry-Pfad abgedeckt wurde
