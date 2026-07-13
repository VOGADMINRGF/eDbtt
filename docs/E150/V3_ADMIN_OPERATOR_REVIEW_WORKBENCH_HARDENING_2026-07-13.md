# V3 Admin / Operator / Review-Workbench Hardening

Datum: 2026-07-13
Task: `V3-ADMIN-OPERATOR-REVIEW-WORKBENCH-HARDENING-01`
Cluster: Admin / Operator / Review-Workbench / naechste Schritte

## Gepruefte aktive Surfaces

- `/admin`
  - Bleibt die ruhige Operator-Konsole ueber den bestehenden Arbeitsrouten.
  - Footer-/Weiterleitungslinks lesen jetzt ihre Kern-Surfaces aus einer kanonischen Surface-Quelle statt aus verstreuten Ad-hoc-Labels.
- `/admin/review`
  - Geprueft als zentrale Review-Workbench.
  - Keine neue Parallel-Review-Logik aufgebaut; die Surface bleibt die kanonische Betreiber-Arbeitsliste.
- `/admin/editorial/queue`
  - Header und Einordnung lesen aus derselben gemeinsamen Surface-Quelle wie andere Operator-Surfaces.
  - Review-first Export- und Freigabe-Wahrheit bleibt unveraendert.
- `/admin/feeds`
  - Als aktive Feed-/Source-Workbench geprueft.
  - Keine neue Runtime oder Queue eingefuehrt; die Surface bleibt explizit reviewpflichtig.
- `/admin/region`
  - Region-/Review-/Sichtbarkeits- und Freischaltungslabels lesen jetzt aus shared Helpern.
  - Rohe Debug-/Runtime-Flags wie `reviewRequired: true`, `noAutoPublish: true`, `notRealNews=true` und `runtime review queue` wurden aus der sichtbaren Surface entfernt und in menschlich lesbare Operator-Sprache ueberfuehrt.
- `/admin/access`
  - Surface-Einordnung kommt aus derselben kanonischen Surface-Quelle wie angrenzende Admin-Surfaces.
  - Access bleibt bewusst getrennt von Membership-, Entitlement- und Billing-Wahrheit.
- `/admin/entitlements`
  - Surface-Eyebrow/-Titel wurden an die gemeinsame Operator-Surface-Quelle gebunden.
  - Review-first Freischaltungswahrheit aus dem bestehenden Production-Entry-Contract bleibt bestehen.
- `/admin/errors`
  - Error Logs bleiben Diagnoseflaeche.
  - Neue Next-Step-Links zeigen jetzt explizit zur Review Queue, Feed Control, Freischaltung und Pricing Orders statt die Diagnoseflaeche isoliert stehen zu lassen.
- `/admin/system`
  - System Hub zeigt jetzt haeufige naechste Schritte zur eigentlichen Operator-Workbench.
  - Keine neue Admin-Insel, sondern Rueckwege in Review, Access, Entitlements, Pricing Orders und den Organisationsbereich.
- `/account/organization/dashboard`
  - Vertragsquellen-, Verifikations- und Onboarding-Status teilen jetzt dieselben kanonischen Labels wie angrenzende Admin-Surfaces.
  - Keine zweite Billing-/Freischaltungswahrheit.

## Harmonisierung

- Gemeinsame Labelhelper eingefuehrt fuer:
  - Verifikationsstatus
  - Onboarding-/Provisioning-Status
  - Billing-Quellenwahrheit
  - Region-Entitlement-Status und -Gruende
  - Review-/Sichtbarkeitsstatus auf der Region-Surface
  - sichtbare Guardrails auf der Region-Surface
- Gemeinsame Surface-Metadaten eingefuehrt fuer die zentralen Operator-Routen:
  - Review Queue
  - Editorial Queue
  - Feed Control
  - Access Center
  - Entitlements
  - Pricing Orders
  - Organisationsbereich
  - System Hub
  - Error Logs

## Produktwahrheit nach dem Slice

- `/admin/review` bleibt die zentrale Review-Workbench.
- `/admin/errors` und `/admin/system` sind Diagnose- und Ruecksprung-Surfaces, nicht neue operative Parallelwelten.
- Freischaltung, Membership, Billing und Access bleiben getrennte Wahrheiten mit konsistenten Labels.
- `/admin/region` spricht ueber Review-, Guardrail- und Sichtbarkeitszustand jetzt in Operator-Sprache statt in rohen Runtime-/Enum-/Debug-Begriffen.
- Keine neue Queue-Runtime, kein Auto-Approve, kein Auto-Publish, keine neue DB-Schreibwelt.

## Runner-Stop nach diesem Cluster

- In `OpenTasks.md` verbleiben danach nur noch:
  - `GOV-CIVIC-ECON-01` als docs-/contract-first Task
  - `WORKTREE-COMMIT-CREATE-LEDGER-HANDOFF-14B2` als maintenance-only Task
- Es existiert damit aktuell kein weiterer echter produktiver `codex_ready` Cluster mehr.
- Der naechste autonome Produktionslauf braucht entweder neue produktive `codex_ready` Tasks oder eine bewusste Entscheidung, ob docs-/contract-first bzw. maintenance-only weiterlaufen sollen.

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/admin-region-page.render.test.tsx tests/admin-region-entitlement-ui.test.tsx tests/account-organization-dashboard.page.test.tsx tests/admin-access-entitlements-surface.contract.test.tsx tests/operator-console-page.contract.test.tsx tests/admin-dashboard-graph-repairs-link.contract.test.ts tests/operator-workbench-labels.contract.test.ts tests/admin-editorial-hubs.page.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`
