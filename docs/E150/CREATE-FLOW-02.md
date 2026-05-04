# CREATE-FLOW-02 — /create Intent-Flows (Beitragen / Pruefen / Entwerfen)

## Ziel
`/create` bleibt ambitionierter Multi-Intent-Composer und wird nicht zurueckgebaut: drei echte Arbeitswege mit klar unterscheidbarem Wording, intent-aware Payload, erster Rueckfrage, Arbeitsstand und Folgeaktionen.

## Problem
Die drei Modi waren vorhanden, aber aus Nutzersicht nicht konsistent als eigenstaendige Flows wirksam (zu wenig sichtbare Differenzierung, zu entkoppelte Rueckfrage, unklare Ergebnisschicht, fehlende technische Intent-Weitergabe).

## Produktentscheidung
Kein Rueckbau. Die drei Modi bleiben und werden als reale Intent-Flows umgesetzt:
- `contribute` (Beitragen)
- `check` (Pruefen)
- `draft` (Entwerfen)

## Geaenderte Dateien
- `apps/web/src/features/create/intentFlows.ts`
- `apps/web/src/app/create/page.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/i18n/operatorSystemTexts.core.ts`
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
- `apps/web/src/app/api/contributions/analyze/parseAnalyzeRequest.ts`
- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/features/create/analyzeContract.ts`
- `apps/web/src/features/create/analyzeBoundaryContract.ts`
- `apps/web/tests/create-intent-flows.contract.test.ts`
- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/create-mode-selector.contract.test.ts`
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`
- `apps/web/tests/create-entry-i18n.render.test.tsx`
- `apps/web/tests/create-followup-i18n.contract.test.ts`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `apps/web/tests/create-analyze.contract.test.ts`
- `apps/web/tests/create-analyze.create-route.test.ts`
- `apps/web/tests/create-analyze.envelope.test.ts`
- `apps/web/tests/create-analyze.boundary-contract.test.ts`
- `apps/web/tests/create-analyze.route.test.ts`
- `apps/web/tests/create-analyze.workspace-ui.test.ts`

## UX-Verhalten pro Intent
### Beitragen
- Titel/Helper/Placeholder/Button auf Beitragslogik abgestimmt
- erste Rueckfrage: wichtigster nicht zu verlierender Punkt
- Arbeitsstand mit erkannter Typisierung, Kurzfassung, offener Zuordnung, offenen Punkten, naechsten Schritten

### Pruefen
- Titel/Helper/Placeholder/Button auf Prueflogik abgestimmt
- erste Rueckfrage: welche Aussage/Entscheidung genauer geprueft werden soll
- Arbeitsstand mit Pruefgegenstand, offenen Fragen, Gegenposition-/Quellenbezug, naechsten Schritten

### Entwerfen
- Titel/Helper/Placeholder/Button auf Entwurfslogik abgestimmt
- erste Rueckfrage: Zielgruppe und vorbereitete Entscheidung
- Arbeitsstand mit Entwurfszweck, Struktur-/Baustein-Logik, naechsten Schritten

## Contract-/Flow-Hardening
- Intent-Normalisierung unterstuetzt neue Query `?intent=` und legacy-kompatibel `?mode=` ohne Deep-Link-Bruch.
- Intent wird bis zum Analyze-Request/Response-Vertrag durchgereicht (`intent` Feld).
- Start-Validierung ist sichtbar: leer/zu kurz blockiert mit hilfreicher Meldung.
- Kontext-Picker bleibt optional und nutzt weniger technische Nutzertexte.
- Kontingent-/Zugriffsbereich bleibt vorhanden, aber eingeklappt.
- Fehlerpfade behalten Eingabetext, aktiven Intent und Rueckfrage-Antwort.

## Tests
Ausgefuehrt am 2026-05-04:
- `pnpm -C apps/web run typecheck` ✅
- `pnpm -C apps/web run lint` ✅
- `pnpm -C apps/web exec vitest run tests/create-intent-flows.contract.test.ts tests/create-mode.page.test.ts tests/create-mode-selector.contract.test.ts tests/create-entry-hierarchy.contract.test.tsx tests/create-entry-i18n.render.test.tsx tests/create-followup-i18n.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/create-analyze.contract.test.ts tests/create-analyze.create-route.test.ts tests/create-analyze.envelope.test.ts tests/create-analyze.boundary-contract.test.ts tests/create-analyze.route.test.ts tests/create-analyze.workspace-ui.test.ts` ✅
- `pnpm -C apps/web run build` ✅ (non-blocking Warnungen: `baseline-browser-mapping` veraltet; waehrend Page-Data-Collection mehrfach `querySrv ECONNREFUSED _mongodb._tcp.cluster0.byqqblz.mongodb.net`, Build trotzdem erfolgreich)

## Offene Folgepunkte
- Keine neue Backend-Persistenz fuer erweiterten Arbeitsstand in diesem Slice.
- Keine neuen rechtlichen Aussagen zu vertraulichen Hinweisen oder rechtssicheren Abstimmungen.
