# POST-V1-CONSOLIDATION-FOLLOWUP-02

Datum: 2026-05-27
Status: done

## Ziel

Nach `PUBLIC-TOPIC-SUPPLY-LAYER-01` und `POST-V1-CONSOLIDATION-BUNDLE-01` den dokumentierten Post-V1-Stand noch einmal gegen Remote, GitHub, Release-Gate, Supply-Kanten und Pricing-Vertrauenscopy pruefen, ohne neue Runtime umzubauen.

## Remote- / Deploy-Parität

- Lokales `main` und `origin/main` stehen jetzt auf demselben Follow-up-Commit:
  - `HEAD`: `abe59466`
  - `origin/main`: `abe59466`
  - `git rev-list --left-right --count origin/main...HEAD`: `0 0`
- Die relevanten Post-V1-Commits sind damit remote enthalten:
  - `b710af56 feat(swipes): add public topic supply layer`
  - `d8227dbe chore(post-v1): consolidate backlog persistence and release gates`
  - `abe59466 chore(post-v1): verify consolidation follow-up`
- GitHub-Web-/API-Livestatus fuer Commit-Checks und Vercel war aus der aktuellen Umgebung nicht stabil verifizierbar:
  - `gh run list` und `gh api .../status` schlugen wiederholt mit `error connecting to api.github.com` fehl.
  - Deshalb wird in diesem Follow-up **nicht** behauptet, dass GitHub Actions oder Vercel fuer `d8227dbe` live-gruen aus der aktuellen Shell bewiesen wurden.

## Supply-Layer-Follow-up-Befund

### Gepruefte Punkte

- `statement_proposals`, Feed-/VoteDrafts, Dossier-Vorschlaege, Anlassraum-Signale und Create-Handoffs werden weiterhin ueber denselben `publicTopicSupply`-Readmodel-Layer gebuendelt.
- Es wurde keine zweite Themenwelt gefunden.
- Scope-Isolation bleibt aktiv:
  - keine Seed-Fallbacks in `fromDraft`
  - keine Seed-Fallbacks in `regionId`-/`viewerRegionIds`-Kontexten
  - keine Seed-Fallbacks in `organizationId`-/`organizationIds`-Kontexten
  - keine Seed-Fallbacks in Admin-/Review-Kontexten
- Feed-Drafts erscheinen nicht ungefiltert:
  - `review` und `published` bleiben die relevanten Feed-Draft-Zustaende fuer Swipe-Folgepfade
  - `queued`, `candidate_created` und `weak_signal` bleiben sichtbar als review-first Herkunft, nicht als automatische Wahrheit

### User-facing Lesart

- Swipe-Karten und Detail-Sheet erklaeren weiterhin sichtbar:
  - warum ein Thema angezeigt wird
  - ob es allgemein, regional, aus Feed, Dossier, Anlassraum oder aus dem eigenen Beitrag kommt
  - wohin es weiterfuehrt
- Kontextlinks bleiben auf bestehenden Pfaden:
  - `/dossier/[id]`
  - `/runden?anlassraumId=...`
  - `/create?...`

### Fazit

- Keine Runtime-Regression oder neue Supply-Luecke gefunden.
- Keine Aenderung am Supply-Layer noetig.

## Admin-Supply-Befund

`/admin/feeds` liest weiterhin dasselbe Feed-/Supply-Readmodel und zeigt im geprueften Stand:

- verfuegbare oeffentliche Swipe-Themen
- regionale / organisationsspezifische Vorschlaege
- Reviewbedarf
- Quelleneingang / Quellenstatus
- naechste Aktion

Die user-facing Copy bleibt ehrlich:

- kein Vollcrawler-Claim
- kein Scheduler-Versprechen als laufende Produktionsautomatik
- kein Auto-Publish
- keine rohen technischen Statuskeys als Hauptsprache im Leitstand

## Persistence-Risiken

Die im Bundle dokumentierte Persistenzlesart bleibt tragfaehig. Im Follow-up wurde **kein neuer harter Risiko-Sachverhalt** gefunden, der einen Sofort-Slice `PERSISTENCE-REALITY-FINAL-AUDIT-02` erzwingt.

