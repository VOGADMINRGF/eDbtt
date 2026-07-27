# I18N Go OpenTasks Intake

Datum: 2026-07-27

Status: SSOT-Intake, keine Implementierungsfreigabe

## Zweck

Dieses Dokument hält den erforderlichen Sync in den kanonischen operativen Kopf von `docs/E150/OpenTasks.md` fest. Es ist kein Ersatz für `OpenTasks.md` und darf von Codex nicht als aktive Queue gelesen werden.

## Aufzunehmende IDs

- `I18N-MESSAGE-SSOT-05`
- `I18N-PUBLIC-CORE-MIGRATION-06`
- `I18N-AUTH-ACCOUNT-ADMIN-07`
- `I18N-LEGAL-LONGFORM-08`
- `I18N-RTL-MOBILE-A11Y-09`
- `I18N-GO-CERTIFICATION-10`

Vollständiger Scope, Abhängigkeiten und Akzeptanzkriterien:

- `docs/E150/I18N_GO_PROGRAM_2026-07-27.md`

## Verbindliche Intake-Regel

1. aktuellen `main` lesen
2. offene Pull Requests und Dateikollisionen prüfen
3. ausschließlich den kanonischen operativen Kopf von `docs/E150/OpenTasks.md` ändern
4. bestehende I18N-Zeilen und Evidence nicht duplizieren
5. die neuen IDs zunächst mit den im Go-Programm definierten `blocked`-Status übernehmen
6. `I18N-PREFERENCE-SEPARATION-03` nicht allein wegen PR `#427` auf `done` setzen; der manuelle Review-Smoke bleibt erforderlich
7. `I18N-CROSS-LINGUAL-RUNTIME-04` nicht entblocken, solange Runtime-, AI-Policy- und Review-Abhängigkeiten offen sind
8. historische Abschnitte nicht löschen oder als aktive Queue interpretieren
9. Kalendertermine als Planung, nicht als Erledigungsbeleg behandeln
10. vor jedem späteren Implementierungsbranch den taskbezogenen Preflight ausführen

## Erwartetes Ergebnis des SSOT-Syncs

- die IDs `05` bis `10` erscheinen genau einmal im kanonischen operativen Kopf
- Abhängigkeiten entsprechen dem Go-Programm
- keine neue ID ist vorzeitig `codex_ready`
- das I18N-Endziel ist ausdrücklich ein objektiv zertifiziertes System-Go und nicht nur die vorhandene Foundation
- der Kalender verweist auf dieselben IDs und Statusgrenzen

Bis dieser Sync auf `main` gemergt ist, darf aus diesem Intake kein Implementierungsbranch entstehen.
