# GOV-AI-03A Anlassraum-Arbeitskontext Ist-Matrix (Stand 2026-03-27)

Ziel:
- bestehenden Arbeitskontext-/Handoff-Iststand fuer
  `/create` -> `/runden` / `/swipes` / `/dossier`
  kompakt dokumentieren,
- offene Produktentscheidung im Parent `GOV-AI-03` klar abgrenzen.

Nicht-Ziel:
- kein neuer Anlassraum-Arbeitsmodus,
- keine Routing- oder Surface-Aenderung,
- keine neue Kanonisierung Anlassraum vs. Dossier.

## 1) Surface-Rollen (Ist-Stand)

| Surface | Ist-Rolle |
| --- | --- |
| `/create` | kanonischer Intake/Freistart inkl. Handoff-Kontext |
| `/runden` | kanonische oeffentliche Anlassraum-Entry-Surface |
| `/swipes` | Beteiligungs-/Bewertungsmodus (u. a. Arrival via `fromDraft`) |
| `/dossier/:id` | strukturierte Verdichtung / Zielobjekt |

## 2) Handoff-/Routing-Istmatrix

| Ausgangspunkt | Signal / Contract | Zielpfad im Ist-Stand | Evidenz |
| --- | --- | --- | --- |
| `/create` finalize | server `redirectTo` aus `/api/contributions/finalize` | mit `dossierId` -> `/dossier/<id>`; sonst `/swipes?fromDraft=<draftId>` | `apps/web/src/app/api/contributions/finalize/route.ts`, `apps/web/src/app/api/create/finalize/route.ts`, `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` |
| `/create` CTA/Match | `createAnalyze.suggestedCtas` + `matches[*].targetRef` | kontextabhaengig `/create?...`, `/dossier/...` oder kein Ziel (`neu_anlegen`) | `apps/web/src/features/create/analyzeContract.ts`, `apps/web/src/features/create/matchService.ts`, `apps/web/src/features/create/ctaHandoff.ts` |
| `/swipes` arrival | `fromDraft` Query | fokussierter Arrival-Mode auf Draft-Treffer; no-match fallback bleibt | `apps/web/src/app/swipes/page.tsx`, `apps/web/src/features/surfaces/swipes/arrival.ts` |
| `/anlassraum` alias | non-breaking wrapper | Redirect auf `/runden` mit Query-Paritaet | `apps/web/src/app/anlassraum/page.tsx`, `apps/web/tests/anlassraum-alias.route.test.ts` |

## 3) Offene Decision-Boundary (Parent `GOV-AI-03`)

Offen bleibt:
- wie Anlassraum als **Arbeitsort** produktseitig final modelliert wird,
- welche verbindlichen Nutzerpfade zwischen Anlassraum-Kontext und Dossier-Arbeitsphase spaeter gelten.

Diese Matrix dokumentiert nur den bestehenden Ist-Stand und ersetzt keine Produktentscheidung.
