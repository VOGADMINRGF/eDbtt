# PR-CREATE-ANLASSRAUM-DOSSIER-FEED-E2E-01

Datum: 2026-05-10
Status: done

## Ziel

Die reviewbare Weiterfuehrung aus `/create` sollte nicht bei Faktencheck oder Dossier enden. Auch Anlassraum-, Rueckbearbeitungs- und Themen-/Feed-Anschluss mussten denselben Arbeitsstand sichtbar weiterreichen.

## Umgesetzt

- `CreateHandoffDraft` um `topicSeed` (`topicKey`, `topicLabel`, `jurisdiction`, `themenradarSourceType`) erweitert.
- `CreateHandoffDraft` um `resumeHref` erweitert, damit Zielsurfaces eine echte Rueckbearbeitung in `/create` anbieten koennen.
- Neue `/create`-Folgeaktion `Anlassraum vorbereiten` verdrahtet.
- `/runden` rendert bei `handoffId` einen sichtbaren Create-Handoff-Banner statt stiller Query-Navigation.
- Dossier- und Contribution-Handoffs zeigen jetzt auch Topic-Key/Jurisdiktion und einen Ruecklink in `/create`.
- `topicSeed` wird fuer Review-, Feed-Weiterfuehrungs- und Themenaufbau-Anschluesse vorbelegt.

## Guardrails

- Keine zweite Create-Oberflaeche.
- Keine automatische Veroeffentlichung.
- Keine automatische DeepSearch.
- Kein stiller Themen- oder Graph-Merge.
- Alle Handoffs bleiben reviewbar und bestaetigungspflichtig.

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-handoff-draft.contract.test.ts tests/create-dossier-handoff.contract.test.ts tests/create-anlassraum-handoff.contract.test.tsx tests/live-click-hardening.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/runden-page.acceptance.test.ts`

## Ergebnis

- Anlassraum-Handoff existiert jetzt als echter reviewbarer Arbeitsstand.
- Dossier-/Contribution-Ziele verlieren weder Topic-Seed noch Rueckbearbeitungsmoeglichkeit.
- Feed-/Themenaufbau bekommt einen stabilen Startanker, ohne Auto-Merge oder Auto-Publish.
