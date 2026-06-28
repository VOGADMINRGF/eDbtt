# Repo Implementation Audit

Stand: 2026-06-28

## 1. Kurzfazit

Das Repo ist weit fortgeschritten und der lokale Web-Qualitaetspfad ist nach vier technischen Stabilisierungsslices wieder voll gruen. Positiv bleibt, dass der Prozess dokumentations- und contract-first angelegt ist: `docs/E150/OpenTasks.md` funktioniert als SSOT, viele produktische Guardrails sind explizit modelliert und kritische Pfade wie Auth/Scope, Review Queue, Content Release, Pricing, Source Connections und Material Intake haben klar erkennbare Runtime- oder Persistenzbausteine. Gleichzeitig ist die Repo-Realitaet weiter heterogen: neben produktionsnahen Pfaden existieren zahlreiche Alias-, Demo-, Seed- und Fixture-Surfaces, die bewusst nicht denselben Reifegrad haben. Oeffentliche Beteiligungsraeume und der Dialog-Intelligence-Strang sind sichtbar umgesetzt, aber weiterhin nur als Shell-/Contract-/Preview-Stufe und nicht als vollstaendige End-to-End-Runtime zu lesen. Auch die Dokumentation ist nicht vollstaendig synchron: `README.md` nennt noch Next.js 15, obwohl `apps/web/package.json` Next 16.0.10 verwendet, und `apps/web/README.md` ist weiterhin das generische Next.js-Template. Der groesste technische Widerspruch dieses Audits ist damit geschlossen: `pnpm -C apps/web exec vitest run` ist nach dem Verlauf `93/59 -> 85/51 -> 71/37 -> 55/29 -> 0/0` lokal wieder gruen. Der naechste Fokus verschiebt sich von technischer Stabilisierung auf Copy-/Docs-Harmonisierung und explizite Produktentscheidungen.

## 2. Die fünf Kernfragen

### 2.1 Was steht in `OPEN_TASKS.md` / Docs?

Hinweis: Im Repo existiert nicht `docs/OPEN_TASKS.md`, sondern `docs/E150/OpenTasks.md`. Diese Datei ist der tatsächliche SSOT.

| Dokument / Quelle | Aussage / Anforderung | Aktualität | Verbindlichkeit | Bewertung |
| ----------------- | --------------------- | ---------- | --------------- | --------- |
| `docs/E150/OpenTasks.md` | Operativer SSOT mit Status, Akzeptanzkriterien, Evidenz und Priorisierung | hoch | sehr hoch | Maßgebliche Quelle; groß und historisch gewachsen, aber weiterhin die belastbarste Steuerung |
| `docs/E150/ProductionReadinessMatrix.md` | Harte Reifestandslesart für V1/V2, viele Bereiche als `production_ready` | hoch | hoch | Wichtig, aber nur belastbar, wenn gegen reale Tests und Runtime gegengeprüft; aktuell zu optimistisch für den Gesamtrepo |
| `docs/E150/SSOT-RECONCILIATION-AFTER-PR236-01_2026-06-27.md` | Jüngster Docs-Abgleich nach Participation-/Create-/Voxy-Merges | hoch | mittel | Guter Abgleichspunkt; ausdrücklich docs-only und ohne neuen Volltest-/Build-Beweis |
| `docs/E150/PUBLIC-PARTICIPATION-SPACE-INDEX-01_2026-06-27.md` | `/beteiligung` und `/beteiligung/[slug]` nur als read-only Fixture-Surfaces | hoch | hoch | Mit Code konsistent; wichtig gegen Fehlinterpretation als fertige Runtime |
| `docs/E150/DIALOG-INTELLIGENCE-RESULTS-01_2026-06-28.md` | Dialog Intelligence zunächst contract-first, ohne echte AI-Laufzeit | hoch | hoch | Mit Code konsistent; klar als Vorstufe dokumentiert |
| `docs/E150/Pflichtenheft.md` | Prozess-, Guardrail- und Verifikationsregeln | mittel | hoch | Prozessstark, aber stärker generisch als der tatsächliche Tagesbetrieb in `OpenTasks.md` |
| `docs/surface-architecture.md` | Kanonische Produktsurfaces und Demo-/Alias-Regeln | mittel | mittel | Nützlich, aber nicht vollständig ausreichend für die heutige Routenvielfalt |
| `docs/ROUTES.generated.md` | Generated Route-Inventar aus dem Dateibaum | hoch | mittel | Sehr belastbar für „was existiert“, nicht für „was ist kanonisch“ |
| `README.md` | Repo-Überblick, Architektur, Qualitäts- und CI-Hinweise | mittel | mittel | Teilweise veraltet, u. a. Next.js-Version |
| `apps/web/README.md` | App-spezifische Doku | niedrig | niedrig | Faktisch veraltet; generisches Next.js-Template ohne Produktrealität |
| `docs/ORPHAN_FEATURES_VPM25.md` | Hygiene-/Orphan-Inventar für Legacy-Module | mittel | niedrig | Nützlich als Drift-Hinweis, nicht als Priorisierung |
| `docs/E150/CURRENT_STATE_2026-04-04.md` | Schneller Einstieg in den damaligen Produktstand | niedrig | niedrig | Als historische Orientierung brauchbar, als aktueller Gesamtstand überholt |

### 2.2 Was ist im Repo tatsächlich schon manifestiert?

