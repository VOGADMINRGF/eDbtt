# RATHAUS-DEMO-GRAPH-SEED-01

Stand: 2026-05-17
Issue: `#162`
Branch: `pr/rathaus-demo-graph-seed-01`

## Ziel

Der offizielle Reinickendorf-Link zur Bürgerbeteiligung Investitionsprogramm 2025-2029 / Haushalt 2026-2027
soll in `/create` als expliziter review-first Seed-Fall erkennbar sein.

Öffentliche Nutzer sehen nur eine sichere Themenvorschau.
Admin- und reinickendorf-scoped Verwaltungsrollen sehen die vollständigen reviewpflichtigen Seed-Kandidaten.

## Umgesetzt

- Neuer shared Seed in `features/region/rathausDemoSeed.ts`
- Erkennung offizieller `berlin.de`-Reinickendorf-URLs für:
  - `https://www.berlin.de/ba-reinickendorf/service/buergerbeteiligung/investitions-haushaltsplanung/`
  - `https://www.berlin.de/ba-reinickendorf/aktuelles/pressemitteilungen/2025/pressemitteilung.1549089.php`
- Frist `04.05.2025` wird im Seed als abgelaufen behandelt; Verfahren ist `closed` und `archived`
- Public `/create`:
  - maximal 3 Themencluster
  - klare Warnung bei fehlender Region-/Admin-Berechtigung
  - keine Dossier-/Anlassraum-/Claim-Anlage
- Admin-/Regionsicht in `/create`:
  - 2 Dossiers
  - 16 Anlassräume
  - 48 reviewpflichtige Claims / Fragen / Optionen
  - Links zu `/admin/region`, `/admin/review`, `/dossier/[id]/studio`, `/runden?view=active&anlassraumId=...`
- Review-Queue erweitert:
  - Rathaus-Demo-Dossiers und Anlassraum-Seeds erscheinen als `region_intelligence_suggestion`
  - alle Seed-Items bleiben `internal_review`

## Seed-Inhalt

Dossiers:

1. `Bürgerbeteiligung Investitionsprogramm 2025-2029 / Haushalt 2026-2027 Reinickendorf`
2. `Rathaus Reinickendorf`

Anlassräume:

1. Rathaus: Sanierung der Medien ab 2028
2. Rathaus als Bürgerort
3. Haushalt verständlich machen
4. Barrierefreiheit und Zugang im Rathaus
5. Prioritätenvergleich Rathaus, Schulen, Kultur, Sport, Straßen
6. Fontane-Haus Innensanierung
7. ATRIUM Wasser, Abwasser, Elektrik, Dachflächen
8. Humboldt-Bibliothek Sanierung
9. Sportanlage Goeschenstraße
10. Seniorenfreizeitstätte Adelheidallee
11. Kurt-Schumacher-Quartier Jugendfreizeitstätte
12. Jugendfreizeitstätte Fuchsbau
13. Ollenhauerstraße / Oranienburger Straße
14. Schulbauoffensive Reinickendorf
15. Pauschale Investitionsmittel priorisieren
16. Gezielte Zuweisungen erklären

Jeder Anlassraum enthält genau 3 reviewpflichtige Bausteine:

- 1 Quellen-Aussage
- 1 Verständlichkeitsfrage
- 1 Priorisierungs-/Entscheidungsoption

Gesamt: `48`

## Guardrails

- kein Auto-Publish
- keine automatische amtliche Freigabe
- keine automatische Dossier-Finalisierung
- keine automatische Anlassraum-Finalisierung
- kein stiller Graph-Merge

## Geänderte Dateien

- `features/region/rathausDemoSeed.ts`
- `features/region/index.ts`
- `features/reviewQueue.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/CreateRathausDemoSourcePreview.tsx`
- `apps/web/tests/create-link-extraction-public-preview.contract.test.ts`
- `apps/web/tests/create-link-extraction-admin-gate.contract.test.ts`
- `apps/web/tests/reinickendorf-rathaus-demo-graph-seed.contract.test.ts`
- `apps/web/tests/rathaus-demo-anlassraum-claims.contract.test.ts`
- `apps/web/tests/dossier-anlassraum-many-to-many-seed.contract.test.ts`
- `apps/web/tests/review-queue.rathaus-demo-seed.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Validierung

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run \
  tests/create-link-extraction-public-preview.contract.test.ts \
  tests/create-link-extraction-admin-gate.contract.test.ts \
  tests/reinickendorf-rathaus-demo-graph-seed.contract.test.ts \
  tests/rathaus-demo-anlassraum-claims.contract.test.ts \
  tests/dossier-anlassraum-many-to-many-seed.contract.test.ts \
  tests/review-queue.rathaus-demo-seed.test.ts
```

Status: grün
