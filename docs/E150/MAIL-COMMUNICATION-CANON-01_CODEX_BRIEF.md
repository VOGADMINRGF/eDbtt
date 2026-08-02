# CODEX BRIEF — MAIL-COMMUNICATION-CANON-01

## Auftrag

Setze den technischen Task `MAIL-COMMUNICATION-CANON-01` vollständig um. Der Task vereinheitlicht Absender, Envelope, Rendering, Sprache, Sicherheit und Gestaltung aller eDebatte-Systemmails.

Der getrennte Task `MAIL-PRODUCTION-SENDER-GATE-01` bleibt ein menschliches Produktions-Gate. Er darf durch Code, Tests, Preview oder simulierte Header nicht als erledigt markiert werden.

## Bestehender Branch / Worktree

Erst nach grünem Preflight anlegen:

```text
Branch: fix/mail-communication-canon-01
Worktree: /Users/RF/Arbeitsmappe/worktrees/edebatte-mail-communication-01
```

Keinen zweiten Branch, keinen parallelen Worktree und keinen weiteren PR für denselben technischen Slice anlegen.

## Pflichtlektüre vor jeder Änderung

Vollständig lesen:

1. `AGENTS.md`
2. `docs/foundation/Constitution.md`, sofern auf `main` vorhanden
3. `docs/foundation/Vision.md`, sofern auf `main` vorhanden
4. `docs/foundation/Architecture-Canon.md`, sofern auf `main` vorhanden
5. `docs/foundation/Engineering-Canon.md`, sofern auf `main` vorhanden
6. `docs/brand/EDEBATTE_BRAND_NARRATIVE.md`
7. `docs/E150/CODEX_RUN_PACK_CONTRACT.md`
8. den kanonischen operativen Kopf von `docs/E150/OpenTasks.md`
9. `docs/E150/MAIL-COMMUNICATION-CANON-01_2026-07-30.md`
10. Issue `#538`

Danach offene Pull Requests und erkennbare Datei-, Scope- und Produktkollisionen prüfen.

## Pflicht-Preflight

Vor Branch- oder Codeänderung ausführen:

```bash
cd /Users/RF/Arbeitsmappe/edebatte-org
node scripts/codex-task-preflight.mjs MAIL-COMMUNICATION-CANON-01
```

Nur bei Ergebnis `codex_ready` beziehungsweise `executable` fortfahren. Bei `blocked`, `manual_gate`, `needs_decision`, `research_only` oder `done` ohne Codeänderung stoppen und den exakten Blocker melden.

## Verbindliche Absenderentscheidung

```env
MAIL_FROM="eDebatte <members@edebatte.org>"
MAIL_REPLY_TO="eDebatte Team <members@edebatte.org>"
```

`SMTP_FROM` ist ausschließlich ein identischer Legacy-Alias.

Für produktive eDebatte-Systemmails nicht zulässig:

- sichtbares VoiceOpenGov-Branding
- VoiceOpenGov-Absenderdomain
- `no-reply@voiceopengov.*`
- `no-reply@edebatte.org`
- reservierte Platzhalter- oder `.invalid`-Empfänger

Keine Produktions-ENV, DNS-Records oder Provider-Secrets raten oder in das Repository schreiben.

## Root Cause zuerst verifizieren

Vor Umsetzung im Ist-Code nachvollziehen und in Evidence festhalten:

1. Welche Runtime-Variable liefert aktuell den sichtbaren Absender?
2. Welche produktiven und Legacy-Resolver greifen?
3. Welche Mail-Builder existieren tatsächlich?
4. Welche Routen, Jobs und Services versenden Mails?
5. Welche Builder umgehen `emailTemplates.ts`?
6. Welche Locale-Information ist an den jeweiligen Stellen real verfügbar?
7. Welche bestehenden Brand-Assets sind für Mailclients geeignet?
8. Welche Tests sichern Mailer, Auth, Env und Empfänger-Policy bereits?

Keine Implementierung auf Grundlage einer unvollständigen Dateiliste beginnen.

## Zielarchitektur

Ein gemeinsamer technischer Pfad:

