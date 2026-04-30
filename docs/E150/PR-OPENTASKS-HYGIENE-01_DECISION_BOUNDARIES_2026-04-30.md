# PR-OPENTASKS-HYGIENE-01 — OpenTasks SSOT Hygiene + Decision Boundaries

Datum: 2026-04-30
Repo: `VOGADMINRGF/edebatte-org`

## Ziel
OpenTasks als operative SSOT bereinigen, Chat-Backlog-Sweep abschließen und echte Entscheidungsaufgaben explizit als `needs_decision` markieren.

## Durchgefuehrt

1. `PR-CHAT-BACKLOG-01` auf `done` gesetzt.
2. `GOV-CIVIC-ECON-01` von `open` auf `needs_decision` gesetzt.
3. `PR-BETEILIGUNGSRADAR-00` als klare Decision-Boundary bestaetigt (`needs_decision`, Docs-only).
4. `DOMAIN-HARM-01C` als klare Decision-Boundary bestaetigt (`needs_decision`, keine harte Migration ohne expliziten Beschluss).
5. Zusatznotizen im Bereich `Next codex_ready tasks` sprachlich auf den Hygiene-Stand angepasst.

## Entscheidungsgrenzen (explizit)

- Kein Beteiligungsradar-Build in diesem Slice.
- Keine Ingestion-/Crawler-/Ausschreibungsautomation.
- Keine automatische Anlassraum-/Runden-/Mandat-Erzeugung.
- Keine harte `/anlassraum`-Migration ohne separaten Produktentscheid inkl. Redirect-/SEO-Policy.
- Keine stillen Wirtschafts-/Satzungsentscheidungen in Code oder Doku außerhalb expliziter Governance-Entscheidung.

## Ergebnis

- `docs/E150/OpenTasks.md` ist in den betroffenen IDs konsistent mit dem SSOT-Prinzip.
- Chat-Backlog-Ideen sind als operative Folge-Tasks vorhanden; Hygiene-Sweep selbst ist abgeschlossen.
- Entscheidungspflichtige Themen bleiben offen und klar abgegrenzt.
