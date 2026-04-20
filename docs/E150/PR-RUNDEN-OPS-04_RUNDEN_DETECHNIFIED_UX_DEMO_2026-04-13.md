# PR-RUNDEN-OPS-04 — /runden enttechnisiert + Anlassraum-Demo (2026-04-13)

## Ziel
`/runden` von Routen-/Techniksprache auf Wirkungslogik umstellen und eine kleine Demo-/Erklaerseite einfuehren, die Anlassraum-, QR- und Beitragsfluss unmittelbar verstaendlich macht.

## Umgesetzt

1. `/runden` Hero und Einstieg auf Wirkungssprache umgestellt
- Hero neu: `Anlaesse fuehren`.
- Einleitung erklaert Nutzen statt Seitenpfad:
  - Beitraege sammeln
  - Anlass per QR/Link teilen
  - Arbeitsstand sichtbar weiterfuehren
- Obere Einstiegskarten komplett in Produktsprache:
  - `Neuen Anlass oeffnen`
  - `Laufenden Anlass weiterfuehren`
  - `Stand und Ergebnisse ansehen`
- Keine sichtbare URL-/Route-Prosa wie `... in /create` oder `... in /runden` mehr in den zentralen CTA-Texten.

2. Empty State als operativer 3-Schritte-Start
- Empty State neu als handlungsorientierter Arbeitsstart:
  - Schritt 1: Anlass oeffnen
  - Schritt 2: Beitraege einsammeln
  - Schritt 3: Stand sichtbar weiterfuehren
- CTA-Hierarchie entspricht dem Zielbild:
  - Primaer: `Neuen Anlass oeffnen`
  - Sekundaer: `Ersten Beitrag vorbereiten`
  - Tertiaer: `Mehr erfahren`

3. QR-/Teilnahmelogik als Nutzen statt Technik
- Beteiligungssektion im Anlasskontext:
  - Titel: `Teilnahme oeffnen`
  - Nutzen-Text zu QR/Link fuer mobilen/analogen/digitalen Zugang in denselben Arbeitsstand
- Bei fehlender Berechtigung oder fehlendem laufendem Kontext:
  - freundliche Erwartungsfuehrung statt technischer Sperrprosa
- Share-Action-Texte in `RundenShareActions` enttechnisiert (`Teilnahmeziel`, `QR bereitstellen`, `Teilnahmetext`).

4. Sprachlicher Anschluss in `/create`
- Leitstruktur in `/create` um `Widerspruch` erweitert (Intro, Leitfrage, Chip), damit `/create` und `/runden` dieselbe Anlass-/Beitragssprache nutzen.

5. Neue Demo-/Erklaerseite eingefuehrt
- Neue Route: `/runden/demo`
- Inhalt:
  - Hero: `Aus einzelnen Beiträgen wird ein gemeinsamer Arbeitsstand`
  - 3-Schritte-Logik (Anlass oeffnen -> QR/Link teilen -> Beitraege geordnet buendeln)
  - Folgebild-Block (`Arbeitsstand`, `Dossier`, `Abstimmung/Stellungnahme/Nachverfolgung`)
  - Nutzenblock (`Warum das hilfreich ist`)
  - CTAs: `Anlass oeffnen`, `Teilnahmelogik verstehen`
- Verknuepfung aus `/runden` zur Demo ist in Hero und Empty State sichtbar.

## Geaenderte Dateien
- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/runden/RundenShareActions.tsx`
- `apps/web/src/app/runden/demo/page.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/tests/runden-page.acceptance.test.ts`
- `apps/web/tests/runden-demo.page.contract.test.tsx`
- `docs/E150/OpenTasks.md`

## Tests
Ausgefuehrt:
- `pnpm -C apps/web exec vitest run tests/runden-page.acceptance.test.ts tests/runden-demo.page.contract.test.tsx tests/create-mode.page.test.ts tests/create-analyze.workspace-ui.test.ts`
- `pnpm -C apps/web exec tsc --noEmit`
- `pnpm -C apps/web exec eslint src/app/runden/page.tsx src/app/runden/RundenShareActions.tsx src/app/runden/demo/page.tsx src/app/create/CreateClient.tsx tests/runden-page.acceptance.test.ts tests/runden-demo.page.contract.test.tsx`

Ergebnis:
- Alle betroffenen Tests gruen.
- Typecheck und gezielter Lint gruen.

## Scope-Grenze
- Keine neue Featurewelt fuer `/create` oder `/runden`.
- Keine Aenderung am Rollen-/Governance-Grundmodell.
- Keine neue Parallelwahrheit zur bestehenden Anlassraum-/Order-/Pricing-Produktlogik.
