# ALPHA2-CONTINUOUS-DISPATCH-01

Stand: 2026-08-25
Issue: `#646`
Status: `implementation / review`

## Ziel

Ein einmal autorisierter Alpha2-Arbeitsstrom soll zwischen normalen, reversiblen und low-risk Worker-Slices **keinen erneuten Chat-Trigger** benötigen. Nach einem abgeschlossenen Slice bewertet Alpha2 den nächsten zulässigen Schritt erneut gegen OpenTasks-Eligibility und den kanonischen Risk/Action-Gate und setzt den Arbeitsstrom selbst fort, bis ein echter Human-/Risk-Gate oder ein belastbarer Idle-/Complete-Zustand erreicht wird.

Der Chat ist damit Betreiber- und Statusoberfläche, nicht der vorgesehene Runtime-Taktgeber.

## In diesem Slice umgesetzt

1. `Alpha2ContinuationPlanner` liefert nach einem abgeschlossenen Run entweder einen konkreten Folgeslice, `idle` oder `complete`.
2. Vor jeder automatischen Fortsetzung werden die bestehenden Verträge `evaluateAlpha2TaskEligibility(...)` und `resolveAlpha2ActionGate(...)` erneut angewendet.
3. Ein zulässiger Folgeslice muss dieselbe Root-Mission behalten, den abgeschlossenen Run als Parent referenzieren, `queued` starten und zur Task-/Risk-Identität passen.
4. Der Child-Run wird **vor** BullMQ-Dispatch im bestehenden Mongo-Run-Ledger persistiert. Ein Redis-/Queue-Ausfall verliert deshalb die Arbeitsabsicht nicht; der bestehende Recovery-Pfad kann den persistierten queued Run erneut dispatchen.
5. `review`/`manual_gate` beziehungsweise Human-Sovereignty-Aktionen werden nicht automatisch ausgeführt. Statt einer weiteren „Go?“-Schleife entsteht ein persistenter `human_gate`-Child-Run mit konkretem Grund.
6. Der bestehende Runtime Worker kann nach erfolgreichem `completed`-Ergebnis unmittelbar den Continuation Planner aufrufen und den nächsten zulässigen Slice dispatchen.
7. Parent/Child-Beziehung und der Zustand der autonomen Fortsetzung (`dispatched`, `human_gate`, `idle`, `complete`) werden als sichere Checkpoint-Metadaten im bestehenden Ledger dokumentiert.

## Contract-Evidence

`apps/web/tests/alpha2-continuous-dispatch.contract.test.ts` belegt unter anderem:

- eine Kette aus drei bounded Worker-Slices, in der Slice 1 → Slice 2 → Slice 3 ohne neue menschliche Autorisierung fortgesetzt wird;
- ein nicht automatisch zulässiges `merge_code` wird als dauerhafter `human_gate` erfasst und nicht dispatcht;
- fällt Redis beim Dispatch aus, bleibt der Child-Run als `queued` in der kanonischen Mongo-Wahrheit erhalten und ist recovery-fähig.

## Mission Control

`/admin/system/alpha2` bleibt read-only und zeigt zusätzlich:

- `next eligible action`;
- `last autonomous continuation`;
- `human gate reason`;
- `idle reason`.

Es werden weiterhin keine Prompts, Secrets oder Chain-of-Thought-Inhalte exponiert.

## Guardrails

- `docs/E150/OpenTasks.md` bleibt die einzige operative Task-SSOT.
- Dieser Nachweis ist **keine** zweite Task-Wahrheit und ersetzt keine OpenTasks-Synchronisierung.
- Keine zweite Registry, Queue oder Run-Persistenz.
- Kein Auto-Merge, Auto-Deploy oder allgemeines Auto-Publish.
- Kein autonomes Spending, keine Verträge/Rechte, keine Secret-/Security-Mutation.
- Bestehende Review-, Manual- und Risk-Gates bleiben fail-closed.
- Worker-Slices bleiben bounded; Alpha setzt nur den nächsten berechtigten Slice fort.

## Noch nicht als „live autonom“ zu behaupten

Dieser PR verdrahtet die Runtime-Fähigkeit, aktiviert aber **keinen Production-Worker, keine Provider-Credentials und kein Deployment**. Ein wirklich vom Chat unabhängiger 24/7-Betrieb erfordert anschließend einen gestarteten long-running Alpha2-Control-Plane-Prozess mit einem konkreten Continuation Planner/Executor Resolver in der autorisierten Runtime-Umgebung.

## Offene Acceptance aus #646

Die normale Continuous-Dispatch-Kette, Human-Gates, Redis-Recovery und Mission-Control-Signale werden in diesem Slice abgedeckt. Der explizite Fall „fehlgeschlagener CI/Test-Schritt erzeugt einen eigenen bounded Repair-Slice und setzt danach fort“ wird als eigener kleiner Follow-up-Slice umgesetzt, damit die bestehende Retry-/Recovery-Semantik nicht parallel oder widersprüchlich erweitert wird.

## OpenTasks-Synchronisierung

`OpenTasks.md` ist aufgrund seiner Größe über den aktuellen Connector nicht zuverlässig als vollständiger UTF-8-Inhalt verfügbar. Daher erfolgt hier keine riskante Volltext-Ersetzung. Die Task-SSOT muss über einen sicheren vollständigen Repo-Read beziehungsweise den bestehenden repo-lokalen Preflight/Metadata-Pfad synchronisiert werden; Issue `#646` und dieser Evidenznachweis bleiben bis dahin nur Tracking/Evidence, nicht operative Ersatz-SSOT.