| Thema / Feature | In Docs gefordert | Im Code vorhanden | Datei(en) | Status | Kommentar |
| --------------- | ----------------- | ----------------- | --------- | ------ | --------- |
| Start / Home / leichter Intake | Ja | Ja | `apps/web/src/app/page.tsx`, `apps/web/src/app/start/page.tsx`, `apps/web/src/features/start/*` | manifestiert | Startseite ist echter Produkteinstieg mit eigenem Start-Draft-Kontext |
| `/create` als kanonischer Intake | Ja | Ja | `apps/web/src/app/create/page.tsx`, `apps/web/src/app/api/create/*`, `apps/web/src/features/create/*` | manifestiert | Auth-, Draft-, Entitlement- und Request-Scope-gebunden; klarer Kernpfad |
| Legacy-Create-Wrapper | Ja, non-breaking | Ja | `apps/web/src/app/contributions/new/page.tsx`, `apps/web/src/app/beitraege/page.tsx`, `apps/web/src/app/beitraege/neu/page.tsx` | manifestiert | Mehrere historische Einstiege bleiben als Redirect-/Wrapper-Pfade aktiv |
| Swipes / Beteiligung | Ja | Ja | `apps/web/src/app/swipes/page.tsx`, `apps/web/src/features/swipes/*` | manifestiert | Umfangreich getestet, produktisch eingebunden |
| Themen-/Topic-Surfaces | Ja | Ja | `apps/web/src/app/themen/page.tsx`, `apps/web/src/app/topic/[slug]/page.tsx`, `features/topicRound/data.ts` | teilweise manifestiert | Sichtbar vorhanden, aber wichtige Teile sind seedbasiert |
| Anlassraum / Runden | Ja | Ja | `apps/web/src/app/runden/page.tsx`, `apps/web/src/app/runden/new/page.tsx`, `features/topicRound/entrySource.ts` | teilweise manifestiert | Öffentliche/runtime-nahe Pfade existieren; Full-Test zeigt hier aktuell Instabilität |
| Alias `/anlassraum` | Ja | Ja | `apps/web/src/app/anlassraum/page.tsx` | manifestiert | Bewusster Wrapper auf `/runden`, keine zweite Fachlogik |
| Dossier / Studio / Review-to-Publish | Ja | Ja | `apps/web/src/app/dossier/*`, `features/dossier/*`, `features/contentReleaseWorkbench.ts` | manifestiert | Einer der am stärksten ausgebauten produktionsnahen Bereiche |
| Admin / Operator Console / Review | Ja | Ja | `apps/web/src/app/admin/page.tsx`, `apps/web/src/app/admin/review/page.tsx`, `apps/web/src/features/admin/operatorConsoleReadModel.ts` | manifestiert | Große Surface- und API-Abdeckung, echte Operator-/Review-Lesart |
| Organisations-Dashboard / Entitlements / Verträge | Ja | Ja | `apps/web/src/app/account/organization/dashboard/page.tsx`, `features/region/*`, `features/pricing/*` | manifestiert | Starker produktionsnaher Pfad mit Persistenz- und Scope-Logik |
| Öffentliche Beteiligungsräume | Ja | Ja | `apps/web/src/app/beteiligung/page.tsx`, `apps/web/src/app/beteiligung/[slug]/page.tsx`, `apps/web/src/features/participation/*` | teilweise manifestiert | Sichtbar umgesetzt, aber ausdrücklich fixturebasiert und read-only |
| Dialog Intelligence | Ja | Ja | `apps/web/src/features/dialog/dialogIntelligenceContract.ts`, `apps/web/src/features/dialog/DialogResultsHandoffPanel.tsx` | teilweise manifestiert | Contract und kleines UI vorhanden; echte Runtime fehlt bewusst |
| Self-Service-Org-Onboarding | Ja | Ja | `apps/web/src/features/organization/selfServiceOrgOnboardingContract.ts` | teilweise manifestiert | Contract/Fixtures vorhanden, noch kein voller Runtime-/Admin-Workflow |
| Material Intake | Ja | Ja | `apps/web/src/features/material/*` | teilweise manifestiert | Persistente Metadaten- und Review-Registry vorhanden; breite Extraktionsruntime bleibt offen |
| Source Connections / Region Intelligence | Ja | Ja | `features/region/server/sourceConnectionRuntime.ts`, `features/region/intelligence.ts` | manifestiert | Explizite URL-/Snapshot-/Review-Pfade sind real vorhanden |
| Pricing / Order / Vormerken | Ja | Ja | `apps/web/src/app/pricing/*`, `apps/web/src/app/order/page.tsx`, `features/pricing/*` | manifestiert | Funktional gut ausgebaut; aktuelle offene Arbeit ist eher Copy-/Trust-Harmonisierung |
| Wrapper / Mobile | Ja | Ja | `apps/wrapper-android/*`, `apps/web/src/features/wrapper/*` | teilweise manifestiert | Android-Wrapper vorhanden, aber klar nachgelagert zum Web-V1 |
| Reports / Votes / ältere Demo-/Public-Surfaces | Teilweise | Ja | `features/report/data/demoReports.ts`, `features/votes/demoVotes.ts`, `apps/web/src/app/votes/*`, `apps/web/src/app/abstimmungen/*` | teilweise manifestiert | Sichtbar umgesetzt, teils demo-/seednah, teils produktiv lesbar |

### 2.3 Was fehlt noch?

## P0 – Blocker

1. Akute P0-Blocker im lokalen Web-Testpfad sind geschlossen.
   `pnpm -C apps/web exec vitest run`, `npm run lint` und `npm run typecheck` sind nach dem aktuellen Slice lokal gruen.
2. Reifegraddokumentation und Repo-README bleiben nachzuziehen.
   Der technische Vollpfad ist jetzt gruen, aber Teile der Doku beschreiben die Gegenwart noch ungenau oder veraltet.
3. Seed-/Fixture-/Runtime-Grenzen bleiben ein produktischer Klarheitspunkt.
   Oeffentliche Beteiligungs-, Themen- und Dialog-Surfaces sind nicht ueberall dieselbe Daten- oder Runtime-Wahrheit.
4. Produktische Copy-Harmonisierung bleibt der naechste fachliche Folgepfad.
   Nach der technischen Stabilisierung sind Pricing-/Mitgliedschafts-/Organisationscopy und einige Surface-Erklaerungen der naechste saubere Slice.

## P1 – Muss vor produktiver Nutzung

1. Public-Participation-Flächen von Fixture-Shell zu echter Runtime klar abgrenzen oder ausbauen.
2. Topic-/Round-/Participation-Datenbasis konsolidieren.
   Heute koexistieren Seed-, Fixture- und DB-Pfade für fachlich nahe öffentliche Räume.
3. Dialog-Intelligence-Runtime sauber anbinden oder als reine Vorschau weiter deklarieren.
4. Repo-Dokumentation bereinigen.
   `README.md` und `apps/web/README.md` sind nicht auf dem tatsächlichen Stand.
5. OpenTasks-Hygiene verbessern.
   Die operative Datei ist gültig, aber der Bereich „Next codex_ready tasks“ ist als Tagessteuerung unnötig historisch überfrachtet.

## P2 – Sollte zeitnah folgen

1. Alias- und Legacy-Routen systematisch inventarisieren und bewusst halten oder abbauen.
2. Orphan-/Legacy-Module aus `docs/ORPHAN_FEATURES_VPM25.md` gegen echte Nutzung und spätere Rolle prüfen.
3. Vollständigen Build-/Release-Gate nach dem Test-Fix erneut lokal nachweisen.
4. I18N-Basis und Operator-/Public-Copy stärker vereinheitlichen.

## P3 – Nice to have / später

1. Post-V1-Erweiterungen wie Live-Connectoren, Checkout-V2, Feed-Crawler-Scale, Wrapper-Store-Release.
2. Breitere Material-Extraktionsruntime und automatische Source-Automation.
3. Größerer Dialog-Wizard oder Preference-Memory nach separater Produktentscheidung.

