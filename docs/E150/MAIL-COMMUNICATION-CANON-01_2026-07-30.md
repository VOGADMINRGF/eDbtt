# MAIL-COMMUNICATION-CANON-01 — Einheitlicher eDebatte-Mailkanon

Status: **kanonischer Implementierungsvertrag**  
Beschlossen: **2026-07-30**  
Issue: **#538**  
Technischer Task: **`MAIL-COMMUNICATION-CANON-01`**  
Produktions-Gate: **`MAIL-PRODUCTION-SENDER-GATE-01`**

## 1. Anlass und Root Cause

Eine reale Login-Code-Mail wurde am 2026-07-30 weiterhin mit der sichtbaren Absenderidentität `VoiceOpenGov <no-reply@voiceopengov…>` zugestellt. Der Mailinhalt entsprach dem vorhandenen isolierten OTP-Template: einfache Tabelle, generische Anrede, Codebox, Sicherheitshinweis und Signatur.

Die bisherige Architektur löst den sichtbaren Absender unmittelbar aus `MAIL_FROM` beziehungsweise dem Legacy-Alias `SMTP_FROM` auf. Die produktive Runtime besitzt damit weiterhin eine alte VoiceOpenGov-/No-Reply-Konfiguration. Gleichzeitig erzeugen bestehende Mail-Builder ihre HTML-Fragmente unabhängig voneinander und ohne gemeinsamen eDebatte-Rahmen.

Die frühere konzeptionelle Festlegung eines einheitlichen Kommunikationssystems war daher noch keine tatsächliche Produktumsetzung.

## 2. Verbindliche Produktentscheidung

Der kanonische Absender aller eDebatte-Systemmails lautet:

```env
MAIL_FROM="eDebatte <members@edebatte.org>"
MAIL_REPLY_TO="eDebatte Team <members@edebatte.org>"
```

`SMTP_FROM` bleibt ausschließlich ein Legacy-Alias. Solange er noch gesetzt ist, muss er exakt `MAIL_FROM` entsprechen.

### Nicht zulässige sichtbare eDebatte-Absender

- `VoiceOpenGov <…>`
- Adressen unter `voiceopengov.org`, `voiceopengov.de` oder weiteren VoiceOpenGov-Domains
- `no-reply@voiceopengov.*`
- `no-reply@edebatte.org`
- `@example.org`, `@example.com`, `@example.net`
- `.invalid`- oder nicht verwaltete Testdomains

VoiceOpenGov und eDebatte bleiben getrennte Identitäten. Eine eDebatte-Mail darf weder durch Absender, Signatur, Links noch sichtbare Gestaltung den Eindruck erwecken, von VoiceOpenGov versendet worden zu sein.

## 3. Zielarchitektur

Alle transaktionalen und systemischen eDebatte-Mails folgen einem gemeinsamen fachlichen und technischen Vertrag:

```text
fachliches Ereignis
→ lokalisierter Inhalt
→ gemeinsamer eDebatte-Mailrahmen
→ HTML + Plain Text
→ kanonischer Envelope
→ SMTP-Transport
→ metadata-only Zustellnachweis
```

E-Mail-Typen dürfen eigene Inhalte, Handlungen und Sicherheitshinweise besitzen. Sie dürfen jedoch keine unabhängigen Layout-, Marken-, Envelope- oder Sprachsysteme etablieren.

## 4. Technischer Scope

### 4.1 Kanonischer Envelope

Die Mailer-Schicht löst zentral auf:

- `from`
- `replyTo`
- Empfänger
- Subject
- HTML
- Plain Text
- optionalen internen Mail-Typ/Tag

Verbindliche Regeln:

1. `MAIL_FROM` ist die einzige kanonische Absenderquelle.
2. `SMTP_FROM` ist nur ein identischer Legacy-Alias.
3. `MAIL_REPLY_TO` ist explizit typisiert und wird an Nodemailer übergeben.
4. Preview und Production dürfen nicht still auf VoiceOpenGov, No-Reply oder `localhost` zurückfallen.
5. Fehlende oder widersprüchliche Production-Konfiguration schlägt sicher und verständlich fehl.
6. Fehler werden nicht als erfolgreiche Zustellung ausgegeben.
7. Logs enthalten ausschließlich notwendige Metadaten: Mail-Typ, maskierten Empfänger, Fehlerkategorie und Provider-Message-ID, soweit vorhanden.
8. Codes, Token, Reset-Links, vollständige Mailtexte und vollständige Empfängeradressen werden nicht geloggt.

