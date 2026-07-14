# V3 Preview Smoke Results After Agentic 2026-07-14

## Scope

- Task: `V3-PREVIEW-SMOKE-READINESS-AFTER-AGENTIC-COMPLETE-01`
- Branch: `pr/v3-preview-smoke-readiness-after-agentic-complete-01`
- Primary role: `governance_compliance`
- Supporting roles: `personal_voxy`, `dossier_briefing`
- Typ: docs-only readiness slice / keine Runtime-Aktivierung / keine Provider / keine Secrets / kein Auto-Publish

## Baseline verifiziert

- `main` war vor Start sauber und aktuell auf `ad27feebb2460578404e60366300050e37f75a6e`.
- `#363` bis `#389` liegen auf `main`.
- Der Controlled-Agentic-Track ist repo-seitig als Contract- und Surface-Wahrheit abgeschlossen:
  - `V3-AGENT-REGISTRY-RUNNER-BOOTSTRAP-01`
  - `V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01`
  - `V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01`
  - `V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01`
  - `V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01`
  - `V3-CIVIC-PRINCIPLES-GOV-LIGHT-MUNICIPAL-HANDOFF-DECISION-01`
  - `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01`
  - `V3-VOXY-EXPERIENCE-SHELL-MOBILE-AGENTIC-INTEGRATION-01`
  - `V3-AGENTIC-CIVIC-E2E-PILOT-01`

## Referenzen

- `docs/E150/V3_PREVIEW_SMOKE_READINESS_PLAN_2026-07-13.md`
- `docs/E150/V3_PREVIEW_SMOKE_RESULTS_2026-07-13.md`
- `docs/E150/V3_RELEASE_READINESS_REGRESSION_MATRIX_2026-07-13.md`
- `docs/E150/V3_VOXY_EXPERIENCE_SHELL_MOBILE_AGENTIC_INTEGRATION_2026-07-14.md`
- `docs/E150/V3_AGENTIC_CIVIC_E2E_PILOT_2026-07-14.md`

## Einordnung

- Preview: `gruen`, sofern der manuelle Smoke mit der Vorlage aus `V3_PREVIEW_SMOKE_RESULTS_2026-07-13.md` auf Local oder Vercel Preview ohne P0/P1-Befund durchlaeuft.
- Beta: `gelb`, weil nach dem Repo-Readiness-Stand weiterhin ein echter externer Browser-/Deploy-Smoke und Release-Ops-Hardening fehlen.
- Full Release: `rot`, weil `V3-EXTERNAL-BROWSER-E2E-01`, `V3-INCIDENT-RECOVERY-MAINTENANCE-01` und `V3-MONITORING-ALERTING-ROLLBACK-01` offen bleiben.
- Queue 03: `nein`. Der Agentic-Abschluss erzeugt keinen neuen autonomen Produkt-Cluster.

## Gruen / Gelb / Rot

### Gruen

- Public-, Create-, Dossier-, Account-, Language-, AI-Trace- und Admin-Guardrails sind repo-seitig abgedeckt.
- Voxy ist als Page-/Mobile-/Agentic Shell integriert, ohne Runtime, Provider oder Auto-Publish.
- Der Agentic-Civic-Pilot ist als review-first Pfad sichtbar, aber nicht als echte autonome Ausfuehrung.

### Gelb

- Der manuelle Preview-Smoke selbst ist noch nicht ausgefuellt; diese Datei erfindet keine Testergebnisse.
- Browser-, Device- und Deploy-Realitaet muss noch in der Smoke-Vorlage protokolliert werden.
- GOV-light, Municipal Handoff und Verified Publisher Preflight sind contract-first sichtbar, aber noch kein echter Release-Ops-Betriebsmodus.

### Rot

- Kein externer Browser-E2E-Run.
- Kein Incident-/Rollback-/Monitoring-Abschluss.
- Keine Runtime-, Provider-, Notification- oder Entitlement-Freigabe fuer agentische Aussenwirkung.

## Manuelle und automatisierte Pruefpfade

### 1. Public / Landing / Voxy

- Manuell pruefen:
  - `/` und `/start` auf klare CTA-Hierarchie, sichtbare Voxy-Shell und fehlende raw/unstyled Navigation.
  - Mobile-Viewport auf Voxy-Bildgroesse, Orbit-/Card-Layout und fehlenden Viewport-Overflow pruefen.
  - `/create`, `/pricing`, `/order` auf direkte, ehrliche Funnel-Sprache ohne hidden runtime oder hidden costs pruefen.
- Repo-Wahrheit:
  - Voxy ist Hero-/Guide-/Status-Schicht, nicht Runtime.
  - `/order` bleibt kanonischer Startpfad.
  - keine Fake-Live-, Publish- oder Wartelisten-Hauptwelt.
- Automatisierte Abdeckung:
  - `tests/landing-clarity.contract.test.tsx`
  - `tests/landing-information-architecture.contract.test.tsx`
  - `tests/mobile-entry-routes.contract.test.tsx`
  - `tests/order-entry.contract.test.ts`
  - `tests/pricing-page.contract.test.ts`
  - `tests/public-route-h1-visibility.contract.test.tsx`

