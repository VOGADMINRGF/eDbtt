# MAIL-COMMUNICATION-CANON-01 — Technische Evidence

Stand: 2026-07-30
Task: `MAIL-COMMUNICATION-CANON-01`
Issue: `#538`
Branch: `fix/mail-communication-canon-01`
Status: `review`

## Ergebnis

Alle im Repository gefundenen realen eDebatte-Systemmailpfade laufen über einen
gemeinsamen Renderer und den bestehenden zentralen Nodemailer-Transport. Der
Envelope ist auf
`eDebatte <members@edebatte.org>` mit
`eDebatte Team <members@edebatte.org>` als Reply-To festgelegt. Deutsch und
Englisch werden über gemeinsame Inhaltsbausteine unterstützt; unbekannte oder
fehlende Locales fallen kontrolliert auf Deutsch zurück.

Die technische Umsetzung versendet keine Testmail. Die reale Postfach-,
Provider-, DNS-, Header- und Mailclient-Abnahme bleibt ausschließlich
`MAIL-PRODUCTION-SENDER-GATE-01`.

## Finales Alpha-Review-Korrekturdelta

Der korrektive technische Prüf-Head ist
`e4feabab69f2ef0ad3ed9fae813ea19d44c4030a`. Der nachfolgende
Dokumentationscommit verändert ausschließlich diese Evidence.

### Zustandsklassen und Idempotenz

- Organisationszugänge für bestehende Nutzer werden zunächst als
  `pending_activation` persistiert. Neue oder noch nicht verifizierte Nutzer
  verbleiben in `invited`. Erst eine erfolgreiche Required Delivery wechselt
  denselben Membership-Datensatz atomar auf `active`.
- Eine eindeutige Membership pro Organisation und Nutzer sowie ein atomarer
  Delivery-Claim verhindern parallele Dopplungen. Ein Retry verwendet
  Membership, Invite-/Reset-Payload und Auditkontext des vorhandenen
  Teilzustands; er erzeugt weder eine zweite Membership noch neue Tokens.
  Permanente Zustellfehler wechseln in manuelle Recovery.
- Membership-Anträge besitzen einen eindeutigen offenen Vorgang
  `membership-open:<userId>` und einen globalen Workflow-Claim.
  `membershipId`, Zahlungsreferenz, PII-Zahlungsprofil und
  Microtransfer-Code werden nur einmal erzeugt und bei Retry wiederverwendet.
  Payer-, Admin- und Household-Zustellungen werden getrennt persistiert.
  Bereits erfolgreiche Empfänger werden ausgelassen; nur retryable
  Fehlschläge werden erneut beansprucht. Household-Tokens sind pro
  Membership/Empfänger eindeutig und werden wiederverwendet. Permanente
  Fehler wechseln in manuelle Recovery.
- Account-Löschung persistiert eine eindeutige fachliche Löschanforderung mit
  eigenem Delivery-Claim. Membership-/Antragsstornierung wird je Vorgang
  höchstens einmal als erledigt markiert. Die Session wird erst nach
  erfolgreicher Required Delivery gelöscht; ein Mailfehler hinterlässt einen
  wiederholbaren Teilzustand mit derselben Löschanforderung.
- Dunning beansprucht jede Stufe atomar. Transiente Fehler erhalten
  exponentiellen Backoff, permanente Fehler den Status `manual_recovery`.
  Eine erfolgreich zugestellte Stufe wird vor dem nächsten Lauf fortgeschrieben
  und nicht erneut versendet.

### Enumeration-Schutz und Tokenrotation

`auth/request-reset`, `auth/email/start-verify` und `auth/verify/resend`
antworten für bekannte und unbekannte Adressen einheitlich mit
`200 { "ok": true }`. Öffentliche Antworten enthalten weder
Delivery-Metadaten noch Verify-Token oder `verifyUrl`; der interne
Zustellstatus bleibt am Token-Slot auditierbar.

