# TRIMONGO + GRAPH CONTRACT (Nicht-Verschlechterung)

Dieses Dokument ist der verbindliche Architektur-Vertrag. Alle Patches muessen ihn einhalten.

## 1) Canonical Storage: triMongo

**triMongo ist die einzige kanonische Datenquelle.**  
Wir nutzen 4 logisch getrennte MongoDB-Datenbanken:

- **core**: Entities wie Statements, Candidates, Drafts, Reports, Moderation/Flags, Factcheck-Jobs und operative User-/Social-/Onboarding-Daten (z.B. `users`, `social_friend_requests`, `social_messages`, `user_referrals`, `product_onboarding_events`, Preference-Snapshots).
- **votes**: Votes, Swipe-Events, Aggregationen
- **pii**: sensible User/Profile/Verifizierung
- **ai_core_reader**: read-only Spiegel fuer AI/Analyse-Workloads (keine Writes)

**Regel:** Keine zweite Wahrheit. Kein Prisma als kanonischer Speicher. **ai_core_reader** ist read-only.

### Store-Grenzen (wichtig fuer Onboarding/Social)

- Founder-Welcome, Founder-Backfill, Social-Summary, Friend Requests, Inbox-Messages und Referrals laufen auf **`core`**.
- **`votes`** ist fuer diese Flows nicht zustaendig (nur Vote-/Swipe-/Abstimmungsdaten).
- **`pii`** ist fuer Credentials und Identitaets-/Adressdaten zustaendig, nicht fuer Social-/Inbox-Collections.

## 2) Relationen

Relationen werden ueber IDs modelliert (`statementId`, `impactId`, `authorId`, ...).  
Mongo `_id` ist die stabile Identitaet.

## 3) GraphDB / Neo4j / Arango / Memgraph

GraphDB ist **Spiegel** und **Power-Feature**, nicht primaer.  
Nodes spiegeln Entities, Edges spiegeln Relationen:

- `hat_Impact`, `kommentiert`, `entkraeftet`, `gehoert_zu_Thema`
- `votet_auf`, `ist_Autor`, `unterstuetzt`, `widerspricht` etc.

**Regel:** Graph Sync ist **async/best-effort** und darf **niemals** Publish/UX blockieren.

**Node Key:** `mongo:<collection>:<objectId>`

## 4) Legacy / Uebergang

Mongoose/Legacy-Modelle duerfen existieren, aber:

- Sie duerfen **nicht** in kritischen Pipelines importiert werden: Feeds, Analyze-Pending, Factcheck.
- Sie duerfen **keinen** Publish blockieren.

Prisma darf **nicht** notwendig sein, um MVP-Flows laufen zu lassen.

## 5) Definition "kritische Pipelines"

- `/api/feeds/*` (pull/batch/analyze-pending/drafts/publish)
- `/api/factcheck/*`
- `features/feeds/*`
- Analyze-Pipelines in `features/analyze/*`

## 6) CI/Preflight

Der verbindliche Task- und Branch-Preflight ist in `docs/E150/CODEX_RUN_PACK_CONTRACT.md` beschrieben.
Das technische Repository-Audit bleibt unter `scripts/codex-preflight.mjs` erhalten.
