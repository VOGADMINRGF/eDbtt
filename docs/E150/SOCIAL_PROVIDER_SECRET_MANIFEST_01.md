# SOCIAL_PROVIDER_SECRET_MANIFEST_01

Stand: 2026-08-06

Status: Wertfreier serverseitiger Sicherheits- und Betriebsvertrag.

Dieses Dokument enthält ausschließlich Bezeichner, Zustände und Verfahren. Es enthält keine echten IDs, Tokens, E-Mail-Adressen, Telefonnummern, Passwörter, Recovery-Codes, 2FA-Seeds oder sonstigen Zugangsdaten.

## Verbindliche Grundsätze

- Social-Secrets bleiben ausschließlich serverseitig.
- Kein Social-Secret verwendet ein `NEXT_PUBLIC_*`-Präfix.
- Git, Pull Requests, Browser, Client-Bundles, URLs, Screenshots, Telemetrie und Logs enthalten keine Secretwerte.
- Lokale Entwicklung, Preview und Produktion verwenden getrennte Secret-Namespaces und getrennte Provider-Anwendungen.
- Verbindungen starten mit minimalen Read-Rechten.
- Write-, Upload- oder Publish-Rechte werden erst in einem getrennten, ausdrücklich freigegebenen Slice geprüft.
- Unbestätigte Providerfelder werden als `provider_verification_required` geführt.
- Auto-Publish und Realtime-Publish bleiben deaktiviert.
- Menschliches Review bleibt verpflichtend.

## Umgebungen

| Umgebung | Namespace | Reale Produktionsdaten | Write-/Publish-Rechte | Status |
| --- | --- | --- | --- | --- |
| local | `social/local` | verboten | verboten | vorbereitet |
| preview | `social/preview` | verboten | verboten | vorbereitet |
| production | `social/production` | nur nach Betreiberfreigabe | nur nach gesondertem Gate | nicht aktiviert |

Die Namespace-Bezeichnungen sind logische Verträge. Konkrete Secret-Store-Pfade und Account-IDs werden nicht versioniert.

## Gemeinsame serverseitige Schlüssel

| Schlüssel | Zweck | Wert im Repository |
| --- | --- | --- |
| `SOCIAL_TOKEN_ENCRYPTION_KEY_REF` | Referenz auf den verwalteten Schlüssel für Tokenverschlüsselung | keiner |
| `SOCIAL_SECRET_STORE_NAMESPACE` | Referenz auf den umgebungsspezifischen Secret-Namespace | keiner |

## Provider-Matrix

Alle Scope-, Redirect- und API-Angaben müssen unmittelbar vor einer realen Verbindung gegen die dann gültige offizielle Providerdokumentation geprüft werden.

