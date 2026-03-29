# DOMAIN-HARM-01A Surface-/Routing-Ist-Matrix (Stand 2026-03-27)

Ziel dieses Dokuments:
- belastbare Ist-Sicht fuer `DOMAIN-HARM-01` liefern,
- getroffene Entscheidung repo-nah manifestieren,
- keine Route umbenennen.

Nicht-Ziel:
- keine eigenstaendige neue `/anlassraum/*`-Fachsurface neben `/runden` einfuehren,
- keine IA-/Routing-Logik aendern.
- keine zusaetzliche Produktentscheidung erfinden.

## 0) Manifestierte Entscheidung (DOMAIN-HARM-01, 2026-03-27)

- Option B ist beschlossen.
- `/runden` bleibt die kanonische oeffentliche Surface.
- `Anlassraum` bleibt der Domaenenbegriff.
- `/anlassraum` ist offizieller Alias-/Zielbegriff.
- Es gibt im Ist-Stand keine harte Migration und keine sofortige Umbenennung.
- DOMAIN-HARM-01B (2026-03-27): `/anlassraum` ist als non-breaking Wrapper/Redirect auf `/runden` aktiv.

## 1) Ist-Matrix: oeffentliche Surfaces und angrenzende Entry-Points

| Route | Typ | Ist-Rolle | Label/Wording im Produkt | Relevante Verbindungen |
| --- | --- | --- | --- | --- |
| `/runden` | public page | oeffentliche Anlassraum-/Round-Entry-Surface | "Runden", "Dein Einstieg in produktive Runden" | liest produktives Read-Model (`output_seed` + `anlassraum`), Einstieg in `/create?mode=source` |
| `/anlassraum` | public alias wrapper | offizieller Alias-/Zielbegriff als non-breaking Einstieg | "Anlassraum" (sr-only) | Redirect auf `/runden` mit Query-Paritaet |
| `/swipes` | public page | Beteiligungs-/Bewertungsmodus fuer Vorschlaege | "Swipes", Arrival-Hinweis mit `fromDraft` | `fromDraft`-Arrival, Kontext-Hinweis "Anlassraum/Runden", Detail-Vertiefung Richtung Dossier/Evidenz |
| `/dossier/:id` | public page | strukturierte Verdichtung eines Themas | "Dossier" | Finalize-Ziel bei dossier-gebundenem Flow |
| `/create` | public page | kanonischer Intake-Einstieg | "Erstellen" | Handoff aus Legacy-Entrys, Kontext via `anlassraumId` |
| `/contributions/new` | legacy wrapper | Legacy-Entry fuer Contribution-Flows | "Beitrag analysieren" (sr-only) | Redirect auf `/create` mit allowlist-basiertem Query-Passthrough |
| `/demo/runden` | demo wrapper | Demo-Kompatibilitaet fuer Runden-Einstieg | "Runden" (sr-only) | Redirect auf `/runden?compat=demo_runden` |
| `/demo/swipes` | demo page | Demo-Wrapper ueber derselben Swipes-Surface | "Demo Swipes" (sr-only) | nutzt `SwipesSurface` mit Demo-Context |
| `/swipe`, `/sw` | legacy wrapper | alte Kurzpfade fuer Swipes | "Swipes" (bzw. sr-only) | Redirect auf `/swipes` |

## 2) Routing-/Wrapper-Kette (Ist-Code)

| Kante | Ist-Verhalten | Contract-Hinweis |
| --- | --- | --- |
| `/anlassraum` -> `/runden` | non-breaking Wrapper-Redirect mit Query-Paritaet | `/runden` bleibt kanonische aktive Surface |
| `/api/create/finalize` -> `/api/contributions/finalize` | 1:1 Delegation | eine servergefuehrte Finalize-Entscheidung |
| `api/contributions/finalize` -> `redirectTo` | konditional: mit `dossierId` nach `/dossier/<id>`, sonst `/swipes?fromDraft=<draftId>` | Redirect-Pfad ist intern typisiert |
| `AnalyzeWorkspace` Finalize | nimmt server `redirectTo` mit Prioritaet, fallback intern, navigiert via `router.replace(...)` | keine externen Redirect-Ziele |
| `/swipes?fromDraft=...` | initialer Arrival-Fokus auf Draft-Treffer, Toggle auf "Alle Vorschlaege" | no-match Fallback bleibt aktiv |

