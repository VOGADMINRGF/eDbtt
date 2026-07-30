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
| Beiträge | interne Beitragsbenachrichtigung | DE-Fallback | Legacy-Fragment wird zentral sanitisiert und gerendert |
| Statusreport | Ops-Statusreport | DE-Fallback | Statusreport-Inhalt im gemeinsamen Renderer |
| Admin-Alerts | Test-/Notify-Routen über dynamischen Legacy-Import | DE-Fallback | Kompatibilitätsfassade delegiert an den kanonischen Mailer |

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
- Sanitizing und Einbettung verbleibender kontrollierter Legacy-Fragmente

`apps/web/src/utils/mailer.ts` ist die einzige Transportgrenze. Sie:

- löst From und Reply-To zentral auf,
- prüft Empfänger weiterhin gegen reservierte Platzhalterdomains,
- garantiert HTML und gleichwertigen Plain Text,
- maskiert Empfänger in Logs,
- protokolliert nur Mailtyp, Empfängerdomain/-anzahl, Fehlerkategorie und
  gegebenenfalls Provider-Message-ID,
- protokolliert weder Code, Token, Reset-Link, vollständigen Mailtext noch
  vollständige Empfängeradresse.

In Production schlägt die Konfiguration fehl, wenn From oder Reply-To fehlen,
abweichen oder eine VoiceOpenGov-, No-Reply-, Localhost-, `.invalid`- oder
reservierte Platzhalteridentität verwenden. `SMTP_FROM` wird nur als exakt
identischer Legacy-Alias akzeptiert. Development und Test dürfen ausschließlich
bei vollständig fehlenden Envelope-Werten auf die sicheren kanonischen Werte
zurückfallen; explizit gesetzte widersprüchliche Werte werden auch dort
abgelehnt.

## Automatisierte Prüfung

Erfolgreich:

- `pnpm -w run typecheck`
- `pnpm -w run lint`
- `pnpm -C apps/web run build`
  - grün mit ausschließlich prozesslokalen, nicht produktiven
    Infrastruktur-Platzhalterwerten; keine `.env`-Datei verändert
- `node scripts/ci/check-web-critical-guardrails.mjs`
- `pnpm -C apps/web run test:web-pr-critical-guardrails`
  - 17 Testdateien, 69 Tests
- fokussierte Renderer-/Mailer-/Env-/Statusreport-Tests
  - 6 Testdateien, 38 Tests
- fokussierte Auth-/Membership-/Support-/Preorder-Regression
  - 17 Testdateien, 83 Tests
- fokussierte Admin-/Mail-Regression
  - 8 Testdateien, 64 Tests
- `pnpm install --frozen-lockfile --offline --ignore-scripts`
- `git diff --check`

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
- Draft-PR: `#539`
- Branch: `fix/mail-communication-canon-01`