### 2.4 Wie weit ist jedes Thema Richtung final?

| Bereich | Aktueller Stand | Finalisierungsgrad | Was fehlt bis final? | Risiko | Priorität |
| ------- | --------------- | -----------------: | -------------------- | ------ | --------- |
| Public Participation Spaces | Öffentliche Index- und Detailshell vorhanden, aber nur fixturebasiert | 35 % | Echte Datenquelle, Persistenz, Review-Anbindung, klare Runtime-Grenzen | hoch | P1 |
| Beteiligungsraum-Index / Detailseiten | Visuell und guardrail-seitig sauber, read-only | 40 % | Mehr als Fixtures; klare Integration mit Review-/Region-Pfaden | mittel | P1 |
| Admin / Cockpit | Sehr breite Page-/API-Abdeckung, Operator-Konsole real | 75 % | Vollsuite grün, weniger Drift in Text/Status-Contracts | mittel | P1 |
| Editorial / Review | Persistenz, Audit und Workbench stark ausgebaut | 80 % | Reproduzierbare grüne Gesamtverifikation | mittel | P1 |
| Fixtures / Mockdaten | Viele strukturierte Seeds/Fixtures vorhanden | 70 % | Bessere Trennung zwischen Demo, Seed, produktivem Readmodel | mittel | P1 |
| Datenintegration | Mehrere echte Runtime-Repos mit Persistenzstatus vorhanden | 60 % | Seed-/Fixture-/DB-Mix entschärfen, Env-Reproduzierbarkeit härten | hoch | P0 |
| UI-Komponenten / UX | Viele ausgereifte Surfaces, aber starke Copy-/Contract-Drift im Volltest | 60 % | Create/Start/Runden/Pricing-Copy wieder synchronisieren | hoch | P0 |
| Routing / Navigation | Kanonische Pfade erkennbar, aber sehr viele Wrapper/Aliase | 65 % | Legacy-Pfade explizit dokumentieren oder ausdünnen | mittel | P2 |
| Tests / Qualität | Große, inhaltlich tiefe Testsuite | 85 % | Gruenen Vollpfad halten und kuenftige Produktaenderungen weiter contract-first absichern | mittel | P1 |
| Dokumentation | Außergewöhnlich detailliert, aber teilweise überreich und nicht vollständig synchron | 55 % | README-/OpenTasks-/Readiness-Wahrheit harmonisieren | hoch | P1 |
| OpenTasks / Roadmap | SSOT klar vorhanden, Statusmodell diszipliniert | 65 % | Operative Sicht verdichten, historische Queue-Fragmente entschärfen | mittel | P1 |

### 2.5 Welche nächsten Schritte sind realistisch und priorisiert?

1. Ziel: Repo-weite Testwahrheit wiederherstellen.
   Warum jetzt? Ohne grüne Vollsuite sind alle Reifegrad-Claims fragil.
   Betroffene Dateien: vor allem `apps/web/tests/*`, `apps/web/src/app/create/*`, `features/topicRound/*`, `apps/web/src/features/*`.
   Risiko: mittel.
   Akzeptanzkriterium: `pnpm -C apps/web exec vitest run` ist grün oder die roten Bereiche sind explizit isoliert und begründet.
   Testbedarf: Vollsuite plus gezielte Regressionen.
   Typ: Test / Bugfix.
2. Ziel: Create-/Landing-/Runden-Copy und Vertragsdrift bereinigen.
   Warum jetzt? Die meisten sichtbaren Fehltests liegen auf Kernsurfaces.
   Betroffene Dateien: `apps/web/src/app/create/*`, `apps/web/src/features/start/*`, `apps/web/src/app/runden/*`, zugehörige Tests.
   Risiko: mittel.
   Akzeptanzkriterium: die roten UX-/Contract-Tests für diese Flächen werden grün.
   Testbedarf: gezielte Create-/Start-/Runden-Suites plus Vollsuite.
   Typ: Bugfix / UI.
3. Ziel: Topic-/Round-/Participation-Datenquellen offenlegen und vereinheitlichen.
   Warum jetzt? Öffentliche Fachflächen nutzen heute Seed-, Fixture- und DB-Pfade nebeneinander.
   Betroffene Dateien: `features/topicRound/*`, `apps/web/src/features/participation/*`, `features/region/*`, `docs/E150/OpenTasks.md`.
   Risiko: hoch.
   Akzeptanzkriterium: Für jede öffentliche Themen-/Raum-Fläche ist dokumentiert, ob sie seed-, fixture- oder runtime-backed ist.
   Testbedarf: Daten- und Routing-Contracts.
   Typ: Dokumentation / Refactoring.
4. Ziel: ENV-/Runtime-Testbasis härten.
   Warum jetzt? Mehrere Fehltests scheitern nicht an Fachlogik, sondern an Import-/ENV-Annahmen.
   Betroffene Dateien: `core/db/triMongo.ts`, Auth-/Factcheck-/Feed-Routen, zugehörige Tests.
   Risiko: mittel.
   Akzeptanzkriterium: fehlende Test-ENV führt nicht mehr zu unkontrollierten Suite-Abbrüchen.
   Testbedarf: Auth-/Factcheck-/Feed-/Finalize-Suites.
   Typ: Test / Bugfix.
5. Ziel: Repo-Dokumentation auf aktuelle Wahrheit ziehen.
   Warum jetzt? Root-README und `apps/web/README.md` sind sichtbar veraltet.
   Betroffene Dateien: `README.md`, `apps/web/README.md`, ggf. `docs/E150/ProductionReadinessMatrix.md`.
   Risiko: niedrig.
   Akzeptanzkriterium: Versions-, Produkt- und Qualitätsaussagen stimmen mit Code und Audit überein.
   Testbedarf: keiner außer Link-/Path-Prüfung.
   Typ: Dokumentation.
6. Ziel: Erst danach den nächsten echten `codex_ready`-Slice umsetzen.
   Warum jetzt? Offene Copy-Harmonisierung (`PRICING-FREEMIUM-TRUST-COPY-01`) ist sinnvoll, aber nicht auf driftender Basis.
   Betroffene Dateien: Pricing-/Header-/Start-Copy.
   Risiko: niedrig.
   Akzeptanzkriterium: Umsetzung erfolgt auf grünem Qualitätspfad.
   Testbedarf: Pricing-/Navigation-/Landing-Contracts.
   Typ: UI / Dokumentation.

## 3. Prozessprüfung: Ist der Prozess bereits vergabelt?