## 3) Wording-/Begriffs-Iststand (Produkt + Docs)

| Begriff | Ist-Verwendung | Kernaussage im Ist-Stand |
| --- | --- | --- |
| Anlassraum | Domainbegriff in Part16/Part16-Addendum, Kontext-Hinweise in Swipes | thematische Basisdomaene |
| Runden (`/runden`) | oeffentliche Surface und Label im UI | aktuelle oeffentliche Anlassraum-Surface |
| Dossier (`/dossier/:id`) | eigenes Zielobjekt, eigenes Routingziel | strukturierte Verdichtung |
| Swipes (`/swipes`) | Beteiligung/Voting/Einordnung | kein thematischer Oberbegriff |

## 4) Konkrete Aenderungsorte fuer spaetere DOMAIN-HARM-01-Optionen

Hinweis: Die folgenden Punkte sind nur Decision-Prep. Es wird hier nichts umgesetzt.

### Option A: `/runden` bleibt kanonisch (Status quo absichern)

Betroffene Stellen (Dokumentation/Monitoring):
- `docs/E150/Part16.md`
- `docs/E150/Part16_Anlassraum_Model.md`
- `docs/surface-architecture.md`
- `docs/create-intake-unification.md`
- `docs/E150/OpenTasks.md`

### Option B: Alias `/anlassraum` zusaetzlich zu `/runden` (beschlossen)

Potenzielle Aenderungsorte:
- neue Alias-Route im App-Router (z. B. Redirect/Wrapper auf `/runden`)
- Demo-Kompatibilitaet (`apps/web/src/app/demo/runden/page.tsx`)
- Route-Inventar/Runbook (`docs/ROUTES.generated.*`, `docs/surface-architecture.md`)
- alle hardcodierten `/runden`-Links, bei denen ein Alias explizit mitgefuehrt werden soll

### Option C: spaetere Migration auf `/anlassraum` als kanonische Public-Route

Potenzielle Aenderungsorte (groesserer Slice):
- Public Entry: `apps/web/src/app/runden/page.tsx`
- Demo-/Legacy-Wrapper: `apps/web/src/app/demo/runden/page.tsx`, `apps/web/src/app/demo/page.tsx`, `apps/web/src/app/demo/DemoNavClient.tsx`
- Produktnahe Links auf `/runden` (u. a. `apps/web/src/app/create/CreateClient.tsx`)
- docs mit kanonischem `/runden`-Wording (`docs/E150/Part16*.md`, `docs/surface-architecture.md`, `docs/create-intake-unification.md`, `docs/E150/Part15.md`)
- offene Redirect-/SEO-/Backlink-Fragen (Decision-Boundary)

## 5) Beobachtete Restdrift (ohne Produktentscheidung)

- `docs/surface-architecture.md` listet `/dossier` + `/dossier/[id]`, waehrend das generierte Routeninventar als public Page aktuell `/dossier/:id` ausweist.
- Die oeffentliche Alias-Route `/anlassraum` ist als Wrapper auf `/runden` aktiv; Vorkommen von `anlassraum` ausserhalb davon betreffen Admin-/Governance-Surfaces und APIs.

## 6) Verbleibende Decision-Boundaries nach Option-B-Entscheid

1. Wann (und ob) aus Alias-Phase eine harte Migration auf `/anlassraum` wird.
2. Welche Redirect-/Backlink-/SEO-Policy bei einer spaeteren Migration gilt.

## 7) Evidenz (Code/Docs)

- `apps/web/src/app/runden/page.tsx`
- `features/topicRound/entrySource.ts`
- `apps/web/src/app/demo/runden/page.tsx`
- `apps/web/src/app/swipes/page.tsx`
- `apps/web/src/app/swipes/SwipesClient.tsx`
- `apps/web/src/features/surfaces/swipes/arrival.ts`
- `apps/web/src/features/swipes/service.ts`
- `apps/web/src/app/dossier/[id]/page.tsx`
- `apps/web/src/app/contributions/new/page.tsx`
- `apps/web/src/app/api/create/finalize/route.ts`
- `apps/web/src/app/api/contributions/finalize/route.ts`
- `apps/web/src/features/create/finalizeRedirect.ts`
- `docs/surface-architecture.md`
- `docs/create-intake-unification.md`
- `docs/ROUTES.generated.md`
