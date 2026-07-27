# I18N Go: systemweite Lokalisierung bis objektiver Freigabe

## Ausgangslage

Die I18N-Foundation und der Surface-Audit sind abgeschlossen. UI-, Lese-, Ausgabe- und Originalpräferenz wurden technisch getrennt. Dennoch ist eDebatte noch nicht systemweit UI-lokalisiert und darf aktuell nicht als vollständig mehrsprachig bezeichnet werden.

## Verbindliches Ziel

Aus dem aktuellen No-Go wird ein objektiv belegtes I18N Go für:

- öffentliche Kernflächen
- Auth, Account und Settings
- Organisation, Behörden, Admin und Review
- Recht, Consent und Longform
- RTL, nichtlateinische Schriften, Mobile und Accessibility
- sprachübergreifende Quellen-, Inhalts- und Ausgaberuntime

## Kanonischer Contract

`docs/E150/I18N_GO_PROGRAM_2026-07-27.md`

## Vorgesehene Folge-IDs

- `I18N-MESSAGE-SSOT-05`
- `I18N-PUBLIC-CORE-MIGRATION-06`
- `I18N-AUTH-ACCOUNT-ADMIN-07`
- `I18N-LEGAL-LONGFORM-08`
- `I18N-RTL-MOBILE-A11Y-09`
- `I18N-GO-CERTIFICATION-10`

## Intake-Grenze

Dieses Issue ist nicht selbst ausführbar. Vor jeder Implementierung müssen die IDs im kanonischen operativen Kopf von `docs/E150/OpenTasks.md` stehen und der jeweilige Preflight auf sauberem `main` erfolgreich sein.

`I18N-PREFERENCE-SEPARATION-03` bleibt bis zur manuellen Review-Abnahme auf `review`. `I18N-CROSS-LINGUAL-RUNTIME-04` bleibt bis zur Erfüllung seiner Runtime-, AI-Policy-, Datenschutz-, Draft- und Review-Abhängigkeiten `blocked`.

## Guardrails

- kein Auto-Publish
- kein ungeprüftes Cross-lingual Merge
- Original bleibt erhalten
- keine ungeprüfte automatische Rechtsübersetzung
- keine falsche Vollständigkeitsbehauptung im Sprachumschalter
- keine Provider-, Credential-, Budget- oder Datenverarbeitungsfreigabe durch dieses Issue
