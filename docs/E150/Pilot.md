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
- Community: Quellen, Behauptungen, Optionen, Folgen, offene Fragen (via Research + `/community/contributions`).

## Schnittstellen-Übersicht

Feeds & Kandidaten:
- `POST /api/feeds/pull` (Feeds ingestieren)
- `POST /api/feeds/analyze-pending` (Kandidaten analysieren)

Pilot Control:
- `GET/POST /api/admin/pilot/settings` (Settings lesen/schreiben; Change-Receipts in `pilotSettingsChanges`)
- `POST /api/admin/pilot/run` (End-to-End Pilot-Lauf: pull → analyze-pending)

Faktencheck + Dossier:
- `POST /api/factcheck/enqueue` (Faktencheck starten)
- Dossier-Collections: `dossier_*` (Sources, Claims, Findings, Edges)

Admin UI:
- `/admin/pilot` (Pilot Control Plane)
- `/admin/feeds/drafts` (Draft Review)

## Akquise-Dashboard (PR-0010)

Ziel:
- Staff-only Dashboard fuer Gemeinden/Regionen mit Feed-Status, Last-Fetch und Top-Themen.

Datenfelder (minimal):
- Region/Gemeinde, Feed-Count, Status, LastFetch, ItemCount, Error, Top-Themen (grob).

Status-Logik (minimal):
- ok: letzter Fetch erfolgreich und Items > 0
- leer: Fetch ok, aber keine Items
- fehlerhaft: letzter Fetch fehlgeschlagen

## Beitragstypen + Moderation (PR-0011)

Beitragstypen (minimal):
- source, option, question, impact, view

Moderationsstatus:
- proposed, approved, rejected

Ziel:
- Community/Journos schlagen Beitraege vor, Staff gibt frei.

Public:
- `/community/contributions` (Eingabe + freigegebene Liste)
- `POST /api/community/contributions` (neuer Beitrag, status=proposed)
- `GET /api/community/contributions?topicId=...` (freigegebene Beitraege)

Admin:
- `/admin/contributions` (Review)
- `POST /api/admin/community/contributions/approve` (approve/reject)

## Phase 2: Media Ready Projekte (PR-0012)

Ziel:
- Projekte mit 5-10 Themen, pro Thema mind. 5 Optionen (Pflicht), Ergebnisse projektgebunden.
- Community kann zusaetzliche Optionen vorschlagen (proposed).

## Phase 3: Live + Chat Skeleton (PR-0013)

Ziel:
- Nur Skeleton: Types, Routes, UI-Stubs fuer Live/Chat.
- Keine Realtime-Infrastruktur, keine Provider/Keys.
- Flag-guarded und staff-only sichtbar.

Guardrails:
- Keine externen Provider oder Keys einbauen.
- Keine Persistent-Layer-Implementierung, nur Platzhalter.
