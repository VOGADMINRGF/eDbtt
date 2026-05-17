# BUILD-PRERENDER-HYGIENE-01

Datum: 2026-05-17

## Ziel

`pnpm --filter @vog/web build` sollte gruen und fuer die benannten Hygiene-Pfade deutlich warnungsärmer laufen, ohne neue Produktlogik, neue APIs oder neue Runtime-Fachlogik.

## Umgesetzt

- `apps/web/package.json`
  - Build-Script setzt `BROWSERSLIST_IGNORE_OLD_DATA=1` fuer den Contract-Check.
  - `next build` laeuft mit einem build-lokalen `NODE_OPTIONS`-Warnfilter fuer `baseline-browser-mapping`, damit genau dieser bekannte Tooling-Hinweis nicht mehrfach den Build ueberlagert.
- `scripts/suppress-baseline-browser-mapping-warning.cjs`
  - Filtert nur Warnungen, deren erster String mit `[baseline-browser-mapping]` beginnt.
  - Echte Buildfehler oder andere Warnungen bleiben sichtbar.
- `apps/web/src/app/admin/region/page.tsx`
  - Defensive Array-Normalisierung fuer Feed-, Review-, Participation-, Suggestion- und Module-Reads.
  - Fehlende oder partielle Readmodel-Felder fuehren nicht mehr ueber `.length`, `.map` oder `.join` zu Renderfehlern.
  - `/admin/region` redirectet weiterhin sauber nach `/admin/regions`, wenn `regionId` fehlt oder ungueltig ist.
- `apps/web/tests/admin-region-page.render.test.tsx`
  - Redirect-Fall fuer fehlende `regionId` ergaenzt.
- `apps/web/src/app/qr-studio/page.tsx`
  - Summary-Response wird defensiv normalisiert; Fragen und Optionen haben sichere Array-Defaults.
- `apps/web/src/app/api/factcheck/page.tsx`
  - Ergebnis-/Claims-Shape typisiert und defensiv normalisiert; kein blindes Rendern von `claims.map(...)`.
- `apps/web/src/app/datenschutz/strings.ts`
  - `dataPoints` und `rightsPoints` werden immer als Arrays zurueckgegeben.
- `apps/web/src/app/datenschutz/page.tsx`
  - UI rendert mit lokalen sicheren Array-Defaults.

## Gepruefte Seiten

- `/qr-studio`
- `/archiv`
- `/api/ari`
- `/datenschutz`
- `/_global-error`
- `/api/factcheck`
- `/admin/region`

Hinweise:

- Fuer `/archiv` und `/api/ari` war kein Runtime-Fix erforderlich; sie waren bereits build-stabil.
- Fuer `/_global-error` existiert im aktuellen App-Router-Stand keine eigene Datei und es trat im Build kein gesonderter Hygienefehler auf.
- Duplicate-key-/Metadata-/Viewport-Warnungen waren im aktuellen Stand nicht reproduzierbar; es war daher kein spekulativer Meta-Umbau noetig.

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/admin-region-page.render.test.tsx`
- `pnpm --filter @vog/web build`

## Offen

- Wiederholte `querySrv ECONNREFUSED`-Warnungen fuer Mongo-SRV-Aufloesung koennen im Vollbuild weiterhin aus anderen statischen Datenpfaden ausserhalb dieses Scopes auftauchen.
- Dafuer bleibt der Follow-up `BUILD-MONGO-STATIC-COLLECT-01` offen.
