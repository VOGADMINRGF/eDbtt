# Reperatur Tools (triMongo/TS/Next/Prisma) — Toolkit

**Ziel:** Maximale, „non‑destructive“ Fehlerbehebung per Batch/Codemods. Änderungen sind **rückrollbar** (Git-Diffs/Backups).
**Modus:** Standard ist **Dry-Run** (nur Berichte). Mit `REPERATUR_WRITE=1` werden Fixes geschrieben.

## Installation (im Monorepo-Root ausführen)
```bash
pnpm -w add -D ts-morph fast-glob glob typescript@latest
```
> Falls `pnpm` nicht vorhanden: `npm i -g pnpm`

## Schnellstart
```bash
# 1) Preflight + TSC-Report
bash tools/reperatur/00-preflight.sh

# 2) Dry-Run aller Codemods (nur Berichte, keine Schreibvorgänge)
bash tools/reperatur/20-run-all.sh

# 3) Fixes wirklich anwenden
REPERATUR_WRITE=1 bash tools/reperatur/20-run-all.sh

# 4) Nachbereitung
bash tools/reperatur/90-post.sh
```

## Windows
```powershell
# Dry-Run
powershell -ExecutionPolicy Bypass -File tools/reperatur/run-all.ps1
# Write
$env:REPERATUR_WRITE="1"; powershell -ExecutionPolicy Bypass -File tools/reperatur/run-all.ps1
```

## Hauptmodule
- **10-trimongo.mjs** – Standardisiert `getCol`/`triCol` + optionale Wrapper (`coreCol`, `votesCol`, `piiCol`, `readerCol`).
- **11-imports-prisma.mjs** – Ersetzt App-Imports von `@prisma/client` durch Monorepo-Clients (`@db-web`, `@db-core`) gemäß `config.json`.
- **12-next-dynamic.mjs** – Findet `next/dynamic` mit `ssr:false` in Server Components, fügt `export const dynamic = "force-dynamic";` ein (optional).
- **13-redis-upstash.mjs** – Meldet Alias-Missmatch `@lib/redis`↔`@upstash/redis` und bietet sichere Umstellung.
- **14-mongoose-indexes.mjs** – Erzwingt Indizes (z. B. `Statement` auf `category`, `status`, `publishedAt`) via Idempotenz.
- **15-paths-tsconfig.mjs** – Prüft/ergänzt `tsconfig`-Paths konsistent zum Monorepo (Dry-Run by default).

Alle Mods schreiben nur, wenn `REPERATUR_WRITE=1` gesetzt ist. Reports unter `tools/reperatur/reports/`.