### 2. Create

- Manuell pruefen:
  - `/create` im Voxy- und Direkt-Einstieg auf review-first Handoff, Vorschlagslogik und sichtbare Guardrails pruefen.
  - Sicherstellen, dass Formatvorschlaege Vorschlaege bleiben und keine Ja/Nein-Polarisierungsmaschine erscheint.
  - Keine Surface darf Auto-Publish oder Auto-Weiterleitung in einen Live-Zustand behaupten.
- Repo-Wahrheit:
  - observation != interpretation != hypothesis != fact
  - format recommendation != final participation decision
  - active Voxy nur nach bewusster Nutzeraktion
- Automatisierte Abdeckung:
  - `tests/create-mode.page.test.ts`
  - `tests/create-candidate-preview.contract.test.ts`
  - `tests/agentic-civic-e2e-pilot.contract.test.ts`
  - `tests/voxy-experience-shell.contract.test.ts`

### 3. Runden / Debattenstand

- Manuell pruefen:
  - `/runden` und oeffentliche Debattenstand-Pfade auf freie Lesbarkeit, Gegenargumente und Kontext pruefen.
  - Quellen-, Claims- und Sprachhinweise duerfen keine Fake-Evidenz erzeugen.
  - Translation darf nur als Lesefassung erscheinen.
- Repo-Wahrheit:
  - public Debattenstand remains free
  - translation != evidence
  - keine Fake-Quellen und keine verdeckten Gegenargumente
- Automatisierte Abdeckung:
  - `tests/runden-public-sharing-guide.contract.test.tsx`
  - `tests/dossier-public-route.contract.test.tsx`
  - `tests/content-translation-rendering.test.tsx`
  - `tests/language-bridge-trust-format-contract.test.ts`

### 4. Dossier

- Manuell pruefen:
  - `/dossier/[id]` und `/dossier/[id]/studio` auf `review_ready`, `publish_ready`, `published`, `share_preview` und Export-Grenzen pruefen.
  - Share-/Export-Hinweise duerfen keine oeffentliche Veroeffentlichung vortaeuschen.
- Repo-Wahrheit:
  - `publish_ready != published`
  - `review_ready != approved`
  - export/share/publish bleiben getrennt
- Automatisierte Abdeckung:
  - `tests/dossier-public-route.contract.test.tsx`
  - `tests/dossier-output-studio.page.contract.test.ts`
  - `tests/dossier-export-route-guards.test.ts`

### 5. Account / Organization

- Manuell pruefen:
  - `/account`, `/account/organization` und `/account/organization/dashboard` auf B2C/B2B/B2G-Trennung pruefen.
  - Personal Voxy muss consent-gated bleiben.
  - B2B/B2G duerfen keinen Personal-Companion-Zwang zeigen.
  - GOV-light-Slots muessen als institutioneller Status und nicht als Live-Runtime lesbar bleiben.
- Repo-Wahrheit:
  - B2C personal voxy optional and consented
  - B2B/B2G optional guided assistance or named contact
  - public reading remains free
- Automatisierte Abdeckung:
  - `tests/account-organization-page.contract.test.tsx`
  - `tests/account-organization-dashboard.page.test.tsx`
  - `tests/account-resume-workbench.contract.test.tsx`
  - `tests/voxy-experience-shell.contract.test.ts`

### 6. GOV-light / Municipal Handoff

- Manuell pruefen:
  - Organisations- und Admin-Surfaces auf drei aktive GOV-light-Slots, slot-freies Lesen/Teasern/Vormerken und slot-verbrauchendes Activate/Publish pruefen.
  - Municipal Handoff muss intern als CRM-/Pipeline-Schritt lesbar bleiben.
  - Keine externe Behördenbenachrichtigung und keine automatische Entitlement-Aktivierung.
- Repo-Wahrheit:
  - slot use only on active publish or activate
  - authority continuation != external notification
  - self-service != managed governance
- Automatisierte Abdeckung:
  - `tests/account-organization-dashboard.page.test.tsx`
  - `tests/admin-region-page.render.test.tsx`
  - `tests/admin-access-entitlements-surface.contract.test.tsx`
  - `tests/agentic-civic-e2e-pilot.contract.test.ts`

### 7. Verified Publisher Preflight

- Manuell pruefen:
  - `/account/organization/dashboard`, `/admin/review` und `/admin/system` auf Gruen/Gelb/Rot-Semantik pruefen.
  - Publish darf nur als bewusster Klick erscheinen.
  - Kein Agent darf Auto-Publish oder automatische Adoption andeuten.
- Repo-Wahrheit:
  - conscious publish click required
  - green/yellow/red remains mandatory
  - no agent auto publish
- Automatisierte Abdeckung:
  - `tests/admin-review.page.test.tsx`
  - `tests/admin-system-agentic-runtime-readiness.page.test.tsx`
  - `tests/agentic-civic-e2e-pilot.contract.test.ts`

