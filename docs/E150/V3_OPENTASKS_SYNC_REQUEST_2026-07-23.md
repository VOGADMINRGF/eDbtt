# OpenTasks Sync Request — 2026-07-23

## Ziel

Den operativen Kopf von `docs/E150/OpenTasks.md` nach Merge von PR `#414` auf den aktuellen Repository- und Kalenderstand synchronisieren.

## Quellen

- `docs/E150/OpenTasks.md`
- `docs/E150/V3_OPENTASKS_CALENDAR_ALIGNMENT_2026-07-23.md`
- `docs/E150/V3_SYSTEM_MULTILINGUAL_REALITY_AUDIT_2026-07-22.md`
- `docs/E150/V3_CREATE_DEBATTENSTAND_SIDECAR_SPEC_2026-07-22.md`
- aktueller `main`
- PR `#410` bis `#414`

## Verbindliche Änderung

Nur den **operativen Kopf** von `OpenTasks.md` aktualisieren. Die historischen Evidenzabschnitte darunter bleiben vollständig erhalten.

Der neue Kopf muss:

1. aktuellen Stand und aktuellen `main` nennen,
2. PR `#409` bis `#414` korrekt als erledigt einordnen,
3. den Production-E2E-Harness aus PR `#414` von einem tatsächlich ausgeführten authentifizierten Production-Smoke unterscheiden,
4. die IDs und Abhängigkeiten aus der Alignment-Datei aufnehmen,
5. Startseite, Privacy/SEO, systemweite Mehrsprachigkeit, Feed-Entwicklungslogik, Rückkehr-Digest, Civic/Event-Radar, sieben Agentenrollen und Personal Voxy einordnen,
6. die bereinigte Reihenfolge festhalten,
7. Kalendertermine als Ausführungsplanung, nicht als Beweis der Erledigung behandeln,
8. keine Secrets, Auto-Publish-, Auto-Merge- oder Fake-Runtime-Freigabe enthalten.

## Konfliktgrenzen

Nicht verändern:

- `/create`-Produktcode oder Sidecar-Spezifikation
- Feed-, Live-, Social-, Payment- oder Publishing-Runtime
- historische Evidenz unterhalb des operativen Kopfes
- bestehende Guardrails gegen Auto-Publish und ungeprüfte Merges

## Abnahme

- `git diff --check`
- ausschließlich Dokumentationsdateien verändert
- OpenTasks-Kopf und Alignment-Datei widersprechen sich nicht
- aktuelle PR-/Commit-Angaben sind korrekt
- jeder aktive Slice besitzt ID, Status, Priorität, Abhängigkeiten, Scope und Akzeptanzkriterien
