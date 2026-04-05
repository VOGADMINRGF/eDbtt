# PR-ENV-02B - Mongo Runtime Ping Parity (2026-04-04)

## Scope

Kleiner Runtime-Hardening-Slice nach `PR-ENV-02A`:
- kein Infra-Rewrite
- keine neue Persistenzarchitektur
- keine neue Produktlogik
- nur Ping-/Health-Paritaet fuer Mongo-Runtime-Fehlerbild

## Restluecke vor Slice

Nach `PR-ENV-02A` war die Fehlerklassifikation (`srv`/`dns`/`conn_refused`) bereits in `mongoPing` und `draftStore` aktiv.
Offen blieb eine Route-Drift:
- `/api/admin/system/ping` nutzte eigene store-nahe Query-Probes und gab unklassifizierte Fehler aus.
- `/api/health/mongo` gab rohe Fehlermeldungen ohne deterministische Runtime-Klassifikation aus.

## Umgesetzt

1. Admin-System-Ping auf shared Runtime-Ping gebunden
- Datei: `apps/web/src/app/api/admin/system/ping/route.ts`
- Mongo-Checks laufen jetzt ueber `mongoPing` (`core`/`votes`/`pii`).
- Fehler werden fuer Mongo-Services mit `mongoRuntime` klassifiziert ausgegeben.
- Ergebnis bleibt transparent (kein stilles Success/Fake-OK).

2. Health-Mongo auf deterministisches Runtime-Fehlerbild umgestellt
- Datei: `apps/web/src/app/api/health/mongo/route.ts`
- Nutzt `mongoPing("core")` statt eigener Collection-Probes.
- Liefert bei Connectivity-Ausfall:
  - `error: "mongo_runtime_failure"`
  - klassifiziertes `mongoRuntime`-Objekt
  - Status `503` fuer `srv`/`dns`/`conn_refused`, sonst `500`.

3. Gezielte Regressionstests
- Datei: `apps/web/tests/admin-system-ping.route.test.ts`
- Datei: `apps/web/tests/health-mongo.route.test.ts`
- Testen Success + klassifizierte DNS/ECONNREFUSED-Fehlerpfade.

## Guardrails

- Keine stillen Success-Simulationen.
- Fehler werden nicht verschleiert, sondern klassifiziert.
- Kein Autopublish/keine Produktlogik-Aenderung.
- Keine neue Infrastrukturwelt.

## Ergebnis

`PR-ENV-02` ist vorangebracht (`PR-ENV-02B` abgeschlossen):
- Ping-/Health-Runtimepfade sind konsistenter mit der bestehenden Mongo-Runtime-Klassifikation.
- Ein verbleibender Parent-Rest sollte nur geschlossen werden, wenn noch reale, kleine Runtime-Kanten nachweisbar sind.