| Prozess / Thema | Hinweise auf Vergabelung | Betroffene Dateien | Bewertung | Empfehlung |
| --------------- | ------------------------ | ------------------ | --------- | ---------- |
| Create-Einstieg | Kanonischer Pfad `/create`, aber mehrere Wrapper und historische Einstiege bleiben aktiv | `apps/web/src/app/create/page.tsx`, `contributions/new/page.tsx`, `beitraege/page.tsx`, `beitraege/neu/page.tsx` | relevante Vergabelung | Wrapper explizit halten, aber als Support-Pfade dokumentieren; keine weitere Fachlogik dort |
| Anlassraum / Runden | `/runden` ist kanonisch, `/anlassraum` aliasiert; zusätzlich `round/*`, `runden/new`, `demo/runden` | `apps/web/src/app/anlassraum/page.tsx`, `runden/*`, `round/*`, `demo/runden/*` | leichte Doppelung | Begriffe und Zuständigkeiten in Docs und Nav konsistent halten |
| Votes / Abstimmungen / Statements | Öffentliche Vote-Surfaces existieren parallel unter deutschen und englischen/technischen Namen | `apps/web/src/app/votes/*`, `abstimmungen/*`, `vote/*`, `statements/*` | relevante Vergabelung | Öffentliche Primärpfade klar markieren; Legacy-/Alias-Pfade begrenzen |
| Themen-/Beteiligungsräume | `/themen`, `/topic/[slug]`, `/runden`, `/beteiligung/[slug]` bilden ähnliche öffentliche Diskursräume mit unterschiedlicher Datenbasis ab | `apps/web/src/app/themen/page.tsx`, `topic/[slug]/page.tsx`, `runden/page.tsx`, `beteiligung/*` | relevante Vergabelung | Daten- und Reifestufen je Surface explizit trennen |
| Demo vs. produktive Surfaces | Eigene `/demo/*`-Welt zusätzlich zu produktiven Pfaden | `apps/web/src/app/demo/*`, produktive Pendants | leichte Doppelung | Bewusst okay, aber nur solange Demo-Kontext sichtbar bleibt |
| Topic-/Round-Datenquellen | Seed-Datei für Topics/Rounds, DB-Readmodel für Runden-Einstieg | `features/topicRound/data.ts`, `features/topicRound/entrySource.ts` | relevanter Widerspruch | Seed- und Runtime-Rollen sauber dokumentieren oder entkoppeln |
| Feed-/Governance-Legacy-Endpunkte | Mehrere `legacy`-Routen und parallele Governance-/Feed-Helfer vorhanden | `apps/web/src/app/api/admin/feeds/drafts/legacy/route.ts`, `.../governance/*/legacy/route.ts` | leichte Doppelung | Nur behalten, wenn Migrations-/Backfill-Zweck aktiv bleibt |
| Legacy-/Orphan-Module | Mehrere Feature-Ordner laut Orphan-Doku nicht aktiv verdrahtet | `docs/ORPHAN_FEATURES_VPM25.md`, `features/editor`, `features/event`, `features/media`, `features/moderation` u. a. | relevante Vergabelung | Orphans gegen tatsächliche Nutzungsabsicht triagieren |
| README-/Produktdoku | Root-README, App-README und E150-Doku erzählen nicht dieselbe Gegenwart | `README.md`, `apps/web/README.md`, `docs/E150/*` | relevanter Widerspruch | Eine klare öffentliche Repo-Wahrheit definieren |

## 4. Testprüfung: Gibt es eigenständige Tests?

| Feature / Bereich | Test vorhanden | Testdatei(en) | Testtiefe | Fehlende Tests | Bewertung |
| ----------------- | -------------- | ------------- | --------- | -------------- | --------- |
| Create / Start / Landing | Ja | viele `create-*`, `start-*`, `landing-*` Tests | solide | Gesamtgrüner Contract-Stand fehlt aktuell | solide, aber driftend |
| Runden / Anlassraum | Ja | `runden-*`, `anlassraum-*`, `runden-entry.service.test.ts` | solide | Stabiler grüner Service-/Runtime-Pfad | solide, aber aktuell instabil |
| Dossier / Studio / Review | Ja | `dossier-*`, `review-*`, `content-release-*` | gut abgesichert | Weniger Slice-, mehr Vollpfad-Sicherung wäre hilfreich | gut abgesichert |
| Org / Region / Admin | Ja | `organization-dashboard.*`, `admin-region-*`, `admin-review.*`, `operator-console-*` | gut abgesichert | Mehr repo-weite Integrationsläufe mit realistischen ENV-Setups | gut abgesichert |
| Public Participation Spaces | Ja | `public-participation-space-shell.page.test.tsx`, `public-participation-space-index.page.test.tsx` | solide | Runtime-/Persistenztests fehlen, weil die Fläche derzeit nur Fixtures nutzt | solide |
| Dialog Intelligence | Ja | `dialog-intelligence-contract.test.ts`, `dialog-results-handoff-panel.test.tsx` | solide | Echte Runtime-/Prompt-/Handoff-Integrationstests fehlen bewusst noch | solide |
| Source Connections / Region Intelligence | Ja | `source-*`, `region-intelligence.contract.test.ts`, `admin-region-source-connections.route.test.ts` | solide | Echte End-to-End-Läufe mit realistischer Quelle bleiben begrenzt | solide |
| Material Intake | Ja | `material-intake-contract.test.ts`, `material-intake-repository.test.ts`, `uploads-material-intake.route.test.ts` | solide | Breitere Runtime-/Objekt-Storage-/Extraktionspfade fehlen noch | solide |
| Pricing / Order | Ja | viele `pricing-*`, `vormerken-*`, `institutional-*` Tests | solide | Aktuelle Copy-Harmonisierung ist nicht eingefroren | solide, aber driftend |
| Security / Audit-Inventories | Ja | `route-security-inventory.test.ts`, `gov-sec-03b.zone-inventory.test.ts`, `content-zone-inventory.test.ts` | solide | Inventare laufen aktuell nicht durchgängig grün im Vollsuite-Kontext | solide, aber driftend |
| Gesamtrepo Web-Testlauf | Ja | `pnpm -C apps/web exec vitest run` | gut abgesichert | Reproduzierbar grün werden | aktuell nicht belastbar |

Zusammenfassung der Testlage:

- Die Tests sind überwiegend nicht oberflächlich; viele sind Contract-, Route- und Integrationsprüfungen statt reiner Snapshot-Checks.
- Der Volltestlauf ist nach vier Stabilisierungsslices lokal wieder gruen: `93` / `59` -> `85` / `51` -> `71` / `37` -> `55` / `29` -> `0` / `0`.
- Ein Teil der Fehlschläge ist echter Produkt-/Copy-Drift, ein Teil ENV-/Runtime-Härte.

