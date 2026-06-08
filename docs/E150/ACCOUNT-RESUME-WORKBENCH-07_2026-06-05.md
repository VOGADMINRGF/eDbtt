# ACCOUNT-RESUME-WORKBENCH-07

## Ziel

`/account` soll nicht nur Ablage sein, sondern ein echter Weiterarbeitsbereich für offene
Entwürfe, StartDraft-Handoffs und persistierte `/create`-Arbeitsstände.

## Umgesetzter Stand

Neu ist ein eigener Bereich `Meine Arbeitsstände` im Account.

Er bündelt zwei Quellen:

- lokale Start-Drafts aus dem sessionbasierten `StartDraftContext`
- persistierte `/create`-Arbeitsstände aus dem bestehenden Contribution-Ledger

Der Bereich ist bewusst nur ein Resume-/Orientierungs-Workspace. Es gibt keine neue
Produktlogik für Veröffentlichung, Zählung, Merge oder automatische Prüfung.

## Resume-Verhalten

### Lokaler Start-Draft

Wenn ein lokaler Start-Draft existiert, erscheint er im Account als eigener Arbeitsstand mit:

- Textauszug
- Typ `Beitrag`, `Thema`, `Runde` oder `Redaktion`
- Status wie `Entwurf` oder `Zur manuellen Prüfung vorgemerkt`
- Guardrails wie `Noch nicht veröffentlicht`
- CTA `Weiterarbeiten`
- CTA `Verwerfen`

Weiterarbeiten führt je nach `targetHint` zurück nach:

- `/create?startDraft=1`
- `/themen?startDraft=1`
- `/runden/new?startDraft=1&from=account`
- bei Review-/Reframe-Kontexten zurück in den redaktionellen Startpfad `/start?review=editorial`

Verwerfen löscht nur lokale Start-/Landing-Draft-Artefakte. Es wird nichts serverseitig
gelöscht oder in produktive Beiträge übersetzt.

### Persistierte `/create`-Arbeitsstände

Persistierte Ledger-Einträge werden im Resume-Block branch-scoped zusammengefasst.
Jeder Themenast zeigt:

- Titel
- Kurzbeschreibung
- Typ `Beitrag`, `Thema`, `Runde` oder `Redaktion`
- Status wie `Entwurf`, `Ort noch offen`, `Prüfung offen`
- nächsten sinnvollen Schritt
- CTA `Weiterarbeiten`

Die Hrefs bauen auf dem bestehenden Handoff-/Ledger-Stand auf:

- QR-/Swipe-Vorbereitung führt in den vorhandenen Round-/Swipe-Pfad
- Prüfpfade führen in den vorhandenen Factcheck-/Review-Pfad
- Place-Clarification führt in den vorhandenen `/create`-Fortsetzungspfad
- reine Speicherfälle bleiben im Ledger-/Account-Detail

## Leerer Zustand

Wenn weder lokaler Start-Draft noch persistierte Arbeitsstände existieren, zeigt `/account` einen
ruhigen leeren Zustand mit:

- `Neuen Beitrag starten`
- `Themen ansehen`

Der Bereich wirkt damit nicht leer oder abweisend.

## Mobile

- kompakte Karten
- keine sticky/fixed Resume-Bar
- keine horizontale Scrolllogik
- keine erzwungenen Fokus-/Scroll-Sprünge

## Bestätigte Guardrails

- kein Auto-Publish
- kein produktiver Graph-Write
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein produktiver Vote
- keine stille Persistierung von sessionStorage-Drafts als echte Beiträge
- lokale Drafts bleiben explizit als `Lokaler Entwurf` gekennzeichnet

## Tests und Ergebnis

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/account-resume-workbench.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/themen-surface-staging.contract.test.tsx tests/runden-manual-create.page.contract.test.tsx tests/manual-anlassraum-setup.contract.test.ts`

Ergebnis:

- Typecheck grün
- Lint grün
- 7/7 Testdateien grün
- 27/27 Tests grün

## Offene Punkte

- `BRANCH-WORKSPACE-HANDOFF-08` bleibt der nächste Folgeslice, um branch-spezifische
  Weiterarbeitsräume noch konsistenter zu machen.
- Echte Browser-QA für sehr kleine Mobile-Viewports bleibt separat.
