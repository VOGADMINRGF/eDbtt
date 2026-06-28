# SSOT Reconciliation after Source Review Community

Stand: 2026-06-28
Repo: `edebatte-org`
Bezug: Stand nach den gemergten PRs `#249` bis `#252`

## 1. Ausgangslage nach #252

`main` enthaelt jetzt zusaetzlich zum bereits sichtbaren kleinen Create-/Dialog-Pfad:

- `#249` Handoff-Drafts aus `/create` und dem Dialog-Follow-up gehen in dieselbe bestehende Review-Queue-Runtime.
- `#250` Existing Topic Matches lesen kontrolliert aus vorhandenen Runtime-/Readmodel-Quellen statt nur aus lokaler Preview.
- `#251` `factcheck_request` wird review-first direkt an `/api/factcheck/enqueue` angeschlossen.
- `#252` Community-Source-Review-Hinweise sind als review-first Contribution-Contract vorbereitet.

Damit muss die Doku jetzt klar unterscheiden zwischen:

- sichtbar geschlossenem Produktpfad
- real verdrahteter Runtime
- nur vorbereiteten Contract-/Preview-Pfaden
- bewusst weiter blockierten Ausbaupfaden

## 2. Kanonischer Produktpfad

Der jetzt ehrlich belegte sichtbare Pfad lautet:

Beitrag erfassen
-> Standpunkt erkennen
-> echte vorhandene Anschluesse anzeigen
-> Meinung zaehlen / ausarbeiten
-> Handoff-Draft vorbereiten
-> Review Queue
-> Quellenpruefung
-> Community-Hinweise als pruefpflichtige Beitraege

Wichtig:

- Dieser Pfad ist als Produkt- und UIsprache jetzt konsistent.
- Er ist nicht gleichbedeutend mit vollstaendiger Runtime fuer Dossier, Anlassraum, Beteiligungsraum, Graph oder Deep Research.
- Community-Hinweise sind Hinweise fuer Review, nicht Wahrheit.

## 3. Was seit #249 bis #252 real verdrahtet wurde

Real verdrahtet und deshalb im SSOT als erledigt bestaetigt:

- `CREATE-DIALOG-HANDOFF-TO-REVIEW-QUEUE-WIRING-06`
- `CREATE-EXISTING-TOPIC-MATCHES-RUNTIME-BRIDGE-04`
- `FACTCHECK-SOURCE-ADAPTER-INTEGRATION-01`
- `COMMUNITY-SOURCE-REVIEW-CONTRIBUTION-01`

Konkrete belegte Runtime-Aussagen:

- Create-/Dialog-Handoffs werden ueber denselben bestehenden Review-Queue-Pfad persistiert und in `/admin/review` lesbar gemacht.
- Existing Topic Matches nutzen vorhandene Runtime-/Readmodel-Quellen ehrlich als `runtime`, `hybrid` oder `preview`.
- `factcheck_request` erzeugt review-first echte Factcheck-Intake-Pfade ueber `/api/factcheck/enqueue`.
- Community-Source-Review ist als Contract, Mapping und Guardrail-Schicht vorbereitet.

## 4. Was weiterhin nur Contract / Preview / blocked_unwired ist

Nicht fertig und weiterhin offen:

- `DIALOG-INTELLIGENCE-RUNTIME-AI-02`
- `DOSSIER-RUNTIME-CREATION-04`
- `ANLASSRAUM-RUNTIME-CREATION-04`
- `PARTICIPATION-SPACE-RUNTIME-CREATION-04`
- `TOPIC-GRAPH-RUNTIME-05`
- `TOPIC-DEDUPLICATION-REVIEW-QUEUE-01`
- Community Moderation UI
- Abuse-/Spam-Handling fuer Community-Source-Review
- Trust-/Reputation-Levels
- Source-Quality-Scoring
- Review-Workbench-Erweiterung fuer Community-Hinweise

Wichtig fuer die SSOT-Lesart:

- `source_question` bleibt im neuen Match-/Source-Review-Zusammenhang bewusst preview-only.
- Community-Source-Review-Submission bleibt bewusst `blocked_unwired`, bis Moderation, Abuse-Schutz, Auth und Persistenz belastbar an dieselbe Runtime angeschlossen sind.
- Externe Source-Adapter, DeepSearch oder breitere Research-Automation bleiben spaetere explizite Folgepfade und sind hier nicht stillschweigend enthalten.

## 5. Guardrails

Verbindlich weiter dokumentiert:

