# Truth Guardrails & Factcheck Intervention

## Ziel
Wenn Gegenquellen oder Factcheck-Ergebnisse dem Erstframing widersprechen, muss das Dossier die
ursprüngliche Darstellung sichtbar relativieren.

## Produktregel
- Kein Medium erhält Deutungshoheit.
- Erstframing ist ein Anlass, kein Endurteil.
- Gegenquellen, Einspruch und Factcheck werden bei Divergenz priorisiert angezeigt.

## Datenmodell
`truthGuardrails` (optional auf `Dossier`):
- `framingStatus`: `initial | contested | relativized`
- `sourceDivergence`: `supports | contradicts | unclear | mentions | score | status`
- `factcheckIntervention`: `status | summary | lastUpdatedAt`

## Ableitung
Falls kein persistiertes `truthGuardrails` vorliegt, wird es aus:
- `analyze.findings`
- `corrections` (Einspruch/Korrektur)

abgeleitet (`features/dossier/truthGuardrails.ts`).

## UI
- `TruthGuardrailsPanel` in der Dossier-Sidebar.
- Header-Hinweis bei `framingStatus !== initial`.
- Demo-Factcheck zeigt Source-Divergence und Interventionsstatus als Prozesssignal.

