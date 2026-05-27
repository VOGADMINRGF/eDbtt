# V1-ABSOLUTE-LAUNCH-LOCK-01

## Ziel

V1 nach `production_ready`, Public Topic Supply und Post-V1-Konsolidierung ohne neue Produktlogik auf letzte Launch-Härte prüfen:

- zentrale öffentliche und arbeitsnahe Routen
- Empty States
- Claim-Drift
- Release-Gate
- Build-/Typecheck-/Lint-Parität

Kein neues Feature, keine neue Feed-/Swipe-/Dossier-/Anlassraum-Runtime und keine Scope-Ausweitung Richtung Auto-Publish, Checkout, Social-Live-Posting oder Provider-Ausbau.

## Geprüfte Grundlagen

- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- V1-/Post-V1-Evidence-Dateien im Stand `2026-05-25` bis `2026-05-27`
- `.github/workflows/production-validation.yml`
- `package.json` → `release:validate:production`

## Route Smoke

Die Route-Prüfung wurde bewusst über bestehende Contracts, den Produktions-Build und das Release-Gate abgesichert, nicht über neue Demo- oder Smoke-Runtime.

### Öffentlich / B2C

| Route | Befund |
| --- | --- |
| `/start` | Kontextualisierter Einstieg vorhanden; Erstnutzer sehen Orientierung und Trust-Hinweise, vertraute Kontexte priorisieren Arbeitsaktionen. |
| `/create` | Review-first Intake bleibt klar; keine Auto-Publish-Behauptung. |
| `/swipes` | Öffentliche Themenversorgung bleibt produktnah, mit ehrlichem Empty State und Folge-CTAs. |
| `/runden` | Öffentlicher Anlassraum mit Status, Beteiligung und Folgepfaden bleibt verständlich. |
| `/anlassraum` | Sauberer Alias auf `/runden`, keine Parallelroute. |
| `/dossier/[id]` | Produktnaher Pfad ohne stillen Demo-Ersatz; explizite Demo nur bei bewusst erlaubtem Demo-Kontext. Dokumentierter Test-/Seed-Pfad bleibt `/dossier/demo`. |
| `/stream` | Öffentliche Beteiligungsfläche, kein Zwang zu Video, klare Folgepfade zu Anlassraum/Dossier/Swipes. |
| `/pricing` | Freie Grundnutzung, keine versteckten AI-Kosten, kein externer Checkout-Claim. |
| `/pricing/institutionen` | Freischaltung bleibt review-first und manuell; kein externer Checkout und keine automatische Veröffentlichung behauptet. |

### Arbeits- / Admin-nahe Flächen

| Route | Befund |
| --- | --- |
| `/account/organization/dashboard` | Workspace-first, sichere nächste Schritte, klare Status- und Freischaltungsgrenzen. |
| `/admin/feeds` | Manual-first Leitstand, keine Scheduler- oder Auto-Publish-Behauptung. |
| `/admin/review` | Zentrale Review-Queue bleibt explizit review-first; `public_official` nur als bewusst menschlicher Schritt. |
| `/dossier/[id]/studio` | Studio bleibt reviewpflichtiger Output-/Export-Workspace ohne Live-Posting-Claim. |
| `/atlas/social-review` | Social Queue bleibt Review-/Export-/Planungspfad, nicht Live-Connector. |

## Claim-Sweep

Geprüfte No-Go-Claims:

- kein Auto-Publish
- kein Auto-Social
- keine automatische Amtlichkeit
- keine versteckten AI-Kosten
- kein Checkout, wenn nicht vorhanden
- kein Vollcrawler-Versprechen
- keine leeren oder falschen CTAs
- keine Demo-Daten als echte Produktionsinhalte

### Befund

- `/start`, `/pricing`, `/pricing/institutionen`, `/admin/feeds`, `/admin/review`, `/account/organization/dashboard`, `/stream` und `/dossier/[id]/studio` enthalten explizit ehrliche Guardrails statt falscher Versprechen.
- `demoFallback` bleibt im Dossier-Pfad nur hinter `shouldAllowDemoDossierFallback(...)`; produktnahe Dossier-Pfade zeigen bei fehlender Runtime bewusst keinen stillen Demo-Ersatz.
- Ein vorheriger Final-Sweep gegen tote CTAs/Dummy-Fallbacks bleibt wirksam; in diesem Slice wurde keine neue CTA-Drift gefunden.