### Bestaetigt

- Studio-/Distribution-Arbeitsstaende in `localStorage` bleiben explizit lokale Arbeitsstaende und werden nicht als Produktionswahrheit ausgegeben.
- Social Distribution Queue bleibt derived/readmodel plus persistente Queue-/Audit-Stores; Export und `scheduled_ready` werden nicht als veroeffentlicht dargestellt.
- Dossier Update bleibt klar zwischen persistenter Suggestion-Quelle und derived public context getrennt.
- Topic-/Dossier-/Anlassraum-/Swipe-/Stream-Kontexte bleiben derived public surfaces ueber persistenten Primaerstores.
- Review Queue Items bleiben derived; die persistente Audit-/Operations-Kette ist weiterhin die eigentliche Wahrheit.

### Schluss

- `PERSISTENCE-REALITY-FINAL-AUDIT-01` bleibt als optionaler V2-Folgeslice sinnvoll.
- Ein neues `PERSISTENCE-REALITY-FINAL-AUDIT-02` war in diesem Follow-up nicht gerechtfertigt.

## GitHub-Issue-Befund

### Aktiv mutiert

Diese Issues waren laut SSOT/Evidence erledigt oder obsolet, aber auf GitHub noch offen. Sie wurden in diesem Follow-up geschlossen:

- `#80` -> `CLOSED`
- `#58` -> `CLOSED`
- `#73` -> `CLOSED`

### Bewusst offen gelassen

Diese Issues bleiben offen und passen weiterhin zur Bundle-Einordnung:

- `#75` -> V2 candidate
- `#74` -> V2 candidate
- `#48` -> V2 candidate
- `#43` -> needs separate audit
- `#40` -> needs separate audit
- `#36` -> V2 candidate
- `#35` -> V2 candidate
- `#34` -> V3 candidate
- `#33` -> V2 candidate
- `#32` -> V2 candidate

### Hinweis

- Fuer diese verbleibenden V2/V3-/Audit-Issues wurde in diesem Follow-up **kein** weiterer GitHub-Kommentar oder Label-Mutationslauf erzwungen.
- Der Grund war nicht fachliche Unsicherheit, sondern die instabile GitHub-API-Erreichbarkeit in dieser Umgebung. Kommentarversuche fuer offene Folge-Issues liefen auf `error connecting to api.github.com`. Der SSOT-/Evidence-Abgleich ist trotzdem sauber dokumentiert.

### Entscheidungstabelle fuer die verbleibenden offenen Issues

| Issue | Entscheidung | OpenTasks-Spiegel | GitHub-Mutation |
| --- | --- | --- | --- |
| #75 | V2 candidate | `V2-THEMENRADAR-BRAND-EXPORT-01` | offen gelassen; Kommentarversuch scheiterte an GitHub-API-Erreichbarkeit |
| #74 | V2 candidate | `V2-OUTPUT-STUDIO-FORMATS-01` | offen gelassen; Kommentarversuch scheiterte an GitHub-API-Erreichbarkeit |
| #48 | V2 candidate | `V2-AI-ORCHESTRATION-CONSOLIDATION-01` | offen gelassen; Kommentarversuch scheiterte an GitHub-API-Erreichbarkeit |
| #43 | Audit candidate | `V2-AI-ORCHESTRATION-CONSOLIDATION-01` plus separater Audit-Hinweis | offen gelassen; Kommentarversuch scheiterte an GitHub-API-Erreichbarkeit |
| #40 | Audit candidate | `V2-AI-ORCHESTRATION-CONSOLIDATION-01` plus separater Audit-Hinweis | offen gelassen; Kommentarversuch scheiterte an GitHub-API-Erreichbarkeit |
| #36 | V2 candidate | `V2-OUTPUT-STUDIO-FORMATS-01` | offen gelassen; kein sicherer GitHub-Mutationslauf |
| #35 | V2 candidate | `V2-OUTPUT-STUDIO-FORMATS-01` | offen gelassen; kein sicherer GitHub-Mutationslauf |
| #34 | V3 candidate | `V3-MEDIA-SCRIPT-FORMATS-01` | offen gelassen; kein sicherer GitHub-Mutationslauf |
| #33 | V2 candidate | `V2-OUTPUT-STUDIO-FORMATS-01` | offen gelassen; kein sicherer GitHub-Mutationslauf |
| #32 | V2 candidate | `V2-OUTPUT-STUDIO-FORMATS-01` | offen gelassen; kein sicherer GitHub-Mutationslauf |

