# PR-UX-DOSSIER-02 – Umsetzungsnachweis

Stand: 2026-05-04  
Status: done

## Umgesetzt
- Kompakter Hero in `apps/web/src/components/dossier/DossierViewer.tsx` (kleineres Einstiegslayout, Status/Ebene/Region sichtbar, Details nachrangig als `details`).
- Visual-first Kurzüberblick direkt nach den Einstiegskennzahlen ergänzt:
  - `Warum jetzt?`
  - `Was ist noch offen?`
  - `Welche Folgen sind möglich?`
  - `Wer kann handeln?`
- Begriffsharmonisierung im Dossier:
  - `Evidenzlage & Quellenintelligenz` → `Quellenlage & Überblick`
  - `Evidenz-Überblick` → `Quellenlage-Überblick`
  - Metriklabels auf leichte Sprache (`Quellenlage`, `Was ist noch offen?`, `Perspektivenabdeckung`).
- Section-/Panel-Wording in `apps/web/src/components/dossier/{labels.ts,LegitimacyPanel.tsx}` auf verständlichere Begriffe angepasst.

## Guardrails
- Actor-Trust-/Evidence-Logik bleibt erhalten (keine Parteienlogik, keine Fake-Personalisierung, keine falschen Schutzversprechen).
- Bestehende Evidence-first/Demo-Contracts bleiben grün.

## Tests
- `pnpm --filter ./apps/web exec vitest --run tests/dossier-evidence-first-ux.test.tsx tests/dossier-demo-master-content.test.ts`
- Zusätzlich in Gesamtlauf verifiziert:
  - `tests/ux-actor-trust.contract.test.tsx`
  - `tests/community-contributions.route.actor-trust.test.ts`
  - `tests/community-contributions.route.translation.test.ts`

## Offene Decision Boundaries
- Finale Legal-/Security-Formulierung für vertrauliche Hinweise bleibt separat.
- Rechtssichere/verbindliche Abstimmungsformulierung bleibt separat.
