# V3 Maturity Status Definition

## 1. Executive Summary

- `partially_built` ist kein Zielstatus.
- `partially_built` bedeutet: eine reale Basis ist vorhanden, aber das
  fachliche Endziel ist noch offen.
- V3 zielt darauf, Capabilities von `partially_built` zu
  `endstate_ready` zu fuehren.
- Nur bewusst entschiedene Post-V3-Themen duerfen nach V3 unterhalb von
  `endstate_ready` bleiben und muessen dann explizit als solche markiert
  werden.

## 2. Warum diese Definition noetig ist

Nach dem Reality-Audit gibt es keine bereits vollstaendig geschlossene
V3-Capability, aber viele reale Grundlagen mit `partially_built`.

Ohne eine kanonische Semantik wuerde dieser Status zu leicht wie ein
zufriedener Endstand gelesen. Das waere fuer V3 irrefuehrend: Die Basis ist
real, aber die Umsetzungspflicht bleibt offen, solange keine
End-to-End-Reife ueber Admin, Runtime, Tests, Dokumentation und Handout-Paritaet
erreicht ist.

## 3. Kanonische Reifegrade

| Status | Bedeutung | Darf als Endstand gelten? | Konsequenz |
| --- | --- | --- | --- |
| `missing` | Keine belastbare Basis vorhanden. | nein | neue Basis oder bewusste Ausklammerung noetig |
| `docs_only` | Nur Zielbild oder Dokumentation ist vorhanden, noch keine echte Umsetzung. | nein | Runtime-, Admin-, Test- oder Handout-Basis fehlt weiterhin |
| `partially_built` | Reale Basis ist vorhanden, aber nicht endzielreif. | nein | verpflichtender Folgepfad bis mindestens `endstate_ready` oder bewusste Post-V3-Entscheidung |
| `operational_basic` | Nutzbarer Minimalbetrieb ist vorhanden, aber Komfort, Skalierung, Automatisierung, Admin-Paritaet oder Endzielreife sind offen. | nur fuer klar begrenzten Minimalbetrieb | Endziel oder breite Produktbehauptung bleibt offen |
| `endstate_ready` | Das fachliche Endziel ist erfuellt, admin-steuerbar, review-first, getestet, dokumentiert und handoutfaehig. | ja | Capability darf fachlich als geschlossen gelten |
| `production_ready` | `endstate_ready` plus belastbare Betriebsannahmen, Monitoring, Recovery und Guardrails. | ja | belastbare Produktionsbehauptung fuer den definierten Scope moeglich |
| `live` | Aktiv nutzbar oder vermarktbar mit laufendem Betrieb. | ja | laufender Betrieb oder Vermarktung ist real gegeben |

## 4. Definition partially_built

`partially_built` heisst:

- Code-, Route-, Test-, Admin-, Runtime- oder Doku-Basis existiert real
- das fachliche End-to-End-Ziel ist aber noch offen
- vollstaendige Admin-Steuerung fehlt
- vollstaendige Test-, Regression- oder E2E-Abdeckung fehlt
- vollstaendige Handout- oder Usage-Paritaet fehlt
- vollstaendige Wartungsarmut fehlt
- offene Folgepfade bleiben Pflicht

`partially_built` ist damit ein belastbarer Zwischenstand, aber keine Abnahme
und kein stilles `done`.

## 5. Definition endstate_ready

Eine Capability ist erst `endstate_ready`, wenn:

- das fachliche Endziel erfuellt ist
- Admin oder Operator den Pfad sehen und steuern kann
- review-first Guardrails greifen
- relevante Tests existieren
- Fehler-, Block-, Rollback- oder Diagnosepfad geklaert ist
- Handout- oder Usage-Doku zur echten UI passt
- keine bekannten Endziel-Luecken offen sind
- keine versteckten Kosten-, DeepSearch- oder Publish-Pfade existieren

## 6. Konsequenz fuer V3

Alle `partially_built` V3-Capabilities aus dem Reality-Audit bleiben offene
Arbeit.

Sie duerfen nicht als `done` markiert werden, bis `endstate_ready` erreicht
ist oder bewusst als Post-V3 entschieden wurde.

## 7. Wann partially_built nach V3 bleiben darf

Nur wenn:

- der Pfad explizit als Post-V3 markiert ist
- Risiko und Folge sichtbar bekannt sind
- kein Produktversprechen davon abhaengt
- keine falsche `live`- oder `production_ready`-Behauptung entsteht

## 8. Guardrails

Beizubehalten sind:

- kein Auto-Publish
- kein Auto-Programm
- kein Auto-Factcheck
- kein Auto-Verification
- kein Auto-Graph-Write
- kein Auto-Merge
- keine hidden DeepSearch
- keine hidden Cost Paths
- kein Review-Bypass

## 9. Akzeptanzkriterien

Der Slice ist erfolgreich, wenn:

- `partially_built` klar als unzufriedener Zwischenstand definiert ist
- `endstate_ready` eingefuehrt ist
- `OpenTasks.md` und `ProductionReadinessMatrix.md` diese Semantik spiegeln
- `V3_IMPLEMENTATION_REALITY_AUDIT_2026-07-01.md` den Hinweis traegt, dass
  `partially_built` keine Abnahme ist
- `V3_TOTAL_SCOPE_READINESS_MAP_2026-07-01.md` den Zielpfad bis
  `endstate_ready` benennt
- keine Produktlogik geaendert wurde
