## CREATE-PLACE-CLARIFICATION-BRANCH-SCOPE-10

Status: done  
Date: 2026-06-05

### Was wurde geändert?

- Die globale Ortsrückfrage im `/create`-Followup wird bei Mehrthemen-Beiträgen nicht mehr als eigenes Hauptpanel gerendert.
- Das Multi-Branch-Action-Board bleibt sichtbar, auch wenn ein lokaler Ast noch eine Ortsangabe braucht.
- Offene Ortsklärung erscheint jetzt nur noch am betroffenen Branch.
- Das Beitragspaket zeigt optional nur einen kleinen Paket-Hinweis:
  - `1 Thema braucht noch eine Ortsangabe.`
- Der Branch-CTA wurde präzisiert auf:
  - `Ohne Ort als Entwurf speichern`

### Ergebnis im Mehrthemen-Fall

Bei einem Beitrag wie:

- neuer Radweg in der Clara-Pankowr Allee
- Haftbedingungen
- Renteneintrittsalter
- schwere Straftaten
- Politikertransparenz / Leistungskontrollen

gilt jetzt:

- Das Beitragspaket bleibt sichtbar.
- Der Radweg-Ast zeigt `Ort noch klären`.
- Andere Äste bleiben sofort mit QR-/Swipe-/Review-/Save-Aktionen bearbeitbar.
- Es gibt kein globales Ortsklärungs-Gate mehr.

### Guardrails

- Keine neue Produktlogik
- Kein Publish
- Kein Vote
- Kein Merge
- Keine fachliche lokale Heuristik
- Alles bleibt Draft/Preparation

### Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-place-clarification.contract.test.tsx tests/create-place-registry-jurisdiction.contract.test.tsx tests/create-multibranch-actions.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/create-qr-swipes-drafts.contract.test.tsx`

Ergebnis:

- Typecheck grün
- Lint grün
- 5/5 Testdateien grün
- 24/24 Tests grün