Reset und Verifikation verwenden die kanonischen Token-Slot-Dienste. Eine
Neuausstellung rotiert den jeweiligen Slot atomar; alte Tokens werden
invalidiert. Das Delivery-Audit schreibt nur dann auf einen Slot zurück, wenn
Token-Hash und Slot noch dem versendeten Token entsprechen. Ein verspäteter
paralleler Versand kann deshalb keinen neueren Token wieder als gültig oder
zugestellt markieren.

### Renderer-Provenienz und reale Atomaritätsgrenze

Separate Regressionstests belegen, dass Spread-Clone,
JSON-Serialize/Deserialize und nachträgliche Mutation eines echten
Renderer-Objekts vor jedem Transportversuch abgewiesen werden. Das originale,
unveränderte und eingefrorene Renderer-Objekt bleibt zustellbar.

DB-Zustand und ein externer SMTP-Provider können nicht in einer gemeinsamen
ACID-Transaktion committen. Atomare Claims verhindern parallele
Doppelversuche; ein Prozessabbruch nach Providerannahme, aber vor
Zustellpersistenz, benötigt dennoch manuelle Reconciliation. Ebenso ist die
Initialisierung über Core- und PII-Store nicht storeübergreifend atomar:
Fehlende bereits angelegte PII-Workflow-Secrets führen deshalb kontrolliert
in manuelle Recovery statt zu einer zweiten Zahlungsidentität.

## Root Cause und Ist-Befund

Vor diesem Slice gab es zwei Mailruntime-Flächen:

- `apps/web/src/utils/mailer.ts` löste den sichtbaren Absender aus `MAIL_FROM`
  beziehungsweise dem Legacy-Alias `SMTP_FROM` auf.
- `apps/web/src/utils/email.ts` erzeugte einen zweiten Nodemailer-Transport und
  konnte in Development vollständige Empfänger, Betreff und Body ausgeben.
- `.env.example` enthielt `eDebatte <no-reply@edebatte.org>`; ein explizites
  `MAIL_REPLY_TO` fehlte.
- Builder und Inline-Mails erzeugten voneinander unabhängige HTML-Fragmente.
- Locale war in mehreren Auth-, Membership- und Update-Pfaden vorhanden, wurde
  aber nicht durchgehend bis in den Mailinhalt weitergegeben.

Damit konnte eine alte Runtime-Konfiguration weiterhin VoiceOpenGov/No-Reply
sichtbar machen, während die Anwendung weder einen zentralen Brandrahmen noch
eine fail-closed Absenderprüfung besaß.

## Vollständiges Mailinventar

| Mailfamilie | Reale Aufrufer | Locale nach Umsetzung | Umsetzung |
| --- | --- | --- | --- |
| Login-/2FA-Code | Auth-Login, `sharedAuth`, 2FA-E-Mail-Code, Request-E-Mail, Select-Method | User-Profil/-Settings, sonst DE | `buildTwoFactorCodeMail` |
| Identitätscode/-Fortsetzung | Identity-E-Mail-Start, TOTP-Resume | User-Profil/-Settings, sonst DE | `buildIdentityEmailCodeMail`, `buildIdentityResumeMail` |
| E-Mail-Verifikation | Registrierung, Verify-Resend, Auth-E-Mail-Start, Admin-User-Aktionen | Request-/User-Locale, sonst DE | `buildVerificationMail` |
| Account-Willkommen | Auth-E-Mail-Confirm | User-Profil/-Settings, sonst DE | `buildAccountWelcomeMail` |
| Passwort setzen/zurücksetzen | Admin-User-Erstellung/-Aktion, Request-Reset | User-Locale, sonst DE | `buildSetPasswordMail`, `buildPasswordResetMail` |
| Organisation | Organisations-Einladung und bestehender Zugriff | User-Locale, sonst DE | `buildOrgInviteMail`, `buildOrgAccessMail` |
| Membership | Antrag (User/Admin/Haushalt), Bestätigung, Mark-paid-Aktivierung, Dunning-Skript | User-Profil/-Settings, sonst DE | Confirmation-, Activation-, Apply-, Household- und Reminder-Builder |
| Support/Kontakt | Kontakt-Inbox und Eingangsbestätigung | Request-Locale, sonst DE | `buildSupportTicketReceivedMail`; Status-/Resolution-Builder als kanonische Integration für den noch nicht auf `main` vorhandenen Support-Workflow |
| eDebatte-Paket/Pledge/Preorder | Package, Pledge User/Admin, Preorder, institutionelles Angebot User/Internal | Pricing-/Request-Locale, sonst DE | bestehende Builder im gemeinsamen Renderer |
| Öffentliche Updates | Double-Opt-in, interne DOI-Meldung, Welcome, interne Confirm-Meldung | gespeicherte Request-Locale, sonst DE | lokale Content-Builder plus gemeinsamer Renderer |
| Account Self-Service | interne Benachrichtigung | DE-Fallback | gemeinsamer Renderer über Mailer |
| Beiträge | interne Beitragsbenachrichtigung | DE-Fallback | strukturierte Blöcke im gemeinsamen Renderer |
| Statusreport | Ops-Statusreport | DE-Fallback | Statusreport-Inhalt im gemeinsamen Renderer |
| Admin-Alerts | Test-/Notify-Routen über dynamischen Import | DE-Fallback | strukturierte Blöcke delegieren an den kanonischen Mailer |

