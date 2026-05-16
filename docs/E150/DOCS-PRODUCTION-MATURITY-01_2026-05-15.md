# DOCS-PRODUCTION-MATURITY-01 (2026-05-15)

## Ziel

Die Production-Readiness-Doku von dauerhaftem `pilot-only` auf eine klare Reifestufenlogik umstellen, ohne Runtime, UI oder APIs zu aendern.

## Nicht-Ziele

- keine Runtime-Aenderungen
- keine UI-Aenderungen
- keine neuen APIs
- kein GeoReferenceLayer
- kein Payment
- kein Publishing-Code

## Geaenderte Dateien

- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/OpenTasks.md`
- `docs/E150/Part16.md`
- `apps/web/src/app/faq/faqContent.ts`
- `apps/web/tests/faq-product-narrative.contract.test.ts`

## Umgesetzte Reifestufenlogik

- `foundation`: Grundlage, Contracts oder Importstrategie vorhanden; noch kein geschlossener Produktpfad
- `pilot_ready`: kontrollierter Pilot mit Guardrails moeglich
- `production_candidate`: produktionsnaher Pfad mit klar begrenzten Restluecken
- `production_ready`: belastbarer Produktpfad fuer definierte Zielgruppe
- `live`: aktiv betriebener oder vermarktbarer Pfad
- `paused`: bewusst aus dem MVP genommen
- `blocked`: zentrale Luecke verhindert das Produktversprechen

Wesentliche Konsequenz:

- `pilot-only` wird nicht mehr als Dauerziel gelesen.
- Die Matrix bildet jetzt eine Produktionsroute statt eines statischen Defensivlabels ab.
- Es gibt aktuell bewusst noch keinen externen Hauptpfad, der pauschal als `production_ready` markiert wird.

## Matrix-Praezisierung

- Region-/Organisationsverwaltung wird als `pilot_ready` bis `production_candidate` beschrieben statt als diffuser Dauerpilot.
- Die regionale KI-Startlage bleibt ein Folgepfad; der heutige Stand ist als vorbereitete Grundlage und produktionsnaher Verwaltungskontext getrennt beschrieben.
- `RegionRegistry` und `OfficialDirectory` sind als Importfundament manifestiert, nicht als Runtime-Abhaengigkeit.
- `/create` bleibt technisch stark und `pilot_ready`, mit offenem Folgeslice fuer die sichtbare Confirmation-Stage.
- Anlassraum ist als oeffentlicher Themenraum geschaerft; die vollstaendige Verwaltungsruntime bleibt `blocked`.
- Review- und Visibility-Logik sind als Risk Ladder dokumentiert; die durchgehende Runtime-Haertung bleibt Folgearbeit.
- Studio-Workspace, Output-Distribution und serverseitige Studio-Persistenz sind jetzt als `production_candidate` lesbar.

## FAQ- und Glossar-Ergaenzungen

Neu oder erweitert:

- `Ist eDebatte nur ein Pilot?`
- `Was bedeutet pilotfaehig?`
- `Wann ist ein Bereich produktionsfaehig?`
- `Was sieht eine Verwaltung oder Organisation?`
- `Was sieht die Oeffentlichkeit?`
- Glossar in `Part16` um Reifestufen, `Risk Ladder`, `RegionRegistry` und `OfficialDirectory` ergaenzt

## OpenTasks-Folgepfade

Die bereits angelegten Produktionspfade bleiben die naechsten sauberen Anschlussslices:

- `REGION-DATA-IMPORT-01`
- `REGION-INTELLIGENCE-01`
- `CREATE-SIMPLE-CONFIRMATION-01`
- `ANLASSRAUM-PUBLIC-SHARING-01`
- `PUBLICATION-RISK-LADDER-01`
- `ORG-DASHBOARD-01`

## Acceptance Criteria Check

- `pilot-only` wird nicht mehr als Dauerziel verstanden: erfuellt
- Matrix unterscheidet `pilot_ready`, `production_candidate`, `production_ready`, `live`: erfuellt
- Region-/Organisationslinie ist als produktionsnaher Pfad mit offenen Luecken beschrieben: erfuellt
- Datenimport, KI-Startlage, Anlassraum Public Sharing, Create Simplification, Risk Ladder und Org Dashboard sind als naechste Produktionspfade dokumentiert: erfuellt
- FAQ/Glossar erklaeren Verwaltung, Oeffentlichkeit und Registerrollen: erfuellt
- Keine Runtime-/UI-/API-Aenderungen in diesem Slice: erfuellt

## Offen

- `production_ready` ist bewusst noch kein pauschales Label fuer einen externen Hauptpfad.
- Die Produktionshaerte fuer Region-/Org-Isolation, Review Queue, Payment/Billing und regionale Startlage bleibt Folgearbeit in den benannten Slices.
