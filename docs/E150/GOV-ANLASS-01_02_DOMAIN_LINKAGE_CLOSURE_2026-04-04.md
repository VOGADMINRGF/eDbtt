# GOV-ANLASS-01/02 - Domain + Dossier-Linkage Closure (2026-04-04)

## Scope

Kleiner Abschluss-Slice fuer den verbleibenden Rest von `GOV-ANLASS-01` und `GOV-ANLASS-02`:
- kein neuer Anlassraum-/Dossier-Architekturwurf
- keine neue Produktlogik
- nur restliche Contract-/Readmodel-Absicherung fuer
  - Anlassraum als eigenstaendigen offenen Arbeitsraum
  - optionale Dossier-Verdichtung ohne Defektannahme
  - Mehr-zu-eins-Linkage (ein Dossier, mehrere Anlassraeume)

## Umgesetzt

1. Optionale Dossier-Linkage explizit im Readmodel-Contract eingefroren
- Datei: `apps/web/src/features/anlassraumOperationsRead.ts`
- Neue, kleine Contract-Helferfunktion:
  - `deriveAnlassraumDossierLinkState(dossierId)`
  - Ergebnis: `dossier_linked` oder `optional_not_started`
- `buildOperationalHints` nutzt diese Ableitung; fehlendes Dossier bleibt explizit optional (`dossier_optional_not_started`).

2. Regression-Test fuer optionalen No-Dossier-Zustand
- Datei: `apps/web/tests/anlassraum-operations-read.service.test.ts`
- Test fixiert:
  - `null` -> `optional_not_started`
  - vorhandene ID -> `dossier_linked`

3. Regression-Test fuer Mehr-zu-eins Anlassraum->Dossier
- Datei: `apps/web/tests/dossier-atlas-readmodel.test.ts`
- Test fixiert:
  - zwei verschiedene Anlassraeume duerfen dieselbe `dossierId` tragen
  - beide bleiben als getrennte Anlass-Knoten erhalten (kein stilles Zusammenfalten)

## Guardrails

- Anlassraum bleibt ohne Dossier ein normaler Zustand.
- Dossier bleibt optionale Verdichtung/Oberraum.
- Kein Auto-Publish, keine neue Prioritaets-/Wahrheitslogik.
- Keine semantische Drift Richtung "fehlendes Dossier = Defekt".

## Ergebnis

`GOV-ANLASS-01` und `GOV-ANLASS-02` sind fuer den aktuellen Zielrahmen belastbar abgeschlossen:
- Domain-Baseline steht.
- Anlassraum/Dossier-Schnitt ist in den relevanten Readmodel-/Atlas-Pfaden regressionssicher eingefroren.
