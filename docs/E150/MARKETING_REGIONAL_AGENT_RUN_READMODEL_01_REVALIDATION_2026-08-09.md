# MARKETING-REGIONAL-AGENT-RUN-READMODEL-01 · Revalidierung

Stand: 2026-08-09

Branch: `feat/marketing-regional-agent-run-readmodel-01`

Draft-PR: `#556`

## Ergebnis

Der bestehende Implementierungsbranch wurde konfliktfrei mit
`main@347c8b20eb5e9342c332f82114b5f8d63dd7d893` synchronisiert. Der Merge-Head
vor diesem Evidence-Nachtrag ist
`f3ac15bb96d5395234fe287dac64a6d75752a431`.

Es waren keine fachlichen Codekorrekturen erforderlich. Der vorhandene
Regional-Agent-Run bleibt:

- ausschließlich lesend und an das bestehende Admin-/2FA-Gate gebunden;
- auf repo-backed Fixtures ohne Live-Suche oder Providerkante begrenzt;
- mit getrennten Original-, Lese-, Bedien- und Ausgabesprachen;
- mit user-safe Trace ohne private Chain-of-Thought, Prompt-Rohdaten oder
  Secrets;
- mit ausschließlich `suggestion_only` gekennzeichneten Kandidaten;
- ohne Kampagnenmutation, Distribution, Veröffentlichung oder neue
  Persistenz.

## Kollisionsprüfung

Der tatsächliche PR-Scope umfasst `21` Marketing-, GET-API-, Test- und
Package-Dateien. Die Dateilisten aller offenen Fremd-PRs wurden vor dem Sync
erneut geprüft. Direkte Überschneidung: **0**.

`docs/E150/OpenTasks.md` bleibt außerhalb dieses Implementierungs-PRs. Die
belegte Statuskorrektur erfolgt ausschließlich über den getrennten
Single-Writer-Docs-Slice; dieser Branch erzeugt keine zweite SSOT.

## Technische Nachweise

Alle lokalen Läufe erfolgten unter Node `20.20.2`:

- fokussierte Regional-Agent-/Marketing-Matrix: `6` Dateien, `33/33` Tests
  grün;
- Web-PR-Critical-Guardrails: `20` Dateien, `91/91` Tests grün;
- Production Guardrails: Public Routes `7/7`, Admin Review `6/6`, Publish
  Guardrails `23/23`; insgesamt `36/36` grün;
- Typecheck: grün;
- vollständiger Lint: grün;
- vollständiger Production Build mit ausschließlich `apps/web/.env.example`
  im Prozess: grün; `257` Seitenverträge ohne Verstoß, Compiler und TypeScript
  grün, statische Generierung `323/323`;
- `git diff --check`: grün.

Im Worktree existierte keine `.env.local`. Es wurden keine Secrets gelesen,
geschrieben oder verändert. Die durch den Lockfile-Install lokal regenerierten
Prisma-Dateien wurden vor den Tests vollständig auf den sauberen Branchstand
zurückgeführt und sind nicht Bestandteil des PR-Diffs.

## Verbleibende Gates

Der technische Endstatus bleibt maximal `manual_gate`. Auf dem neuen Exact
Head offen bleiben:

- authentifizierte Preview-Abnahme mit gültiger Vercel-/Admin-Sitzung;
- erneute menschliche Desktop-/Mobile-/Light-/Dark-/DE-/EN-/RTL-Prüfung;
- finale menschliche Fixture-, Provenienz- und Produktabnahme;
- Ready-, Merge- und Production-Entscheidung.

`MARKETING-REGIONAL-SOURCE-DISCOVERY-02` bleibt getrennt im `manual_gate`.
Diese Revalidierung autorisiert weder Live-Recherche noch Providerzugriff,
Credentials, Kampagnenerstellung, Distribution oder Deployment.
