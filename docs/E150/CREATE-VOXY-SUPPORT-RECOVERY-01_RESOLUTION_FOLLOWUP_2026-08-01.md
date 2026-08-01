# CREATE-VOXY-SUPPORT-RECOVERY-01 — Resolution-/Mail-Follow-up

Stand: 2026-08-01

## Ausgangslage

Der ursprüngliche Review-Stand von PR #529 enthielt bereits die persistente Create-Sicherung, den kontrollierten Provider-Fallback, serverseitige Single-Flight-Claims und nutzergebundene Support-Tickets. Die Resolution-/Mail-Idempotenz war dort bewusst offen, weil der kanonische Mailvertrag aus PR #539 noch nicht auf `main` verfügbar war.

Nach dem Squash-Merge von PR #539 wurde `main` mit einem echten Zwei-Eltern-Merge in den bestehenden Charlie-Branch integriert. `docs/E150/OpenTasks.md` wurde dabei vollständig aus `main` übernommen und blieb anschließend byte-identisch zur SSOT.

## Authentifizierter Create-Vertrag

- `/create` bleibt in diesem PR vollständig loginpflichtig.
- `/api/create/save`, `/api/create/intelligent-followup` und `/api/create/link-analysis` prüfen den serverseitig verifizierten Nutzer vor Body-Parsing und vor allen Seiteneffekten.
- Draft-IDs werden serverseitig auf Existenz und Eigentum geprüft.
- Mutierende Create-Routen verwenden einen gemeinsamen Same-Origin-, `Sec-Fetch-Site`-, CSRF- und persistenten Rate-Limit-Vertrag.
- Der Create-Limiter ist Mongo-basiert, deploymentsübergreifend und fail-closed. Bei nicht verfügbarem Limiter startet kein Providerlauf und entsteht kein Ticket.
- Es gibt in diesem PR keinen anonymen Draft-, Provider- oder Gastticket-Vertrag. Ein Gastzugang bleibt ein separater P0-Slice.

## Resolution- und Benachrichtigungsvertrag

- Der Übergang auf `resolved` erzeugt idempotent genau eine Account-Nachricht und genau einen Audit-Datensatz je fachlichem Ereignis.
- Die E-Mail-Zustellung verwendet das unveränderte Objekt aus `buildSupportStatusMail()` direkt mit dem kanonischen `sendMail()`-Vertrag aus PR #539.
- Es gibt keinen selbst gebauten HTML-Pfad, keinen Renderer-Roundtrip und keinen Rückfall auf den alten Absender.
- Vor jeder Zustellung wird ein persistenter Claim mit Claim-ID, Lease, Attempt-Zähler und eindeutigem Resolution-Schlüssel gesetzt.
- Parallele Resolution-Aufrufe teilen denselben fachlichen Zustand; nur ein Aufruf kann den Dispatch-Claim erwerben.
- Eine retryable Zustellung wird nur durch ein ausdrückliches `retryResolutionDelivery: true` erneut versucht. Ein normaler Replay von `status: resolved` verbraucht keinen zweiten Versuch.
- Maximal zwei Zustellversuche sind möglich.
- Teilweise oder unbekannte Transportergebnisse sowie abgelaufene Claims wechseln in `delivery_unknown` und werden nicht automatisch erneut versendet.
- Terminale Zustände unterscheiden `delivered`, `failed_retryable`, `failed_terminal`, `delivery_unknown` und `not_applicable`.
- Das Ticket bleibt fachlich `resolved`, auch wenn die E-Mail scheitert.

## Altbestand und Replay-Sicherheit

- Vor Einführung des Resolution-Vertrags gespeicherte Tickets ohne `resolutionDelivery` werden beim Lesen deterministisch hydratisiert.
- Der eindeutige Index auf `resolutionDelivery.key` ist partiell und blockiert deshalb keine Altbestandsdokumente ohne dieses Feld.
- Ein bereits zugestelltes oder terminal fehlgeschlagenes Ticket wird durch erneutes `resolved` nicht auf `in_app_created` zurückgestuft.
- Ein temporärer Fehler beim Laden des Benutzerkontos wird nicht als dauerhaftes `not_applicable` gespeichert. Die In-App-Nachricht bleibt sichtbar und die Zustellung bleibt ausstehend beziehungsweise rekonstruierbar.

## Datenschutzgrenzen

- Tickets enthalten keinen Beitrag, Link- oder Dokumentinhalt, keine Prompts, Completions, Secrets oder rohe Providerfehler.
- Gespeichert werden ausschließlich Nutzerbindung, Route, Phase, Korrelation/Trace, normalisierte technische Diagnose, optionale Draft-ID, Status- und Zustellmetadaten sowie Zeitstempel.
- Keine externe Provider-, SMTP-, Preview- oder Production-Zustellung wurde für diesen Follow-up ausgeführt.
- `autoPublish` bleibt `false`; es entstehen keine automatischen Dossier-, Anlassraum-, Graph- oder Veröffentlichungsaktionen.

## Verifikation auf finalem technischen Head

Finaler technisch geprüfter Head vor dieser Evidence-Aktualisierung:

`5dc35e3083ff35c2d4d8f396cef678b388ac9cb4`

GitHub Web CI, Lauf `1263`:

- Web Security: grün
- Web Contracts: grün
- Web Quality: grün
- `git diff --check`: grün
- Web-PR-Critical-Guardrails: `17` Testdateien / `71` Tests grün
- Production-Guardrails: `12` Testdateien / `36` Tests grün
- fokussierte Create-Runtime-Matrix: `24` Testdateien / `194` Tests grün
- isolierte Create-Save-Sicherheitsmatrix: `2` Testdateien / `25` Tests grün
- Resolution-/Support-Vertrag allein: `13` Tests grün
- Typecheck: grün
- Lint: grün
- vollständiger Build mit `apps/web/.env.example`: grün
- Vercel Preview: grün

Die CI-Matrix enthält explizit den isolierten Security-Harness für die Create-Save-Routen, damit `server-only`- und Runtime-Grenzen ohne Absenkung der Produktionssicherheit testbar bleiben.

## SSOT und Status

- `docs/E150/OpenTasks.md` besitzt auf Branch und `main` denselben Blob:
  `5af85cb7a3f529b27e7561f184a029c98c14b098`
- Der PR bleibt Draft.
- Kein Ready-for-Review, kein Merge und keine Production-Mail wurden automatisch ausgelöst.
- Verbleibendes Gate: menschliche Preview-/Produktabnahme der Create-Fehler-, Ticket- und Account-Flächen einschließlich Desktop/Mobile, Deutsch/Englisch und Tastatur/Fokus.

## Verdict

`create_resolution_smoke_ready`