Zusätzlich verwendet `features/pricing/usecases/createPreorderLead.ts` einen
injizierten Sender; die Route injiziert ausschließlich den kanonischen Mailer.
Es existiert nach der Migration nur noch ein `nodemailer`-Import und ein
Transport: `apps/web/src/utils/mailer.ts`.

## Architektur und Sicherheitsvertrag

`apps/web/src/utils/mailRenderer.ts` stellt zentral bereit:

- `TransactionalMail { subject, preheader, html, text, locale }`
- DE-/EN-Locale-Auflösung und deterministischen DE-Fallback
- Escaping dynamischer Werte
- validierte `http`-/`https`-CTAs
- Absatz-, Detail-, Listen-, Code-, CTA- und Hinweisbausteine
- einen tabellenbasierten, maximal 620 px breiten eDebatte-Rahmen
- versteckten Preheader, Viewport-/Color-Scheme-Metadaten, Textheader und
  nachvollziehbaren Nachrichtengrund im Footer
- Sanitizing und Einbettung verbleibender kontrollierter Legacy-Fragmente;
  der `legacyMailHtml`-Template-Tag escaped jede dynamische Interpolation

`apps/web/src/utils/mailer.ts` ist die einzige Transportgrenze. Sie:

- löst From und Reply-To zentral auf,
- prüft Empfänger weiterhin gegen reservierte Platzhalterdomains,
- garantiert HTML und gleichwertigen Plain Text,
- maskiert Empfänger in Logs,
- protokolliert nur Mailtyp, Empfängerdomain/-anzahl, Fehlerkategorie und
  gegebenenfalls Provider-Message-ID,
- protokolliert weder Code, Token, Reset-Link, vollständigen Mailtext noch
  vollständige Empfängeradresse.

## Legacy-HTML- und Mehrfachempfänger-Contract

### Legacy-HTML-Finding: bestätigt und zentral behoben

Die repository-weite Prüfung ergab zwei direkte produktive Aufrufer von
`renderLegacyTransactionalMail`:

- `apps/web/src/utils/emailTemplates.ts` über `finalizeMail` für Preorder,
  Pledge User/Admin, Membership Apply User/Admin, Household Invite und
  Membership Reminder,
- `apps/web/src/features/ops/statusReport/mail.ts` für den Ops-Statusreport.

Diese Flächen enthielten intern kontrollierte Template-Strukturen, interpolierten
aber zugleich Nutzer-, Mitgliedschafts-, Organisations-, Zahlungs- und
Statuswerte. Der bisherige Sanitizer erlaubte unter anderem `a` sowie globale
`style`-Attribute. Ein interpolierter dynamischer Wert mit erlaubtem HTML konnte
deshalb als echtes Markup überleben. Die Annahme „Legacy-HTML ist vollständig
statisch“ ist damit widerlegt.

