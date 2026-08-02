# CODEX ENTRY — MAIL-COMMUNICATION-CANON-01

## Ziel

Diesen Entry in einem frischen Codex-Chat im vorgesehenen Worktree verwenden. Der technische Task ist im kanonischen operativen Kopf von `docs/E150/OpenTasks.md` als `codex_ready` registriert. Das Production-Gate bleibt `manual_gate`.

## Terminal: Preflight, Worktree und VS Code

Aus dem Hauptrepository ausführen:

```bash
cd /Users/RF/Arbeitsmappe/edebatte-org \
  && git fetch origin \
  && git pull --ff-only \
  && node scripts/codex-task-preflight.mjs MAIL-COMMUNICATION-CANON-01 \
  && git worktree add -b fix/mail-communication-canon-01 \
       /Users/RF/Arbeitsmappe/worktrees/edebatte-mail-communication-01 \
       origin/main \
  && open -na "Visual Studio Code" \
       /Users/RF/Arbeitsmappe/worktrees/edebatte-mail-communication-01
```

Nur fortfahren, wenn der Preflight `codex_ready` beziehungsweise `executable` meldet. Existiert Branch oder Worktree bereits, keinen zweiten erzeugen, sondern den vorhandenen Zustand prüfen.

## Codex-Auftrag

```text
Arbeite ausschließlich im aktuell geöffneten Worktree:
/Users/RF/Arbeitsmappe/worktrees/edebatte-mail-communication-01

Bestehender Branch:
fix/mail-communication-canon-01

Task:
MAIL-COMMUNICATION-CANON-01

Issue:
#538

Erstelle keinen weiteren Branch, keinen weiteren Worktree und zunächst keinen Pull Request, bevor du Preflight, Pflichtlektüre und Kollisionsprüfung abgeschlossen hast.

Lies zuerst vollständig und in dieser Reihenfolge:
1. AGENTS.md
2. docs/foundation/Constitution.md, sofern auf main vorhanden
3. docs/foundation/Vision.md, sofern auf main vorhanden
4. docs/foundation/Architecture-Canon.md, sofern auf main vorhanden
5. docs/foundation/Engineering-Canon.md, sofern auf main vorhanden
6. docs/brand/EDEBATTE_BRAND_NARRATIVE.md
7. docs/E150/CODEX_RUN_PACK_CONTRACT.md
8. den kanonischen operativen Kopf von docs/E150/OpenTasks.md
9. docs/E150/MAIL-COMMUNICATION-CANON-01_2026-07-30.md
10. docs/E150/MAIL-COMMUNICATION-CANON-01_CODEX_BRIEF.md
11. Issue #538

Führe danach erneut aus:
node scripts/codex-task-preflight.mjs MAIL-COMMUNICATION-CANON-01

Prüfe anschließend offene Pull Requests sowie erkennbare Datei-, Scope- und Produktkollisionen. Beachte insbesondere parallele Änderungen an docs/E150/OpenTasks.md und an Auth-/Support-Mailpfaden. Integriere keine fremden ungemergten Änderungen und überschreibe keinen neueren main-Stand.

Root Cause und Ist-Inventar:
- Ermittle alle realen sendMail-/Nodemailer-Aufrufer und alle inline oder zentral erzeugten Systemmails.
- Belege, wie MAIL_FROM und SMTP_FROM aktuell aufgelöst werden.
- Ermittle, welche Locale-Information je Versandpfad real verfügbar ist.
- Prüfe vorhandene eDebatte-Brand-Assets und Mail-/Env-/Security-Tests.
- Dokumentiere alle gefundenen Mailtypen, auch außerhalb von emailTemplates.ts.

Verbindliche Absenderentscheidung:
MAIL_FROM="eDebatte <members@edebatte.org>"
MAIL_REPLY_TO="eDebatte Team <members@edebatte.org>"
SMTP_FROM bleibt nur ein identischer Legacy-Alias.

Setze anschließend den vollständigen technischen Scope aus Contract und Codex Brief um:
- zentraler kanonischer Mail-Envelope mit from und replyTo
- gemeinsamer responsiver eDebatte-Mailrahmen
- HTML-Escaping aller dynamischen Werte
- zugängliche CTA-, Code-, Hinweis- und Footer-Bausteine
- HTML und gleichwertiger Plain Text
- mindestens vollständige DE-/EN-Lokalisierung mit kontrolliertem Fallback
- Migration aller realen transaktionalen eDebatte-Mailtypen
- Entfernung sichtbarer VoiceOpenGov- und No-Reply-Absender aus eDebatte-Code, Defaults und Tests
- keine Codes, Token, Reset-Links oder Mailinhalte in Logs
- Empfänger- und Production-Guardrails fail-closed
- keine neue Mailruntime, Queue, externe Mailplattform oder Newsletter-Architektur

Erfinde keine DNS-, Provider-, Postfach- oder Production-ENV-Ergebnisse. MAIL-PRODUCTION-SENDER-GATE-01 bleibt manual_gate.

Erstelle Evidence:
docs/E150/MAIL-COMMUNICATION-CANON-01_EVIDENCE_2026-07-30.md

Aktualisiere OpenTasks nur für:
- MAIL-COMMUNICATION-CANON-01: codex_ready → in_progress → nach vollständiger technischer Umsetzung maximal review; done erst nach Produktabnahme
- MAIL-PRODUCTION-SENDER-GATE-01: unverändert manual_gate

Prüfe mindestens:
- fokussierte Mail-, Auth-, Env-, Mailer- und Security-Tests
- pnpm -w run typecheck
- pnpm lint
- pnpm -C apps/web run build
- git diff --check

Ergänze Contract-Tests für:
- gemeinsamen Renderer in allen Mailtypen
- HTML-Escaping
- From und Reply-To
- VoiceOpenGov-/No-Reply-Production-Blockade
- identischen SMTP_FROM-Legacy-Alias
- DE, EN und Fallback
- HTML und Plain Text
- unveränderte OTP-/Codewerte
- keine geheimen Inhalte in Logs

Öffne nach grünem Prüfstand genau einen Draft-PR gegen main. Kein Auto-Merge.

Finale Antwort:
1. Root Cause
2. Architekturänderung
3. vollständiges Mailinventar und migrierte Mailtypen
4. geänderte Dateien
5. Tests und Checks
6. Status MAIL-COMMUNICATION-CANON-01
7. unveränderter Status MAIL-PRODUCTION-SENDER-GATE-01
8. verbleibende reale Provider-/DNS-/ENV-/Postfach-/Mailclient-Gates
9. Draft-PR-Link
```

## Nach dem technischen PR

Erst nach technischer und menschlicher Produktabnahme folgt das getrennte Produktions-Gate. Dort sind reale Provider-, Postfach-, SPF-, DKIM-, DMARC-, Return-Path- und Mailclient-Nachweise erforderlich. Kein Codex- oder CI-Ergebnis ersetzt diesen Schritt.
