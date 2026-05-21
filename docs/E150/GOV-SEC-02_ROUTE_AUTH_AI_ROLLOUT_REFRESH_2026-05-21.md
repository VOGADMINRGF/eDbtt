# GOV-SEC-02 Route-/Auth-/AI Rollout Refresh (2026-05-21)

Status: fortgeschrieben  
Bezug: `GOV-SEC-02`, generischer Organisations-/Regionen-Rollout nach `AUTH-INTEGRATION-HARDENING-01`, `DB-BACKED-REVIEW-OPERATIONS-01`, `DB-BACKED-CONTENT-RELEASE-01`, `AUDIT-READSIDE-UNIFICATION-01`, `NON-ADMIN-MODERATION-PERMISSIONS-01`

## Ziel

Der urspruengliche Auditlauf aus `docs/E150/GOV-SEC-02_Audit_2026-03-26.md` war vor dem aktuellen Org-/Region-Rollout entstanden. Diese Fortschreibung prueft den heutigen Stand fuer:

- oeffentliche Routen
- authenticated Create-/Save-/Finalize-Pfade
- org-scoped Moderations- und Content-Release-Routen
- Betreiber-/Operator-Routen
- Source-/Region-Routen
- Dossier-/Topic-/Runden-Public-Pfade
- AI-/Research-/DeepSearch-Anbindungen

## Neu eingefuehrte maschinenlesbare Inventur

Code:

- `apps/web/src/features/security/routeSecurityInventory.ts`

Tests:

- `apps/web/tests/route-security-inventory.test.ts`

Die Inventur haelt pro Surface typisiert fest:

- `primaryClassification`
- `effectiveAccessClasses`
- `usesRequestScopeContext`
- `requiresValidSession`
- `operatorFallback`
- `orgIsolation`
- `pendingOrUnverifiedModerationBlocked`
- `operatorModeExplicit`
- `aiGuard`
- `publicationGuard`
- `auditCoverage`
- `sourceAnchors`

Abgedeckte Klassen:

- `public`
- `authenticated`
- `organization_scoped`
- `operator_only`
- `internal_system`
- `preview_review_only`

## Gepruefte Kernpfade

### Public

- `/api/contributions/analyze`
  - DeepSearch nur als explizites Opt-in (`allowDeepSearch`)
  - keine stillen Auto-Kosten
  - `noAutoPublish` + `noSilentMerge`
  - Material-/Research-Pfade bleiben review-first
- `/api/dossier/[id]`
  - review-only Drafts liefern `dossier_review_only`
  - kein Public-/Share-/QR-Leak fuer interne Staende
- `/topic/[slug]`
  - visible-only Public Surface
  - versteckte/archivierte/blockierte Zustaende mit ehrlichen Holding States
  - Share/QR erst nach bewusster sichtbarer Freigabe
- `/runden`
  - QR/Share nur fuer passende sichtbare und rollenseitig erlaubte Kontexte
- `/api/runden/public-input`
  - oeffentliche Hinweise/Fragen/Optionen gehen review-first in Participation Signals
  - kein Auto-Publish, kein Auto-Dossier, kein Auto-Anlassraum, kein Auto-Official

### Authenticated / Create

- `/api/contributions/save`
  - neu gehaertet: verlangt jetzt validen Session-Kontext statt barem `u_id`
  - RequestScope wird nur als Kontextzusammenfassung an den Draft angehaengt
- `/api/contributions/finalize`
  - neu gehaertet: verlangt jetzt validen Session-Kontext statt barem `u_id`
  - erzeugt vorgeschlagene Claims/Proposal-Artefakte, keine Veroeffentlichung
- `/api/create/handoffs`
  - `allowOperatorFallback: false`
  - Org-/Regionscope wird serverseitig geprueft
  - persistierte Handoffs bleiben reviewpflichtige Arbeitsstaende
- `/api/create/handoffs/[handoffId]`
  - Resume nur fuer Owner, scoped Organisation oder expliziten Betreiberkontext

### Org-scoped Moderation / Release

- `/api/account/organization/review/items/[itemId]`
  - `allowOperatorFallback: false`
  - fremde Items bleiben unsichtbar
  - pending/unverified bekommt keine Moderationsrechte
  - Review Operations sind auditierbar
- `/api/account/organization/review/content-release`
  - `allowOperatorFallback: false`
  - Sichtbarkeit nur mit vorhandener Berechtigung
  - `public_official` bleibt ausserhalb dieses Pfads

### Betreiber / Review / Region

