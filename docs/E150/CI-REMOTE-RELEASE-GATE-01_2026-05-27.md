# CI-REMOTE-RELEASE-GATE-01

## Ziel

Das bestehende GitHub-Actions-Release-Gate so härten, dass mindestens das statische Remote-Gate auf `push main`, `pull_request` und manuellen Workflow-Start reproduzierbar läuft. Der produktive Build-/Release-Teil bleibt bewusst guarded und wird nicht unehrlich als immer aktiv behauptet.

## Scope

- kein Runtime-Code
- keine Produktlogik
- nur Workflow + SSOT-Dokumentation

## Geprüfter Ausgangszustand

- vorhandener Workflow: `.github/workflows/production-validation.yml`
- vorhandener SSOT-Task: `CI-REMOTE-RELEASE-GATE-01`
- bestehende Release-Gate-Doku:
  - `docs/E150/POST-V1-CONSOLIDATION-BUNDLE-01_2026-05-26.md`
  - `docs/E150/POST-V1-CONSOLIDATION-FOLLOWUP-02_2026-05-27.md`
  - `docs/E150/V1-ABSOLUTE-LAUNCH-LOCK-01_2026-05-27.md`

## Umgesetzte Härtungen

### 1. Deterministisches Setup

- `pnpm/action-setup@v4` ergänzt
- `pnpm` fest auf `10.17.1` gezogen, passend zu `packageManager`
- `actions/setup-node@v4` auf `20.19.0` festgezogen
- `cache-dependency-path: pnpm-lock.yaml` ergänzt

### 2. Static Gate robuster gemacht

- `workflow_dispatch` ergänzt
- `permissions: contents: read` ergänzt
- `BROWSERSLIST_IGNORE_OLD_DATA=1` auch im `static-gate` gesetzt
- Concurrency-Gruppe auf Workflow + PR-Nummer oder Ref normalisiert, damit PRs und `main` nicht unnötig gegeneinander kollidieren

### 3. Production Gate bewusst guarded gelassen

- keine Aktivierung ohne `PRODUCTION_VALIDATION_ENABLED=1`
- keine Aktivierung ohne dokumentierte Repo-Secrets
- kein Fake-Rot bei Forks oder fehlenden Secrets
- keine Behauptung, dass der produktive Remote-Build immer läuft

## Geänderte Dateien

- `.github/workflows/production-validation.yml`
- `docs/E150/OpenTasks.md`
- `docs/E150/CI-REMOTE-RELEASE-GATE-01_2026-05-27.md`

## Validierung

Lokal gelaufen:

- `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/production-validation.yml'); puts 'yaml ok'"`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm run release:validate:production`

## Ergebnis

Das statische Remote-Gate ist jetzt reproduzierbarer an das lokale Repo-Setup angeglichen und fuer `push main` / `pull_request` / manuellen Start sauber vorbereitet. Der produktive Build-/Release-Teil bleibt absichtlich guarded und ist weiterhin kein unehrliches Immer-an-Gate.

## Bewusst offen

- Live-Prüfung einzelner GitHub-Actions-Runs war in dieser Shell nicht belastbar, weil Netzwerkzugriff auf GitHub nicht vorausgesetzt ist.
- Repo-Secrets und `PRODUCTION_VALIDATION_ENABLED` bleiben Betreiberkonfiguration und werden nicht ins Repo geschrieben.
