# ROUTING-HARM-01C - Server Target Parity fuer Finalize-Fallbacks (2026-04-04)

## Scope

Abschluss-Haertung fuer `ROUTING-HARM-01` ohne neue Produktlogik:
- Serverziel (`redirectTo`) bleibt fuehrend.
- Client-Fallbacks bleiben defensiv und widersprechen dem Serverziel nicht.
- Wrapper-/Boundary-Paritaet zwischen `/create` und `/contributions/new` bleibt erhalten.

## Umgesetzt

1. `/create` Finalize-Fallback auf shared Server-Paritaet gestellt
- Datei: `apps/web/src/app/create/CreateClient.tsx`
- `afterFinalizeNavigateTo` nutzt jetzt `buildFinalizeFallbackPath({ dossierId })`.
- Damit gilt auch in `/create`: Fallback nur `/swipes` (oder dossier-gebunden `/dossier/<id>`), kein intent-basierter `/runden`-Fallback im Finalize-Pfad.

2. Contract-Test fuer Round-Setup-Fall angepasst
- Datei: `apps/web/tests/create-mode.page.test.ts`
- Der explizite `round_setup`-Entry bleibt als Orchestrator-Intent erhalten, aber Finalize-Fallback ist jetzt server-paritaetisch `/swipes`.

## Guardrails

- `redirectTo` vom Server hat Vorrang.
- Nur interne Redirects.
- Kein neuer Routing-Kanon.
- Kein Auto-Publish.

## Ergebnis

`ROUTING-HARM-01` ist als kleiner Restabschluss eingefroren:
- Serverzielfuehrung + Fallback-Paritaet sind in den produktiven Wrappern konsistent.
- Der verbleibende Scope liegt ausserhalb des Routing-Contracts (z. B. genereller UX-Polish).