- `/api/admin/review/items/[itemId]`
  - expliziter Betreiberkontext via `requireAdminOrResponse`
  - RequestScope markiert `Betreiber-Modus`
  - Review Operations sind auditierbar
- `/api/admin/review/content-release`
  - review-only Surface
  - scoped Publication oder Betreiberbetrieb, aber keine automatische Sichtbarkeit/Official-Freigabe
- `/api/admin/region/source-connections`
  - trotz `/admin`-Pfad effektiv scoped
  - Betreiber sieht global, Organisation nur gefilterte Connections/Results ihres Scopes
- `/api/admin/region/participation-signals/[id]/review`
  - Official Release bleibt expliziter menschlicher Entscheidungsweg
  - `approve_official`/`revoke_official` nur mit Betreiber- oder Publication-Approval-Kontext

### Internal / System

- `/api/internal/ops/status-report/scheduled`
  - getrennt ueber Secret-Header
  - kein Nutzer-/Operator-Loginpfad

## AI- und Kosten-Guardrails

Bestaetigt:

- keine stille DeepSearch-Aktivierung im oeffentlichen Analyze-Pfad
- keine automatischen Research-Kosten ohne expliziten Material-/Research-Kontext
- kein Auto-Publish
- kein Auto-Merge
- kein automatisches `public_official`
- Material-/Source-Pfade bleiben review-first

## Publication Guards

Bestaetigt:

- `public_official` bleibt Official-Release-Sonderpfad
- keine automatische Sichtbarkeit
- Public URL / QR / Share nur bei sichtbarem Status
- review-only bleibt intern

## Audit / Unified Activity

Der aktuelle Rollout traegt die sicherheitsrelevanten Review-to-Publish-Aktionen leseseitig zusammen:

- Review Operations
- Content Release
- Official Release
- Source Results

Belegt durch:

- `features/unifiedAuditReadside.ts`
- `features/reviewQueue.ts`
- `features/region/organizationDashboard.ts`
- `apps/web/tests/unified-audit-readside.test.ts`

`/admin/review` und `/account/organization/dashboard` nutzen denselben Unified Audit Readside-Stand.

## Findings dieser Fortschreibung

### F1 — Create Save/Finalize nutzten noch bare `u_id` statt validem Session-Kontext (behoben)

Beobachtung vor der Haertung:

- `/api/contributions/save`
- `/api/contributions/finalize`

lasen nur `u_id` aus den Cookies und prueften keinen validen Session-Kontext.

Umsetzung:

- beide Routen nutzen jetzt `getSessionUser(req)`
- Zugriff nur noch bei `sessionValid === true`
- Regressionstests fuer `401 not_authenticated` sind ergaenzt

## Offene Restpunkte nach diesem Audit

Keine neuen High-Severity-Route-/Auth-/AI-Blocker fuer den kontrollierten Pilot aus dieser Fortschreibung.

Weiter offen bleiben ausserhalb von `GOV-SEC-02`:

- `AUTH-PROVIDER-RUNTIME-INTEGRATION-01`
  - finale externe Provider-/Directory-/Membership-Aufloesung
- `PR-ADMIN-DASHBOARD-FULL-AUDIT-REPAIR-01`
  - verbleibende Live-/Browser-Auditpfade in weiteren Betreiberflaechen
- `GOV-SEC-03`
  - breiteres Zonen-/Trace-/Review-Modell fuer `production_ready`

## Validierung

- `pnpm -C apps/web exec vitest run tests/route-security-inventory.test.ts tests/request-scope-context.test.ts tests/create-mode.save.route.test.ts tests/create-mode.finalize.route.test.ts tests/create-handoff.persistence.route.test.ts tests/org-review-item-ops.route.test.ts tests/org-content-release.route.test.ts tests/admin-review-item-ops.route.test.ts tests/admin-region-source-connections.route.test.ts tests/topic-public-page.contract.test.tsx tests/runden-public-input.route.test.ts tests/unified-audit-readside.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`

## Fazit

`GOV-SEC-02` bleibt in der operativen SSOT `done`, ist jetzt aber fuer den generischen Org-/Region-Rollout neu belegt:

- Routeklassen sind typisiert inventarisiert
- Org-/Operator-/Public-/Internal-Pfade sind testlich verankert
- Create Save/Finalize verlangt validen Session-Kontext
- DeepSearch-/Publish-/Official-Guardrails bleiben explizit und nicht still
- Unified Audit ist fuer die reviewrelevanten Quellen lesbar zusammengefuehrt