| Provider / Kanäle | Vorgesehene serverseitige Schlüssel | Credential-Art | Minimale Read-Scopes | Spätere Write-Scopes | Redirect-Vertrag | Ownerstatus |
| --- | --- | --- | --- | --- | --- | --- |
| Meta / Facebook / Instagram | `SOCIAL_META_OAUTH_CLIENT_ID`, `SOCIAL_META_OAUTH_CLIENT_SECRET`, `SOCIAL_META_OAUTH_REDIRECT_URI` | OAuth-App | `provider_verification_required` | `provider_verification_required` | pro Umgebung getrennt; HTTPS außerhalb localhost | `owner_assignment_required` |
| YouTube | `SOCIAL_YOUTUBE_OAUTH_CLIENT_ID`, `SOCIAL_YOUTUBE_OAUTH_CLIENT_SECRET`, `SOCIAL_YOUTUBE_OAUTH_REDIRECT_URI` | OAuth-App | `provider_verification_required` | `provider_verification_required` | pro Umgebung getrennt; HTTPS außerhalb localhost | `owner_assignment_required` |
| LinkedIn | `SOCIAL_LINKEDIN_OAUTH_CLIENT_ID`, `SOCIAL_LINKEDIN_OAUTH_CLIENT_SECRET`, `SOCIAL_LINKEDIN_OAUTH_REDIRECT_URI` | OAuth-App | `provider_verification_required` | `provider_verification_required` | pro Umgebung getrennt; HTTPS außerhalb localhost | `owner_assignment_required` |
| Reddit | `SOCIAL_REDDIT_OAUTH_CLIENT_ID`, `SOCIAL_REDDIT_OAUTH_CLIENT_SECRET`, `SOCIAL_REDDIT_OAUTH_REDIRECT_URI` | OAuth-App | `provider_verification_required` | `provider_verification_required` | pro Umgebung getrennt; HTTPS außerhalb localhost | `owner_assignment_required` |
| X | `SOCIAL_X_OAUTH_CLIENT_ID`, `SOCIAL_X_OAUTH_CLIENT_SECRET`, `SOCIAL_X_OAUTH_REDIRECT_URI` | OAuth-App | `provider_verification_required` | `provider_verification_required` | pro Umgebung getrennt; HTTPS außerhalb localhost | `owner_assignment_required` |
| TikTok | `SOCIAL_TIKTOK_CLIENT_KEY`, `SOCIAL_TIKTOK_CLIENT_SECRET`, `SOCIAL_TIKTOK_REDIRECT_URI` | Provider-App | `provider_verification_required` | `provider_verification_required` | pro Umgebung getrennt; HTTPS außerhalb localhost | `owner_assignment_required` |
| Threads | `SOCIAL_THREADS_APP_ID`, `SOCIAL_THREADS_APP_SECRET`, `SOCIAL_THREADS_REDIRECT_URI` | Provider-App | `provider_verification_required` | `provider_verification_required` | pro Umgebung getrennt; HTTPS außerhalb localhost | `owner_assignment_required` |
| Mastodon | `SOCIAL_MASTODON_INSTANCE_URL`, `SOCIAL_MASTODON_OAUTH_CLIENT_ID`, `SOCIAL_MASTODON_OAUTH_CLIENT_SECRET`, `SOCIAL_MASTODON_OAUTH_REDIRECT_URI` | instanzgebundene OAuth-App | `provider_verification_required` | `provider_verification_required` | Instanz und Umgebung getrennt prüfen | `owner_assignment_required` |
| Bluesky | `SOCIAL_BLUESKY_OAUTH_CLIENT_ID`, `SOCIAL_BLUESKY_OAUTH_CLIENT_SECRET`, `SOCIAL_BLUESKY_OAUTH_REDIRECT_URI` | OAuth-/Provider-App | `provider_verification_required` | `provider_verification_required` | pro Umgebung getrennt; HTTPS außerhalb localhost | `owner_assignment_required` |
| Telegram | `SOCIAL_TELEGRAM_BOT_TOKEN` | Bot-Credential | `provider_verification_required` | `provider_verification_required` | nicht anwendbar oder providerabhängig | `owner_assignment_required` |
| WhatsApp Channels | `SOCIAL_WHATSAPP_PHONE_NUMBER_ID`, `SOCIAL_WHATSAPP_BUSINESS_ACCOUNT_ID`, `SOCIAL_WHATSAPP_ACCESS_TOKEN` | Business-/Provider-Credential | `provider_verification_required` | `provider_verification_required` | providerabhängig | `owner_assignment_required` |

Die Namen sind ein serverseitiger Namensvertrag. Ihre tatsächliche Verwendbarkeit und die aktuellen Provider-Flows bleiben bis zur offiziellen Providerprüfung unbestätigt.

## Ownership und Wiederherstellung

Vor einer realen Verbindung müssen pro Provider dokumentiert sein:

- `platform_owner`
- `security_owner`
- `recovery_owner_primary`
- `recovery_owner_secondary`
- Eigentümer der Developer-App
- Eigentümer des öffentlichen Plattformkontos
- 2FA-Status
- Recovery-Nachweis
- letzte Rechteprüfung
- nächster Rotationstermin

Personennamen, E-Mail-Adressen, Telefonnummern und Recovery-Daten gehören nicht in dieses Manifest.

## Lebenszyklus

