# Production E2E Harness

Dieser Ordner enthält einen lokalen, fail-closed Playwright-Harness für Production-nahe Browser-Smokes gegen eDebatte.

## Voraussetzungen

- Node `20.x`
- `pnpm install --frozen-lockfile`
- installierte Chromium-Binärdatei über Playwright
- keine Nutzung mit geteilten oder persönlichen Zugangsdaten

## Chromium installieren

```bash
pnpm -C apps/web exec playwright install chromium
```

## Sichere lokale Variablen

Nur lokal setzen. Keine Werte in Repo, Shell-Skripte, Screenshots, Traces oder geteilte Logs schreiben.

```bash
export EDEBATTE_E2E_BASE_URL='https://www.edebatte.org'
export EDEBATTE_E2E_EMAIL='<dedicated-test-account>'
export EDEBATTE_E2E_PASSWORD='<read-from-password-manager>'
export EDEBATTE_E2E_DOSSIER_ID='<optional-readonly-dossier-id>'
export EDEBATTE_E2E_PARTICIPATION_SLUG='<optional-readonly-participation-slug>'
```

## Verfügbare Modi

### 1. `public-read`

- keine Zugangsdaten
- keine Writes
- prüft Browsernavigation und Runtime-Fehlmarker auf Login-, Register- und geschützten Redirect-Pfaden
- ersetzt nicht die bestehenden Public-Route- und Guardrail-Smokes aus CI

Ausführen:

```bash
pnpm -C apps/web run test:e2e:production:public
```

### 2. `authenticated-read`

Nur lokal mit dediziertem Testkonto.

- Login ausschließlich über die sichtbare UI
- genau ein Loginversuch pro Testlauf
- Session- und Redirect-Prüfung
- `/account` Reload
- `/create` nur lesend, ohne Analyse-/Save-/Draft-Aktion
- optionale Dossier- und Beteiligungsfixtures nur bei explizit gesetzten IDs

Ausführen:

```bash
pnpm -C apps/web run test:e2e:production:authenticated
```

Wenn `EDEBATTE_E2E_EMAIL` oder `EDEBATTE_E2E_PASSWORD` fehlen, wird der Test sauber geskippt.

## Verhalten bei 2FA

Der Harness umgeht 2FA nicht.

- Wenn `/api/auth/login` `require2fa` liefert, bricht `authenticated-read` sicher mit einem Skip ab.
- Für automatisierte authenticated-read-Läufe ist entweder ein dediziertes Testkonto ohne 2FA nötig oder ein separat freigegebener 2FA-Testvertrag.
- Keine TOTP-Seeds, Mailcodes oder Recovery-Codes im Repo speichern.

## Registration nur als Form-Smoke

- lädt `/register`
- prüft clientseitige Validierung
- stoppt vor einem echten Submit
- blockiert jeden versehentlichen `POST /api/auth/register` fail-closed
- nutzt nur synthetische, nicht abgesendete Beispieldaten

Ausführen:

```bash
pnpm -C apps/web run test:e2e:production:registration-form
```

## Controlled Mutation bleibt standardmäßig gesperrt

Der mutierende Production-Pfad ist in diesem Slice nicht implementiert.

- ohne exakt `EDEBATTE_E2E_ALLOW_MUTATION=1` bleibt Mutation fail-closed blockiert
- auch mit Flag gibt es noch keinen freigegebenen mutierenden Ablauf

Ausführen:

```bash
pnpm -C apps/web run test:e2e:production:mutation-contract
```

## Abbruchkriterien

Der Harness stoppt oder scheitert bewusst bei:

- fehlender sicherer Base URL
- unerwarteten Write-Requests in read-only Modi
- `CriticalProductionWebRuntimeEnvError`
- `web_database_url_missing`
- `Internal Server Error`
- Login-Schleifen
- Demo-Routen im Produktpfad
- `401`, `429` oder `require2fa` beim authenticated Login

## Secrets, Reports und lokale Artefakte

- Authenticated-Read schreibt bewusst keine Screenshots oder Traces, damit Zugangsdaten nicht in Artefakten landen.
- Public-Read und Registration-Smoke erlauben Screenshots/Traces nur bei Fehlern.
- Playwright-Artefakte liegen unter gitignorierten lokalen Pfaden.
- Keine Credentials in Testtiteln, Annotations oder Reports verwenden.

## Testkonto- und Cleanup-Anforderungen

- nur dediziertes Wegwerf- oder Read-only-Testkonto nutzen
- kein persönliches Betreiberkonto
- keine echten Identitäts-, Bank-, Adress- oder Zahlungsdaten absenden
- keine Registrierung, Mitgliedschaft, Identitätsprüfung, Review-Entscheidung, Veröffentlichung oder Abstimmung automatisieren

## Bekannte Blocker

- automatisierter authenticated-read mit 2FA bleibt offen
- kontrollierter Mutationstest benötigt vor Aktivierung ein separates Produkt- und Cleanup-Contracting
- optionale Dossier- und Beteiligungsfixtures werden ohne explizite IDs nicht geraten

## Geplanter späterer Mutation-Contract

Vor einer echten Aktivierung müssen mindestens geklärt werden:

- dediziertes Wegwerf-Testkonto
- eindeutiger Testdatenmarker
- erwartete Writes je Route
- sichere Cleanup- oder Archivierungsstrategie
- klare Produktentscheidung, welche Production-Mutationen überhaupt zulässig sind
