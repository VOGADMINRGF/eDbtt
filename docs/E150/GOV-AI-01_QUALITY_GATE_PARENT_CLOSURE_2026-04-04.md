# GOV-AI-01 - Quality Gate Parent Closure (2026-04-04)

## Scope

Kleiner Abschluss-Slice fuer den verbleibenden `GOV-AI-01`-Restscope:
- keine neue KI-Architektur
- keine neue CTA-/Match-/Surface-Logik
- keine neue Produktentscheidung
- nur Abschluss-Haertung fuer Pflicht-Qualitaetsschicht in Analyze-/Finalize-Kanten

## Ist-Stand vor Slice

Bereits gesetzt:
- `/create` als kanonischer Intake-Orchestrator
- Analyze-/Envelope-/Boundary-Contract aktiv
- no-auto-publish/no-silent-merge Guardrails aktiv
- Routing-/Wrapper-Paritaet aus `ROUTING-HARM-01` abgeschlossen
- Parent `PR-AI-CREATE-01` abgeschlossen

Verbleibende kleine Restkante:
- Abschluss-Reife von GOV-AI-01 sollte testseitig explizit einfrieren, dass
  - duenne/ungueltige Analyze-Inputs nicht still durchrutschen,
  - und Finalize ohne Analyze-Claims nicht akzeptiert wird.

## Umgesetzt

1. Analyze-Parser-Restkante testseitig gehaertet
- Datei: `apps/web/src/app/api/contributions/analyze/parseAnalyzeRequest.test.ts`
- Neue Regressionstests:
  - reject thin input (`min. 10 Zeichen`)
  - reject invalid `anlassraumId` (`invalid_anlassraum_id`)

2. Finalize-Qualitaetsbindung testseitig eingefroren
- Datei: `apps/web/tests/create-mode.finalize.route.test.ts`
- Neuer Test:
  - Finalize mit selektierten IDs, aber ohne analysierbare Claims im Draft -> `400 no_claims_selected`

## Guardrails (unveraendert und explizit abgesichert)

- Freistart bleibt erhalten.
- Pflicht-Qualitaetsschicht bleibt vor weiterem Routing verbindlich.
- Rueckfragen/Fehlerpfade bleiben explizit statt stiller Fehlzuordnung.
- Kein Auto-Publish.
- Keine implizite Legacy-Rueckkehr.

## Ergebnis

`GOV-AI-01` ist als Parent belastbar abgeschlossen:
- Akzeptanzkriterien sind im bestehenden Produktfluss vorhanden und durch gezielte Regressionstests eingefroren.
- Verbleibende AI-Folgethemen liegen ausserhalb dieses Abschluss-Slices (`GOV-AI-05/06/07` etc.).
