# FACTCHECK-SEAL-PRODUCTION-01

Stand: 2026-05-24
Status: umgesetzt

## Ziel

`/factcheck`, `/admin/factcheck` und `/admin/review` nutzen fuer v1 jetzt einen gemeinsamen
review-first Faktcheck-/Seal-Pfad:

- Pruefungen werden bewusst angefragt
- kein automatischer DeepSearch-Lauf
- kein automatischer kostenpflichtiger Provider-Lauf
- kein automatisches Siegel
- keine automatische oeffentliche Sichtbarkeit
- Org-Scope, Membership, Entitlement und Vertragslage bleiben getrennt sichtbar

## Produktlesart v1

`Factcheck/Seal` ist fuer `production_ready-v1` nur in dieser begrenzten Lesart freigegeben:

- die Anfrage ist persistent und auditierbar
- Provider-/Deep-Research bleibt explizit freigabepflichtig
- Quellenlage und Grenzen werden ehrlich dokumentiert
- `sealEligible` ist nie gleich `sealGranted`
- ein oeffentlich sichtbares Siegel entsteht nur nach bewusster Betreiberentscheidung
- `publication_approved` und `public_official` entstehen nie automatisch

Das ist kein Claim fuer Auto-Factcheck, Auto-Seal oder vollautomatische Research-Orchestrierung.

## Runtime-Aenderungen

### 1. Persistente Domain-Wahrheit

`features/factcheck/db.ts` fuehrt jetzt einen persistierbaren Workflow-Contract fuer:

- `FactcheckStatus`
- `FactcheckVerificationMode`
- `FactcheckResearchMode`
- `FactcheckSealEligibility`
- `FactcheckSealDecision`
- `FactcheckAuditEvent`

Gespeichert werden jetzt zusaetzlich:

- `organizationId`
- `regionId`
- `requestedByUserId`
- `sourceRefs`
- `materialRefs`
- `limitations`
- `accessContext`
- `publicSealVisible`
- `auditEvents`

### 2. Kein Auto-Provider, kein Auto-Seal

`/api/factcheck/enqueue` erzeugt nur noch einen review-first Request.

- `withSerp` oder `deepSearch` fuehren nicht mehr zu einem automatischen Lauf
- stattdessen entstehen ehrliche Zustande wie `needs_source` oder `provider_review_required`
- Quellenmangel bleibt sichtbar und auditierbar

### 3. Scope- und Rechtehaertung

`features/factcheck/access.ts` und die Factcheck-Routen erzwingen:

- Org A sieht Org B nicht
- Betreiberkontext bleibt explizit
- Seal-Entscheidungen sind Betreiber/Admin-only
- Nutzer ohne produktive Org-Lage bekommen sichere limitierte Zustande statt Fake-Erfolg

### 4. Seal-Entscheidung getrennt von Eligibility

`/api/factcheck/status/[jobId]/seal` trennt jetzt:

- `sealEligible`
- `sealGranted`
- `publicSealVisible`

Moegliche bewusste Aktionen:

- `grant`
- `revoke`
- `archive`

### 5. Review Queue / Admin

`features/reviewQueue.ts` fuehrt `factcheck_request` als eigene Review-Domain.

`/admin/review` zeigt jetzt fuer Factcheck-/Seal-Faelle:

- Research-Modus
- Siegelentscheidung
- Quellenhinweis-Anzahl
- Scope-Zusammenfassung
- Audit-Hinweis

## Guardrails

Explizit weiter ausgeschlossen:

- automatischer DeepSearch
- automatischer kostenpflichtiger Provider-Run
- automatisches Siegel
- Auto-Publish
- automatisches `public_official`
- neue Produktparallelwelt

## Validierung

Gruen:

- `pnpm -C apps/web exec vitest run tests/create-factcheck-handoff.contract.test.ts tests/factcheck-enqueue.auth.route.test.ts tests/admin-review.page.test.tsx tests/review-queue.readmodel.test.ts tests/dossier-studio-workspace.route.test.ts tests/account-organization-dashboard.page.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `rm -rf apps/web/.next`
- `pnpm --filter @vog/web build`

## Ergebnis

`Factcheck/Seal` ist damit fuer v1 begrenzt `production_ready`, wenn der Pfad als bewusster,
persistenter, review-first und auditierbarer Betreiber-/Organisations-Workflow genutzt wird.

Optional spaeter offen bleiben:

- echte Provider-Orchestrierung
- tieferer Deep-Research-Freigabepfad
- Kosten-/Kontingentmodell
- breitere Siegelkriterien und externe Vermarktungslogik
