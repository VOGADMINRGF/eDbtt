# UX-ANLASSRAUM-MANUAL-CREATE-01

Datum: 2026-05-29
Status: done

## Ziel

Der Anlassraum-Start bekommt einen eigenen manuellen Produktpfad unter `/runden/new`.
`/create` bleibt erhalten, ist aber für diesen Flow nur noch der optionale Vertiefungsschritt mit KI.

## Umgesetzte Bausteine

- Neue Route:
  - `apps/web/src/app/runden/new/page.tsx`
- Neue Komponenten:
  - `apps/web/src/app/runden/new/AnlassraumSetupForm.tsx`
  - `apps/web/src/app/runden/new/AnlassraumOptionEditor.tsx`
  - `apps/web/src/app/runden/new/AnlassraumVisibilitySettings.tsx`
  - `apps/web/src/app/runden/new/AnlassraumSupportSettings.tsx`
  - `apps/web/src/app/runden/new/AnlassraumPrePublishCheck.tsx`
- Neue Domain-Hilfe:
  - `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`

## Produktverhalten

- Vier sichtbare Schritte:
  - `Rahmen`
  - `Optionen`
  - `Sichtbarkeit`
  - `Unterstützung & Start`
- Mindestregel:
  - Titel oder Abstimmungsfrage sind Pflicht für weitere Schritte.
- Öffentliche Einreichung:
  - Mindestens zwei feste Optionen sind nötig, bevor `Öffentlich nach Review einreichen` aktiviert wird.
- KI:
  - Standardmäßig aus.
  - Nur als spätere Option `optional_suggestions`, `option_suggestions` oder `source_review`.
- `/create`-Weiterweg:
  - `mode=source`
  - `source=runden`
  - `reason=manual_anlassraum_continue_create`
  - `signalTitle`
  - `prefill`
  - `returnTo=/runden/new`
- Guardrails:
  - kein Auto-Analyze
  - kein Auto-Publish
  - kein Auto-Dossier
  - kein Auto-Option-Merge

## Voxy-Einsatz

Voxy ist sichtbar, aber bleibt fachlicher Guide und nie Deko:

## Voxy-Einsatzmatrix

- `/runden` First Screen:
  - `VoxyGuide` als sichtbares `panel` neben der Einstiegsentscheidung.
  - Copy: `Du entscheidest zuerst den Rahmen. KI und Prüfung kommen nur dazu, wenn du sie auswählst.`
- `/runden/new` Einstieg:
  - `VoxyGuide` als sichtbares `panel` im oberen Einführungsbereich.
- `/runden/new` Desktop je Schritt:
  - rechte Sticky-Guide-Spalte als `panel`
- `/runden/new` Mobile je Schritt:
  - kompakte Top-Card als `compact`
- Schritt `Rahmen`:
  - Variante `welcome`
  - Copy: `Du entscheidest zuerst den Rahmen. KI und Prüfung kommen nur dazu, wenn du sie auswählst.`
- Schritt `Optionen`:
  - Variante `presenting`
  - Copy: `Feste Optionen geben Kontrolle. Community-Vorschläge öffnen den Raum.`
- Schritt `Sichtbarkeit`:
  - Variante `hint`
  - Copy: `Öffentlich heißt nicht automatisch geprüft. Du bestimmst, wann sichtbar wird.`
- Schritt `Unterstützung & Start`:
  - Variante `thinking` oder `check`
  - Copy: `KI bleibt optional. Nichts wird automatisch veröffentlicht.`
- `/create` nach manuellem Anlassraum-Start:
  - `VoxyGuide` oben als `panel`
  - Copy: `Der Rahmen steht. Ich kann jetzt Frage, Optionen oder Quellenstruktur verbessern.`

Warum Voxy Guide ist und nicht Deko:

- Voxy erklärt jeweils den nächsten fachlichen Schritt.
- Voxy ersetzt keine Pflichtinformation und keine Validierung.
- Voxy löst keine Aktion automatisch aus.
- Voxy bleibt im Maßstab unterhalb von Überschrift, Formular und Primär-CTA.

## Light/Dark-Regeln

- Neue Voxy- und `/runden/new`-Flächen nutzen die vorhandenen Tokens:
  - `rgb(var(--bg))`
  - `rgb(var(--card))`
  - `rgb(var(--fg))`
  - `rgb(var(--muted))`
  - `rgb(var(--border))`
- Keine `dark:`-Sonderpfade in den neuen Voxy- und Anlassraum-Komponenten.
- Keine festen Dark-only Karten auf heller Seite.
- Brand-Farbverlauf bleibt auf Primär-CTAs und kleine Akzente begrenzt.
- Voxy-Bildflächen bekommen eine token-basierte Card-Fläche mit leichter Schattenkante, damit sie im Light Mode nicht ausfransen.

## CTA-Umstellung

- `/runden` verlinkt den primären Anlassraum-Start jetzt auf `/runden/new`.
- Der Guided-Builder auf `/runden` nutzt für `Anlass starten` ebenfalls `/runden/new`.
- `/create` bleibt für Beitrag, Ausarbeitung und KI-Vertiefung erreichbar, aber nicht mehr als primärer Anlassraum-Start.

## Anlassraum -> create Übergangslogik

- `Mit KI in /create weiter` baut nur einen Prefill-Handoff und startet keine Analyse.
- Der Übergang setzt:
  - `mode=source`
  - `source=runden`
  - `reason=manual_anlassraum_continue_create`
  - `signalTitle`
  - `prefill`
  - `returnTo=/runden/new`
- Guardrails bleiben aktiv:
  - kein Auto-Analyze
  - kein Auto-Publish
  - kein Auto-Dossier
  - kein Auto-Option-Merge
- `/create` zeigt den Übergang als optionale Vertiefung, nicht als Pflichtschritt.

## Persistenzstand

- Dieser PR fuehrt bewusst lokale Entwurfssicherung per Browser-Speicher ein, damit der manuelle Rahmen beim Wechsel nach `/create` erhalten bleiben kann.
- Echte serverseitige Draft-/Start-Persistenz ist noch nicht Teil dieses Slices und wurde als Folgepunkt `UX-ANLASSRAUM-MANUAL-CREATE-PERSIST-01` in `OpenTasks.md` notiert.

## Tests

Befehle:

```bash
pnpm -C apps/web exec vitest run tests/manual-anlassraum-setup.contract.test.ts tests/runden-manual-create.page.contract.test.tsx tests/runden-page.acceptance.test.ts tests/runden-guided-question-builder.contract.test.ts
pnpm -C apps/web exec vitest run tests/voxy-guide.render.test.tsx tests/create-mode.page.test.ts
pnpm -C apps/web typecheck
```

Ergebnisnotiz:

- `vitest`: Vertrags- und Seiten-Tests für `/runden`, `/runden/new`, `/create` und `VoxyGuide` grün.
- `typecheck`: erfolgreich.
