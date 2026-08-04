# VOXY-AUTO-PUBLISH-READINESS-01

Stand: 2026-08-04

Issue: #571

Status: Review-Implementierung

Aktivierung: ausdrücklich **nicht** Bestandteil dieses Slices

## Zweck

Voxy soll bei wachsendem Volumen nicht dauerhaft jeden unkritischen Beitrag vollständig manuell behandeln müssen. Gleichzeitig darf Skalierung nicht durch ungeprüftes Auto-Publish erkauft werden.

Der verbindliche Zwischenzustand lautet:

```text
menschliche Freigabe verpflichtend
+ Auto-Publish-Entscheidung im Shadow Mode berechnen
+ Entscheidung, Revision und Korrekturen auditierbar speichern
+ keine automatische Ausführung
```

## Keine politische KI-Zensur

Die Qualitätsprüfung bewertet:

- Belegbarkeit von Claims durch die angegebenen Quellen
- Trennung von Tatsache, Einordnung, Hypothese und offener Frage
- Datenschutz, Persönlichkeitsrechte und rechtliche Risiken
- Sprach- und Übersetzungskonsistenz
- technische Integrität, Barrierefreiheit und Markenregeln
- sichtbare Unsicherheiten, Gegenpositionen und Quellenlücken

Sie darf keine Position deshalb blockieren, weil sie politisch unbequem, unpopulär, links, rechts oder mehrheitsfern ist. `politicalViewpointScoringAllowed` bleibt `false`.

## Start- und Reviewlogik

Geplanter Start ist der kontrollierte Voxy-Social-Regelbetrieb am 21.08.2026. Der tatsächliche Start wird erst mit `shadowStartedAt` wahr.

```text
reviewDueAt = shadowStartedAt + 30 lokale Kalendertage
```

Die Berechnung verwendet eine IANA-Zeitzone, initial `Europe/Berlin`, und erhält die lokale Uhrzeit auch über Sommer- und Winterzeitwechsel. Ein Start in der Zukunft wird blockiert.

Bei planmäßigem Start ist der Review am 20.09.2026. Verschiebt sich der reale Start, muss der Kalendertermin entsprechend verschoben werden.

## Zentraler Policy-Snapshot

Allowlist-Regeln stammen nicht aus dem zu prüfenden Beitrag. Der Kandidat referenziert nur eine `policySnapshotId`; die eigentlichen Regeln werden als zentraler, versionierter Snapshot an die Prüfung übergeben.

Der im Repository vorbereitete Snapshot bleibt bewusst auf `prepared`. Ein positives Shadow-Ergebnis ist erst möglich, wenn ein Mensch einen konkreten Snapshot mit folgenden Angaben freigibt:

- Policy-ID und Version
- `approvedBy` und `approvedAt`
- Gültigkeitszeitraum
- IANA-Zeitzone
- erlaubte Sprachen
- erlaubte Kanäle
- erlaubte risikoarme Inhaltsklassen

Ein Kandidat kann sich keine Sprache, keinen Kanal und keine Inhaltsklasse selbst erlauben.

## Zulässige Shadow-Allowlist

Nur strukturell risikoarme Klassen dürfen überhaupt ein positives Shadow-Ergebnis erhalten:

- Projektupdate
- bereits veröffentlichtes Ergebnis
- Veranstaltungs- oder Statusmeldung
- Übersetzung eines bereits freigegebenen Inhalts
- wiederkehrendes Faktenupdate aus freigegebenen Quellen

Das ist keine Veröffentlichungsfreigabe. Es bedeutet nur `would_publish` im Shadow-Protokoll.

## Sensible Klassen

Diese bleiben unabhängig von Modellscore, Reichweite oder Volumen menschlich:

- politische Analyse und Interpretation
- Breaking News
- unbestätigte Anschuldigungen
- Wahlen
- Recht
- Gesundheit
- Konflikte
- personenbezogene Inhalte

## Pflichtgates