## Empty-State-Befund

| Bereich | Befund |
| --- | --- |
| Swipes ohne Themen | Leerer Zustand bietet Filter-Reset plus direkte Themen-CTAs statt Sackgasse. |
| Organisationsbereich ohne Freischaltung / Scope | `Nächster sicherer Schritt` bleibt prominent; kein Feature-Teppich ohne Berechtigung. |
| Admin Feeds ohne Runtime-/Source-Daten | Lade-/Fehlerzustände und nächste Aktion bleiben sichtbar; kein Fake-Crawler. |
| Admin Review ohne Aufgaben | Filterhinweis und Review-first-Kontext statt leerer Arbeitsfläche. |
| Dossier ohne veröffentlichbaren Stand | Review-only / Not-found / Load-failed unterscheiden sauber; kein stiller Demo-Fallback in produktnahen Pfaden. |
| Stream ohne Video oder ohne offenen Event | Öffentlicher Beteiligungspfad bleibt nutzbar, mit klaren Folge-CTAs zu Anlassraum, Dossier und Swipes. |

## Release-Gate-Befund

### Workflow

- `.github/workflows/production-validation.yml` existiert.
- `static-gate` läuft auf `push` nach `main` und auf `pull_request`.
- `production-gate` bleibt ehrlich guarded über `vars.PRODUCTION_VALIDATION_ENABLED == '1'` plus benötigte Secrets.
- Keine Secrets werden im Repo mitgeführt.

### Lokal

- `package.json` verweist weiterhin auf `node scripts/release/validate-production.mjs`.
- Ein erster Lauf von `release:validate:production` scheiterte ausschließlich an einer `.next`-Kollision, weil parallel ein separater `next build` lief.
- Der serielle Wiederholungslauf war vollständig grün.

### Remote / Live

- GitHub-Issue-Abfragen funktionierten weiterhin.
- GitHub-Actions-Run-Listing für `production-validation.yml` war aus dieser Shell nicht verlässlich abrufbar (`error connecting to api.github.com`).
- Vercel-Status war aus derselben Umgebung nicht belastbar verifizierbar.
- Deshalb wird Remote-/Deploy-Status hier bewusst als **nicht sicher live prüfbar aus der aktuellen Umgebung** dokumentiert, nicht als grün behauptet.

## Gelaufene Checks

- `pnpm -C apps/web exec vitest run tests/v1-production-ready-public-routes.contract.test.tsx tests/live-click-hardening.contract.test.ts tests/start-shared-create-composer.contract.test.tsx tests/swipes-public-topic-supply.contract.test.tsx tests/runden-public-anlassraum-status.contract.test.tsx tests/dossier-public-route.contract.test.tsx tests/stream-public-runtime.contract.test.tsx tests/account-organization-dashboard.page.test.tsx tests/admin-feeds-runtime-dashboard.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-social-queue.contract.test.tsx tests/social-review-queue-v1.contract.test.tsx`
- `pnpm -w -r typecheck`
- `pnpm -w -r lint`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`
- `pnpm run release:validate:production`

## Geänderte Dateien

- `docs/E150/OpenTasks.md`
- `docs/E150/V1-ABSOLUTE-LAUNCH-LOCK-01_2026-05-27.md`

## Bewusst nicht angefasste Punkte

- keine Feed-/Swipe-/Supply-Runtime-Änderung
- keine Dossier-/Anlassraum-/Stream-Produktlogik-Änderung
- kein Checkout
- kein Social-Live-Posting
- kein Provider-/Wrapper-Ausbau
- kein Layout.tsx-/global.css-Refactor

## Fazit

V1 ist nach heutigem Stand lokal auf Launch-Härte geprüft: zentrale Routen, leere Zustände, Claims, Build und Release-Gate sind konsistent und grün. Verbleibende Unsicherheit betrifft nicht die Runtime selbst, sondern nur den aus dieser Umgebung nicht belastbar verifizierbaren Live-Status externer Plattformen wie GitHub Actions Runs und Vercel Deployments.