## 5. Datenintegration und Datenstabilität

| Datenbereich | Quelle | Stabilität | Risiken | Fehlende Integration | Empfehlung |
| ------------ | ------ | ---------- | ------- | -------------------- | ---------- |
| Create-Drafts / Handoffs | Persistente Handoff-/Draft-Repos plus lokaler Resume-Kontext | teilweise stabil | UI-/Contract-Drift im Create-Komplex | Vollgrüne End-to-End-Wiederaufnahme | zuerst testen und härten |
| Review Queue / Content Release / Unified Audit | Persistente Collections mit explizitem In-Memory-Fallback | stabil | Qualitätsdrift eher in Tests/Copy als im Datenmodell | repo-weite Integrationsverifikation | bestehende Architektur beibehalten |
| Org-Membership / Entitlements / Verträge | Persistente Region-/Membership-/Pricing-Repos mit Source-of-Truth-Markern | teilweise stabil | ENV-/Scope-Komplexität, viele Statuspfade | klare Self-Service-Folgepfade | weiter nutzen, aber besser dokumentieren |
| Region Source Connections | Persistente Konfiguration + Dry-Run-Resultate, explizite URL-Snapshots | teilweise stabil | bewusst keine breite Automation; Single-Page-Auswertung | breitere Operator-/Refresh-Runtime | current scope beibehalten |
| Material Intake | Persistente Metadaten-/Audit-Registry | teilweise stabil | keine echte Objekt-Storage-/Extraktionsvollruntime | Phase-2-Runtime | nicht über den aktuellen Reifegrad hinaus behaupten |
| Topic / Round Public Surfaces | Mischung aus Seeds (`TOPIC_SEED`, `ROUND_SEED`) und DB (`output_seed`, `anlassraum`) | fragil | fachlich gleiche Domäne auf unterschiedlichen Datenquellen | klarer Canon je Surface | priorisiert konsolidieren |
| Public Participation Spaces | Lokale Fixtures | nur Fixture / Demo | keine Persistenz, keine Auth, keine Runtime-Wahrheit | echte Review-/Region-/Content-Release-Anbindung | explizit als Shell belassen oder ausbauen |
| Dialog Intelligence | Typed Contract + Preview-Fixtures | nur Fixture / Demo | keine echte Laufzeit, keine externe Quelle, kein persistenter Outcome | Runtime-AI, Handoff-Integration | klar als Vorstufe kennzeichnen |
| Votes / Reports / ältere Public Flächen | Teilweise Demo-Datensätze | unklar / zu verifizieren | Gefahr alter Wunschpfade und Demo-Annahmen | Datenquellen-Audit pro Surface | separat prüfen |

## 6. Manifestationsabgleich

| Thema / Feature | In Docs gefordert | Im Code vorhanden | Tests vorhanden | Datenbasis vorhanden | Status | Kommentar |
| --------------- | ----------------- | ----------------- | --------------- | -------------------- | ------ | --------- |
| Start / leichter Einstieg | Ja | Ja | Ja | Ja, teils lokal/persistiert | manifestiert | Produktiver Einstieg vorhanden |
| Create / Analyze / Handoff | Ja | Ja | Ja | Ja | manifestiert | Starker Kernpfad, aber aktuelle Contract-Drift |
| Swipes | Ja | Ja | Ja | Ja | manifestiert | Gut ausgebaut |
| Themen / Topic | Ja | Ja | Ja | Seed + Runtime gemischt | teilweise manifestiert | Öffentliche Themenwelt nicht auf einer Datenwahrheit |
| Anlassraum / Runden | Ja | Ja | Ja | DB + gekoppelte Readmodels | teilweise manifestiert | Produktiv angelegt, aktuell aber testseitig instabil |
| Dossier / Studio | Ja | Ja | Ja | Ja | manifestiert | Einer der reifsten Bereiche |
| Admin / Review / Operator | Ja | Ja | Ja | Ja | manifestiert | Umfangreich und real |
| Public Participation Space | Ja | Ja | Ja | Nur Fixtures | teilweise manifestiert | Shell gut, Runtime fehlt |
| Dialog Intelligence | Ja | Ja | Ja | Contract/Fixtures | teilweise manifestiert | Sichtbar, aber nicht runtime-complete |
| Self-Service Org Onboarding | Ja | Ja | Ja | Contract/Fixtures | teilweise manifestiert | Gute Vorarbeit, noch keine volle Produktstrecke |
| Material Intake | Ja | Ja | Ja | Persistente Metadaten | teilweise manifestiert | Unterbau da, Phase 2 fehlt |
| Source Connections / Region Intelligence | Ja | Ja | Ja | Persistente Konfiguration + Dry Run | manifestiert | Klar review-first und begrenzt |
| Pricing / Order / Membership | Ja | Ja | Ja | Ja | manifestiert | Copy-Harmonisierung bleibt offen |

## 7. Widersprüche / veraltete Annahmen

| Thema | Dokumentation sagt | Code sagt | Tests sagen | Bewertung | Empfehlung |
| ----- | ------------------ | --------- | ----------- | --------- | ---------- |
| OpenTasks-Pfad | Nutzerauftrag/ältere Referenzen sprechen von `docs/OPEN_TASKS.md` | Repo nutzt `docs/E150/OpenTasks.md` | keine direkte Prüfung | relevanter Widerspruch | überall auf den echten SSOT-Pfad normieren |
| Framework-Version | `README.md` nennt Next.js 15 | `apps/web/package.json` nutzt `next@16.0.10` | keine direkte Prüfung | relevanter Widerspruch | Root-README aktualisieren |
| App-README | `apps/web/README.md` impliziert generisches Next.js-Beispielprojekt | App ist hochspezifische eDebatte-Produktfläche | keine direkte Prüfung | veraltet / überholt | README ersetzen oder stark kürzen |
| Produktionsreife | `ProductionReadinessMatrix.md` formuliert viele Bereiche als `production_ready` | Code zeigt produktionsnahe und nicht-produktionsnahe Pfade gemischt | Vollsuite ist lokal gruen, aber nicht jede Surface ist dieselbe Runtime-Wahrheit | relevanter Widerspruch | Reifegrad weiterhin pro Teilpfad und nicht repo-weit pauschal behaupten |
| Operative Queue-Sicht | `OpenTasks.md` ist SSOT, aber Abschnitt „Next codex_ready tasks“ führt noch viele bereits erledigte Punkte auf | Code enthält bereits Juni-Slices, die dort nur indirekt eingepflegt sind | keine direkte Prüfung | leichte Doppelung | Abschnitt auf echte aktuelle aktive Aufgaben reduzieren |
| Öffentliche Beteiligungsräume | Participation-Docs sind präzise als fixture-first Shell formuliert | Code bestätigt das explizit mit Fixtures und „Fixture-basiert“-Badge | Tests bestätigen read-only Shell | kein Widerspruch | so belassen, aber nicht überhöhen |
| Topic-/Round-Datenwahrheit | Docs sprechen von kanonischen Surfaces | Code mischt Seeds (`topicRound/data.ts`) und DB-Runtime (`entrySource.ts`) | `runden-entry.service.test.ts` aktuell rot | relevanter Widerspruch | Datenquellen pro Surface explizit machen |
| Sicherheits-/Zoneninventare | Docs und Inventar-Tests wollen harte Driftfreiheit | Code/Tests laufen aktuell nicht vollständig grün | mehrere Inventory-Tests rot | relevanter Widerspruch | erst Teststand reparieren, dann neue Claims |

