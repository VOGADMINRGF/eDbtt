# GOV-ATLAS-01E - Atlas / Weekly Visual Polish (2026-04-04)

## Scope

Gezielter Visual-Polish fuer die bestehenden Surfaces:
- `/atlas`
- `/atlas/weekly`

Kein neuer Contract-Block, keine neue Ranking-/Wahrheitslogik, kein Rebuild.

## Umgesetzt

1. Ruhigere Hierarchie und Bereichsnavigation
- Beide Surfaces erhielten mobile-taugliche Bereichsanker (Summary/Ansicht/Region/Kontext/Guardrails).
- Bessere visuelle Abschnittstrennung ohne neue Produktlogik.

2. Atlas-Surface (`/atlas`) nachgehärtet
- Header-Aktionsbereich klarer (Weekly-Link + Rueckverweis auf Betriebsflaeche).
- Themencluster-Chips kompakter und lesbarer.
- Detailbloecke mit Eintragszaehlern und konsistenter Marker-Darstellung.
- Flow- und Guardrail-Bereich ruhiger gegliedert.

3. Weekly-Surface (`/atlas/weekly`) nachgehärtet
- Public-first Wochenansicht mit staerkerer Lesefuehrung.
- Summary/Flows/Themen/Region-Kontexte sauberer getrennt.
- Interner Detailmodus bleibt optional und ueberlaedt die Public-Ansicht nicht.
- Screenshot-/Partner-taugliche Kartenhierarchie verbessert.

4. Atlas <-> Weekly Verbindung
- Konsistente Navigationspunkte zwischen beiden Surfaces.
- Keine losen Einzelscreens mehr.

## Guardrails bleiben unverändert

- Thema vs. Region bleibt getrennt.
- Kontextmarker bleiben non-epistemisch.
- Keine Toplist-/Wahrheits-/Prioritaetsoptik.
- Read-only und kein Auto-Publish.

## Nicht Teil von 01E

- keine Social-Review-Queue,
- keine Export-/Render-Engine fuer Bilddateien,
- keine neuen Filter-/Interaktionssysteme.
