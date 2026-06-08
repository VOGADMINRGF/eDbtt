# CLOSED-COSMOS-UX-AUDIT-09

Status: done  
Datum: 2026-06-06

## Geprüfte Flows

- `/start -> /create`
- `/start -> /themen`
- `/start -> /runden/new`
- Reframe- und redaktioneller Pfad auf `/start`
- `/account` als Resume-Ort für lokale und persistierte Arbeitsstände
- Wechsel zwischen Arbeitsmodi über `StartDraftWorkspaceChooser`

## Ergebnisbild

Der geschlossene Kosmos wirkt jetzt konsistenter als Draft-/Resume-System:

- Nutzer geben den Text nur einmal ein.
- Alle zentralen Surfaces greifen denselben `StartDraftContext` auf.
- `GlobalDraftStatusBar` und `StartDraftWorkspaceChooser` rahmen denselben Arbeitsstand auf `/start`, `/create`, `/themen` und `/runden/new`.
- `/account` bleibt der zentrale Wiederaufnahme-Ort für lokale und persistierte Arbeitsstände.

## Statussprache

Bestätigt bzw. nachgehärtet:

- `Entwurf`
- `Lokaler Entwurf`
- `Noch nicht veröffentlicht`
- `Noch nicht gezählt`
- `Noch nicht zusammengeführt`
- `Noch keine Stimmen`
- `Zur manuellen Prüfung vorgemerkt`
- `Weiterarbeiten`

Kleine Korrekturen in diesem Slice:

- `/create` verwendet im Prüfpfad kein missverständliches `eingereicht` mehr, sondern `Arbeitsstand zur Prüfung vorgemerkt`.
- `/runden/new` markiert den Restore als `lokal gesicherter Entwurf`.
- `/account` spricht von `lokalen und dauerhaft gesicherten Entwürfen`, statt lokale Session-Drafts implizit wie persistierte Beiträge klingen zu lassen.

## Konfliktverhalten bei bestehenden Drafts

- `/create` überschreibt bestehende lokale Entwürfe nicht still, sondern bleibt beim expliziten Übernehmen-/Beibehalten-Pfad.
- `/runden/new` zeigt bei vorhandenem lokalem Anlassraum-Entwurf den Importkonflikt explizit an.
- `/account` trennt lokale Start-Drafts von persistierten Ledger-Arbeitsständen sichtbar.

## Account-Resume-Verhalten

- `Meine Arbeitsstände` bleibt ein echter Resume-Ort.
- Lokale Drafts bleiben klar lokal markiert und können verworfen werden.
- Persistierte Arbeitsstände zeigen Typ, Status, nächsten Schritt und `Weiterarbeiten`.
- Keine stille Hochstufung lokaler Session-Drafts zu produktiven Beiträgen.

## Guardrails

Über die auditierte Surface-Gruppe bestätigt:

- kein Auto-Publish
- kein produktiver Vote
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein DeepSearch
- kein produktiver Graph-Write
- keine Demo-/Fake-Daten als echte Arbeitsstände

## Mobile-QA

Code- und Contract-Prüfung:

- keine programmatischen Fokus-/Reload-Sprünge im Start-Handoff
- keine neue sticky/fixed Draft-Statusleiste in den auditieren Handoff-Surfaces
- Workmode-CTAs brechen über Grid/Flex um
- Runden-Optionen bleiben editierbar

Offen für echte Device-QA:

- `360x740`
- `390x844`
- `414x896`
- `430x932`

Noch manuell zu prüfen:

- keine horizontalen Scrollbars
- kein Refresh-Gefühl beim Surface-Wechsel
- keine Layoutsprünge durch Statusbar, Preview, Voxy oder WorkspaceChooser
- Account-Resume auf kleinen Viewports kompakt lesbar

## Tests und Ergebnis

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/start-create-light-entry.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/global-draft-status-bar.contract.test.tsx tests/branch-workspace-handoff.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/themen-surface-staging.contract.test.tsx tests/runden-manual-create.page.contract.test.tsx tests/manual-anlassraum-setup.contract.test.ts tests/closed-cosmos-ux-audit.contract.test.ts`

Ergebnis:

- Typecheck grün
- Lint grün
- relevante Closed-Cosmos-Contracts grün

