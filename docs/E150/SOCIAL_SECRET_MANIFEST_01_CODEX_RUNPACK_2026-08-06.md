# SOCIAL-SECRET-MANIFEST-01 · Codex Run-Pack

Stand: 2026-08-06

Status: Governance-Vorbereitung. Keine Providerverbindung, kein Secret-Wert, kein Merge und kein Deployment.

## Ziel

Die bestehende Social-Konfiguration wird um einen datenschutzmaximalen und providerneutralen Secret-Vertrag ergänzt.

## Erlaubter Implementierungsscope nach positivem Post-Merge-Preflight

- `apps/web/.env.example`
- `docs/E150/SOCIAL_PROVIDER_SECRET_MANIFEST_01.md`
- ein fokussierter Contract- oder Guardrail-Test unter `apps/web/tests/`
- notwendige Evidence-Dokumentation unter `docs/E150/`

## Pflichtänderungen

- bestehende Connector-Flags und Namen unverändert erhalten
- `REDDIT_CONNECTOR_ENABLED=0` ergänzen
- `THREADS_CONNECTOR_ENABLED=0` ergänzen
- `SOCIAL_DISTRIBUTION_ENABLED=0` erhalten
- `SOCIAL_AUTO_PUBLISH_ENABLED=0` erhalten
- `SOCIAL_REALTIME_PUBLISH_ENABLED=0` erhalten
- `SOCIAL_REQUIRE_REVIEW=1` erhalten
- bestehende Ausnahme `WEBSITE_EMBED_CONNECTOR_ENABLED=1` nicht still verändern

## Secret-Manifest

Das Manifest enthält keine Werte, sondern pro Provider ausschließlich:

- Provider und Marke
- Credential-Art
- serverseitiger Secret-Key-Name
- Secret-Referenz statt Rohwert
- Umgebung: local, preview oder production
- minimale Read-Scopes
- getrennte spätere Write-Scopes
- Redirect-URI-Vertrag
- verantwortlicher Owner
- Erstellungs-, Rotations-, Ablauf- und Widerrufsstatus
- Disconnect- und Löschverfahren
- Retention und Audit
- Incident- und Recovery-Verfahren

Unbestätigte Providerfelder und Scopes werden mit `provider_verification_required` gekennzeichnet.

## Datenschutz- und Sicherheitsgrenzen

- keine Social-Secrets als `NEXT_PUBLIC_*`
- keine Tokens, Passwörter, Recovery-Codes oder 2FA-Seeds im Repository
- keine Secretwerte in URL, Screenshot, Log, Telemetrie oder Client-Bundle
- Produktion, Preview und lokale Entwicklung strikt getrennt
- least privilege und zunächst read-only
- Publish-Rechte erst in einem getrennten späteren Slice
- Rohpayloads standardmäßig nicht dauerhaft speichern
- keine individuellen Nutzerreisen oder politischen Profile

## Tests

Der fokussierte Guardrail-Test weist mindestens nach:

- Reddit und Threads sind standardmäßig deaktiviert
- alle Connectoren bleiben standardmäßig deaktiviert, außer dem bestehenden Website-Embed-Vertrag
- Review bleibt verpflichtend
- Auto-Publish und Realtime-Publish bleiben deaktiviert
- keine Social-Secret-Namen beginnen mit `NEXT_PUBLIC_`
- keine beispielhaften Token- oder Secretwerte sind enthalten

## Nicht-Ziele

- keine OAuth-Route
- keine Datenbank oder Migration
- keine Provider-API
- keine reale Secret-Anlage
- keine Verbindung zu Plattformkonten
- kein Upload oder Publish
- keine Veränderung der reservierten Voxy-Stränge
- kein Deployment

## Ausführung

Nach Merge dieses Governance-Slices auf sauberem `main`:

`node scripts/codex-task-preflight.mjs SOCIAL-SECRET-MANIFEST-01`

Nur bei `status: codex_ready` und `executable: true` darf ein separater Implementierungsbranch erstellt werden.
