# PARTICIPATION-MAP-PLACE-FUTURE-05

Datum: 2026-06-27
Status: erledigt

## Ziel

Einen kleinen, typed Participation Map / Place Future Contract einführen, der spätere Orts-, Map- und
Place-Bezüge vorbereitet, ohne heute eine Karte, Geocoding-Logik, externe APIs, Routing, Persistenz
oder Koordinaten einzuführen.

## Umgesetzter Contract

Datei:

- `apps/web/src/features/participation/placeFuture.ts`

Enthalten:

- `ParticipationPlaceReference`
- `ParticipationPlaceReferenceType`
- `ParticipationPlacePrecision`
- `ParticipationPlaceReviewStatus`
- `ParticipationPlaceLinkedSpace`
- `ParticipationPlaceDisplayMode`
- `ParticipationPlaceReadiness`
- `ParticipationPlaceGuardrails`
- `getParticipationPlaceTypeLabel(...)`
- `getParticipationPlacePrecisionLabel(...)`
- `getParticipationPlaceReviewStatusLabel(...)`
- `getParticipationPlaceDisplayModeLabel(...)`
- `isParticipationPlaceDisplayable(...)`
- `requiresParticipationPlaceReview(...)`
- `canShowParticipationPlacePublicly(...)`
- `summarizeParticipationPlaceReadiness(...)`
- `createEmptyParticipationPlaceReference(...)`

Der Contract nutzt bestehende Typen aus:

- `apps/web/src/features/participation/spaceContainer.ts`

## Place-Type-Modell

- `free_text_place`
- `district`
- `street_or_area`
- `institution`
- `event_location`
- `online_context`
- `not_location_bound`

Wichtig:

- `online_context` ist ein digitaler Kontext ohne physischen Ort
- `not_location_bound` ist ein gültiger Zustand ohne Ortsbezug
- Typen beschreiben Kontext, nicht verifizierte Geodaten

## Precision-Modell

- `none`
- `low`
- `medium`
- `high`
- `exact`

Wichtig:

- Präzision heißt fachliche Einordnung, nicht Koordinate
- `exact` behauptet weder Geocoding noch verifizierte Lat/Lon-Daten

## Review-Status-Modell

- `unreviewed`
- `needs_clarification`
- `reviewed_context`
- `approved_for_display`
- `hidden_for_safety`

Wichtig:

- `hidden_for_safety` kann öffentliche Anzeige vollständig blockieren
- `approved_for_display` heißt nur für spätere Anzeige freigegeben, nicht automatisch veröffentlicht

## Display-Mode-Modell

- `hidden`
- `text_only`
- `area_label`
- `approximate_marker`
- `exact_marker_future`

Wichtig:

- Display Mode heißt Intent, nicht tatsächliches Rendering
- `exact_marker_future` bleibt ein Future-Intent ohne Marker, Karte oder Koordinate
- `online_context` bleibt text-/hidden-only

## Linked-Space-Modell

`ParticipationPlaceLinkedSpace` enthält:

- `spaceId`
- `spaceTitle`
- `spaceStatus`
- `spaceVisibility`

Damit bleiben spätere Ortsbezüge an den bestehenden Participation-Space-Contract gekoppelt, ohne eine
zweite Raumlogik aufzubauen.

## Guardrails

- kein Map Rendering
- kein Geocoding
- keine externe Map-API
- kein Coordinate Storage
- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Graph
- keine automatische amtliche Bewertung
- Place ist nur Kontext
- `exact_marker_future` ist nur Future-Intent
- Safety Review kann öffentliche Anzeige blockieren

## Validierung

Erfolgreich ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/participation-place-future-contract.test.ts`
- `pnpm -C apps/web run build`

## Bewusst out of scope

- keine Map-Komponente
- keine Marker-UI
- keine Koordinaten
- keine Geocoding-Logik
- keine externe Map-API
- keine neue Route
- keine öffentliche Karte
- keine Admin-Oberfläche
- keine Persistenz
- keine Datenbankmigration
- keine externe Integration
- kein Workflow-Runner
- keine automatische Veröffentlichung
- keine automatische Dossier-Erzeugung
- keine automatische Anlassraum-Erzeugung
- keine automatische Graph-Erzeugung
- keine amtliche Entscheidungsbehauptung