### 4.2 Gemeinsames Mail-Rendering

Es wird eine zentrale, wiederverwendbare Rendering-Schicht angelegt. Sie liefert mindestens:

```ts
type TransactionalMail = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};
```

Der gemeinsame Rahmen enthält:

- versteckten Preheader
- eDebatte-Header auf Grundlage vorhandener kanonischer Brand-Assets
- responsiven Inhaltsrahmen mit maximal etwa 600–640 px Breite
- kompatibles Tabellenlayout für verbreitete Mailclients
- Systemfont-Stack ohne zwingende Remote-Fonts
- klare Überschrift und verständliche Inhaltsstruktur
- wiederverwendbare CTA-Komponente
- wiederverwendbare OTP-/Code-Komponente
- wiederverwendbare Sicherheits-/Hinweiskomponente
- eDebatte-Footer mit nachvollziehbarem Nachrichtengrund und Kontaktmöglichkeit
- robuste Darstellung in Light und Dark Mode
- keine Tracking-Pixel-Pflicht für Auth-, Identitäts- und Sicherheitsmails

Die Lösung verwendet keine neu erfundene zweite Designwelt. Vorhandene eDebatte-Brand-Assets und Farb-/Typografieprinzipien werden wiederverwendet. Kann ein Asset in Mailclients nicht zuverlässig eingebettet werden, muss ein zugänglicher textlicher eDebatte-Header erhalten bleiben.

### 4.3 HTML-Sicherheit

Alle dynamischen Werte werden vor Einfügung in HTML korrekt escaped. Dies betrifft insbesondere:

- Namen
- Organisationsnamen
- Rollen
- Planbezeichnungen
- Zahlungsreferenzen
- Datumswerte
- URLs
- frei erzeugte oder importierte Texte

Verbindlich:

- keine rohe Interpolation unkontrollierter Werte in HTML
- Links stammen aus kanonisch erzeugten und geprüften URLs
- OTPs und Codes bleiben exakt erhalten
- Text-Fallbacks enthalten dieselbe fachliche Information ohne HTML-Reste
- keine unnötigen personenbezogenen Details in Sicherheitsmails
- keine geheimen Werte in Alt-Texten, Preheadern oder Trackingparametern

### 4.4 Zu migrierende Mailtypen

Codex muss zunächst alle realen Builder und Aufrufer inventarisieren. Mindestens folgende bestehende Typen werden auf das gemeinsame System migriert:

1. Login-/2FA-Code
2. Identitätsbestätigungscode
3. E-Mail-Verifikation
4. Account-Willkommen
5. Passwort setzen
6. Passwort zurücksetzen, sofern separater Pfad vorhanden
7. Organisations-Einladung
8. Organisations-Zugriff
9. Identitätsprüfung fortsetzen
10. Mitgliedschaftsantrag
11. Mitgliedschaftsaktivierung
12. Support-Ticket- und Resolution-Benachrichtigungen
13. vorhandene Admin-, Status- und weitere transaktionale eDebatte-Mails

Keine Mail darf nur deshalb außerhalb des Kanons bleiben, weil sie in einer anderen Datei oder Route erzeugt wird.

### 4.5 Mehrsprachigkeit

Das Mail-System verwendet ein gemeinsames Template mit lokalisierbaren Inhaltsbausteinen, nicht vollständige kopierte HTML-Dateien je Sprache.

Zu lokalisieren sind mindestens:

- Subject
- Preheader
- Anrede
- Überschrift
- Erläuterung
- CTA
- Sicherheitshinweis
- Gültigkeits-/Ablaufhinweis
- Signatur und Footer

Verbindliche Regeln:

