# E150 Pilot Backbone

## Primärziel (Pilot) + Definition of Done

Ziel: Das System kann sich minimal selbst "fuettern" (Feeds), erzeugt Kandidaten (Thema/Behauptung),
fuehrt einen steuerbaren Faktencheck durch und schreibt verwertbare Outputs in Graph/Dossier.

Definition of Done (Pilot):
- Feeds werden ingestiert und als StatementCandidates gespeichert (Dedupe + Hash).
- Kandidaten werden analysiert und als Drafts bereitgestellt.
- Faktencheck laeuft in Stufen (0/1/2) und schreibt Dossier-Outputs.
- Pilot-Settings steuern Level, Budget und Auto-Run.
- Run-Receipts pro Kandidat werden protokolliert (Status + Level + Kosten falls verfuegbar).

## Faktencheck-Stufen (0/1/2) + Admin-Hebel

- Level 0: Keine neue KI-Analyse, nur bestehende Claims aus Draft (ohne SERP).
- Level 1: KI-Analyse (Claims) ohne SERP.
- Level 2: KI-Analyse + SERP-Quellen.

Hebel:
- `check_level` (0..2)
- `daily_budget` (Units/EUR)
- `per_topic_budget` (Units/EUR)
- `auto_run_enabled` (true/false)
- `max_items_per_feed`

## Rollen + Beitragstypen

- Admin: Settings, Pilot-Run, Freigaben.
- Journalist: Review/Feinschliff von Drafts & Factcheck.
- Community: Quellen, Behauptungen, Optionen, Folgen, offene Fragen (via Research/Contributions).

## Schnittstellen-Übersicht

Feeds & Kandidaten:
- `POST /api/feeds/pull` (Feeds ingestieren)
- `POST /api/feeds/analyze-pending` (Kandidaten analysieren)

Pilot Control:
- `GET/POST /api/admin/pilot/settings` (Settings lesen/schreiben)
- `POST /api/admin/pilot/run` (End-to-End Pilot-Lauf)

Faktencheck + Dossier:
- `POST /api/factcheck/enqueue` (Faktencheck starten)
- Dossier-Collections: `dossier_*` (Sources, Claims, Findings, Edges)

Admin UI:
- `/admin/pilot` (Pilot Control)
- `/admin/feeds/drafts` (Draft Review)
