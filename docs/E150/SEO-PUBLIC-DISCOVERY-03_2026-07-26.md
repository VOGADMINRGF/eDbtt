# SEO-PUBLIC-DISCOVERY-03

Stand: 2026-07-26

## Ziel

Die öffentliche Discovery-Basis sollte nach `PRIVACY-SNIPPET-02` technisch konsistent werden, ohne neue Produkt- oder Routingpfade zu eröffnen:

- kanonische öffentliche Sitemap
- `/robots.txt` mit Sitemap-Verweis
- ein gemeinsames OG-/Sharing-Bild für öffentliche Metadaten
- strukturierte Daten für die Startfläche
- `noindex` für Auth-/Settings-Flächen
- keine irreführende Änderung der bestehenden PWA-Startwahrheit

## Umsetzung

### 1. Zentrale Discovery-Wahrheit

- Neuer SEO-Helper `apps/web/src/lib/seo/publicDiscovery.ts` bündelt:
  - kanonische öffentliche Sitemap-Pfade
  - `NOINDEX_ROBOTS`
  - gemeinsames Public-Metadata-Mapping
  - Default-OG-Bild-URL
  - strukturierte Home-`WebSite`-Daten

### 2. Öffentliche Discovery-Routen

- Neue Route `apps/web/src/app/sitemap.ts` liefert die statische Discovery-Sitemap für:
  - `/`
  - `/themen`
  - `/runden`
  - `/beteiligung`
  - `/factcheck`
  - `/pricing`
  - `/pricing/institutionen`
- `apps/web/src/app/robots.ts` verweist jetzt explizit auf `https://www.edebatte.org/sitemap.xml`.

### 3. Öffentliche Metadata-Basis

- Homepage, `/themen`, `/runden`, `/pricing` und `/pricing/institutionen` nutzen jetzt dieselbe Public-Metadata-Basis.
- `buildShareMetadata` liefert für öffentliche Share-Flächen standardmäßig:
  - kanonische `www`-URLs
  - `de_DE` als OG-Locale
  - ein gemeinsames Default-OG-Bild
  - `summary_large_image` für Twitter

### 4. Strukturierte Daten

- Die Startfläche rendert jetzt explizite `application/ld+json`-Daten vom Typ `WebSite`.

### 5. Indexierungsgrenzen

- `/login`, `/register`, `/reset`, `/verify` und `/settings` sind technisch auf `noindex,nofollow` festgezogen.
- Legacy-/Install-Pfad `/start` bleibt bewusst **nicht** in der Sitemap und wird nicht als neue Discovery-Canonical behauptet.

## PWA-Startadresse

- Die bestehende PWA-Startadresse `/start` bleibt unverändert.
- Begründung: Im Repo ist `/start` bereits als installierbarer Mobile-/PWA-Einstieg dokumentiert; dieser Slice harmonisiert öffentliche Discovery, entscheidet aber keine neue PWA- oder Routing-Wahrheit.
- Die öffentliche Canonical-Discovery bleibt daher bei `/`, während `/start` als bestehender Install-/Arbeits-Einstieg erhalten bleibt.

## Validierung

- `pnpm -C apps/web exec vitest run tests/robots-route.contract.test.ts tests/sitemap-route.contract.test.ts tests/share-metadata.contract.test.ts tests/public-discovery.contract.test.ts tests/settings-indexing.contract.test.ts tests/web-manifest.contract.test.ts tests/pwa-manifest.contract.test.ts`
- `pnpm -C apps/web exec eslint --config eslint.config.js 'src/app/page.tsx' 'src/app/start/page.tsx' 'src/app/themen/page.tsx' 'src/app/runden/page.tsx' 'src/app/pricing/page.tsx' 'src/app/pricing/institutionen/page.tsx' 'src/app/register/page.tsx' 'src/app/login/page.tsx' 'src/app/login/LoginPageClient.tsx' 'src/app/reset/page.tsx' 'src/app/reset/ResetPageClient.tsx' 'src/app/verify/page.tsx' 'src/app/verify/VerifyPageClient.tsx' 'src/app/robots.ts' 'src/app/sitemap.ts' 'src/app/opengraph-image.tsx' 'src/features/share/metadata.ts' 'src/lib/seo/publicDiscovery.ts' 'tests/robots-route.contract.test.ts' 'tests/sitemap-route.contract.test.ts' 'tests/share-metadata.contract.test.ts' 'tests/public-discovery.contract.test.ts'`
- `pnpm -C apps/web run typecheck`
- `git diff --check`

## Ergebnis

Die öffentliche Discovery ist jetzt auf einen kleinen, testbaren Contract gezogen:

- genau eine kanonische öffentliche Sitemap-Basis
- gemeinsames Share-/OG-Bild statt routeweiser Leerstelle
- explizite strukturierte Startdaten
- `noindex` für Auth-/Settings-Flächen
- keine stille PWA-/Routing-Neuentscheidung
