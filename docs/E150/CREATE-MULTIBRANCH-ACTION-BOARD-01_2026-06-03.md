# CREATE-MULTIBRANCH-ACTION-BOARD-01

Datum: 2026-06-03
Status: umgesetzt als erster produktionsnaher MVP-Slice

## Was wurde gebaut?

- `intelligentFollowup` traegt jetzt optional ein `ContributionPackage` mit mehreren `TopicBranchDecision`-Aesten.
- Das Paket wird nur aus dem GPT-Quick-Planner aufgebaut; es fuehrt keine lokale fachliche Themen- oder Claim-Heuristik ein.
- Pro Ast werden Titel, Kurzbeschreibung, `ClaimCandidate`, Sensitivitaets-/Pruefhinweis, Draft-Status und optionale `ExistingMatch`-Vormerkung in denselben `/create`-Flow eingebettet.
- `CreateVisualFollowup` zeigt fuer Mehrthemen-Beitraege ein echtes Multi-Branch-Action-Board statt eines globalen Einheits-CTAs.
- Pro Ast koennen Nutzer jetzt vorbereitend waehlen:
  - `prepare_qr_poll`
  - `prepare_swipes`
  - `request_review_or_sources`
  - `save_only`
- `ExistingMatch` wird nur angezeigt, wenn echte Matchdaten mit Support-Count vorliegen; Entscheidungen wie `Ja, mitzaehlen` oder `Teilweise, als Nuance ergänzen` werden nur vorgemerkt.
- Sobald ein `ContributionPackage` existiert, wird es lokal gesichert und best effort ueber den vorhandenen `/api/create/save`-Pfad als Draft mitgespeichert.
- Bei Save-Fehlern bleibt die UI ehrlich: `Dein Entwurf ist lokal gesichert. Dauerhaft speichern hat gerade nicht geklappt.`

## Was ist bewusst nur vorbereitet?

- `ContributionPackage`
- `TopicBranchDecision`
- `ClaimCandidate`
- `ExistingMatch`
- `BranchActionIntent`
- `BranchDecisionStatus`

Diese Modelle sollen im ersten Slice als ViewModel-/Contract-Basis eingefuehrt werden, ohne schon den kompletten Produkt-/Backend-Ausbau zu erzwingen.

## Was bleibt ausdruecklich Folge-Slice?

- echter Profil-/Ledger-Backend-Ausbau
- reales Stimmen-Mitzaehlen in bestehenden Claims
- automatisches oder bestaetigtes Graph-/Claim-Merge
- echter QR-Publish oder oeffentliche Veroeffentlichung
- finaler Public-Swipes-Publish
- serverseitig kanonische Persistenz aller Branch-Entscheidungen
- tiefer Ausbau der Existing-Match-Logik in echte Topic-/Claim-/Anlassraum-Verknuepfungen

## Was blieb im MVP bewusst reduziert?

- `ExistingMatch` wird noch nicht aktiv aus einem reichhaltigen Graph-Resolver gespeist; ohne echte Support-Daten bleibt der Block unsichtbar.
- Die lokale Sicherung stellt den Entwurf verlässlich ab, fuehrt aber noch keinen neuen kanonischen Ledger-/Profilpfad ein.
- Der Desktop-Detailbereich fuehrt bei aktivem Beitragspaket bewusst keine zusaetzliche lokale Themenheuristik aus, sondern verweist auf das Action-Board als massgebliche Mehrthemen-Steuerung.

## Guardrails

- Keine lokale fachliche Heuristik fuer Themen- oder Claim-Entscheidungen.
- Themen/Claims kommen nur aus GPT `planner_only` bzw. einer spaeteren GPT-Claim-Ableitung.
- Kein Auto-Publish.
- Kein Auto-Merge.
- Kein Auto-Vote.
- Kein automatisches Mitzählen in bestehenden Claims.
- Jede Branch-Entscheidung bleibt reviewbar und erfordert explizite Nutzerbestaetigung.
- High-risk/legal-sensitive Aeste bleiben reine Vorbereitung und zeigen einen neutralen Pruefhinweis.

## Erwartete Testabdeckung fuer den MVP-Slice

- Mehrthemen-Beitrag erzeugt mehrere Branches.
- UI zeigt `Entscheide je Thema`.
- Nutzer kann je Branch unterschiedliche Actions waehlen.
- `ExistingMatch` mit `currentSupportCount=5` zeigt die Mitzaehl-Frage.
- `Ja, mitzaehlen` wird nur vorgemerkt, nicht real gezaehlt.
- High-risk-Branch zeigt Review-Hinweis.
- Save-Fehler sichert lokal.
- Keine fachliche lokale Heuristik greift als Themen-/Claim-Quelle ein.

## Tatsächlich revalidiert

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-planner-openai-happy-path.contract.test.ts tests/create-planner-complex-civic-input.contract.test.ts tests/create-degraded-followup-actions.contract.test.tsx tests/create-handoff.persistence.route.test.ts tests/create-multibranch-actions.contract.test.tsx`
