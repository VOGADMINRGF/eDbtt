# Start Here – eDebatte (Local Dev)

Ziel: Repo klonen und in <30 Minuten lokal starten.

## Voraussetzungen

- Node.js 20.x
- pnpm 10.x
- Docker (Desktop oder Engine)

## 1) Environment vorbereiten

1. Web-Env kopieren:

```bash
cp apps/web/.env.example apps/web/.env.local
```

2. Root-Env (Infra) kopieren:

```bash
cp .env.example .env
```

> Hinweis: `.env` steuert Docker Compose (Mongo/Redis/Neo4j).  
> `apps/web/.env.local` steuert die App.

## 2) Infra starten (Tri-Mongo + Redis + optional Neo4j)

```bash
./scripts/dev/start.sh
```

Optional mit Neo4j:

```bash
PROFILE=graph ./scripts/dev/start.sh
```

## 3) Dependencies installieren

```bash
pnpm install
```

## 4) App starten

```bash
pnpm dev
```

## 5) Health Check

- `GET /api/health/system` (Aggregat)
- `GET /api/health/system-matrix` (Detailmatrix)

## 6) Demo-Seeds (optional)

```bash
./scripts/dev/seed.sh
```

## Stop / Reset

```bash
./scripts/dev/stop.sh   # stoppt Container
./scripts/dev/reset.sh  # stoppt + löscht Volumes
```

---

Wenn etwas rot ist:
- `apps/web/.env.local` prüfen
- `docker compose ps` kontrollieren
- `/admin/telemetry/ai/orchestrator` für Provider-Health
