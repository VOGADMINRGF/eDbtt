# I18N-PREFERENCE-SEPARATION-03

Datum: 2026-07-26
OpenTasks-Status: review
PR-Phase: Draft
Evidence: PR #427

## Ziel

`uiLocale`, `readingLocale`, Output-Präferenzen und die Anzeige des Originals in den Kernflächen technisch trennen, ohne die bestehende Sprach-Bridge für Original- und Arbeitssprache still neu zu definieren.

## Umgesetzt

- `apps/web/src/context/LocaleContext.tsx` verwaltet jetzt einen gemeinsamen Sprachvertrag mit:
  - `uiLocale`
  - `readingLocale`
  - `preferredOutputLocales`
  - `showOriginalByDefault`
- Bestehende Persistenzpfade bleiben kompatibel:
  - UI-Sprache weiter über `vog:locale`, Cookie `lang` und URL-Parameter `?lang=`
  - Lesesprache weiter über `vog_content_lang`
  - neue Präferenzen lokal über eigene Keys
- `apps/web/src/lib/i18n/contentLanguage.ts` hängt sich an den gemeinsamen Vertrag an, statt eine zweite unabhängige Wahrheitsquelle zu bleiben.
- `apps/web/src/app/(components)/SiteHeader.tsx` verwendet UI- und Lesesprache getrennt:
  - Navigation und UI-Übersetzung folgen `uiLocale`
  - Lesesprache wird separat sichtbar angezeigt
  - der Sprachumschalter ändert nicht mehr implizit auch die Lesesprache
- `apps/web/src/app/settings/page.tsx` enthält jetzt eine eigene Sektion für:
  - UI-Sprache
  - Lesesprache
  - bevorzugte Ausgabesprache
  - Original standardmäßig anzeigen
- Konto-Settings persistieren die Trennung jetzt auch serverseitig:
  - `uiLocale`
  - `readingLocale`
  - `preferredOutputLocales`
  - `showOriginalByDefault`
  - `preferredLocale` bleibt als Legacy-Mirror der Lesesprache erhalten
- `apps/web/src/app/account/AccountClient.tsx` bearbeitet diese Sprachpräferenzen explizit statt nur ein einziges Feld "Bevorzugte Sprache".

## Guardrails

- keine Produkt- oder Routing-Neudefinition
- keine neue Parallel-Architektur neben der bestehenden Sprach-Bridge
- `preferredLocale` bleibt als Legacy-Mirror erhalten, damit abhängige Lesepfade nicht still brechen
- Original- und Arbeitssprache in den Create-/Analyze-Verträgen bleiben separat und werden nicht auf eine globale UI-Präferenz reduziert

## Tests

- `pnpm exec vitest run src/context/LocaleContext.test.ts src/app/api/contributions/analyze/parseAnalyzeRequest.test.ts` in `apps/web`
- `pnpm exec eslint --config eslint.config.js 'src/context/LocaleContext.tsx' 'src/context/LocaleContext.test.ts' 'src/lib/i18n/contentLanguage.ts' 'src/app/(components)/SiteHeader.tsx' 'src/app/settings/page.tsx' 'src/app/account/AccountClient.tsx' 'src/app/api/account/settings/route.ts'` in `apps/web`

## Bekannte Grenze

- `pnpm check:web` ist im aktuellen Repo-Stand nicht grün, scheitert aber weiterhin an vorbestehenden TypeScript-/Alias-Problemen außerhalb dieses Slices, unter anderem in `next/navigation`-Typen und `@features/*`-Auflösungen.