### 8. Admin / Review / System

- Manuell pruefen:
  - `/admin/review` als zentrale Review-first Queue pruefen.
  - `/admin/system` auf Contract-/Preview-Wahrheit statt Fake-Runtime pruefen.
  - `/admin/access`, `/admin/entitlements`, `/admin/region` auf ehrliche Operator-Sprache pruefen.
  - Keine Provider-, Prompt-, Chain-of-Thought- oder Debug-Leaks in sichtbaren Admin-Surfaces.
- Repo-Wahrheit:
  - admin review remains canonical
  - agentic readiness is contract truth, not runtime truth
  - no provider or prompt leak in visible UIs
- Automatisierte Abdeckung:
  - `tests/admin-review.page.test.tsx`
  - `tests/admin-system-agentic-runtime-readiness.page.test.tsx`
  - `tests/admin-access-entitlements-surface.contract.test.tsx`
  - `tests/admin-region-page.render.test.tsx`
  - `tests/ai-trace-surface-truth.test.ts`
  - `tests/frontend-ai-transparency.contract.test.ts`
  - `tests/public-debug-leak.guard.test.ts`

### 9. Language Bridge

- Manuell pruefen:
  - Originalsprache, Lesefassung und Trust-Hinweise auf `/create`, `/admin/review`, `/dossier/[id]/studio`, `/account` pruefen.
  - Keine English-first-Verengung und keine Uebersetzung als Evidenz.
- Repo-Wahrheit:
  - original language remains evidence
  - translation is reading aid only
  - review states never derive from translation states
- Automatisierte Abdeckung:
  - `tests/content-translation-rendering.test.tsx`
  - `tests/language-bridge-trust-format-contract.test.ts`
  - `tests/create-i18n.contract.test.ts`

### 10. Regression / CI

- Repo-seitig verpflichtend:
  - fokussierte Preview-/Agentic-/Voxy-/Admin-/Language-Suite
  - `pnpm -C apps/web run lint`
  - `pnpm -C apps/web run build`
  - `pnpm -C apps/web run typecheck`
- Stop-Kriterium:
  - P0/P1-Leaks oder Build-/Typecheck-Regressionen blockieren Preview/Beta direkt.
  - Falls `typecheck` nur an bekannter `.next/types/**/*.ts`-Drift haengen sollte, muss das explizit dokumentiert werden und darf nicht stillschweigend gruengerechnet werden.

## Folgeentscheidungen nach diesem Slice

- `V3-EXTERNAL-BROWSER-E2E-01`: `ja`, als naechster sinnvoller Runner nach dem manuellen Smoke.
- `V3-NOTIFICATIONS-REALTIME-MAIL-01`: `nein` fuer den aktuellen Preview-Scope; erst relevant, wenn reale Notification-Wege bewusst freigegeben werden.
- `V3-MONITORING-ALERTING-ROLLBACK-01`: `ja`, vor breiterem Beta- oder Release-Betrieb.
- `V3-INCIDENT-RECOVERY-MAINTENANCE-01`: `ja`, vor breiterem Beta- oder Release-Betrieb.

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/order-entry.contract.test.ts tests/pricing-page.contract.test.ts tests/create-mode.page.test.ts tests/create-candidate-preview.contract.test.ts tests/runden-public-sharing-guide.contract.test.tsx tests/dossier-public-route.contract.test.tsx tests/dossier-output-studio.page.contract.test.ts tests/dossier-export-route-guards.test.ts tests/account-organization-page.contract.test.tsx tests/account-organization-dashboard.page.test.tsx tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/admin-system-agentic-runtime-readiness.page.test.tsx tests/admin-access-entitlements-surface.contract.test.tsx tests/admin-region-page.render.test.tsx tests/voxy-experience-shell.contract.test.ts tests/agentic-civic-e2e-pilot.contract.test.ts tests/ai-trace-surface-truth.test.ts tests/frontend-ai-transparency.contract.test.ts tests/content-translation-rendering.test.tsx tests/language-bridge-trust-format-contract.test.ts tests/create-i18n.contract.test.ts tests/public-debug-leak.guard.test.ts`
  - Ergebnis: `26` Dateien, `93/93` Tests gruen
- `pnpm -C apps/web run lint`
  - Ergebnis: gruen
- `pnpm -C apps/web run build`
  - Ergebnis: gruen
- `pnpm -C apps/web run typecheck`
  - Ergebnis: gruen

Hinweise:

- `landing-clarity.contract`, `landing-information-architecture.contract` und `mobile-entry-routes.contract` emittieren weiter bekannte React-Warnungen zu nicht-booleanschen `fill`- und `priority`-Attributen, laufen aber gruen und blockieren diesen Docs-/Readiness-Slice nicht.

Hinweis:

- Diese Datei dokumentiert Readiness, Pfade und Guardrails nach dem Controlled-Agentic-Abschluss.
- Reale manuelle Beobachtungen gehoeren weiterhin in `docs/E150/V3_PREVIEW_SMOKE_RESULTS_2026-07-13.md`.
