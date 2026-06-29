# COMMUNITY-MODERATION-ABUSE-TRUST-GUARDRAILS-01

Stand: 2026-06-29
Repo: `edebatte-org`
Bezug: Stand nach `#253`

## Ausgangslage nach #253

`main` enthaelt bereits:

- `#249` Create/Dialog Handoff -> Review Queue Runtime
- `#250` Existing Topic Matches -> Runtime/Readmodels
- `#251` Factcheck Requests -> Source Review
- `#252` Community Source Review Contributions
- `#253` SSOT after Source Review Community Flow

Damit gibt es bereits einen kleinen sichtbaren Pfad fuer:

Beitrag erfassen
-> Standpunkt erkennen
-> echte vorhandene Anschluesse anzeigen
-> Meinung zaehlen / ausarbeiten
-> Handoff-Draft vorbereiten
-> Review Queue
-> Quellenpruefung
-> Community-Hinweise als pruefpflichtige Beitraege

Vor einer echten oeffentlichen Community-Submission oder AI-Runtime fehlt aber noch die belastbare Moderationslesart.

## Warum dieser Slice vor oeffentlicher Community-Submission und AI Runtime kommt

Community hilft beim Pruefen, entscheidet aber keine Wahrheit.

Ohne typed Moderations-, Abuse-, Trust- und Risk-Guardrails waeren zwei falsche Lesarten naheliegend:

- viele Hinweise oder vertrauensvolle Beitragende koennten wie Wahrheits- oder Quellenbestaetigung wirken
- ein spaeterer Runtime-Submit koennte Missbrauch, personenbezogene Daten oder koordinierte Manipulation zu frueh in einen scheinbar normalen Review-Pfad druecken

Dieser Slice fuehrt deshalb zuerst einen kleinen review-first Contract ein, bevor an oeffentliche Submission, Moderations-UI, Abuse-Persistenz oder AI-Runtime gedacht wird.

## Moderation Statusmodell

Neu modelliert in `apps/web/src/features/create/communitySourceReviewModeration.ts`:

- `pending_review`
- `needs_moderation`
- `allowed_as_hint`
- `hidden_pending_review`
- `rejected_abuse`
- `escalated_to_editorial`

Wichtig:

- neue normale Hinweise starten review-first als `pending_review`
- Hinweise mit heiklen oder unsauberen Signalen koennen auf `needs_moderation` gehen
- `allowed_as_hint` bedeutet nur moderationssicherer Hinweis, nicht `accepted_as_fact`
- `hidden_pending_review` und `rejected_abuse` bleiben unsichtbar bzw. nicht zaehlbar als Evidenz

## Abuse Reasons

Neu typisiert:

- `spam`
- `harassment`
- `duplicate`
- `coordinated_manipulation`
- `unverifiable_claim`
- `misleading_source`
- `personal_data`
- `off_topic`
- `unsafe_content`

Diese Gruende entscheiden nicht ueber Wahrheit, sondern ueber Moderations- und Sichtbarkeitsgrenzen.

## Trust Levels

Neu typisiert:

- `unknown`
- `new_contributor`
- `known_contributor`
- `trusted_contributor`
- `editorial_contributor`

Trust darf nur Review priorisieren. Trust bestaetigt keine Wahrheit, keine Quelle und keinen Claim.

## Risk Levels

Neu typisiert:

- `low`
- `medium`
- `high`
- `critical`

Die Risk-Lesart dient nur Moderation und Review-Sortierung.

Sie ist kein Wahrheits-, Quellen- oder Community-Ranking.

## Guardrails

Explizit modelliert:

- high trust != verified truth
- many contributions != truth
- accepted_as_hint != accepted_as_fact
- source_suggestion != confirmed source
- counter_source != claim disproved
- lived_experience != representative evidence
- community contribution must remain review-first
- public exposure requires moderation-safe status
- rejected/hidden contributions must not be counted as evidence
- no auto-publish
- no auto-merge
- no auto-dossier
- no auto-anlassraum
- no auto-participation-space

Minimal integriert:

- `communitySourceReviewContribution.ts` fuehrt typed Moderation/Trust/Risk mit
- `CreateHandoffDraftSummary.tsx` erklaert jetzt zusaetzlich, dass Hinweise vor Sichtbarkeit moderiert werden und dass viele Hinweise keine bestaetigte Wahrheit bedeuten

## Was bewusst nicht umgesetzt wurde

Bewusst nicht gebaut:

- keine neue oeffentliche Community-Seite
- keine neue Admin- oder Moderations-Workbench
- keine AI Runtime
- keine Graph Runtime
- keine automatische Faktenpruefung
- keine automatische Verifikation
- keine Mehrheitswahrheit
- keine Auto-Publish- oder Auto-Merge-Logik
- keine Dossier-/Anlassraum-/Beteiligungsraum-Erstellung
- keine Payment-/Membership-Aenderung
- keine DeepSearch- oder externe Quellenanbindung
- keine Abuse-/Spam-Persistenz-Runtime
- keine Trust-/Reputation-Runtime
- kein Source-Quality-Scoring

## Tests / Build

Revalidiert mit:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/community-source-review-moderation.test.ts tests/community-source-review-contribution.test.ts tests/factcheck-source-adapter-bridge.test.ts tests/create-handoff-review-queue-runtime-bridge.test.ts`
- `pnpm -C apps/web run build`

## Offene Folgepfade

- Community Moderation UI
- Abuse/Spam Persistence
- Trust/Reputation Runtime
- Source Quality Scoring
- Review Workbench Erweiterung
- `DIALOG-INTELLIGENCE-RUNTIME-AI-02`
- `TOPIC-GRAPH-RUNTIME-05`
- `TOPIC-DEDUPLICATION-REVIEW-QUEUE-01`

## Ergebnis

Der Slice macht Community Source Review belastbarer, ohne eine fertige Community-Moderationsplattform zu behaupten.

Die neue Wahrheit bleibt:

- Hinweise sind Hinweise
- Moderation bleibt Pflicht
- Trust und Volumen priorisieren hoechstens Review
- Quellen- und Faktenwahrheit bleiben menschlich gepruefte Folgeentscheidungen