```text
Mail Content / Locale
→ Shared eDebatte Mail Renderer
→ TransactionalMail { subject, preheader, html, text }
→ Canonical Envelope { from, replyTo, to, tag }
→ Existing SMTP Transport
→ metadata-only result
```

Keine zweite Mailruntime und keine neue externe Mailplattform einführen.

## Umsetzungsschritte

### Schritt 1 — Inventar und sichere Basis

- alle `sendMail`-Aufrufer, Nodemailer-Nutzungen, Mail-Builder und inline HTML-Mails suchen
- tatsächliche Mailtypen dokumentieren
- bestehende Tests und Sicherheitsregeln erfassen
- feststellen, welche Locale pro Pfad verfügbar ist
- alte sichtbare VoiceOpenGov-/No-Reply-Absender und `Gruesse`-/`fuer`-Copy inventarisieren

### Schritt 2 — Zentrale Hilfsfunktionen

Baue zentral und testbar:

- `escapeMailHtml(value)` oder vorhandene sichere Entsprechung
- validierte/sicher verwendete Link-Komponente
- gemeinsamer `renderTransactionalMail(...)`
- wiederverwendbare CTA-, OTP-/Code-, Hinweis- und Footer-Bausteine
- zentrale Locale-/Copy-Auflösung mit dokumentiertem Fallback

Keine externe Template-Abhängigkeit hinzufügen, wenn vorhandene Mittel ausreichen.

### Schritt 3 — Kanonischer Envelope

- `MAIL_REPLY_TO` in Env-Typen und Runtime-Resolver aufnehmen
- Mailer übergibt `replyTo` an Nodemailer
- `.env.example` auf die beschlossenen eDebatte-Werte umstellen
- `MAIL_FROM` bleibt kanonisch; `SMTP_FROM` nur identischer Alias
- Preview/Production dürfen nicht auf VoiceOpenGov, No-Reply oder `localhost` zurückfallen
- Produktions-Guardrail gegen verbotene Absenderidentitäten ergänzen
- Development/Test darf lokal ausführbar bleiben, ohne echte externe Mail zu versenden
- bestehende Empfänger-Policy gegen reservierte Domains erhalten

Achte darauf, kein Production-Deployment unkontrolliert zu brechen: Dokumentiere die notwendige ENV-Reihenfolge und halte das echte Setzen der Production-Werte im Manual Gate.

### Schritt 4 — Alle Templates migrieren

Migriere mindestens:

- `buildTwoFactorCodeMail`
- `buildIdentityEmailCodeMail`
- `buildVerificationMail`
- `buildAccountWelcomeMail`
- `buildSetPasswordMail`
- `buildOrgInviteMail`
- `buildOrgAccessMail`
- `buildIdentityResumeMail`
- Mitgliedschaftsbestätigung
- Mitgliedschaftsaktivierung
- Support-Ticket-/Resolution-Mails
- alle zusätzlich im Inventar gefundenen transaktionalen eDebatte-Mails

Kein Mailtyp behält ein unabhängiges sichtbares Layout. Inhaltliche Besonderheiten bleiben erhalten.

### Schritt 5 — Mehrsprachigkeit

- ein gemeinsames Content-/Template-System
- mindestens DE und EN vollständig
- vorhandene weitere Locales strukturell anbinden
- Subject, Preheader, Anrede, Titel, Body, CTA, Hinweise und Footer in derselben Sprache
- kontrollierter Fallback auf die kanonische Standardsprache
- keine vollständigen duplizierten HTML-Dateien pro Sprache
- korrekte Umlaute und `ß`

Erfinde keine Nutzer- oder Locale-Daten. Fehlt Locale am Aufrufer, nutze den dokumentierten Fallback und registriere nur dann einen Follow-up, wenn eine echte fachliche Lücke bleibt.

### Schritt 6 — Mailclient-taugliches Design

- vorhandene eDebatte-Brand-Assets prüfen und wiederverwenden
- robustes Tabellenlayout, maximal etwa 600–640 px
- zugänglicher Textheader als Fallback
- Systemfonts
- guter Kontrast
- responsive Abstände
- Light-/Dark-Mode-Resilienz
- zugängliche CTA
- klar lesbare Codebox
- Plain-Text-Gleichwertigkeit
- keine Pflicht zu Remote-Fonts, JavaScript, Formularen oder Trackingpixeln

