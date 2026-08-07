# Codex Brief – V3-AGENTIC-RUNTIME-ACTIVATION-CLOSURE-01

## Ausführungsstatus

`dependency_wait`

Dieser Brief ist vorbereitet, aber noch nicht ausführbar. Kein Implementierungsbranch und kein neuer PR, solange der Task nicht im kanonischen operativen Kopf von `docs/E150/OpenTasks.md` exakt `codex_ready` ist und der Preflight erfolgreich läuft.

## Kanonische Referenzen

- `AGENTS.md`
- `docs/E150/CODEX_RUN_PACK_CONTRACT.md`
- `docs/E150/OpenTasks.md`
- `docs/E150/V3_AGENTIC_RUNTIME_ACTIVATION_CLOSURE_01_DECISIONS_2026-08-01.md`
- Issue #552
- `.codex/agents/registry.json`
- `.codex/agents/bootstrap.json`
- `apps/web/src/features/agenticRuntime/agentRegistryBootstrapContract.ts`
- `apps/web/src/features/agenticRuntime/agentRunArtifactSafeTraceContract.ts`
- `apps/web/src/features/agenticRuntime/agenticCivicE2EPilotContract.ts`
- `apps/web/src/features/voxy/voxyExperienceShellContract.ts`

## Vor Start zwingend prüfen

1. Arbeitsbaum sauber und auf aktuellem `origin/main`.
2. PRs #520, #536 und #527 auf Datei-, Shell-, Voxy-, Navigation-, Admin- und SSOT-Kollisionen prüfen.
3. Task im OpenTasks-Kopf vorhanden und exakt `codex_ready`.
4. Preflight:

```bash
node scripts/codex-task-preflight.mjs \
  V3-AGENTIC-RUNTIME-ACTIVATION-CLOSURE-01
```

5. Keinen Branch erstellen, wenn `executable` oder `branchCreationAllowed` nicht `true` sind.

## Ziel

Die vorhandenen sieben internen Produktrollen werden in einem kontrollierten, seriellen `single-runner-multi-role`-Ablauf geschlossen. Nach außen bleibt genau ein Voxy sichtbar. Bestehende Contracts, Stores, Review-, Dossier-, Create-, Source-, Claim-, Participation- und Governance-Wahrheiten werden wiederverwendet.

## Erster zulässiger Implementierungsschnitt

- Registry-, Bootstrap-, OpenTasks- und Evidence-Wahrheit abgleichen.
- Veraltete Status- und Abhängigkeitsannahmen korrigieren, ohne erledigte Slices neu zu bauen.
- Globales `runtimeActivationAllowed` durch eine typsichere, fail-closed Capability-Matrix vorbereiten.
- Stufen: `contract_only`, `read_only_preview`, `review_ready_artifacts`, `confirmed_mutation`, `production_enabled`.
- Im ersten Slice höchstens `read_only_preview` und `review_ready_artifacts` aktivierbar.
- Sprache als getrennten Original-/Lese-/Bedien-/Ausgabekontext durch den Run führen.
- Deutsch, Englisch, Türkisch und Arabisch contract-seitig sichern; Arabisch mit RTL-Gegenprobe.
- Gemeinsames Budget, Timeout, Retry, Abbruch und Idempotenz; höchstens zwei kontrollierte Provideraufrufe.
- Safe Trace ohne Prompts, Completions, Chain-of-Thought, Secrets oder unnötige personenbezogene Rohdaten.

## Harte Grenzen

- kein Auto-Publish;
- kein Auto-Vote;
- keine automatische rechtmäßige Inhaltsentfernung;
- keine Realmail-, Behörden- oder Partnernachricht;
- kein Deployment;
- keine Production-Aktivierung;
- keine parallelen Agentenprozesse;
- keine parallelen Stores oder Graph-Wahrheiten;
- keine freie neue Provider-/Modellpolicy;
- keine Übersetzung als Evidenz;
- keine Persistenz unbestätigter politischer Profile;
- keine Rechte- oder Entitlement-Ausweitung.

## Erwartete Tests

- Registry-/Bootstrap-/OpenTasks-Konsistenz;
- Rollenauflösung und denied actions;
- Capability-Matrix fail-closed;
- maximal zwei kontrollierte Provideraufrufe;
- Timeout, Abbruch, Retry und Idempotenz;
- DE/EN/TR/AR und RTL;
- getrennte Sprachrollen;
- `translationIsNotEvidence` unveränderlich;
- Safe Trace ohne sensible Rohdaten;
- keine Mutation vor Review und Bestätigung;
- kein Publish, keine externe Nachricht, kein Deploy;
- fokussierte Tests, Typecheck, Lint, Build und `git diff --check`.

## Manuelle Gates

- Desktop, Mobile, Tastatur, Fokus und Recovery auf Preview;
- externer Browser-E2E vor Beta;
- Monitoring, Incident und Rollback vor Production.

## Abschlussgrenze

Der Implementierungs-PR bleibt Draft und höchstens auf `review`, bis die definierten manuellen Gates real erfüllt sind. Kein Merge und kein Ready ohne ausdrückliche Betreiberfreigabe.