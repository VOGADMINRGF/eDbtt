# V3 Account Contribution Handoff Correlation Audit

Stand: 2026-07-07  
Branch: `pr/v3-account-contribution-handoff-correlation-03`

## Scope

Umgesetzt wurde `V3-ACCOUNT-CONTRIBUTION-HANDOFF-CORRELATION-03` als
vertraglicher und UI-seitiger Korrelations-Slice:

- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

Ziel war nicht, neue Persistenz oder eine Migration zu bauen, sondern die noch
offene Rueckfrage sauber zu beantworten:

`Welcher persisted Handoff gehoert wirklich zu welchem urspruenglichen Beitrag?`

## Inventarisierte bestehende Felder

Belastbare, heute wirklich vorhandene Korrelation:

- `PersistedCreateHandoffRecord.id`
- `AccountUserScopedRuntimeLinkage.persistedHandoffRef.createHandoffId`
- `workspace.provenance.sourceDraftId`
- `sourceHandoffId` in Dossier-, Anlassraum- und Participation-Runtime-Records
- `createdByUserId`
- `dossierId`

Vorhanden, aber fuer die Rueckverknuepfung nur indirekt nutzbar:

- `ledgerId`
- `packageId`
- `branchId`
- `ledgerBranchId`
- `selectedAction`
- `resumeHref`
- `sourceText`

Bewusst nicht als harte Wahrheit benutzt:

- reine Textgleichheit oder Textaehnlichkeit
- Topic-/Titel-Aehnlichkeit
- nur `dossierId + user` ohne weitere ID

## Neue typed Korrelationsschicht

Neue Dateien:

- `features/account/contributionHandoffCorrelationTypes.ts`
- `features/account/buildContributionHandoffCorrelations.ts`

Der neue Readmodel-Vertrag unterscheidet explizit:

- `exact`
- `strong`
- `partial`
- `suggested`
- `missing`
- `blocked`

und dokumentiert die Basis:

- `shared_id`
- `source_handoff_id`
- `source_draft_id`
- `ledger_branch_id`
- `provenance`
- `created_by_and_dossier_id`
- `existing_review_context`
- `existing_runtime_readmodel`
- `text_similarity_suggestion`
- `none`

Guardrail:

- `text_similarity_suggestion` kann nie `exact` oder `strong` erzeugen

## Was jetzt als exact / partial / suggested / missing gilt

### Exact

Nur bei wirklich geteilter Kennung oder expliziter harter Referenz:

- gemeinsame ID zwischen Beitrag und persisted Handoff
- spaetere `sourceHandoffId`-/`sourceDraftId`-/`ledgerBranchId`-Bruecken, falls
  sie im Bestand vorhanden sind

Die Typen und Tests erlauben diese Faelle, ohne heute Fake-IDs zu erfinden.

### Strong

Nur bei expliziter vorhandener Rueckreferenz wie:

- `sourceHandoffId`
- `sourceDraftId`
- `ledgerBranchId`

### Partial

Nur wenn bereits ein echter gemeinsamer Dossier-/Runtime-Kontext existiert,
aber die Rueck-ID fehlt:

- gleicher Nutzer
- gleiches `dossierId`
- passender Arbeitsmodus
- optional bestaetigt durch bestehendes Runtime-Readmodel

### Suggested

Nur als moegliche Verbindung und immer reviewpflichtig:

- gleiche oder sehr nahe `sourceText`-Wahrheit
- optional passender Arbeitsmodus

Nie mehr als `suggested`.

### Missing

Wenn keine harte oder partielle Beleglage existiert.

Das ist im aktuellen Bestand weiterhin haeufig der ehrliche Regelfall fuer die
Rueckverknuepfung `contribution_drafts`/Ledger -> persisted Handoff.

## Surface-Integration

### `/account`

`AccountResumeWorkbenchSection.tsx` zeigt pro lokalem Draft oder Ledger-Branch
jetzt einen additiven Block `Verknuepfung zum Arbeitsstand`.

Sichtbar werden:

- Handoff-Status
- Korrelationstaerke
- Korrelationsbasis
- Review-/Dossier-/Participation-/Output-/Voxy-Status
- warum die Verbindung belastbar ist
- warum sie noch nicht belastbar ist
- naechster Schritt

Persisted Handoffs ohne belastbare Rueckverknuepfung bleiben weiter als
separate `Verbundener Arbeitsstand`-Karten sichtbar, statt still an den
falschen Beitrag angehaengt zu werden.

### `/admin/review`

`Create-/Account-Herkunft` zeigt jetzt additiv:

- `Account-Linkage`
- humanisierte Korrelationsbasis
- Begruendung, wenn die Rueckverknuepfung noch offen ist

Damit ist fuer V3-Items sichtbar, ob die Herkunft nur persisted Handoff,
teilweise Account-gebunden oder rueckwaertig noch offen ist.

### `/dossier/[id]/studio`

Bei `provenance.sourceDraftId` wird weiter die belegte Herkunft aus einem
persisted Create-Arbeitsstand gezeigt.

Zusaetzlich sichtbar:

- `Rueckverknuepfung zum urspruenglichen Beitrag`
- Begruendung, falls diese Rueckverknuepfung noch nicht voll belastbar ist

So bleibt klar getrennt:

- `Workspace stammt aus diesem persisted Handoff`
- `urspruenglicher Nutzerbeitrag ist / ist nicht sicher rueckverlinkbar`

## Bewusst nicht getan

- keine neue Persistenz
- keine Migration
- keine neue Queue
- kein Auto-Handoff
- kein Auto-Publish
- kein Social Posting
- kein Voxy Render
- kein DeepSearch-Autostart
- keine Fake-Linkage

## Ergebnis

Der Slice schliesst die offene Vertragsluecke:

- harte Rueckverknuepfungen koennen typed als `exact` oder `strong` modelliert
  werden
- partielle und nur vorgeschlagene Verbindungen werden klar getrennt
- fehlende Rueck-ID bleibt explizit `missing`
- `/account`, `/admin/review` und `/dossier/[id]/studio` sprechen jetzt
  denselben ehrlichen Korrelationswortschatz

Der aktuelle Bestand wurde **nicht** kuenstlich hochgestuft. Wo die Rueck-ID
weiter fehlt, bleibt die UI bewusst bei `partial`, `suggested` oder `missing`.

## Tests

Neu oder erweitert:

- `apps/web/tests/account-contribution-handoff-correlation.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`
- `apps/web/tests/v3-account-user-scoped-runtime-linkage.test.ts`
- `apps/web/tests/review-queue.readmodel.test.ts`

Validiert:

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/account-contribution-handoff-correlation.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/v3-account-user-scoped-runtime-linkage.test.ts`
- `pnpm -C apps/web exec vitest run tests/review-queue.readmodel.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