## 8. Finalisierungsplan

## Phase 1 – Bereinigung / Wahrheit herstellen

- `OpenTasks.md` operativ entschlacken, vor allem den Abschnitt „Next codex_ready tasks“
- veraltete Docs markieren: `apps/web/README.md`, Root-`README.md`, ältere Schnellstarttexte
- manifestierte, aber nur shell-/contract-first umgesetzte Bereiche klar so labeln
- Vollsuite-Fehlschläge kategorisieren und keinen `production_ready`-Gesamtclaim darauf aufbauen
- Seed-/Fixture-/Runtime-Welten pro Surface sichtbar machen

## Phase 2 – Stabilisierung

- Volltestlauf grün ziehen oder sauber in reproduzierbare Blöcke trennen
- ENV-/DB-abhängige Testhärte verbessern
- Create-/Start-/Runden-/Pricing-Copy wieder mit ihren Contracts synchronisieren
- `features/topicRound/*` und angrenzende Public-Surfaces datenquellenseitig härten
- Status-/Visibility-Regeln weiter über denselben Testpfad absichern

## Phase 3 – Finalisierung

- fehlende P0/P1-Funktionalität gezielt schließen, nicht breit weiterbauen
- Public Participation Space entscheiden: bewusst Shell belassen oder echte Runtime anflanschen
- Dialog Intelligence entscheiden: contract-first belassen oder Runtime-Handoff ergänzen
- finale Dokumentation auf die dann verifizierte Repo-Wahrheit ziehen
- Vollsuite, Typecheck, Lint und bei Bedarf Build erneut nachweisen

## Phase 4 – Danach / spätere Ausbaustufen

- P2-/P3-Themen wie I18N-Schale, Live-Connectoren, Checkout-V2, Feed-Crawler-Scale
- größere Refactorings nur nach Daten- und Qualitätsstabilisierung
- breitere echte Datenintegration dort, wo heute noch Fixtures oder Seeds tragen

## 9. Konkrete nächste Umsetzungsschritte

### Schritt 1: Vollsuite-Wahrheit wiederherstellen

* Ziel: `pnpm -C apps/web exec vitest run` wieder grün oder gezielt isoliert bekommen
* Warum notwendig: Der aktuelle Volltestlauf widerspricht der dokumentierten Reife
* Betroffene Dateien: `apps/web/tests/*`, `apps/web/src/app/create/*`, `features/topicRound/*`, diverse Surface-Komponenten
* Risiko: mittel
* Akzeptanzkriterium: Keine unkommentierten roten Kerntests mehr
* Testbedarf: Vollsuite
* Darf sofort umgesetzt werden: ja
* Produktentscheidung nötig: nein

### Schritt 2: Create-/Start-/Runden-Copy-Drift schließen

* Ziel: Sichtbare Kernoberflächen wieder mit ihren bestehenden Contracts synchronisieren
* Warum notwendig: Viele Fehltests betreffen genau diese Nutzerpfade
* Betroffene Dateien: `apps/web/src/app/create/*`, `apps/web/src/features/start/*`, `apps/web/src/app/runden/*`
* Risiko: mittel
* Akzeptanzkriterium: betroffene Contract-Tests grün
* Testbedarf: Create-/Start-/Runden-Suites
* Darf sofort umgesetzt werden: ja
* Produktentscheidung nötig: nein

### Schritt 3: Runden-Entry-Service reparieren

* Ziel: `features/topicRound/entrySource.ts` wieder stabil und testbar machen
* Warum notwendig: Kernpfad `/runden` hat aktuell nachweisbare Service-Instabilität
* Betroffene Dateien: `features/topicRound/entrySource.ts`, `apps/web/tests/runden-entry.service.test.ts`
* Risiko: mittel
* Akzeptanzkriterium: Scenario A/D/E im Test wieder grün
* Testbedarf: `runden-entry.service.test.ts` plus Folgecontracts
* Darf sofort umgesetzt werden: ja
* Produktentscheidung nötig: nein

### Schritt 4: Test-ENV und Importhärte bereinigen

* Ziel: Factcheck-/Finalize-/Feed-Suites dürfen nicht an fehlenden Pflicht-ENV unkontrolliert scheitern
* Warum notwendig: Aktuelle Fehlschläge sind teilweise Harness- statt Fachfehler
* Betroffene Dateien: ENV-Validation, Feed-/Factcheck-/Finalize-Routen und deren Tests
* Risiko: mittel
* Akzeptanzkriterium: rote Harness-/Importfehler verschwinden
* Testbedarf: betroffene Route-Suites
* Darf sofort umgesetzt werden: ja
* Produktentscheidung nötig: nein

### Schritt 5: OpenTasks-Hygiene nachziehen

* Ziel: operative Tagessteuerung in `docs/E150/OpenTasks.md` wieder fokussieren
* Warum notwendig: der aktuelle SSOT ist korrekt, aber unnötig historisch belastet
* Betroffene Dateien: `docs/E150/OpenTasks.md`
* Risiko: niedrig
* Akzeptanzkriterium: aktive `codex_ready`-Liste enthält nur tatsächlich offene nächste Slices
* Testbedarf: keiner
* Darf sofort umgesetzt werden: ja
* Produktentscheidung nötig: nein

### Schritt 6: README-Wahrheit herstellen

* Ziel: Root- und App-README auf die reale Repo-Situation aktualisieren
* Warum notwendig: aktuelle Doku erzeugt falsche technische und produktische Erwartungen
* Betroffene Dateien: `README.md`, `apps/web/README.md`
* Risiko: niedrig
* Akzeptanzkriterium: Next-Version, Produktpfade und Qualitätsbefehle stimmen
* Testbedarf: keiner
* Darf sofort umgesetzt werden: ja
* Produktentscheidung nötig: nein

