# PRODUCTION-READY-V1-CLOSURE-01

Stand: 2026-05-25

## V1-Produktdefinition

`production_ready-v1` bedeutet fuer eDebatte im definierten Produktmodus:

- veroeffentlichbarer, tragfaehiger Produktbetrieb auf bestehenden Pfaden
- persistente und auditierbare Produktionswahrheit
- klare Rechtewirkung ueber Membership, Entitlements, Vertrag und Scope
- ehrliche UI-Zustaende statt Scheinfreigabe
- review-first Grenzen ohne Auto-Publish, ohne automatisches `public_official`, ohne automatische `publication_approved`
- keine falschen Claims zu externer Register-, Checkout-, CRM-, Social- oder AI-Automation

## Geschlossene V1-Bloecke

- Self-Provisioning: `docs/E150/SELF-PROVISIONING-PRODUCTION-01_ORG_ONBOARDING_PROVISIONING_2026-05-23.md`
- Auth / Membership / Directory: `docs/E150/AUTH-MEMBERSHIP-DIRECTORY-MANUAL-VERIFICATION-PRODUCTION-01_OPERATOR_VERIFIED_DIRECTORY_2026-05-23.md`
- Entitlement Provisioning: `docs/E150/ENTITLEMENT-PROVISIONING-PRODUCTION-01_ACCESS_GRANTS_AFTER_ORG_APPROVAL_2026-05-23.md`
- Billing / Contract / Provisioning: `docs/E150/BILLING-CONTRACT-PROVISIONING-PRODUCTION-01_OPERATOR_VERIFIED_CONTRACT_2026-05-23.md`
- Source Connections: `docs/E150/SOURCE-CONNECTIONS-PRODUCTION-01_ORG_SCOPED_SOURCE_SNAPSHOTS_2026-05-23.md`
- Material Intake: `docs/E150/MATERIAL-INTAKE-PRODUCTION-01_REVIEW_FIRST_UPLOADS_PDF_YOUTUBE_2026-05-23.md`
- Material Persistence / Audit: `docs/E150/MATERIAL-STORAGE-EXTRACTION-PIPELINE-01_PERSISTENT_METADATA_REVIEW_QUEUE_2026-05-23.md`
- Create / Analyze E2E: `docs/E150/CREATE-ANALYZE-E2E-PRODUCTION-01_REVIEW_FIRST_CREATE_PIPELINE_2026-05-23.md`
- Anlassraum / Runden Runtime: `docs/E150/ANLASSRAUM-RUNTIME-PRODUCTION-01_ROOM_ROUND_LIFECYCLE_2026-05-24.md`
- Factcheck / Seal: `docs/E150/FACTCHECK-SEAL-PRODUCTION-01_RESEARCH_VERIFICATION_SEAL_WORKFLOW_2026-05-24.md`
- Release Gate / Longrun QA: `docs/E150/RELEASE-GATE-LONGRUN-QA-01_PRODUCTION_VALIDATION_RUNBOOK_2026-05-24.md`
- Social Publishing / Distribution: `docs/E150/SOCIAL-PUBLISHING-CI-PRODUCTION-01_REVIEW_FIRST_DISTRIBUTION_2026-05-24.md`
- Partner / Media / Funding Packages: `docs/E150/PARTNER-MEDIA-PACKAGES-PRODUCTION-01_PROJECT_PACKAGES_TRANSPARENCY_2026-05-24.md`

## Release-Gate

Kanonischer Release-Befehl:

```bash
pnpm run release:validate:production
```

Der Release ist nur releasable, wenn:

- der Gate-Lauf komplett gruen ist
- der Lauf unter Node 20.x und dem festgelegten pnpm erfolgt
- `apps/web/.next` frisch geloescht und danach sauber neu gebaut wurde
- Build, Typecheck und Lint im Gate gruen sind
- derselbe Commit anschliessend in Vercel ohne lokale Sonderpfade gruen baut

## Vercel-Ready-Regel

Ein Commit ist erst `Vercel Ready`, wenn:

- der lokale Release-Gate-Lauf gruen war
- der lokale Build ohne `.next`-Altzustand gruen war
- der Vercel-Build fuer denselben Commit gruen ist
- keine lokalen ENV-Tricks, Retry-Sonderwege oder Patches ausserhalb des Commits noetig waren

## Tagging-Regel

Vor dem Deploy:

```bash
git tag -a release-check/web-v1-YYYYMMDD-HHMM-SHA7 -m "local release gate green"
```

Nach gruenem Vercel-Deploy:

```bash
git tag -a release-ready/web-v1-YYYYMMDD-HHMM-SHA7 -m "vercel ready"
```

Rollback-Anker:

- letzter `release-ready/web-v1-*`-Tag

## No-Go-Regeln

- kein Auto-Publish
- kein automatisches `public_official`
- keine versteckten AI-Kosten
- keine Schein-Checkout-Integration
- keine Schein-Registerintegration
- keine Schein-CRM-Integration
- kein automatisches Factcheck-Siegel
- kein automatisches externes Social-Posting
- keine Vollcrawler-, Voll-PDF- oder Voll-YouTube-Automationsbehauptung

## Public Claims Audit

Fuer den finalen Launch-Readiness-Abschluss wurden die produktnahen Aussagen auf bestehenden Flaechen nachgezogen:

- `/pricing`: review-first, Betreiber-Verifikation, manuelle Vertragsfreigabe, kein externer Checkout- oder CRM-Claim
- `/pricing/institutionen`: keine direkte Checkout-Sprache mehr; Freischaltung laeuft ueber Anfrage, Betreiber-Verifikation und manuelle Vertragsfreigabe
- `/account/organization/dashboard`: bestehende v1-Copy bleibt auf auditierbare Freischaltung, optionale spaetere Integrationen und ehrliche Status fokussiert
- FAQ-/Produkttexte: keine KI-Vollautomationsbehauptung fuer Themenlage; stattdessen review-first vorstrukturierte Themenlage

## V2-Ausbauoptionen

Nicht launch-blockierend:

- echte externe Register-/Directory-Integration
- echte externe Checkout-/Billing-Integration
- echte externe CRM-/Accounting-Integration
- breitere Provider-/Research-/Factcheck-Automation
- tieferer Material-Storage-, Scan- und Extraktionsstack
- automatischer Scheduler oder externe Social-API-Distribution
- breiterer Self-Service ohne Betreiberkante

## Ergebnis

Die Gesamtplattform ist damit `production_ready-v1` im definierten Produktmodus.
