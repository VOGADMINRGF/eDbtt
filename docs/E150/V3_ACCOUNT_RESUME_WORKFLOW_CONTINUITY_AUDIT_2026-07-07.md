# V3 Account Resume Workflow Continuity Audit

Stand: 2026-07-07  
Branch: `pr/v3-account-resume-workflow-continuity-01`

Scope: bestehende Account-/Resume-/Draft-Wahrheit so verdichten, dass Nutzer
im Account nachvollziehen können, was aus ihrem Beitrag wurde. Keine neue Route,
keine neue Queue, keine neue Persistenz, keine Auto-Aktivierung und keine neue
Runtime-Architektur.

## Verwendete Fläche

- `/account`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`

Bewusst genutzt wurde die vorhandene Resume-Workbench, weil dort bereits die
bestehenden user-scoped Wahrheiten zusammenlaufen:

- lokaler `StartDraftContext`
- servergesicherte `/create`-Ledger-Einträge aus `contribution_drafts`
- bestehende Handoff-/Review-Vorbereitung aus `branchHandoffTargets`

Nicht genutzt wurden Admin- oder globale Review-Flächen, weil der Slice eine
ehrliche Nutzerantwort auf die Frage liefern soll: `Was wurde aus meinem Beitrag?`

## Umgesetzter Slice

### 1. Neuer Nutzer-Presenter

`apps/web/src/features/create/V3AccountResumeWorkflow.tsx` führt bestehende
Account-Wahrheit in einer kleinen read-only Statuskarte zusammen.

Sichtbar werden je Arbeitsstand:

- Beitrag erhalten
- Beitrag klassifiziert
- Thema / möglicher Anschluss erkannt
- Formatvorschlag vorhanden
- Review oder Rückfrage
- Dossier-Kandidat
- Anlassraum / Beteiligung
- Output / Social
- Voxy-Briefing
- aktueller Status
- nächster sinnvoller Schritt

Die Statussprache bleibt nutzerseitig und vermeidet rohe interne Enums oder
Debug-Begriffe.

### 2. Additive Integration in die bestehende Account-Workbench

`AccountResumeWorkbenchSection.tsx` rendert die neue V3-Karte jetzt additiv
pro bestehendem Arbeitsstand:

- lokale Start-Drafts
- servergesicherte `/create`-Ledger-Branches

Der bisherige Resume-Pfad, bestehende CTAs und Guardrails bleiben erhalten.

### 3. Ehrliche Grenzen

Der Slice behauptet bewusst **nicht**:

- dass ein Draft schon in der globalen Review-Queue liegt
- dass `review_ready` schon `approved` wäre
- dass `publish_ready` schon `published` wäre
- dass schon ein echtes Dossier, ein echter Anlassraum oder ein echter
  Beteiligungsraum entstanden ist
- dass Output-/Social-/Voxy-Runtime im Account schon real verdrahtet wäre

Stattdessen wird sauber unterschieden zwischen:

- vorhandener Draft-/Ledger-Wahrheit
- vorbereiteten Folgepfaden
- `readmodel_only`
- fehlender belastbarer Downstream-Wahrheit

## Sichtbare Zustände

### Lokale Start-Drafts

- bleiben explizit `lokal`
- zeigen Einordnung, mögliche Themenanschlüsse und Review-/Rückfragebedarf
- markieren Dossier-, Participation-, Output- und Voxy-Pfade nur dort, wo
  heute belastbare Vorbereitung sichtbar ist

### Servergesicherte `/create`-Arbeitsstände

- zeigen, dass der Beitrag dauerhaft als Arbeitsstand gesichert wurde
- machen Themenast, Formatvorschlag und Review-/Quellenvorbereitung sichtbar
- zeigen Beteiligungsentwürfe ehrlich als vorbereitet, aber nicht aktiv
- zeigen Dossier-/Output-/Voxy-Folgepfade nur als vorbereitet oder
  `readmodel_only`, solange keine echte user-scoped Runtime-Wahrheit im Account
  geladen wird

## Guardrails, die unverändert bleiben

- Kein Auto-Publish
- Keine öffentliche Aktivierung ohne Review
- Kein Social Posting
- Kein Voxy Rendering
- Kein DeepSearch-Autostart
- Kein Auto-Graph-Write
- Kein Auto-Merge
- Keine Fake-Runtime-Wahrheit
- Draft ist nicht Veröffentlichung
- Vorschlag ist nicht Entscheidung
- `review_ready` ist nicht `approved`
- `publish_ready` ist nicht `published`

## Tests

- `apps/web/tests/v3-account-resume-workflow.test.tsx`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`

## Bewusst offen

- echte user-scoped Persisted-Handoff-/Review-/Dossier-/Participation-Linkage
  im Account
- echte Output-/Social-/Voxy-Runtime-Wahrheit im Nutzer-Account

## Nächster sinnvoller Slice

- `V3-ACCOUNT-USER-SCOPED-REVIEW-RUNTIME-LINKAGE-02`
