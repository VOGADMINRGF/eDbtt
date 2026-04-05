# UX-COPY-HARM-01 - Frontend-Umlaute Closure (2026-04-05)

## Scope

Kleiner Copy-Hardening-Slice ohne Produktlogik:

- nur user-facing Frontend-Texte
- keine API-/ID-/Routing-Änderung
- keine Variablen-/Contract-Umbenennung
- keine i18n-Architekturarbeit

## Restmatrix (vor dem Slice)

| Surface / Datei | user-facing Copy | Legacy-Schreibweise | technisch sensibel | Drift | klein schließbar |
| --- | --- | --- | --- | --- | --- |
| `/community` (`apps/web/src/app/community/page.tsx`) | ja | `Raeume`, `Uebersicht`, `oeffnen`, `Beitraege`, `verfuegbar`, `verknuepft` | nein | ja | ja |
| Create-UI/Resolver (`apps/web/src/features/create/*.ts*`) | ja | `ergaenzen`, `hinzufuegen`, `begruendet`, `Naehe`, `moeglich`, `fuer` | teils (CTA-IDs) | ja | ja |
| Content Translation UI (`apps/web/src/features/i18n/contentTranslations.ts`) | ja | `Uebersetzt`, `Uebersetzung`, `fuer` | nein | ja | ja |
| Admin-Surfaces (`apps/web/src/app/admin/**`) | ja | `Laedt`, `Zurueck`, `Vorschlaege`, `oeffnen`, `fuer`, `Eintraege`, `ungueltig` | nein | ja | ja |

## Umsetzung

- User-facing Legacy-Copy mit echten Umlauten geschärft in:
  - `apps/web/src/app/community/page.tsx`
  - `apps/web/src/features/create/intents.ts`
  - `apps/web/src/features/create/historyMaintenanceDiagnosticsUi.tsx`
  - `apps/web/src/features/create/matchService.ts`
  - `apps/web/src/features/create/ctaHandoff.ts`
  - `apps/web/src/features/create/ctaResolver.ts`
  - `apps/web/src/features/create/reviewQueueUi.tsx`
  - `apps/web/src/features/i18n/contentTranslations.ts`
  - mehreren Admin-Surfaces (`apps/web/src/app/admin/**`, z. B. Access, Reports, Media, Graph, Factcheck, Projects, Settings, Pilot, Support, Attach-Drafts, Audit)
  - `apps/web/src/app/dashboard/streams/[id]/page.tsx` (ein verbleibender user-facing Resttext)

## Guardrails

- Technische Identifier blieben unverändert:
  - z. B. `anlassraum_oeffnen`, `dossier_oeffnen`, `perspektive_anhaengen`, `verfuegbar`
- Regex-/Stopword-Logik blieb unverändert:
  - z. B. `fuer` in Tokenlisten/Regex-Patterns
- keine API-/Routing-/Contract-Umbenennung

## Verifikation

- Repo-Scan auf Legacy-Umlautersatz in user-facing Bereichen zeigt nur noch technische/absichtlich unveränderte Treffer (IDs, Regex/Stopwords, Pfad-/Namespace-Strings).

## Ergebnis

`UX-COPY-HARM-01` ist im verbleibenden realen Frontend-Copy-Restscope abgeschlossen.
