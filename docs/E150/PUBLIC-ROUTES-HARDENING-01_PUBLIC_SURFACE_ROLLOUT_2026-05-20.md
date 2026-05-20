# PUBLIC-ROUTES-HARDENING-01

Stand: 2026-05-20

## Ziel

Die bestehenden öffentlichen Rollout-Routen sollten nach `TOPIC-PAGE-PUBLIC-TARGET-01` nicht nur sichtbar, sondern auch robust, verständlich und loginfrei lesbar sein:

- `/topic/[slug]`
- `/runden`
- öffentliche Dossier-Leseflächen
- Share-/QR-Flächen auf diesen Pfaden

Keine neue Content-Plattform, kein Auto-Publish, kein automatisches `public_official`.

## Umsetzung

### 1. Öffentliche Topic-Route gehärtet

- `/topic/[slug]` rendert sichtbare `topic_page`-Ziele weiter öffentlich und loginfrei.
- Bekannte nicht sichtbare `topic_page`-Ziele fallen nicht mehr still auf die alte Topic-Surface zurück.
- Stattdessen gibt es öffentliche Holding-States für:
  - `internal_review`
  - `archived`
  - `blocked`
- Unbekannte Slugs ohne Topic-Target oder Legacy-Topic bleiben 404.
- Nicht sichtbare Topic-Ziele erzeugen `noindex`-/`nofollow`-Metadaten.

### 2. Dossier-Lesefläche ehrlicher gemacht

- Share-/Preview-/Companion-Chrome erscheint nur noch auf lesbaren öffentlichen Dossierständen.
- `review_only` zeigt explizit:
  - reviewpflichtiger Draft
  - kein öffentlicher Link
  - keine Share-Fläche
  - kein QR
- Fehlende oder nicht ladbare Dossiers bleiben ehrliche Empty-/Fehlerzustände ohne Demo-Scheinpfad.

### 3. `/runden`-Copy nachgeschärft

- Öffentliche Guide-Copy deckt jetzt auch `archived` explizit ab.
- QR-/Share-Copy sagt klar:
  - Link/Share/QR erst nach bewusster sichtbarer Freigabe
  - Sichtbar heißt nicht automatisch geprüft oder amtlich
  - Widerruf/Archivierung nimmt den öffentlichen Pfad wieder zurück

## Guardrails

- kein Auto-Publish
- kein automatisches `public_official`
- kein Social Publishing
- kein Payment
- keine neue Content-Plattform
- bestehende Topic-/Dossier-/Anlassraum-/Content-Release-/Publication-Risk-Ladder-Strukturen weiterverwendet

## Tests / Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/topic-public-page.contract.test.tsx tests/dossier-public-route.contract.test.tsx tests/dossier-output-studio.page.contract.test.ts tests/runden-page.acceptance.test.ts tests/runden-public-sharing-guide.contract.test.tsx tests/runden-qr-participation-language.contract.test.tsx`
- `pnpm --filter @vog/web build`

## Ergebnis

Die öffentlichen Rollout-Pfade sind jetzt klarer lesbar und statusfester:

- sichtbare Inhalte bleiben loginfrei lesbar
- unbekannte Pfade liefern 404
- nicht sichtbare, archivierte oder blockierte öffentliche Zielpfade zeigen ehrliche Holding-States
- Share-/QR-Flächen erscheinen nur auf passenden sichtbaren Ständen
- `public_official` bleibt vollständig beim Official-Release-Pfad