Jede spätere reale Verbindung benötigt mindestens folgende Zustände:

- `planned`
- `credentials_created`
- `read_only_connected`
- `paused`
- `reauthorization_required`
- `rotation_required`
- `revocation_pending`
- `revoked`
- `disconnected`
- `deleted`

Ein fehlender oder unklarer Zustand führt fail-closed zu keiner Verbindung und keiner Veröffentlichung.

## Rotation und Ablauf

- Client-Secrets und langfristige Credentials erhalten einen dokumentierten Rotationstermin.
- Ablaufdaten werden als Metadaten, niemals als Secretwert, auditierbar geführt.
- Abgelaufene oder unklare Credentials blockieren Synchronisation und Veröffentlichung.
- Scope-Erweiterungen gelten als neue Freigabe und erfordern erneutes menschliches Review.
- Rotation darf alte Credentials erst nach erfolgreicher Verifikation der neuen Referenz widerrufen.
- Ein Rollback auf alte Credentials ist nur möglich, solange diese noch nicht widerrufen wurden und die Sicherheitsentscheidung dokumentiert ist.

## Disconnect und Widerruf

Ein Disconnect führt in dieser Reihenfolge aus:

1. Connector deaktivieren.
2. Laufende Synchronisationen stoppen.
3. Providerzugriff widerrufen.
4. Access- und Refresh-Tokens aus dem Secret Store löschen.
5. Datenbankreferenzen entkoppeln.
6. Provider-Rohpayloads gemäß Retention löschen.
7. Auditereignis ohne Secretfragmente schreiben.
8. Verbleibende Aggregate auf Personen- und Kontenbezug prüfen.
9. Wiederverbindung nur über einen neuen autorisierten Flow erlauben.

Kann ein Widerruf beim Provider nicht bestätigt werden, bleibt der Zustand `revocation_pending` und der Connector ist blockiert.

## Retention

- Provider-Rohpayloads werden standardmäßig nicht dauerhaft gespeichert.
- Temporäre Fehleranalyse erfordert explizites Operator-Opt-in, Verschlüsselung und maximal sieben Tage Aufbewahrung.
- Technische Logs ohne PII werden maximal 30 Tage gespeichert.
- Aggregierte kanal- oder kampagnenbezogene Messwerte dürfen erst nach fachlicher Datenschutzfreigabe bis zu 24 Monate gespeichert werden.
- Nicht personenbezogene finale Learnings können langfristig erhalten bleiben.
- Disconnect löscht Tokens unverzüglich und entkoppelt verbleibende Aggregate vom Providerkonto.

## Audit

Auditereignisse enthalten ausschließlich:

- Provider und Umgebung
- Verbindung beziehungsweise Secret-Referenz-ID
- Aktion
- Zeitstempel
- verantwortliche Rolle
- vorheriger und neuer Zustand
- Scope-Klassifikation
- Ergebnis
- Fehlerklasse
- Rotation-, Ablauf- oder Widerrufsstatus

Auditereignisse enthalten niemals Secretwerte, Tokenfragmente, Passwörter, Recovery-Codes oder 2FA-Seeds.

## Incident-Verfahren

Bei vermutetem Credential-Verlust:

1. betroffenen Connector und globale Social-Distribution deaktivieren;
2. Auto-Publish und Realtime-Publish bleiben deaktiviert;
3. Provider-Credential widerrufen;
4. Secret-Referenz sperren und rotieren;
5. betroffene Umgebungen und Scopes bestimmen;
6. Audit und technische Logs auf Secretfragmente prüfen;
7. erforderliche Datenschutz- und Sicherheitsbewertung durchführen;
8. Wiederverbindung erst nach menschlicher Freigabe und dokumentierter Lösch-/Widerrufsprobe zulassen.

## Nicht Bestandteil dieses Slices

- keine OAuth-Route
- keine Datenbank oder Migration
- keine Provider-API
- keine reale Secret-Anlage
- keine Verbindung zu Plattformkonten
- kein Upload
- kein Publish
- kein Deployment
- keine Änderung der Voxy-Produktionskette
