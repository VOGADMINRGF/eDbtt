# Architektur – eDebatte (Kurzfassung)

## Textdiagramm

```
Browser
  │
  ▼
Next.js App (apps/web)
  ├── UI + API Routes
  ├── E150 Orchestrator
  ├── Telemetry/Health
  ▼
Core Layer (core/*, features/*)
  ├── Analyze/Claims/Consequences/Responsibility
  ├── Dossier/Reports
  ├── Streams/Campaigns
  ▼
Datenebene (Tri-Mongo)
  ├── core  (Content, Dossiers, Reports)
  ├── votes (Abstimmungen)
  └── pii   (Personenbezogenes)
  ▼
Infra
  ├── Redis (Jobs/Queues/Cache)
  └── Neo4j (Graph; optional)
```

## Datenflüsse (Kurz)

- **Check → Dossier → Beteiligung** ist der verbindliche Produktpfad.
- **AnalyzeResult** erzeugt Claims/Consequences/Paths und speist das Dossier.
- **Votes** werden strikt in der Votes-DB gehalten.
- **PII** wird nur in der PII-DB geschrieben (über `piiCol()` / Service-Layer).

## Observability

- `/api/health/system` liefert Aggregat-Health (DB/Redis/Provider)
- `/admin/telemetry/ai/flow` und `/admin/telemetry/ai/orchestrator` zeigen Orchestrator-Status

## Deployment

- **Production:** Vercel (Next.js App + API Routes)
- **Self-host (optional):** `compose/prod.yml`
