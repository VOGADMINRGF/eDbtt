# V1-DOSSIER-UPDATE-ENGINE-01

Stand: 2026-05-25
Status: done
Typ: Runtime-/Surface-Hardening auf bestehenden Dossier-Pfaden

## Ziel

Die Dossier Update Engine als V1-produktionsnahen Pfad schließen:

- `Create/Feed/Swipe/Anlassraum/Evidence -> Dossier-Vorschlag -> Review -> Dossier-Kontext -> öffentlicher Dossierstand`

Ohne Auto-Publish, ohne zweite Queue und ohne neue Parallelarchitektur.

## Umgesetzte Schwerpunkte

### 1. Shared Dossier-Update-Statusvertrag

Neue gemeinsame Statussprache für Dossier-Fortschreibung:

- `update_suggested`
- `source_hint_added`
- `claim_hint_added`
- `perspective_hint_added`
- `question_hint_added`
- `needs_review`
- `accepted`
- `attached_to_dossier`
- `published_in_dossier`
- `superseded`
- `archived`
- `rejected`
- `error`

Verankert in:

- `features/dossier/updateStatusContract.ts`

Die Begriffe werden im UI in einfache deutsche Lesefassungen übersetzt, etwa:

- `Update vorgeschlagen`
- `Quelle in Prüfung`
- `Offene Frage ergänzt`
- `Im Dossier-Kontext`
- `Veröffentlicht im Dossier`

### 2. Dossier-Update-Inputs auf bestehender Runtime gebündelt

Neues derived Readmodel:

- `features/dossier/updateReadModel.ts`

Gebündelte Inputs:

- Create-Handoffs
- Feed-Drafts / Feed-Radar-Hinweise
- Swipes / `statement_proposals`
- Anlassraum-/Runden-Kontext
- Evidence-/Claim-Hinweise

Wichtig:

- keine neue Collection für eine zweite Queue
- bestehende `dossier_suggestions` bleiben der reviewbare Vorschlagsspeicher
- derived Hinweise werden dort materialisiert, aber nicht automatisch akzeptiert oder veröffentlicht

### 3. Reviewpflichtige Dossier-Vorschläge bleiben auf bestehenden Pfaden

Nachgeschärft:

- `apps/web/src/app/api/dossiers/[dossierId]/suggestions/route.ts`
- `apps/web/src/app/admin/dossiers/[dossierId]/AdminDossierClient.tsx`

Ergebnis:

- bestehender Admin-Dossierpfad liest jetzt dieselben Update-Vorschläge mit:
  - Ursprung
  - vorgeschlagenem Abschnitt
  - Review-Hinweis
  - Risiko
  - nächster Aktion
- keine zweite Review-Queue
- Moderation bleibt auf bestehenden `accepted`/`rejected`-Schritten

### 4. Öffentliche Dossier-Fläche erklärt Stand und neue Hinweise sauber getrennt

Nachgeschärft:

- `apps/web/src/app/api/dossier/[id]/route.ts`
- `apps/web/src/app/api/dossiers/[dossierId]/route.ts`
- `apps/web/src/app/dossier/[id]/ui.tsx`

Ergebnis:

- öffentlicher Dossierstand zeigt jetzt:
  - geprüften bzw. sichtbaren Arbeitsstand
  - neue Hinweise in Prüfung
  - bereits im Dossier-Kontext sichtbare Updates
  - Quellenlage, offene Fragen und Perspektiven
  - Verknüpfung zu Anlassraum und Swipes
- keine amtliche Wahrheits- oder Siegelbehauptung

### 5. Dossier <-> Anlassraum <-> Swipes nachvollziehbar verknüpft

Nachgeschärft:

- `features/topicRound/entrySource.ts`
- `apps/web/src/app/runden/page.tsx`

Ergebnis:

- `/runden` zeigt jetzt neben Dossier-Link auch den letzten Dossierstand
- Dossier kann auf Anlassraum und Swipe-Karte verweisen
- Links bleiben auf bestehenden echten Routen

## Geänderte Dateien

- `features/dossier/updateStatusContract.ts`
- `features/dossier/updateReadModel.ts`
- `features/dossier/schemas.ts`
- `apps/web/src/app/api/dossier/[id]/route.ts`
- `apps/web/src/app/api/dossiers/[dossierId]/route.ts`
- `apps/web/src/app/api/dossiers/[dossierId]/suggestions/route.ts`
- `apps/web/src/app/api/dossiers/[dossierId]/suggestions/create/route.ts`
- `apps/web/src/app/dossier/[id]/ui.tsx`
- `apps/web/src/app/admin/dossiers/[dossierId]/AdminDossierClient.tsx`
- `features/topicRound/entrySource.ts`
- `apps/web/src/app/runden/page.tsx`
- `apps/web/tests/dossier-update-status-contract.test.ts`
- `apps/web/tests/dossier-update-inputs.contract.test.ts`
- `apps/web/tests/dossier-update-review-workflow.contract.test.ts`
- `apps/web/tests/dossier-public-update-context.contract.test.tsx`
- `apps/web/tests/dossier-anlassraum-swipes-linking.contract.test.ts`
- `apps/web/tests/v1-dossier-update-engine.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Validierung

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/dossier-update-status-contract.test.ts tests/dossier-update-inputs.contract.test.ts tests/dossier-update-review-workflow.contract.test.ts tests/dossier-public-update-context.contract.test.tsx tests/dossier-anlassraum-swipes-linking.contract.test.ts tests/v1-dossier-update-engine.contract.test.ts`

Zusätzlich revalidiert:

- `pnpm -C apps/web exec vitest run tests/dossier-public-route.contract.test.tsx tests/dossier-public-handoff-linking.contract.test.tsx tests/runden-public-anlassraum-status.contract.test.tsx`

## Guardrails weiterhin aktiv

- keine automatische Veröffentlichung
- keine automatische amtliche Wahrheit
- keine automatische Social-Ausleitung
- kein automatisches Siegel
- keine zweite Review-Queue
- keine automatische Dossier-Finalisierung

## Offen / bewusst nicht Teil dieses Slices

- Social-Live-Posting
- Stream-Runtime
- Billing-/Checkout-Ausbau
- neue externe Scheduler-/Crawler-Behauptungen
- tiefere Versionierungs- oder Diff-UI jenseits der bestehenden Revisionen

## Kurzfazit

Die Dossier Update Engine ist jetzt als ehrlicher V1-Pfad lesbar:

- Signale aus Create, Feed, Swipes, Anlassraum und Evidence werden zu reviewpflichtigen Dossier-Vorschlägen gebündelt
- Admin und Public Surface lesen dieselbe Fortschreibungslogik
- Dossier erklärt jetzt sauber, was sichtbarer Stand ist und was noch in Prüfung bleibt
- Anlassraum, Dossier und Swipes sind als bestehende Folgeflächen nachvollziehbar verbunden
