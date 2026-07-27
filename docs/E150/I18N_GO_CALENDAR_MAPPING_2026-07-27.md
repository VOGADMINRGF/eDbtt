# I18N Go Kalender-Mapping

Datum: 2026-07-27

Status: Planungsbezug; Kalender ist kein Erledigungsbeweis

## Bestehende Blöcke

### 2026-08-11, 13:00–15:00

Task: `I18N-PREFERENCE-SEPARATION-03`

Zweck:

- Review-Closure statt erneuter Implementierung
- Desktop-/Mobile-Smoke für Header, Settings und Account
- Reload-/Persistenzprüfung
- Nachweis der Trennung von UI-, Lese-, Ausgabe- und Originalpräferenz
- nur bei vollständiger Abnahme Statusvorschlag `done`

### 2026-08-12, 13:00–15:00

Task: `I18N-CROSS-LINGUAL-RUNTIME-04`

Zweck:

- Readiness- und Gate-Review
- Runtime-, AI-Policy-, Datenschutz-, Kosten-, Draft- und Review-Abhängigkeiten prüfen
- keine externe Übersetzungsruntime, Credentials oder Provider aktivieren
- bei offenen Blockern Status `blocked` beibehalten

## Angelegte Folgeblöcke

Die folgenden Termine sind als blockierte Planung angelegt. Sie werden erst zu Implementierungsblöcken, wenn die jeweilige ID im kanonischen operativen Kopf von `docs/E150/OpenTasks.md` vorhanden ist und der Preflight auf sauberem `main` erfolgreich war.

| Datum | Task | Zweck | Startbedingung |
| --- | --- | --- | --- |
| 2026-08-19, 13:00–15:00 | `I18N-MESSAGE-SSOT-05` | Capability-Registry, Message-Loader, Fallback- und CI-Vertrag | `I18N-PREFERENCE-SEPARATION-03` done |
| 2026-08-20, 13:00–15:00 | `I18N-PUBLIC-CORE-MIGRATION-06` | öffentliche Kernflächen migrieren | `I18N-MESSAGE-SSOT-05` done |
| 2026-08-21, 13:00–15:00 | `I18N-AUTH-ACCOUNT-ADMIN-07` | private und operative Kernflächen migrieren | `I18N-MESSAGE-SSOT-05` done |
| 2026-08-25, 13:00–15:00 | `I18N-LEGAL-LONGFORM-08` | geprüfte Rechts- und Longform-Fassungen | Message-SSOT done und Legal-Gate erfüllt |
| 2026-08-26, 13:00–15:00 | `I18N-RTL-MOBILE-A11Y-09` | RTL, Mobile, Tastatur, Screenreader, Locale-Formate | Migrationen 06–08 ausreichend geschlossen |
| 2026-09-04, 13:00–15:00 | `I18N-GO-CERTIFICATION-10` | produktive Systemabnahme und Capability-Freigabe | alle I18N- und Production-Gates erfüllt |

## Parallelitätsregel

`I18N-PUBLIC-CORE-MIGRATION-06`, `I18N-AUTH-ACCOUNT-ADMIN-07` und `I18N-LEGAL-LONGFORM-08` können nach abgeschlossenem Message-SSOT in getrennten PRs parallel laufen, sofern offene PRs und Dateikollisionen vorher geprüft wurden.

`I18N-CROSS-LINGUAL-RUNTIME-04` kann technisch parallel zu den Oberflächenmigrationen bearbeitet werden, bleibt aber von Runtime-, AI-Policy-, Datenschutz- und Review-Gates abhängig.

## Kalenderregel

- keine Kalenderbeschreibung darf einen blockierten Task als ausführbar darstellen
- jeder Implementierungsblock nennt Task-ID, Status, Abhängigkeiten, Scope und Abnahme
- ein Termin setzt weder Task-Status noch Dependency automatisch auf erledigt
- Manual Gates werden nicht durch Codex oder Kalendertermine entschieden
- kein Auto-Publish, kein ungeprüftes Cross-lingual Merge und keine Provider-Aktivierung