Der zentrale Klassenfix führt den verpflichtenden `legacyMailHtml`-Template-Tag
ein. Jede normale Interpolation wird HTML-escaped; nur bereits mit demselben Tag
erzeugte, intern kontrollierte Teiltemplates können strukturell komponiert
werden. Legacy-Links werden zusätzlich zentral normalisiert: erlaubt sind
valide absolute `http`-/`https`-Links und einfache `mailto`-Adressen.
`javascript:`, `data:`, protocol-relative und ungültige URLs verlieren ihre
Linkwirkung. Für verbleibende Links werden `target="_blank"` und
`rel="noopener noreferrer"` erzwungen.

Alle weiteren produktiven freien HTML-Erzeuger wurden auf strukturierte
Mailblöcke umgestellt:

- Account Self-Service,
- Kontakt-Inbox,
- Beitrags-Inbox,
- eDebatte-Paket-Aktivierung,
- institutioneller Angebots-/Download-Link für User und interne Empfänger,
- öffentliche Updates Start/Bestätigung für interne Empfänger,
- Admin-Alerts.

Die freie Kompatibilitätsfunktion `utils/email.ts::sendMail` wurde entfernt.
`ensureTransactionalMail` akzeptiert an der Transportgrenze nur noch exakt das
Objekt, das derselbe Runtime-Modulkontext zuvor über
`renderTransactionalMail` oder `renderLegacyTransactionalMail` erzeugt und
eingefroren hat. Ein frei gesetzter Stringmarker im HTML ist kein
Vertrauenssignal mehr. Nachbauten und nachträgliche Mutationen werden mit
`mail_content_provenance_invalid` fail-closed abgelehnt. Einen produktiven
`sendEmail`-Aufrufer gibt es im Repository nicht.

Synthetisch geprüft wurden fremdes HTTPS, `mailto`, dynamisches Nutzer-`<a>`,
dynamisches Nutzer-`style`, `javascript:`, `data:`, protocol-relative URLs
sowie manipulierte `target`-/`rel`-Attribute. Zusätzlich wird ein realer
Membership-Legacy-Builder mit injiziertem Anchor und Style geprüft und ein
Source-Contract erfasst jeden direkten Legacy-Renderer-Aufrufer.

### Mehrfachempfänger-Finding: bestätigt und zentral behoben

Der Mailer normalisierte bereits `string[]` und kommaseparierte Empfänger,
übergab die vollständige Liste anschließend aber in einem Nodemailer-Aufruf als
sichtbares `to`. Mehrere unabhängige Empfänger konnten sich deshalb gegenseitig
im To-Header sehen.

Produktiv erreichbar waren Listen insbesondere über:

- Admin-Alerts mit `cfg.recipients`,
- die konfigurierbaren internen Ziele `CONTACT_INBOX`, `MAIL_ADMIN_TO` und
  `UPDATES_NOTIFY_TO`,
- den Ops-Statusreport-Listenpfad; seine aktuelle Konfiguration begrenzt die
  erlaubten Empfänger zusätzlich auf die kanonische interne Adresse.

Der Pledge-Adminpfad lieferte bereits getrennt je Empfänger aus. Auth-,
2FA-, Verifikations-, Passwort-, Organisations-, Membership-, Support-,
Update-, Paket-, Preorder- und Admin-User-Mails adressieren fachlich jeweils
eine einzelne externe Adresse. Interne Inbox-/Ops-Ziele sind gemeinsame
Verteiler, können technisch aber als Liste konfiguriert sein.

Der zentrale Mailer validiert nun die vollständige, normalisierte und
deduplizierte Empfängerliste vor dem ersten Transportaufruf. Danach erfolgt
genau ein Nodemailer-Aufruf je Adresse, jeweils mit einer einzelnen Adresse im
sichtbaren `to`. Ein ungültiger Empfänger blockiert die gesamte Liste vor dem
Versand. Teilfehler werden nach dem Versuch aller getrennten Zustellungen als
Gesamtfehler mit ausschließlich aggregierten Zähler-Metadaten gemeldet.
Mehrfachempfänger-Logs enthalten weder Adressen noch Empfängerlisten,
Nachrichteninhalte oder Provider-Fehlertexte.