### Schritt 7: Surface-Datenquellen inventarisieren

* Ziel: Für `/themen`, `/topic`, `/runden`, `/beteiligung` und angrenzende Public-Flächen eine klare Seed-/Fixture-/Runtime-Matrix haben
* Warum notwendig: die fachliche Wahrheit ist derzeit verteilt
* Betroffene Dateien: `features/topicRound/*`, `apps/web/src/features/participation/*`, passende Docs
* Risiko: hoch
* Akzeptanzkriterium: Jede dieser Flächen ist sauber als seed-, fixture- oder runtime-backed dokumentiert
* Testbedarf: Daten- und Routen-Contracts
* Darf sofort umgesetzt werden: ja
* Produktentscheidung nötig: nein

### Schritt 8: Erst danach `PRICING-FREEMIUM-TRUST-COPY-01`

* Ziel: den aktuell noch offenen `codex_ready`-Copy-Slice sauber umsetzen
* Warum notwendig: sinnvoller nächster Nutzwert, aber erst auf stabilisierter Basis
* Betroffene Dateien: Pricing-/Start-/Header-/Membership-Copy
* Risiko: niedrig
* Akzeptanzkriterium: Copy ist konsistent und Verträge bleiben grün
* Testbedarf: Pricing-/Navigation-/Landing-Contracts
* Darf sofort umgesetzt werden: ja
* Produktentscheidung nötig: nein

## 10. Aktualisierung von `docs/E150/OpenTasks.md`

`docs/E150/OpenTasks.md` wurde in diesem Stabilisierungsslice aktualisiert:

1. `REPO-TEST-STABILIZATION-01` wurde von `codex_ready` auf `done` gesetzt.
   Der Evidence-Block dokumentiert jetzt den vollstaendigen Verlauf `93/59 -> 85/51 -> 71/37 -> 55/29 -> 0/0`.
2. Die veralteten Create-/Start-/Landing-/Pricing-/Region-/Runden-Erwartungscluster wurden als geschlossen nachgezogen.
3. Der Abschnitt `Next codex_ready tasks` priorisiert jetzt wieder fachliche Folgearbeit statt weiterer Test-Infra-Stabilisierung.

## 11. Clusterstand nach dem fokussierten Follow-up-Slice

| Cluster | Betroffene Testdateien | Symptom | Vermutete Ursache | Kategorie | Priorität |
| ------- | ---------------------- | ------- | ----------------- | --------- | --------- |
| Feed-Cluster-Route ohne Mongo-Leak (geschlossen) | `apps/web/tests/feed-cluster-job.route.test.ts` | vorher `MongoServerSelectionError` / Timeout, jetzt isoliert gruen | fehlender Mock fuer `recordFeedRuntimeRun`, Route-Test beruehrte unbeabsichtigt Runtime-Log-Persistenz | `echter DB-Zugriff` | P0 |
| Dossier-/Studio-/Social-Page-Contracts isoliert (geschlossen) | `apps/web/tests/dossier-output-studio.page.contract.test.ts`, `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`, `apps/web/tests/dossier-studio-social-queue.contract.test.tsx`, `apps/web/tests/social-manual-export-fallback.contract.test.ts`, `apps/web/tests/studio-distribution-panel.contract.test.tsx` | vorher Timeout / haengende Render-Contracts, jetzt gezielt gruen | fehlende In-Memory-Repos, Queue-Readmodel zog Runtime-Ketten und Content-Release-/Mongo-Pfade mit | `Shared State / Isolation` | P0 |
| Runden-Working-Surface-Timeout geschlossen | `apps/web/tests/runden-working-surface-copy.contract.test.ts` | vorher Timeout, jetzt isoliert gruen | fehlende Scope-/Org-Dashboard-Mocks beim Import der `/runden`-Surface | `Mock fehlt` | P1 |
| Feed-Radar-Runtime isoliert (geschlossen) | `apps/web/tests/v1-feed-radar-runtime.contract.test.ts` | vorher Timeout, jetzt isoliert gruen | fehlender Mock auf dem exakten `@/features/swipes/publicTopicSupply`-Pfad plus unisolierte Feed-Automation-Nebendependenzen | `Mock fehlt` | P0 |
| Feed-/Source-Automation-Readmodels stabilisiert (geschlossen) | `apps/web/tests/source-feed-automation-contract.test.ts`, `apps/web/tests/source-feed-health-readmodel.contract.test.ts` | vorher `healthy -> quiet` bzw. Summary-Diff, jetzt gezielt gruen | fixtures mit statischen Mai-Zeitstempeln drifteten gegen den aktuellen Systemzeitpunkt | `Fixture-Drift` | P1 |
| Themenradar-Readmodel-Drift reduziert (geschlossen) | `apps/web/tests/themenradar-feed-cluster.contract.test.ts`, `apps/web/tests/themenradar-no-autopublish.contract.test.ts` | vorher `stale_signal`/Review-Hint-Diff, jetzt gezielt gruen | recency-basierte ReviewState-Logik lief gegen gealterte Fixtures statt eingefrorene Zeit | `Fixture-Drift` | P1 |
| Security-/Inventory-Anchor-Drift geschlossen | `apps/web/tests/content-zone-inventory.test.ts`, `apps/web/tests/gov-sec-03b.zone-inventory.test.ts`, `apps/web/tests/route-security-inventory.test.ts` | vorher rote Anchor-Assertions, jetzt gezielt gruen | dokumentierte Source-Angaben und Anchor-Strings drifteten gegen den aktuellen Code-Stand | `Security-Contract` | P1 |
| Create-/Start-/Landing-/Pricing-Erwartungsdrift geschlossen | u. a. `apps/web/tests/{analyze-workbench-hidden-until-start,branch-workspace-handoff.contract,create-chat-first-mobile-dialog-experience.contract,demo-create.page.contract,entry-hero-identity.contract,gradient-headline-i18n.render,landing-clarity.contract,landing-information-architecture.contract,mobile-entry-routes.contract,pricing-b2b-secondary-only.contract,pricing-institutionen-b2b-partner.contract,pricing-institutionen-page.contract}.test*` | vorher rote UX-/Copy-/CTA-Erwartungen, jetzt gruen | aktuelle Repo-Realitaet war weiter als die aelteren Contracts | `veraltete Erwartung` | geschlossen |
| Runden-/Region-/Start-Handoff- und Spezialtests geschlossen | `apps/web/tests/{start-draft-handoff-targets.contract,region-contract,runden-context-human-readable-only,runden-public-anlassraum-status.contract,runden-public-sharing-guide.contract,no-duplicate-primary-worksurface-on-create,no-internal-query-leak-in-create-ui}.test*` | vorher Suitefehler, Drift oder fehlender Helper, jetzt gruen | Mischung aus fehlendem Helper, sichtbarer Technik-Sprache und veralteten Assertions | `Bugfix + Erwartungsdrift` | geschlossen |