- bestehende reale Locale-Infrastruktur wiederverwenden
- mindestens Deutsch und Englisch vollständig implementieren und testen
- weitere bereits im System unterstützte Sprachen strukturell anbinden
- dokumentierter Fallback bei fehlender Übersetzung
- Original-, Bedien- und Ausgabesprache nicht vermischen
- deutsche Texte mit `ä`, `ö`, `ü`, `ß`; keine UI-Copy wie `Gruesse`, `fuer` oder `gueltig`
- dialogische Anrede kann dem Nachbarschaftsprinzip folgen, Auth- und Sicherheitsmails bleiben jedoch knapp, eindeutig und phishing-resistent

## 5. Inhaltlicher Kanon

Alle eDebatte-Systemmails sind:

- menschlich
- freundlich
- verständlich
- wertschätzend
- sicherheitsbewusst
- eindeutig hinsichtlich Absender und Anlass

Sie sind nicht:

- werblich aufdringlich
- künstlich verspielt bei sicherheitskritischen Schritten
- VoiceOpenGov-gebrandet
- voller unbelegter Wirkungs-, Sicherheits- oder Zustellversprechen
- mit allgemeinen KI- oder Auto-Publish-Behauptungen versehen

Jede Mail erklärt, weshalb sie versendet wurde und was zu tun ist. Sicherheitsmails erklären außerdem, wie die Nachricht ignoriert werden kann, wenn der Vorgang nicht selbst ausgelöst wurde.

## 6. Testvertrag

### 6.1 Renderer- und Template-Tests

- gemeinsamer Rahmen wird von jedem migrierten Mailtyp verwendet
- Subject, Preheader, HTML und Text sind nicht leer
- genau ein sinnvoller Hauptinhalt und höchstens eine dominante primäre Handlung
- OTP-/Codewerte bleiben unverändert
- Plain Text enthält CTA-Ziel oder Code
- Footer und sichtbare eDebatte-Identität vorhanden
- keine sichtbare VoiceOpenGov- oder No-Reply-Identität

### 6.2 Security-Tests

- HTML-Escaping für bösartige Namen, Organisationen, Rollen und Planwerte
- keine Script-, Event-Handler- oder ungeprüfte Markup-Injektion
- keine Codes, Token oder Reset-Links in Mailer-Logs
- Empfänger-Policy blockiert reservierte Platzhalterdomains weiterhin
- keine realen Testsendungen an erfundene Adressen

### 6.3 Envelope-/Env-Tests

- `MAIL_FROM="eDebatte <members@edebatte.org>"`
- `MAIL_REPLY_TO="eDebatte Team <members@edebatte.org>"`
- identischer `SMTP_FROM` wird als Legacy-Alias akzeptiert
- abweichender `SMTP_FROM` erzeugt Konflikt
- fehlender Production-Absender ist fail-closed
- VoiceOpenGov-/No-Reply-Absender werden in Production abgelehnt
- `.env.example` enthält keine alte sichtbare Absenderidentität

### 6.4 Locale-Tests

- DE vollständig
- EN vollständig
- dokumentierter Fallback
- Umlaute und `ß` korrekt
- Subject, Preheader und Text entsprechen derselben Sprache

### 6.5 Integrations- und Regressionstests

Mindestens relevante Pfade prüfen:

- Login/2FA
- Identitätscode
- Verifikation
- Passwort
- Organisationseinladung
- Mitgliedschaft
- Support-Resolution

Pflichtchecks:

```bash
pnpm codex:preflight -- --task MAIL-COMMUNICATION-CANON-01
pnpm -w run typecheck
pnpm lint
pnpm -C apps/web run build
git diff --check
```

Zusätzlich alle fokussierten Mail-, Auth-, Env-, Mailer- und Security-Tests.

## 7. Harte Grenzen

- kein Newsletter-Marketing-System
- keine neue Queue allein für diesen Slice
- keine neue externe Mailplattform ohne eigene Entscheidung
- kein Tracking-/Analytics-Ausbau
- keine neue VoiceOpenGov-Mailarchitektur
- keine Änderung von Membership-, Rollen-, Preis- oder Consent-Semantik
- keine automatischen Nachrichten an unbestätigte, erfundene oder nicht verwaltete Empfänger
- keine Secrets oder DNS-Werte im Repository
- kein Auto-Publish

