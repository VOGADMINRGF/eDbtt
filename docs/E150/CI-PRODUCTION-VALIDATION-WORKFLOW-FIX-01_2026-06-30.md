# CI-PRODUCTION-VALIDATION-WORKFLOW-FIX-01

## Ausgangslage

`.github/workflows/production-validation.yml` erzeugte auf normalen `pull_request`- und `push main`-Events wiederholt rote `0s`-Runs mit `No jobs were run`, obwohl der eigentliche Web-CI-Workflow fuer dieselben Aenderungen gruen war.

## Ursache

- `production-validation.yml` war neben `workflow_dispatch` auch auf `pull_request` und `push main` registriert.
- Der Workflow ist inhaltlich kein allgemeiner PR-/Main-CI, sondern ein guarded Production-/Release-Gate mit stark secret- und flag-abhaengigem `Production gate`.
- Normale PR-/Main-Validierung ist im Repo bereits separat ueber `.github/workflows/web-ci.yml` abgedeckt.
- Damit lief ein zusaetzlicher Workflow in einem Event-Kontext, fuer den er fachlich nicht der kanonische Check ist und in GitHub wiederholt als irrefuehrender `No jobs were run`-Run sichtbar wurde.

## Gewaehlte Loesung

- `production-validation.yml` wurde auf `workflow_dispatch` begrenzt.
- Der Workflow bleibt damit ein bewusst manueller Production-Validation-/Release-Gate.
- Es wurden keine Fake-Jobs, Sentinel-Jobs oder leeren Gruenmacher eingefuehrt.

## Warum Web CI unberuehrt bleibt

- `.github/workflows/web-ci.yml` bleibt unveraendert.
- Normale PR-/`main`-Checks laufen weiterhin dort ueber Install, Lint und Web-Typecheck.
- Es wurde kein Produktcode, keine Testlogik und keine App-Runtime geaendert.

## Kuenftiger Scope von Production Validation

- `production-validation.yml` ist bis auf Weiteres manuell.
- Ein spaeterer automatischer Trigger darf erst wieder aktiviert werden, wenn ein belastbarer Production-Deployment-Vertrag im Repo dokumentiert ist.
- Offener Folgepfad: `PRODUCTION-DEPLOYMENT-VALIDATION-CONTRACT-02`.

## Geaenderte Dateien

- `.github/workflows/production-validation.yml`
- `docs/E150/OpenTasks.md`
- `docs/E150/CI-PRODUCTION-VALIDATION-WORKFLOW-FIX-01_2026-06-30.md`

## Lokale Validierung

- `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/production-validation.yml'); puts 'yaml ok'"`
- `git diff --check`

## Ergebnis

Normale PR-/`main`-Pushes erzeugen aus dieser Workflow-Datei kuenftig keine roten `No jobs were run`-Runs mehr. Die eigentliche Web-CI bleibt unveraendert, und der guarded Production-Validation-Pfad bleibt bewusst als manueller Betreiber-Workflow erhalten.
