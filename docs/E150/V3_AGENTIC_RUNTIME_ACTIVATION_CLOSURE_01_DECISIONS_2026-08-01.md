# V3 Agentic Runtime Activation Closure – Entscheidung 2026-08-01

## Status

- Vorgeschlagene Task-ID: `V3-AGENTIC-RUNTIME-ACTIVATION-CLOSURE-01`
- Issue: #552
- Operativer Status: `dependency_wait`
- Nächster zulässiger Status: erst nach sicherem OpenTasks-SSOT-Sync und erfolgreichem Preflight höchstens `codex_ready`
- Typ: Decision-/Evidence-Slice; keine Runtime-Aktivierung

## Anlass

`main` enthält bereits die sieben kanonischen internen Produktrollen, die Agent Registry, das deterministische Task-to-Role-Routing, Safe Trace, Segmentierung, Voxy Experience Shell und einen Agentic-Civic-E2E-Pilot. Gleichzeitig bleibt die tatsächliche Runtime-Aktivierung bewusst gesperrt und mehrere Bootstrap-Statuswerte bilden den bereits materialisierten Contract-/Surface-Stand nicht mehr vollständig ab.

Dieser Slice dokumentiert den freigegebenen Rahmen für die kontrollierte Schließung dieser Lücke. Er führt keine Provider-, Publish-, Notification-, Deployment- oder Produktionsaktion aus.

## Bestehende sieben Rollen

1. `personal_voxy`
2. `intake_format`
3. `research_source`
4. `claims_factcheck`
5. `participation_moderation`
6. `dossier_briefing`
7. `governance_compliance`

Nach außen bleibt genau ein Voxy sichtbar. Intern arbeitet weiterhin ein kontrollierter `single-runner-multi-role`-Ablauf. Es entstehen keine frei laufenden parallelen Agentenprozesse.

## Betreiberentscheidung

Am 2026-08-01 wurde folgender Rahmen freigegeben:

- ein sichtbarer Voxy als konsistente Begleitung;
- sieben interne Rollen in einem seriellen Runner;
- keine autonome Parallel-Runtime;
- Preview zunächst höchstens `read_only_preview` und `review_ready_artifacts`;
- maximal zwei kontrollierte Provideraufrufe pro Nutzeraktion;
- bestehende Provider- und Modellpolicy wiederverwenden, keine freie neue Modellwahl;
- gemeinsames Kosten-, Timeout-, Retry-, Abbruch- und Idempotenzbudget;
- keine automatische Veröffentlichung, Abstimmung, Moderationslöschung oder externe Nachricht;
- Persistenz nur für bestätigte Drafts, zulässige Artefakte, Provenienz und Safe Trace;
- erster Sprachpilot: Deutsch, Englisch, Türkisch und Arabisch, einschließlich RTL-Gegenprobe;
- Pilot zunächst nur für interne beziehungsweise ausdrücklich berechtigte Preview-Nutzer;
- Production bleibt bis zu grünem Monitoring-, Incident- und Rollback-Vertrag gesperrt.

## Zielablauf

```text
Nutzeranliegen
→ Segment, Consent, Sprache und Absicht bestimmen
→ primäre und unterstützende Rollen deterministisch auflösen
→ zulässige Artefakte seriell vorbereiten
→ Quellen, Provenienz, Unsicherheit und Gegenposition erhalten
→ Governance- und Review-Gate
→ Voxy zeigt Vorschau und nächsten Schritt
→ Nutzer bestätigt eine zulässige Mutation ausdrücklich
```

## Aktivierungsstufen

Jede Rolle wird getrennt und reversibel geführt:

1. `contract_only`
2. `read_only_preview`
3. `review_ready_artifacts`
4. `confirmed_mutation`
5. `production_enabled`

Der erste Implementierungsslice darf keine Rolle pauschal auf `production_enabled` setzen.

## Sprachvertrag

- Original-, Lese-, Bedien- und Ausgabesprache bleiben getrennte Run-Kontexte.
- Originalinhalte und Originalquellen bleiben erhalten.
- Übersetzung ist eine Lesefassung und niemals Evidenz.
- Review- oder Wahrheitsstatus wird nicht aus einem Übersetzungsstatus abgeleitet.
- Unbekannte Sprachen fallen kontrolliert auf die definierte Bedien-/Fallbacksprache zurück.
- Türkisch und Arabisch gehören zum ersten Pilot; Arabisch benötigt RTL-, Fokus- und Layout-Gegenproben.
- Kein Publish oder fachlicher Statuswechsel allein durch Übersetzung.

## Rollenbezogene erste Grenze

- Personal Voxy: optionale, consent-gated Kontextbegleitung.
- Intake & Format: reviewfähige Anlass-, Themen- und Formatkandidaten.
- Research & Source: nur freigegebene Quellen- und Providerpfade; Provenienz und Lücken bleiben sichtbar.
- Claims & Factcheck: Kandidaten und Prüfbedarf, keine endgültige Wahrheitsinstanz.
- Participation & Moderation: Vorschläge und Cluster, keine automatische Entfernung rechtmäßiger Inhalte.
- Dossier & Briefing: Drafts und Briefings, kein Publish.
- Governance & Compliance: fail-closed Gate, keine Rechteausweitung.

## Harte Grenzen