## 8. Produktions-Gate

`MAIL-PRODUCTION-SENDER-GATE-01` bleibt unabhängig von der technischen Umsetzung `manual_gate`.

### 8.1 Runtime und Postfach

Praktisch zu bestätigen:

- Production `MAIL_FROM` exakt `eDebatte <members@edebatte.org>`
- Production `MAIL_REPLY_TO` exakt `eDebatte Team <members@edebatte.org>`
- `SMTP_FROM` entfernt oder identisch
- SMTP-Provider autorisiert `edebatte.org`
- `members@edebatte.org` existiert und empfängt Antworten
- Preview und Production sind bewusst getrennt

### 8.2 Domain-Authentifizierung

Providerabhängig und anhand echter Header prüfen:

- SPF: pass
- DKIM: pass
- DMARC: pass
- Alignment nachvollziehbar
- Envelope-From / Return-Path dokumentiert

Konkrete DNS-Einträge werden nicht geraten. Es gelten die durch den tatsächlich verwendeten Provider ausgegebenen Werte.

### 8.3 Realer Production-Smoke

An ein kontrolliertes Betreiber-/Testpostfach senden und prüfen:

- sichtbarer Name `eDebatte`
- sichtbare Adresse `members@edebatte.org`
- Reply-To an das verwaltete eDebatte-Postfach
- korrekter Betreff und Preheader
- Brand-Header, Codebox, CTA, Sicherheitscopy und Footer
- HTML und Plain Text
- ausschließlich erwartete eDebatte-Links
- Apple Mail, Gmail und Outlook
- Desktop und Mobile
- Dark Mode
- SPF, DKIM und DMARC anhand der Header

Evidence enthält keine aktiven Codes, Token, vollständigen personenbezogenen Inhalte oder Secrets.

### 8.4 Rollback

Ein Rollback darf nicht zu VoiceOpenGov oder No-Reply zurückkehren. Ist der neue Sender nicht sicher nutzbar, wird der Versand kontrolliert deaktiviert und der Fehler sichtbar behandelt.

## 9. Statusmodell

### `MAIL-COMMUNICATION-CANON-01`

- Start: `codex_ready`
- während Umsetzung: `in_progress`
- nach Code-/Test-/Preview-Nachweis: `review`
- nach Produktabnahme: `done`

### `MAIL-PRODUCTION-SENDER-GATE-01`

- Start und bis zum echten Nachweis: `manual_gate`
- ein grüner Build oder eine Preview ersetzt den Production-Smoke nicht

## 10. Empfohlener Scope der ersten PR

Bevorzugte Dateien:

- `apps/web/src/utils/emailTemplates.ts`
- neue zentrale Mail-Renderer-/Content-Module in einer bestehenden passenden Mail-Domäne
- `apps/web/src/utils/mailer.ts`
- `apps/web/src/lib/server/webRuntimeEnv.ts`
- `apps/web/src/utils/env.ts`
- `apps/web/src/types/env.d.ts`
- `apps/web/.env.example`
- reale Mail-Aufrufer
- fokussierte Tests
- `docs/E150/OpenTasks.md`
- Evidence-Dokument unter `docs/E150/`

Branch nach grünem Preflight:

```text
fix/mail-communication-canon-01
```

Worktree:

```text
/Users/RF/Arbeitsmappe/worktrees/edebatte-mail-communication-01
```

## 11. Abschlussdefinition

Der Slice ist nicht dadurch abgeschlossen, dass das neue Layout im Code existiert. Abgeschlossen ist er erst, wenn:

1. alle realen Systemmail-Pfade inventarisiert und migriert sind,
2. gemeinsame Brand-, Sprach-, Security- und Envelope-Verträge greifen,
3. relevante Tests und Build grün sind,
4. Preview fachlich geprüft wurde,
5. der technische Task auf `done` steht,
6. und das getrennte Production-Gate durch einen echten Versandnachweis geschlossen wurde.