1. zentral freigegebener und aktuell gültiger Policy-Snapshot
2. deterministische technische Prüfung
3. Quellen- und Claim-Prüfung
4. Sicherheits-, Datenschutz- und Rechtsprüfung
5. Sprach- und Übersetzungsprüfung
6. unabhängige Generator- und Reviewer-Identitäten
7. aktuelle Kill-Switch-Probe und aktueller Rollback-Drill
8. Idempotenzschlüssel und verfügbare menschliche Review-Queue
9. Risikoentscheidung mit expliziten Blockern
10. menschliche Entscheidung

Generator und Reviewer werden aus getrennten Principal-IDs geprüft. Ein vom Kandidaten geliefertes Wahrheits-Boolean reicht nicht. Ausfall oder veraltete Evidence führt fail-closed zu `would_hold` oder `would_block`.

## Unveränderliche Revisionen

Jede Bewertung ist an folgende IDs gebunden:

- `evaluationId`
- `contentId`
- `contentRevisionId`
- `contentRevisionHash`
- `policySnapshotId`
- Generator-, Reviewer-, Prompt- und Modellversionen

Die menschliche Entscheidung unterscheidet:

- `approved_as_is`
- `approved_after_changes`
- `changes_requested`
- `rejected`

Nur `approved_as_is` mit identischem Revisionshash zählt als Zustimmung zu einem positiven Shadow-Ergebnis. Eine Freigabe nach Änderungen gilt als kritischer Miss für die ursprünglich geprüfte Revision.

## Evidence nach 30 Tagen

Die Evidence wird vor der Statistik nach Revisions-ID und Revisionshash dedupliziert. Doppelte Datensätze werden ausgewiesen und verhindern einen positiven Readiness-Status.

Getrennt nach Sprache, Kanal und Inhaltsklasse werden erfasst:

- Gesamtzahl, eindeutige Revisionen und Duplikate
- Zahl menschlich geprüfter Kandidaten
- `approved_as_is` und `approved_after_changes`
- Shadow-/Mensch-Übereinstimmung
- kritische Misses: Shadow hätte veröffentlicht, Mensch stoppt oder ändert
- Overblocks: Shadow blockiert, dieselbe Revision wird unverändert genehmigt
- Korrekturen nach Fakten, Quellen, Sprache, Übersetzung, Aussprache, Recht, Datenschutz und Format
- technische Fehlerrate
- Retry-, Rollback-, Kill-Switch- und Idempotenznachweis
- verwendete Policy-, Prompt- und Modellversionen

## Segmentierte Schwellwerte

Eine gute Gesamtquote darf schlechte Teilbereiche nicht verdecken. Vor einer späteren Aktivierungsentscheidung werden Mindeststichproben und Qualitätsgrenzen separat verlangt für:

- jede erforderliche Sprache
- jeden erforderlichen Kanal
- jede erforderliche Inhaltsklasse

Pro Segment werden Übereinstimmung und technische Fehlerrate geprüft. Prozentwerte müssen zwischen `0` und `1` liegen; Stichproben und Fehlergrenzen müssen nichtnegative ganze Zahlen sein.

## Mögliche 30-Tage-Entscheidung

- Shadow Mode fortsetzen
- ausnahmebasierte Freigabe vorbereiten
- begrenzte Allowlist-Aktivierung als neuen Task vorbereiten
- No-Go und Rücksetzung

Selbst ein vollständig grüner Bericht darf nur `eligible_for_human_allowlist_decision` liefern. `autoActivationAllowed` und `globalAutoPublishAllowed` bleiben `false`.

## Technische Dateien

- `apps/web/src/features/voxyPublishing/autoPublishReadiness.ts`
- `apps/web/tests/voxy-auto-publish-readiness.contract.test.ts`
- `.github/workflows/voxy-auto-publish-readiness.yml`

## Kalender

- 21.08.2026, 11:00: Shadow Mode nach Go/No-Go starten
- 20.09.2026, 11:00: 30-Tage-Review

Beide Termine sind an den tatsächlichen Start gekoppelt und bei Verschiebung gemeinsam anzupassen.
