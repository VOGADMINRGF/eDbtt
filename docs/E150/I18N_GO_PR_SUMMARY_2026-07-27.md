# I18N Go Program – PR Summary

## Was geändert wird

- systemweites I18N-Go-Ziel und objektive Freigabekriterien definieren
- neue Folge-Slices `I18N-MESSAGE-SSOT-05` bis `I18N-GO-CERTIFICATION-10` zerlegen
- OpenTasks-Intake und Kalender-Mapping dokumentieren
- Evidence-Drift bei `I18N-PREFERENCE-SEPARATION-03` von Draft auf Merged korrigieren

## Warum

Die bestehende Foundation, der Surface-Audit und die Präferenztrennung reichen noch nicht für die Aussage „vollständig mehrsprachig“. Der neue Contract definiert den vollständigen Weg von der heutigen No-Go-Baseline bis zu einem reproduzierbaren System-Go.

## Wirkung

Dieser PR verändert keine Runtime und keine Produktoberfläche. Er aktiviert keine Provider, Credentials, externen Modelle oder Publishing-Pfade. Implementierung bleibt gesperrt, bis die IDs im kanonischen operativen Kopf von `docs/E150/OpenTasks.md` synchronisiert und taskbezogene Preflights erfolgreich sind.

## Validierung

- Dokumente gegen PR #420, PR #427 und den aktuellen operativen I18N-Stand abgeglichen
- Task-IDs, Status, Abhängigkeiten und Guardrails auf Widerspruchsfreiheit geprüft
- keine Änderung an Code, Runtime oder historischen OpenTasks-Abschnitten
