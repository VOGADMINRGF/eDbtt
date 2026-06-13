# CREATE-STREET-REGISTRY-LOOKUP-12

## Was wurde umgesetzt?

- Eine eigene Street-Registry-Abstraktion wurde in den bestehenden Create-/Place-Pfad eingeführt.
- Neue Contract-Felder:
  - `StreetRegistryLookupResult`
  - `StreetRegistryMatch`
  - `streetRegistryStatus`
  - `streetRegistrySource`
  - `streetRegistryMatches`
  - `selectedStreetMatch`
  - `streetVerificationStatus`
- `lookupStreetCandidate(...)` liefert ohne konfiguriertes Straßenregister bewusst keine amtliche Straßenvalidierung.
- Wenn nur Regions-/Verwaltungskontext vorliegt, wird das als `region_directory` mit `isOfficialStreetMatch=false` geführt.

## Nutzeroberfläche

- Der lokale Place-Branch zeigt jetzt zusätzlich:
  - `Straße prüfen`
  - `Ort und Straße übernehmen`
  - `Ohne Prüfung als Entwurf speichern`
- Ergebnisboxen sind ehrlich:
  - `Straße im Register gefunden: ...`
  - `Mehrere mögliche Straßen gefunden. Bitte wähle den passenden Eintrag.`
  - `Straße noch nicht im Register geprüft. Du kannst Ort und Straße trotzdem als Entwurf speichern.`
  - `Mögliche Region/Zuständigkeit gefunden, Straße aber noch nicht offiziell geprüft.`

## Ledger / Profil

- Branch-scoped gespeichert:
  - `detectedStreetName`
  - `correctedStreetName`
  - `suppliedPlace`
  - `streetRegistryStatus`
  - `streetRegistrySource`
  - `streetRegistryMatches`
  - `selectedStreetMatch`
  - `streetVerificationStatus`
- Profil zeigt dadurch getrennt Straße, Ort und ehrlichen Prüfstatus.

## Guardrails

- Keine Google Maps
- Keine Mapbox
- Keine neue Map-Abhängigkeit
- Kein Publish
- Kein Vote
- Kein Merge
- Kein echtes Teilen
- Keine Fake-Straßentreffer
- Alles bleibt Draft/Preparation

## Bewusst offen

- `CREATE-PLACE-MAP-MARKER-13`
- Eine echte externe oder interne Straßenregister-Anbindung
- Koordinaten/Marker/MapLibre/OpenStreetMap-Einbettung

## Verifikation

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-place-clarification.contract.test.tsx tests/create-place-registry-jurisdiction.contract.test.tsx tests/create-multibranch-actions.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/create-street-registry-lookup.contract.test.tsx`

Ergebnis:

- Typecheck grün
- Lint grün
- Fokus-Suite grün
