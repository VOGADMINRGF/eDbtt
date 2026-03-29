# GOV-AI-02B CTA-Ist-Contract Restabdeckung (Stand 2026-03-27)

Ziel:
- verbleibende CTA-Ist-Contracts in Legacy-/Wrapper-/Route-Pfaden dokumentieren,
- Wrapper-/Route-Paritaet testseitig einfrieren,
- keine CTA-Produktentscheidung vorwegnehmen.

Nicht-Ziel:
- kein neues CTA-Keyset,
- keine neue CTA-Priorisierung,
- keine neuen Routing-Defaults.

## 1) Aktueller Ist-Contract (unveraendert)

- Primarer typed Contract: `create_analyze.v1` ueber `buildCreateAnalyzeResponse(...)`.
- CTA-Keyset bleibt:
  - `zustimmen`
  - `anders_sehen`
  - `dossier_oeffnen`
  - `anlassraum_oeffnen`
  - `perspektive_anhaengen`
  - `neu_anlegen`
- Fallback bleibt `no_match` + `neu_anlegen`/`perspektive_anhaengen` ohne Silent-Merge.

Code-Evidenz:
- `apps/web/src/features/create/analyzeContract.ts`
- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/app/api/create/analyze/route.ts`

## 2) Route-/Wrapper-Paritaet Tests

| Pfad | Fokus | Testdatei |
| --- | --- | --- |
| `/api/contributions/analyze` | typed `createAnalyze` payload fuer match/no-match/degraded-faelle | `apps/web/tests/create-analyze.route.test.ts` |
| `/api/create/analyze` | Delegation + unveraenderte Wrapper-Antwort (ok/degraded/non-200) | `apps/web/tests/create-analyze.create-route.test.ts` |
| `ctaHandoff` | Ist-Auswahl/Fallback fuer `anlassraum_oeffnen`, `dossier_oeffnen`, `neu_anlegen`, `perspektive_anhaengen` | `apps/web/tests/create-cta-handoff.test.ts` |
| `matchService` | Ist-Keyset/Fallback-Grundlagen fuer CTA-Vorschlaege | `apps/web/tests/create-match.service.test.ts` |

Neu in `GOV-AI-02B`:
- Wrapper-Paritaet fuer `/api/create/analyze` explizit auf
  - degraded/fallback envelope
  - non-200 upstream response
  testseitig eingefroren.

## 3) Offene Decision-Boundary (Parent `GOV-AI-02`)

- Offen bleibt die fachliche Entscheidung, wie CTA-Ausgaenge priorisiert und kanonisiert werden.
- Dieses Dokument und die Tests fixieren nur den Ist-Zustand, damit spaetere Entscheidungen regressionssicher umgesetzt werden koennen.