## 12. Ausgeführte Prüfungen

| Befehl | Ergebnis | Einordnung |
| ------ | -------- | ---------- |
| `git status --short` | ausgefuehrt | Worktree war nicht sauber; technische Stabilisierung aenderte Web- und Testdateien plus Audit-Dokument |
| `npm run lint` | erfolgreich | `turbo run lint --continue` lief grün durch |
| `npm run typecheck` | erfolgreich | Root-Typecheck gegen `apps/web/tsconfig.json` lief grün |
| `pnpm -C apps/web exec vitest run --reporter=json --outputFile /private/tmp/vitest-edebatte-before-product-expectation-cleanup.json` | fehlgeschlagen, Report geschrieben | Baseline vor diesem Slice: 55 Testdateien rot, 29 Tests rot, 2083 Tests gruen |
| `pnpm -C apps/web exec vitest run tests/no-duplicate-primary-worksurface-on-create.test.ts --reporter=verbose` | erfolgreich | Primary-worksurface-Spezialpruefung gezielt verifiziert |
| `pnpm -C apps/web exec vitest run tests/no-internal-query-leak-in-create-ui.test.ts --reporter=verbose` | erfolgreich | Query-Leak-Spezialpruefung gezielt verifiziert |
| `pnpm -C apps/web exec vitest run` mit allen betroffenen Create-/Start-/Landing-/Pricing-/Region-/Runden-Testdateien | erfolgreich | Erwartungsdrift-Cluster gezielt bereinigt und verifiziert |
| `pnpm -C apps/web exec vitest run --reporter=json --outputFile /private/tmp/vitest-edebatte-after-product-expectation-cleanup.json` | erfolgreich, Report geschrieben | Endstand nach diesem Slice: 0 Testdateien rot, 0 Tests rot, 2115 Tests gruen |

Nicht ausgeführt:

- `npm test`
- `npm run test`
- `npm run build`
- `pnpm -C apps/web run build`
- `pnpm run release:validate:production`

Diese Befehle wurden in diesem Audit nicht neu validiert.

## 13. Slice-Ergebnis

Testergebnis vorher/nachher:

- vorher: `55` fehlschlagende Testdateien / `29` fehlschlagende Tests / `2083` gruene Tests
- nachher: `0` fehlschlagende Testdateien / `0` fehlschlagende Tests / `2115` gruene Tests

Geschlossene Cluster in diesem Follow-up:

- veraltete Create-/Start-/Landing-Erwartungen
- Pricing-CTA-/Add-on-/Segment-Erwartungen
- Region-/Runden-/Start-Handoff-Drift
- `no-duplicate-primary-worksurface-on-create`
- `no-internal-query-leak-in-create-ui`
- verbleibende `v1-production-ready-critical-journeys`-, Navigation- und Human-Readable-Contracts

Offene Cluster nach diesem Follow-up:

- keine verbleibenden roten lokalen Web-Testcluster im `vitest`-Vollpfad

Geaenderte Dateien in diesem Follow-up:

- `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
- `apps/web/src/features/start/LandingCreateLightEntry.tsx`
- `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `apps/web/tests/create-graph-match-after-planner.contract.test.ts`
- `apps/web/tests/create-handoff-draft.contract.test.ts`
- `apps/web/tests/demo-create.page.contract.test.ts`
- `apps/web/tests/entry-hero-identity.contract.test.tsx`
- `apps/web/tests/gradient-headline-i18n.render.test.tsx`
- `apps/web/tests/{initiative-nav-label.contract,navigation-initiative-label.contract,landing-clarity.contract,landing-information-architecture.contract,member-checkbox-flow.contract,mobile-entry-routes.contract,pricing-b2b-secondary-only.contract,pricing-institutionen-b2b-partner.contract,pricing-institutionen-page.contract,region-contract,runden-context-human-readable-only,runden-public-anlassraum-status.contract,runden-public-sharing-guide.contract,start-shared-create-composer.contract,swipes-arrival.helpers,no-duplicate-primary-worksurface-on-create,no-internal-query-leak-in-create-ui,institutional-addon-priority-bands.contract,institutional-cta-hierarchy.contract,v1-production-ready-critical-journeys.contract}.test*`
- `docs/E150/OpenTasks.md`
- `docs/REPO_IMPLEMENTATION_AUDIT.md`

Echte Produktbugs bzw. technische Maengel wurden in diesem Follow-up punktuell behoben:

- fehlender Start->Runden-Handoff-Helper `deriveManualAnlassraumSetupFromStartDraft`
- sichtbare technische `review-first`-Sprache in oeffentlichen Start-/Quick-Action-Texten

Die produktiven Datenpfade und das Routing blieben unveraendert. Geaendert wurden nur Tests, kleine Sprachhaertungen und ein bestehender Handoff-Helper.

Klare Empfehlung:

`jetzt P0/P1 Produktpunkte umsetzen`

## 14. Durchgefuehrter technischer Stabilisierungsslice

Nicht durchgeführt wurden:

- neue Produktfeatures
- Routing-Loeschungen
- Datenmodelländerungen
- große Refactorings
- Testumschreibungen zur Fehlerkaschierung

Durchgefuehrt wurden stattdessen nur technische Haertungen auf bestehender Architektur:

- exakter Mock fuer `@/features/swipes/publicTopicSupply` plus harmlose Feed-Automation-Nebendependenzen in `v1-feed-radar-runtime.contract.test.ts`
- eingefrorene Testzeit fuer Feed-/Source-Automation- und Themenradar-Contracts, damit recency-basierte Readmodels deterministisch bleiben
- Aktualisierung der Security-/Inventory-Source-Anker auf den belegbaren aktuellen Code-Stand, ohne Security-Assertions abzuschwächen
- Sichtbare Technik-Sprache auf `/start` in den oeffentlichen Quick-Action-Texten entschaerft, ohne Safety-/Review-Gates abzuschwaechen
- fehlenden Start->Runden-Handoff-Helper in `manualAnlassraumSetup.ts` wiederhergestellt
- Fortschreibung von `docs/E150/OpenTasks.md` und `docs/REPO_IMPLEMENTATION_AUDIT.md` auf den verifizierten Slice-Stand `55/29 -> 0/0`