### Schritt 7 — Sicherheits- und Drift-Guardrails

Sichere durch Tests:

- dynamische Inhalte sind escaped
- OTPs und URLs werden nicht verändert
- Codes, Token und Mailtexte gelangen nicht in Logs
- sichtbare eDebatte-Mails enthalten kein VoiceOpenGov-/No-Reply-Branding
- reservierte Empfängerdomains bleiben blockiert
- Envelope und Reply-To sind kanonisch
- HTML und Text sind vorhanden
- DE-/EN-Fallback ist deterministisch

### Schritt 8 — Evidence und OpenTasks

Erstelle:

```text
docs/E150/MAIL-COMMUNICATION-CANON-01_EVIDENCE_2026-07-30.md
```

Evidence enthält:

- Root Cause
- vollständiges Mailinventar
- geänderte Architektur
- migrierte Mailtypen
- Tests und Checks
- bekannte Grenzen
- Preview-Abnahme
- klare Trennung zum Production-Gate

Aktualisiere `docs/E150/OpenTasks.md`:

- `MAIL-COMMUNICATION-CANON-01`: `codex_ready` → `in_progress` → nach technischer Umsetzung und Evidence maximal `review`; erst nach Produktabnahme `done`
- `MAIL-PRODUCTION-SENDER-GATE-01`: bleibt `manual_gate`

Keine anderen Statuswerte oder unverwandten Kopfzeilen verändern.

## Bevorzugte Dateifläche

- `apps/web/src/utils/emailTemplates.ts`
- neue gemeinsame Mailmodule nahe der bestehenden Mailer-/Template-Domäne
- `apps/web/src/utils/mailer.ts`
- `apps/web/src/lib/server/webRuntimeEnv.ts`
- `apps/web/src/utils/env.ts`
- `apps/web/src/types/env.d.ts`
- `apps/web/.env.example`
- reale Mail-Aufrufer
- fokussierte Mail-/Auth-/Env-/Security-Tests
- Run-Pack- und Evidence-Dateien unter `docs/E150/`
- `docs/E150/OpenTasks.md`

Erweitere die Dateifläche nur, wenn das Mailinventar einen realen zusätzlichen Versandpfad belegt.

## Harte Grenzen

- kein Newsletter-System
- keine neue Queue
- keine neue externe Mailplattform
- kein Tracking-Ausbau
- keine VoiceOpenGov-Mailarchitektur
- keine Änderung von Rollen, Preisen, Membership oder Consent
- keine realen Mails an erfundene oder unbestätigte Empfänger
- keine Production-ENV-, DNS- oder Secret-Werte im Repo
- kein Auto-Publish
- kein Auto-Merge

## Pflichtprüfungen

Mindestens:

```bash
node scripts/codex-task-preflight.mjs MAIL-COMMUNICATION-CANON-01
pnpm -w run typecheck
pnpm lint
pnpm -C apps/web run build
git diff --check
```

Dazu alle fokussierten Mail-, Auth-, Env-, Mailer- und Security-Tests. Testanzahl und genaue Kommandos in Evidence dokumentieren.

## Produktprüfung vor `done`

Mindestens Preview-/lokaler Rendercheck für:

- Login-Code
- Verifikation
- Passwort
- Organisationseinladung
- Mitgliedschaft
- Support-Resolution
- DE und EN
- Desktop- und schmale Mobile-Breite
- Light und Dark Mode, soweit ohne externen Client prüfbar

Das ersetzt nicht den echten Production-Smoke.

## Final Response

Berichte exakt:

1. Root Cause
2. Architekturänderung
3. migrierte Mailtypen
4. geänderte Dateien
5. Tests und Checks
6. Status von `MAIL-COMMUNICATION-CANON-01`
7. unveränderter Status von `MAIL-PRODUCTION-SENDER-GATE-01`
8. verbleibende manuelle Schritte für Provider, DNS, ENV und echte Mailclient-Abnahme
9. PR-Link

Nicht behaupten, dass Production-Absender, SPF, DKIM oder DMARC korrigiert seien, solange der reale Header-Smoke nicht vorliegt.