- kein Auto-Publish;
- kein autonomes Abstimmen oder Handeln für Nutzer;
- keine automatische Behörden-, Partner- oder Realmail-Nachricht;
- keine parallelen Stores oder Graph-Wahrheiten;
- keine politische Profilbildung ohne ausdrücklichen Consent;
- keine Übersetzung als Evidenz;
- keine Prompt-, Completion-, Chain-of-Thought-, Secret- oder unnötige personenbezogene Rohdaten im Safe Trace;
- keine unbegrenzten oder versteckten kostenpflichtigen Wiederholungen;
- keine Produktionsaktivierung ohne Monitoring, Incident und Rollback;
- kein Deployment in diesem Slice.

## Abhängigkeiten und Kollisionsreihenfolge

Vor einem Implementierungsbranch müssen insbesondere seriell geklärt sein:

1. PR #520 – gemeinsame Studio-, QR-, Auth- und Navigationsflächen synchronisieren beziehungsweise abschließen.
2. PR #536 – Admin-Region-Hauptfläche synchronisieren und das manuelle Produktgate abschließen.
3. PR #527 – Start-/Voxy-Fläche synchronisieren und den fremden `OpenTasks.md`-Diff vollständig auf die aktuelle Main-SSOT zurückführen.
4. `docs/E150/OpenTasks.md` durch genau einen SSOT-Schreiber aktualisieren.
5. Verpflichtenden Preflight erfolgreich ausführen.

Bereits gemergte Grundlagen:

- PR #529 – Create-/Support-Recovery und Resolution-Idempotenz;
- PR #539 – kanonischer Mailvertrag, ohne Realmail-Freigabe;
- Agent Registry, Safe Trace, Segment Contract, Voxy Experience Shell und Agentic-Civic-E2E-Pilot auf `main`.

## Vorgeschlagener OpenTasks-Eintrag

Der folgende Inhalt ist beim nächsten sicheren Serialisierungspunkt in den kanonischen operativen Kopf aufzunehmen:

| ID | Status | Prio | Abhängigkeiten | Scope / Akzeptanz |
| --- | --- | --- | --- | --- |
| `V3-AGENTIC-RUNTIME-ACTIVATION-CLOSURE-01` | `dependency_wait` | P0 | #520, #536, #527; Agent Registry; Safe Trace; Segment Contract; Voxy Experience Shell; Create-/Support-Vertrag #529; Mail-Canon #539; Monitoring/Incident/Rollback vor Production | Bestehende sieben Rollen in einem seriellen `single-runner-multi-role`-Ablauf wahrheitsgemäß schließen; Capability-Gates statt globalem Runtime-Boolean; DE/EN/TR/AR-Sprachkontext end-to-end; höchstens zwei kontrollierte Provideraufrufe; Review und ausdrückliche Bestätigung vor Mutation; kein Auto-Publish, keine externe Nachricht, keine parallele Persistenz; fokussierte Tests, Typecheck, Lint, Build, `git diff --check`, manueller Preview-Smoke und externer Browser-E2E vor Beta. Evidence: Issue #552 und dieses Dokument. |

Nach Abschluss der genannten Branch-/SSOT-Abhängigkeiten darf der Status kontrolliert auf `codex_ready` wechseln.

## Preflight

Erst nach dem OpenTasks-Sync ausführen:

```bash
node scripts/codex-task-preflight.mjs \
  V3-AGENTIC-RUNTIME-ACTIVATION-CLOSURE-01
```

Erforderliches Ergebnis vor Branch-/Implementierungsstart:

```json
{
  "taskId": "V3-AGENTIC-RUNTIME-ACTIVATION-CLOSURE-01",
  "status": "codex_ready",
  "executable": true,
  "branchCreationAllowed": true
}
```

Bis dieses Ergebnis real vorliegt, wird kein erfolgreicher Preflight behauptet.

## Test- und Evidence-Plan für die spätere Implementierung

- Registry-/Bootstrap-/OpenTasks-Konsistenz;
- deterministische Rollenauflösung und unveränderliche denied actions;
- gemeinsames Providerbudget, Timeout, Abbruch, Retry und Idempotenz;
- DE/EN/TR/AR einschließlich RTL und sprachreiner Fehlerzustände;
- Original-/Lese-/Bedien-/Ausgabesprache bleiben getrennt;
- `translationIsNotEvidence` bleibt unveränderlich;
- keine Prompts, Completions, Secrets oder unnötigen personenbezogenen Rohdaten im Safe Trace;
- keine fachliche Mutation vor Review und ausdrücklicher Bestätigung;
- keine externe Nachricht, kein Publish und kein Deploy;
- fokussierte Tests, Typecheck, Lint, Build und `git diff --check`;
- manueller Desktop-/Mobile-/Keyboard-/Recovery-Smoke;
- externer Browser-E2E vor Beta;
- Monitoring-/Incident-/Rollback-Evidence vor Production.

## Ergebnis dieses Decision-Slices

Die Betreiberentscheidung ist dokumentiert und reversibel. Runtime, Provider, Persistenz, Veröffentlichung, externe Nachrichten, Entitlements und Production bleiben unverändert gesperrt. Der nächste erlaubte Schritt ist der serialisierte OpenTasks-SSOT-Sync, nicht die Implementierung.