## Review-Follow-up: Delivery-, Fehler-, Locale- und Logging-Contract

### Formale Delivery-Klassifikation

Jeder produktive Aufruf der zentralen Transportgrenze muss jetzt
`required_delivery` oder `best_effort_delivery` deklarieren. Es gibt keinen
impliziten Default.

| Familie / reale Aufrufer | Contract | Verhalten bei `{ ok: false }` |
| --- | --- | --- |
| Login-2FA, Setup-/Resend-Code, Select-Method, Identity-Code/-Resume | `required_delivery` | kein Success, kein neuer nutzbarer Challenge-/Cookie-Zustand; HTTP 503 mit Delivery-Metadaten |
| Registrierung, Verify-Start/-Resend, Passwort-Reset, Admin-Verifikation/-Passwortlink | `required_delivery` | kein falsches Success; bereits angelegtes Konto wird als persistierter Teilzustand ausgewiesen |
| Organisations-Einladung/-Zugriff | `required_delivery` | Membership bleibt persistiert, Delivery-Status wird gespeichert, HTTP 502 `partial`; ein fehlgeschlagener New-User-Invite bleibt bei einem Delivery-Retry `invited` |
| Updates Double-Opt-in | `required_delivery` | gespeicherter Pending-Opt-in wird als Teilzustand ausgewiesen; keine DOI-Erfolgsmeldung |
| Kontakt-Inbox | `required_delivery` | keine Eingangs-Success-Antwort und keine nachgelagerte Bestätigung; HTTP 502 |
| Institutioneller Angebots-/Download-Link an anfragende Person | `required_delivery` | kein Download-Mail-Success; interne Folgemail wird nicht ausgelöst |
| Membership-Antragsbestätigung, Pledge-Zahlungsanweisung, Household-Invite und Dunning | `required_delivery` | persistierte Fachmutation bleibt erhalten und wird explizit als `partial` gemeldet; Dunning-Level/Auto-Cancel werden erst nach erfolgreicher Reminder-Zustellung fortgeschrieben |
| Account Self-Service | `required_delivery` | Fachmutation wird nicht zurückgerollt; Delivery-Status wird gespeichert und HTTP 502 `partial` geliefert |
| Welcome-, Paketaktivierungs-, Mark-paid-Aktivierungs-, Beitrags-, Membership-Admin-, Pledge-Admin-, Updates-Info- und Preorder-Bestätigungsmails | `best_effort_delivery` | fachlich unabhängige Mutation/Antwort bleibt erfolgreich; vorhandene Aufrufer exponieren oder speichern den Zustellstatus, wo er für die Oberfläche relevant ist |
| Admin-Alerts | `best_effort_delivery` | Alert-Erzeugung blockiert keine Fachmutation; explizite Notify-/Test-Routen melden den Zustellfehler dennoch als HTTP 502 |
| Ops-Statusreport | `best_effort_delivery` | kein App-Runtime-Blocker; der konkrete Reporting-Run wird bei Zustellfehler als fehlgeschlagen markiert |

Required-Delivery-Aufrufer prüfen das Resultat direkt. Es existiert kein
Catch-Block mehr, der ein aufgelöstes `{ ok: false }` fälschlich als Erfolg
behandelt. Bei bereits persistierten Fachmutationen enthalten Antworten den
Teilzustand und die aggregierten Delivery-Metadaten; es wird keine persistierte
Konto-, Membership-, Pledge-, Opt-in- oder Self-Service-Mutation wegen eines
Transportfehlers zurückgerollt. Technische 2FA-Challenges werden dagegen erst
nach erfolgreichem Versand aktiviert oder bei Fehlschlag superseded.

### Zentraler Fehlervertrag

`SendMailResult` liefert für jede Zustellung:

- `status`: `delivered`, `failed` oder `partial`,
- `category`,
- `retryable`,
- `attemptedCount`, `deliveredCount` und `failedCount`,
- keine Empfängerliste und keine Nachrichteninhalte.