- no fake facts
- no fake sources
- no automatic verification
- no majority as truth
- no auto-publish
- no auto-merge
- no auto-create dossier/anlassraum/participation space
- no fake graph
- no hidden DeepSearch/cost path
- community contributions are hints, not truth

Das ist hier entscheidend, weil seit `#251` und `#252` echte Quellenpruefungs- und Community-Hinweis-Sprache sichtbar geworden ist. Die neue Sichtbarkeit darf nicht als Claim fuer verifizierte Quellen, automatische Faktenwahrheit oder oeffentliche Moderationsreife missverstanden werden.

## 6. OpenTasks-Korrekturen

`docs/E150/OpenTasks.md` wurde in diesem Slice so bereinigt:

- neuer done-Eintrag `SSOT-RECONCILE-AFTER-SOURCE-REVIEW-COMMUNITY-02`
- die vier oben genannten Slices bleiben explizit als erledigt bestaetigt
- die Runtime-Folgepfade fuer AI, Dossier, Anlassraum, Beteiligungsraum, Graph und Deduplication bleiben klar offen
- zusaetzliche offene Folgepfade fuer Community-Moderation, Abuse/Spam, Trust/Source Quality und Review-Workbench wurden sichtbar gehalten statt implizit zu verschwinden

Damit driftet die operative Queue nicht in Richtung "Community ist schon produktionsfertig", obwohl real erst ein review-first Contract-/Preview-Slice vorliegt.

## 7. ProductionReadinessMatrix-Korrekturen

`docs/E150/ProductionReadinessMatrix.md` wurde entsprechend geschaerft:

- der Bundle-Stand nach `#249` bis `#252` benennt jetzt explizit Review-Queue-Wiring, Runtime-Bruecke fuer Existing Topic Matches, review-first Factcheck-Intake und den Community-Source-Review-Contract
- `/create` beschreibt jetzt den sichtbaren Pfad bis Quellenpruefung und pruefpflichtigen Community-Hinweisen korrekt
- die Matrix trennt klar zwischen realem Review-/Factcheck-/Queue-Wiring und noch fehlender tieferer Runtime
- `Community Contributions` bleibt absichtlich nur `pilot_ready`, nicht `production_ready`

Das verhindert zwei falsche Lesarten:

- dass Community-Hinweise bereits eine vollstaendige oeffentliche Moderationsplattform waeren
- dass der sichtbare Create-/Dialog-Pfad schon eine automatische Dossier-/Anlassraum-/Graph-Runtime impliziere

## 8. Aktuelle Reifegrad-Einschaetzung

Ehrliche Lesart nach `#252`:

- Produkt-/Flow-Reife fuer den kleinen sichtbaren Create-/Dialog-/Review-/Source-Review-Pfad: ca. `90-92 %`
- Runtime-Reife fuer die tieferen Anschlusswelten: deutlich darunter, weil AI-, Dossier-, Anlassraum-, Beteiligungsraum-, Graph-, Deduplication- und Community-Moderationspfade nicht voll verdrahtet sind
- SaaS-/Production-Reife insgesamt: ebenfalls niedriger als die sichtbare Flow-Reife, weil Moderation, Abuse-Schutz, Auth-/Rollenhaertung fuer spaetere Community-Intake-Pfade, externe Research-Pfade und breitere Betriebs-/Missbrauchskanten noch offen sind

Kurz:

- sichtbarer Produktpfad: weit geschlossen
- Review-/Queue-/Factcheck-Kern: real teilverdrahtet
- Community-Moderation und tiefe Runtime: noch nicht produktionsfertig

## 9. Empfohlene naechste Reihenfolge

Empfohlene sachliche Folge-Reihenfolge ohne neue Scheinsicherheit:

1. Community-Moderation-/Sichtungsbasis auf bestehenden Review-Pfaden anschliessen
2. Abuse-/Spam- und Rate-Limit-Gates fuer Community-Source-Review haerten
3. Review-Workbench fuer Community-Hinweise erweitern
4. erst danach ueber Trust-/Source-Quality-Helfer entscheiden
5. tiefe Runtime-Folgepfade getrennt halten: Dossier, Anlassraum, Beteiligungsraum, Graph, Deduplication, AI

Externe Source-Adapter, DeepSearch oder breitere Research-Automation bleiben nur als spaeterer expliziter Folgepfad sinnvoll.

## Validierung

Auszufuehren fuer diesen docs-only Slice:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

Mehr ist fuer diesen SSOT-Abgleich nicht noetig, solange keine Codeaenderung stattfindet.
