# ALPHA2-REPAIR-CONTINUATION-01

Stand: 2026-08-25
Issue: `#648`
Status: `implementation / review`

## Ziel

Ein fachlich reparierbarer Fehler in einem autorisierten Alpha2-Arbeitsstrom soll nicht wieder beim Nutzer mit einer neuen „Go“-Anforderung landen. Gleichzeitig darf der bestehende Retry-/Recovery-Pfad für transiente Fehler nicht verdoppelt werden.

## Trennung der Fehlerpfade

- **Transient / retryable:** Der bestehende Same-Run-Retry aus `ALPHA2-DURABLE-RUNTIME-01` bleibt unverändert zuständig. Der fehlgeschlagene Run erhält `resumeAt`; BullMQ oder Recovery dispatcht denselben Run erneut.
- **Repairable:** Der Executor kennzeichnet den Fehler ausdrücklich `repairable: true`. Für diesen Run wird kein paralleler Same-Run-Retry terminiert. Stattdessen darf ein bounded Repair-Child geplant werden.
- **Nicht reparierbar / Human Gate:** Kein automatischer Repair-Bypass. Risk-/Human-Sovereignty-Gates bleiben fail-closed.

## Umsetzung

1. `Alpha2WorkerOutcome.failed` kann optional `repairable: true` tragen.
2. `runAlpha2DurableStep(...)` gibt das persistierte Worker-Outcome an die Runtime zurück, damit die Control Plane die Fehlerklasse deterministisch weiterverarbeiten kann.
3. Repairable Failures erhalten keinen `resumeAt`-Retry und keinen zweiten Queue-Pfad.
4. `Alpha2RepairPlanner` plant genau den bounded Repair-Folgeslice.
5. `continueAlpha2AfterRepairableFailure(...)` prüft den Repair-Plan erneut gegen OpenTasks-Eligibility und den bestehenden Risk/Action-Gate.
6. Repair-Child wird vor BullMQ-Dispatch im kanonischen Mongo-Ledger persistiert und an dieselbe Root-Mission/Parent-Beziehung gebunden.
7. Repair-Checkpoint-ID und Child-Idempotency verhindern bei Repeat/Recovery einen zweiten Repair-Child für denselben Failure-Checkpoint.
8. Nach erfolgreichem Repair greift wieder der normale `Alpha2ContinuationPlanner`, sodass der nächste Verify-/Folgeslice ohne neue Chat-Nachricht dispatcht werden kann.

## Tests

`apps/web/tests/alpha2-repair-continuation.contract.test.ts` belegt:

- repairable CI/Test-Fehler → genau ein persistenter Repair-Child → Dispatch;
- wiederholte Repair-Auswertung erzeugt keinen zweiten Child;
- erfolgreicher Repair-Child → Verify-Slice wird über Continuous Dispatch automatisch fortgesetzt;
- normaler transienter Retry bleibt auf dem bestehenden Same-Run-Retry-Pfad und erzeugt keinen Child;
- `merge_code` im Repair-Plan stoppt am bestehenden Human-Sovereignty-Gate.

## Guardrails

- keine zweite Queue-/Run-/Task-Wahrheit;
- `docs/E150/OpenTasks.md` bleibt operative SSOT;
- keine allgemeine Selbstheilung außerhalb ausdrücklich klassifizierter bounded Repairs;
- kein Auto-Merge, Deploy, Publish, Spending, Contracts/Rights oder Secret-/Security-Bypass;
- Provider-/Production-Aktivierung ist nicht Teil dieses Slices.

## SSOT-Hinweis

Diese Datei dokumentiert Implementierung und Evidence, ersetzt aber `OpenTasks.md` nicht. Solange die große OpenTasks-Datei über den aktuellen Connector nicht zuverlässig vollständig lesbar ist, erfolgt keine riskante Volltextmutation.
