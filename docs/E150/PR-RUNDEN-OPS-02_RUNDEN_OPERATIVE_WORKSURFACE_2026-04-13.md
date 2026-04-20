# PR-RUNDEN-OPS-02 — /runden operative Arbeitsflaeche (2026-04-13)

## Ziel
`/runden` als laufende Arbeitsflaeche klar vom Start-/Intake-Bereich (`/create`) absetzen und direkte, rollenklare Handlungswege verankern.

## Umgesetzt

1. Rollen-/Ownership-basierte Quick Actions in `/runden`
- Neue Quick-Action-Module fuer aktive Eintraege mit klarer Priorisierung.
- Manager-Kontext (berechtigte Rollen/Eigentuemer):
  - `QR-Code generieren`
  - `Beitrag verfassen`
  - `Link teilen`
  - `Status aktualisieren`
  - `Ergebnisse ansehen`
- Teilnehmer-Kontext:
  - `Beitrag verfassen`
  - `Anlass oeffnen / teilnehmen`
  - `Ergebnisse ansehen`

2. QR-/Share-Aktionen strikt rollen- und kontextgebunden
- QR-/Share-Aktionen sind nur sichtbar, wenn Rolle oder Ownership passt.
- Keine QR-Hauptaktion fuer normale Teilnehmende.
- Keine QR-/Share-Aktion ohne gueltigen `shareActions`-Kontext.

3. Beitrag verfassen direkt in `/runden`
- Inline-Beitragsmodul pro aktivem Anlass (`compose-*`) eingefuehrt.
- Kontextgebundener Schnellstart nach `/create` mit Anlassraum-Parametern (`anlassraumId`, `reason`, `signalTitle`, optional `prefill`).
- Ziel: weniger Kontextverlust in laufenden Runden.

4. Empty-State auf naechste sinnvolle Handlung ausgerichtet
- Kein passiver Leerlauftext mehr.
- Klare naechste Schritte:
  - neuen Anlass in `/create` starten
  - ersten Beitrag vorbereiten
  - Hinweis, dass QR-/Teilnahmelogik mit laufendem Anlass sichtbar wird

5. Entry-Readmodel fuer Ownership-Gates erweitert
- `RundenEntryItem` erweitert um:
  - `ownerType`, `ownerId`, `stewardUserId`, `createdBy`
- Grundlage fuer rollen- und eigentumsbezogene UI-Freigaben in `/runden`.

## Geaenderte Dateien
- `apps/web/src/app/runden/page.tsx`
- `features/topicRound/entrySource.ts`
- `apps/web/tests/runden-page.acceptance.test.ts`
- `apps/web/tests/runden-entry.service.test.ts`

## Tests
Ausgefuehrt:
- `pnpm -C apps/web exec vitest run tests/runden-page.acceptance.test.ts tests/runden-entry.service.test.ts tests/runden-entry.route.test.ts`
- `pnpm -C apps/web exec tsc --noEmit`

Ergebnis:
- Alle betroffenen `/runden`-Tests gruen.
- Typecheck fuer `apps/web` gruen.

## Hinweise
- Keine neue Parallelwelt fuer `/create` vs. `/runden` eingefuehrt.
- `/create` bleibt Start-/Analyse-/Routing-Flaeche.
- `/runden` ist als operative Laufzeitflaeche fuer aktive Anlaesse geschaerft.