Permanente Empfänger-, Placeholder-/Allowlist-, Inhalts-Provenienz-,
Envelope-, SMTP-Unconfigured- und SMTP-Auth-Fehler sind nicht retryable.
Connection-, Timeout- und unbekannte Transportfehler sind retryable.
SMTP-Responsefehler sind nur für 4xx-Providerantworten retryable; 5xx ist
permanent. Bei getrennter Mehrfachempfängerzustellung bildet `partial` den
aggregierten Teilfehler ab.

### Runtime-Provenienz gegen Marker-Spoofing

Ein Angreifer kann die Transportgrenze nicht mehr durch
`data-edebatte-mail="transactional"` umgehen. Die Runtime-Provenienz liegt in
einem nicht exportierten `WeakSet`; nur originale, eingefrorene
Renderer-Resultate werden akzeptiert. Der Negativtest kombiniert den
gefälschten Marker mit `javascript:`, `data:`, protocol-relative URL,
Tracking-`img` und manipuliertem `target`/`rel` und bestätigt, dass vor jedem
Transportversuch permanent mit `mail_content_invalid` abgebrochen wird. Eine
echte Renderer-Mail passiert denselben Contract.

### Locale und Zahlenformat

- Organisationszugang/-Invite: vorhandene User-Locale, bei neuem User
  kanonischer DE-Fallback.
- Paketaktivierung: persistierte User-Locale, sonst DE.
- Kontaktbestätigung: validierte Request-Locale, sonst DE.
- Auth-, Membership-, Pledge- und Dunning-Mails: persistierte User-Locale,
  soweit ein Userkontext existiert; andernfalls DE.

Echte Routentests führen Organisationszugang, Paketaktivierung und
Kontaktbestätigung mit englischer Locale aus und prüfen den tatsächlich
gerenderten englischen Betreff, Text und `lang="en"`-Frame. Eurobeträge werden
an dieselbe aufgelöste Mail-Locale gekoppelt (`5,00 €` in DE, `€5.00` in EN);
damit kann ein englischer Mailtext nicht mehr unbemerkt deutsches
Zahlenformat enthalten.

### Inhaltsfreies Logging

Der Kontaktpfad protokolliert nur Klassifikation, Hashes und numerische
Metadaten wie `messageLength`; `messagePreview` und der Freitext wurden
entfernt. Der Test verwendet einen eindeutigen vertraulichen Freitext und
weist nach, dass er in keinem Logargument erscheint. Der zentrale Mailer
protokolliert bei Einzelzustellung nur maskierte Adressen, bei Listen nur
`[multiple]`, Zähler und Fehlerkategorie; Provider-Fehlertexte,
Empfängerlisten, Betreff und Body bleiben ausgeschlossen.

In Production schlägt die Konfiguration fehl, wenn From oder Reply-To fehlen,
abweichen oder eine VoiceOpenGov-, No-Reply-, Localhost-, `.invalid`- oder
reservierte Platzhalteridentität verwenden. `SMTP_FROM` wird nur als exakt
identischer Legacy-Alias akzeptiert. Development und Test dürfen ausschließlich
bei vollständig fehlenden Envelope-Werten auf die sicheren kanonischen Werte
zurückfallen; explizit gesetzte widersprüchliche Werte werden auch dort
abgelehnt.

## Vercel-Preview-Root-Cause und Klassenfix

Das Vercel-Deployment `FjJWKvzixZQCetmiqJNsJUu6iE4M` für Commit
`93548412958868a1042c70223ac4c0465944c107` kompilierte erfolgreich und
bestand die TypeScript-Prüfung. Es scheiterte erst bei `Collecting page data`
für `/_not-found` und mehrere Account-Routen.

Die konkrete Ursache lag in `apps/web/src/utils/env.ts`: Der auf Modulebene
ausgeführte `BaseSchema.parse(...)` verlangte allein wegen
`NODE_ENV=production` bereits beim Import exakt kanonische Werte für
`MAIL_FROM` und `MAIL_REPLY_TO`. Dadurch blockierte eine fehlende oder
abweichende optionale Mailkonfiguration den Preview-Build, obwohl kein
Mailversand ausgeführt wurde. Die GitHub-Web-CI blieb grün, weil sie
`apps/web/.env.example` als `.env.local` verwendete und damit die kanonischen
Beispielwerte in den Build einbrachte.