## Remote-Gate-Befund

Die Workflow-Konfiguration bleibt im Follow-up korrekt:

- `.github/workflows/production-validation.yml` existiert
- `Static validation` ist in der Workflow-Definition aktiv auf:
  - `push` nach `main`
  - `pull_request`
- `Production gate` bleibt bewusst guarded:
  - nur mit `PRODUCTION_VALIDATION_ENABLED=1`
  - nur mit vorhandenen Secrets

### Einordnung

- Der Workflow ist **guarded/aktiv vorbereitet**, nicht unehrlich als immer-vollstaendig aktiv beschrieben.
- Die Live-Ausfuehrung auf GitHub war aus dieser Shell nicht sicher verifizierbar, weil `gh run list` / `gh api` die GitHub-API nicht stabil erreichten.
- Der lokale Gate-Lauf blieb dagegen erneut grün und ist damit weiter die belastbare Referenz fuer diesen Slice.

## Pricing- / Freemium-Befund

Erneut geprueft:

- `/pricing`
- `/pricing/institutionen`
- Start-/Trust-Copy

Befund:

- Lesen bleibt frei lesbar
- Swipes bleiben frei lesbar
- Beteiligung und Hinweise wirken nicht wie Paywall-Zugriff
- Organisations-/Institutionenpfade bleiben bewusst freigeschaltet
- keine versteckten AI-Kosten
- kein Auto-Checkout-Claim
- keine automatische amtliche Freigabe

Es wurde **keine weitere Copy-Korrektur** mehr noetig.

## Geaenderte Dateien

- `docs/E150/OpenTasks.md`
- `docs/E150/POST-V1-CONSOLIDATION-FOLLOWUP-02_2026-05-27.md`

## Gelaufene Checks

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/public-topic-supply-readmodel.contract.test.ts tests/swipes-public-topic-supply.contract.test.tsx tests/swipes-regional-org-supply.contract.test.tsx tests/feed-to-swipes-topic-supply.contract.test.ts tests/public-topic-supply-no-fake-seed.contract.test.ts`
- `pnpm run release:validate:production`

## Bewusst offene Punkte

- GitHub Actions / Commit-Status live per API aus dieser Shell nicht belastbar verifizierbar
- Vercel-Livestatus fuer `abe59466` aus dieser Shell nicht belastbar verifizierbar
- V2/V3-/Audit-Issues bleiben offen und werden nicht zu V1-Blockern umgedeutet
- keine Aenderung an `PUBLIC-TOPIC-SUPPLY-LAYER-01`-Runtime
- keine neue Persistenz- oder Release-Architektur

## Fazit

Der dokumentierte Post-V1-Stand bleibt konsistent:

- Remote-Parität zu `origin/main` ist hergestellt und umfasst jetzt auch `abe59466`.
- Der Public Topic Supply Layer haelt seine Guardrails und zeigt keine neue Runtime-Luecke.
- `/admin/feeds` bleibt ein ehrlicher review-first Leitstand statt Vollcrawler- oder Auto-Publish-Surface.
- Die im Bundle als erledigt/obsolet markierten Alt-Issues `#80`, `#58` und `#73` sind jetzt auch auf GitHub geschlossen.
- Die verbleibenden Folge-Issues sind jetzt sauber als V2-, V3- oder Audit-Kandidaten in `OpenTasks.md` gespiegelt.
- GitHub- und Vercel-Livestatus konnten aus dieser Shell nicht vollstaendig API-seitig belegt werden; das ist bewusst dokumentiert und nicht weich umformuliert.
