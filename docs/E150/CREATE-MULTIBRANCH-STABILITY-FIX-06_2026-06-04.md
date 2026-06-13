# CREATE-MULTIBRANCH-STABILITY-FIX-06

Stand: 2026-06-04

## Was wurde stabilisiert?

- Der aktive Themenast im `/create`-Multi-Branch-Board bleibt nach Branch-Aktionen stabil erhalten, solange derselbe Ast weiter existiert.
- Branch-Aktionen speichern jetzt idempotent auf demselben `packageId`-Arbeitsstand statt neue sichtbare Ledger-Pakete zu erzeugen.
- Nach vollständig gesetzten Branch-Aktionen erscheint eine Abschlussführung mit reinen Draft-CTAs:
  - `Im Profil ansehen`
  - `Ein Thema weiterbearbeiten`
  - `Neuen Beitrag starten`
- Account-/Ledger-Anzeige dedupliziert gleiche `packageId` und zeigt pro Paket nur den neuesten sichtbaren Arbeitsstand, ohne ältere Branch-Teilstände still zu verlieren.
- Der `data-voxy-variant`-Hydration-Mismatch im `/create`-Pfad ist behoben: initial wird deterministisch dieselbe Light-Variante gerendert, erst nach Mount darf der Dark-Fall wechseln.

## Guardrails bleiben unverändert

- Keine automatische Veröffentlichung
- Kein Auto-Vote
- Kein Auto-Merge
- Kein echtes QR-/Swipe-Publishing
- Keine fachliche lokale Heuristik
- Alles bleibt `Draft/Preparation`

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/account-organization-dashboard.page.test.tsx`

Ergebnis:

- Typecheck grün
- Lint grün
- 3/3 fokussierte Testdateien grün
- 20/20 Tests grün

## Bewusst offen

- `CREATE-EXISTING-MATCH-COUNTING-06`
- `CREATE-QR-SWIPES-PUBLISH-PREP-07`