Der Klassenfix trennt die Lebenszyklen:

- Das allgemeine `utils/env.ts` validiert keine Mail-Envelope-Werte mehr beim
  Modulimport.
- Die allgemeine Production-Startup-Prüfung validiert weiterhin
  `WEB_DATABASE_URL` und `JWT_SECRET`, koppelt den App-Start aber nicht mehr an
  optionale Mailzustellung.
- `resolveMailEnvelopeForRuntime(...)` bleibt die zentrale Versandgrenze. Ein
  tatsächlicher Production-Versand ohne exakt kanonisches From und Reply-To
  schlägt weiterhin fail-closed fehl.

Ein preview-naher Vollbuild mit absichtlich leeren `MAIL_FROM`,
`MAIL_REPLY_TO` und `SMTP_FROM` sowie ausschließlich prozesslokalen,
nichtproduktiven Platzhaltern für die unabhängigen Runtime-Abhängigkeiten
generierte alle 322 statischen Seiten erfolgreich. Es wurden weder Provider-,
Postfach-, DNS- noch Secret-Konfigurationen verändert und keine reale Mail
versendet.

## Automatisierte Prüfung

Erfolgreich:

- `pnpm -w run typecheck`
- `pnpm -w run lint`
- `pnpm -C apps/web run build`
  - grün mit ausschließlich prozesslokalen, nicht produktiven
    Infrastruktur-Platzhalterwerten; keine `.env`-Datei verändert
- `node scripts/ci/check-web-critical-guardrails.mjs`
- `pnpm -C apps/web run test:web-pr-critical-guardrails`
  - nach dem Vercel-Klassenfix: 17 Testdateien, 71 Tests
- `pnpm -C apps/web run test:production-guardrails`
  - 12 Testdateien, 36 Tests
- Abschlussdelta Legacy-HTML/Mehrfachempfänger:
  - Mail-Communication, Mailer-Security und Runtime-ENV:
    3 Testdateien, 43 Tests
  - relevante Auth-/Membership-/Support-/Admin-/Preorder-/Status-Regression:
    17 Testdateien, 73 Tests
  - Web-PR-Critical-Guardrails: 17 Testdateien, 71 Tests
  - Production-Guardrails: 12 Testdateien, 36 Tests
- Vercel-Delta: Mail-Communication-, Mailer-Security- und Runtime-ENV-Tests
  - 3 Testdateien, 34 Tests
- fokussierte Renderer-/Mailer-/Env-/Statusreport-Tests
  - 6 Testdateien, 38 Tests
- fokussierte Auth-/Membership-/Support-/Preorder-Regression
  - 17 Testdateien, 83 Tests
- fokussierte Admin-/Mail-Regression
  - 8 Testdateien, 64 Tests
- Review-Follow-up Required-/Best-effort-, Provenance-, Fehler-, Locale- und
  Logging-Contract:
  - fokussierte Mail-/Runtime-/Auth-/Membership-/Support-/Admin-/Preorder-/
    Statusreport-Matrix: 22 Testdateien, 139 Tests
  - davon Mail-Communication, Mailer-Security und Runtime-ENV:
    3 Testdateien, 48 Tests
  - Web-PR-Critical-Guardrails: 17 Testdateien, 71 Tests
  - Production-Guardrails: 12 Testdateien, 36 Tests
  - cachefreier Web-Typecheck und `pnpm -w run typecheck`: grün
  - Root-Lint: grün
  - vollständiger Web-Build ohne Mail-/SMTP-ENV: 322 von 322 statischen Seiten
    generiert
