# PR-FAQ-TOPIC-DOSSIER-CLAIM-VOTE-01 (2026-05-07)

## Ziel
Issue #86 als FAQ-/Glossar-Slice umsetzen: öffentlich klar erklären, wie Thema, Dossier, Claim und Abstimmung zusammenhängen, ohne sie gleichzusetzen.

## Problem
Die Begriffe wurden in der öffentlichen Wahrnehmung teilweise vermischt. Besonders unklar war:
- Thema vs. Dossier
- Claim als Dossier-Baustein
- Abstimmung als Frage/Claim-Ebene statt pauschal "über ein ganzes Thema"

## Umsetzung
- `apps/web/src/app/faq/faqContent.ts`
  - neue FAQ-Einträge ergänzt:
    - `Sind Thema und Dossier dasselbe?`
    - `Was ist ein Claim?`
    - `Was ist eine Abstimmung?`
  - inklusive konkreter Beispiele (`Kommunale Prioritäten und Zielkonflikte`)
  - inklusive klarer Hierarchie:
    - Dossier hat Hauptthema
    - Dossier kann mehrere Themenfelder enthalten
    - Claim gehört zu einem Dossier und kann mehrere Themen berühren
    - Abstimmung entsteht aus Claim oder Dossierfrage
- `apps/web/src/app/faq/page.tsx`
  - Seite auf FAQ-SSOT umgestellt (Import von `faqContent` statt doppelter Inline-Daten)
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
  - topic-Suggestion-Badge von `Thema` auf `Themenfeld` angepasst

## Tests
- Neuer Contract-Test:
  - `apps/web/tests/faq-topic-dossier-claim-vote-glossary.contract.test.ts`
- Test prüft u. a.:
  - FAQ enthält `Sind Thema und Dossier dasselbe?`
  - FAQ enthält `Ein Dossier hat meistens ein Hauptthema`
  - FAQ enthält `Ein Claim gehört zu einem Dossier`
  - FAQ enthält `aus einem Claim oder aus einer übergeordneten Dossierfrage`

## Validierung
- `pnpm -C apps/web run typecheck` ✅
- `pnpm -C apps/web run lint` ✅
- `pnpm -C apps/web exec vitest run tests/faq-topic-dossier-claim-vote-glossary.contract.test.ts` ✅

## Offene Folgepunkte
- Optional: EN-spezifische redaktionelle Version der neuen FAQ-Texte ergänzen (derzeit automatische Übersetzungslogik außerhalb `de/en`).
