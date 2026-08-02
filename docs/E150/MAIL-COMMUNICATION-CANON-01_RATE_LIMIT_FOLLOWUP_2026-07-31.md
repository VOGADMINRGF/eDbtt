# MAIL-COMMUNICATION-CANON-01 — Persistenter Public-Auth-Rate-Limit-Follow-up

Stand: 2026-07-31
Task: `MAIL-COMMUNICATION-CANON-01`
Draft-PR: `#539`
Branch: `fix/mail-communication-canon-01`
Status: `review`

## Anlass

Der unabhängige Review des Mailkanons hat bestätigt, dass der bisherige öffentliche Auth-Limiter bei einem nicht verfügbaren Loader auf einen prozesslokalen beziehungsweise freigebenden Pfad zurückfallen konnte. Damit waren die dokumentierten Grenzen über mehrere Vercel-Instanzen nicht belastbar und ein Loader-Ausfall konnte Tokenrotation oder Mailversand weiterhin zulassen.

## Korrekturvertrag

Die öffentlichen Routen

- `/api/auth/request-reset`,
- `/api/auth/email/start-verify`,
- `/api/auth/verify/resend`

verwenden einen eigenen persistenten Fixed-Window-Limiter in der Core-Datenbank. Der Vertrag gilt ausschließlich für diesen öffentlichen Mail-/Tokenpfad und verändert den bestehenden allgemeinen Rate-Limit-Helper nicht.

- Adresse: höchstens 3 Versuche je 10 Minuten.
- IP: höchstens 12 Versuche je 10 Minuten.
- Verify-Start und Verify-Resend teilen denselben Verify-Bucket.
- Die Bucket-ID ist ein SHA-256-Digest aus Namespace, bereits gehashtem Subjekt und Fensterbeginn; weder E-Mail-Adresse noch IP werden im Bucket gespeichert.
- Der Zähler wird atomar mit `findOneAndUpdate` und `$inc` fortgeschrieben.
- `_id` stellt die Eindeutigkeit des Buckets sicher; ein konkurrierender Upsert wird über den Duplicate-Key-Pfad auf denselben Bucket zurückgeführt.
- Ein TTL-Index auf `expiresAt` entfernt abgelaufene Fenster.
- Loader-null, Loaderfehler, Indexfehler oder Storagefehler führen fail-closed zu `allowed: false`.
- Öffentlich bleibt die Antwort in allen Fällen `200 {"ok":true}`.
- Bei Limiterfehler entstehen kein Token, keine Tokenrotation und kein Mail-Side-Effect.
- Intern wird ausschließlich ein strukturierter Status `rate_limiter_unavailable` mit Scope und Fehlerklasse protokolliert; keine Adresse, IP oder Nachricht wird geloggt.

## Scope

Produktcode:

- `apps/web/src/utils/persistentRateLimit.ts`
- `apps/web/src/utils/publicAuthRateLimitLoader.ts`
- `apps/web/src/utils/publicAuthMailControl.ts`

Tests:

- `apps/web/tests/persistent-rate-limit.test.ts`
- `apps/web/tests/public-auth-mail-enumeration.route.test.ts`

Bewusst unverändert:

- `apps/web/src/utils/rateLimitHelpers.ts`
- alle Create-/Voxy-Dateien
- `docs/E150/OpenTasks.md`
- Mail-Renderer, Mailer, Envelope und Providerkonfiguration
- reale SMTP-, DNS- und Postfachkonfiguration

## Testvertrag

Die fokussierten Tests decken ab:

- einen gemeinsam genutzten Bucket über zwei simulierte Prozessinstanzen,
- parallele Requests mit exakt drei erlaubten Adressversuchen,
- ein neues deterministisches Fenster nach Ablauf,
- Storagefehler als propagierten fail-closed Zustand,
- bekannte, unbekannte und rate-limitierte Adressen mit identischer öffentlicher Antwort,
- Loader-null und Loader-/Storagefehler ohne Token- oder Mail-Side-Effect,
- den gemeinsamen Verify-Bucket für Start und Resend,
- gehashte Inputs ohne rohe Adresse oder IP,
- den bestehenden 120-ms-Response-Floor ohne Konstantzeitbehauptung.

Der unterbrochene lokale Lauf hatte die relevante Public-Auth-/Persistent-Limiter-Matrix grün. Maßgeblich für den finalen Head bleiben GitHub CI, Typecheck, Lint, Build und `git diff --check`.

## Aktueller Prüfstand

Technischer Scope-Head vor diesem Evidence-Addendum:
`cd614ede509926dd57eea8c2a8b43b1bbee90bec`

Auf diesem Head:

- Web Contracts: grün
- Web Security: grün
- Web Quality: Lint und Typecheck grün; vollständiger Build bei Erstellung dieses Addendums noch laufend
- Vercel: noch nicht als terminaler Erfolg dokumentiert

Der Draft-PR bleibt Draft. Kein Merge, kein Ready-Status und keine Produktionsfreigabe erfolgen allein aufgrund dieses technischen Follow-ups.

## Verbleibende Gates

- terminal grüner Web-Quality-Build auf dem finalen Evidence-Head,
- terminaler Vercel-Status,
- unabhängiger Abschlussreview des persistenten Limitervertrags,
- sämtliche bestehenden manuellen Mail-Gates zu Postfach, SPF, DKIM, DMARC, Alignment, Return-Path und realen Mailclients.