- `pnpm install --frozen-lockfile --offline --ignore-scripts`
- `git diff --check`
- finales Alpha-Korrekturdelta:
  - Pflichtmatrix für Org-Invite, Membership-Retry, öffentliche Auth-Routen,
    Token-Slot, Account-Löschung, Dunning, Renderer-Provenienz und
    Verify-Frontend: 8 Testdateien, 48 Tests
  - angrenzende Auth-/Membership-/Organisations-/Dunning-/Mail-Regression:
    29 Testdateien, 161 Tests
  - Web-PR-Critical-Guardrails: 17 Testdateien, 71 Tests
  - Production-Guardrails: 12 Testdateien, 36 Tests
  - Workspace-Typecheck und Root-Lint: grün
  - vollständiger Web-Build mit ausschließlich prozesslokalen,
    nichtproduktiven Infrastruktur-Platzhaltern und leeren Mail-/SMTP-Werten:
    322 von 322 statischen Seiten generiert
  - Guardrail-Orchestrator und `git diff --check`: grün

Ein erster Web-Build ohne lokale Infrastruktur-ENV kompilierte erfolgreich,
erreichte die Seitendatensammlung und stoppte erwartbar an fehlenden
`JWT_SECRET`-, Mongo-/Graph- und Salt-Werten. Der wiederholte Build verwendete
ausschließlich prozesslokale, nicht produktive Platzhalterwerte, generierte alle
322 statischen Seiten und war vollständig grün.

Der zusätzliche repository-weite `pnpm -w run brandcheck` bleibt wegen bereits
bestehender VoiceOpenGov-Fundstellen außerhalb der Maildomäne rot. Keine
Fundstelle stammt aus den geänderten Mailtemplates, dem Renderer, dem Mailer
oder den Envelope-Defaults; der taskbezogene Guardrail prüft diese Flächen
separat und ist grün.

Der Task-Preflight meldete im bereits vorgegebenen Task-Worktree
`branch_not_main:fix/mail-communication-canon-01`. Das ist kein fachlicher
Task-Blocker: `OpenTasks.md` führte den Task als `codex_ready`, und der
Auftrag verbot ausdrücklich einen zweiten Branch oder Worktree.

## Preview- und Produktabnahme

Die Contract-Tests rendern die migrierten Mailfamilien in DE, EN und mit
unbekannter Locale. Sie prüfen gemeinsamen Frame-Marker, Responsive-Metadaten,
eDebatte-Identität, Textgleichwertigkeit, Code-/URL-Erhalt, Escaping,
Sanitizing, Envelope und Logschutz. Eine reale Preview-Mail oder ein externer
Mailclient wurde nicht verwendet, damit keine Mail an unbestätigte Empfänger
versendet wird.

Vor `done` bleibt eine visuelle Produktabnahme mit echten, kontrollierten
Preview-Empfängern erforderlich.

## Produktions-Gate und bekannte Grenzen

`MAIL-PRODUCTION-SENDER-GATE-01` bleibt `manual_gate`. Manuell auszuführen sind:

1. verwaltetes Postfach `members@edebatte.org` bereitstellen und Antwortempfang
   bestätigen,
2. Preview-/Production-ENV in sicherer Reihenfolge auf kanonisches From und
   Reply-To setzen; einen noch gesetzten `SMTP_FROM` identisch halten,
3. SMTP-Provider autorisieren und Provider-Credentials außerhalb des Repos
   setzen,
4. SPF, DKIM, DMARC, Alignment und Return-Path anhand echter Header prüfen,
5. Apple Mail, Gmail und Outlook auf Desktop, Mobile sowie in Light/Dark Mode
   mit kontrollierten Empfängern abnehmen,
6. Rollback so bestätigen, dass Versand deaktiviert wird und niemals auf
   VoiceOpenGov oder No-Reply zurückfällt.

Der auf `main` noch nicht vorhandene Support-Ticket-Workflow wird in einem
anderen offenen PR entwickelt. Dieser Slice integriert dessen ungemergte
Produktlogik nicht, stellt aber die kanonischen Received- und
Status-/Resolution-Builder für eine konfliktarme spätere Anbindung bereit.

## PR- und Commit-Referenzen

- Implementierungs-Commit:
  `018a06b046af3b48395799eb348789d73773b48d`
- korrektiver technischer Prüf-Head:
  `e4feabab69f2ef0ad3ed9fae813ea19d44c4030a`
- Draft-PR: `#539`
- Branch: `fix/mail-communication-canon-01`
