# GOV-CIVIC-04B - UI Share Actions fuer Anlass-/Rundenkontexte (2026-04-04)

## Scope

Kleiner produktiver UI-Slice auf Basis von `GOV-CIVIC-04`:
- Share-ready Targets werden in einer ersten Surface sichtbar nutzbar.
- Kein Social-Autoposting, keine API-Integration zu Plattformen.
- Keine neue Wahrheits-, Prioritaets- oder Trust-Logik.

## Umgesetzt

1. Contract-gebundene Share-Action-Daten in der Runden-Entry-Source
- `features/topicRound/entrySource.ts`
- Fuer oeffentliche Anlasskontexte wird aus `resolveShareReadyAssetContract` eine kleine `shareActions`-Struktur abgeleitet:
  - `contextKind` (`anlass`/`runde`/`ergebnis`/`dossier`/`companion`)
  - `canonicalTarget`
  - `qrTarget`
  - `shareTitle` / `sharePrompt` / `shareSummary`
  - `socialCandidate`
  - `needsReviewBeforeOfficialSocial`

2. Kleine UI-Share-Actions-Komponente
- `apps/web/src/app/runden/RundenShareActions.tsx`
- Actions:
  - Link kopieren
  - QR anzeigen
  - QR herunterladen
  - Teilen (Web Share API, sonst Copy-Fallback)
- Zielkontext wird sichtbar gemacht (`Ziel: Runde`, `Ziel: Ergebnis`, ...).

3. Erste produktive Einbindung
- `apps/web/src/app/runden/page.tsx`
- Share-Actions sind sichtbar:
  - im Featured-Block laufender Anlaesse
  - in Ergebnis-Karten abgeschlossener Anlaesse

## Guardrails

- `shareActions` nur fuer oeffentliche Kontexte (`isPublic === true`).
- Kein Auto-Posting-Default.
- `socialCandidate` bleibt Hinweis, kein Prioritaets- oder Wahrheitsprivileg.
- Offizielle Social-Veröffentlichung bleibt kuratiert/qualifiziert.

## Tests

- `apps/web/tests/runden-entry.service.test.ts`
- `apps/web/tests/runden-page.acceptance.test.ts`
