# VOXY-AUTO-PUBLISH-READINESS-01

Stand: 2026-08-04  
Issue: #571  
Status: `codex_ready` / Draft-Implementierung  
Aktivierung: ausdrücklich **nicht** Bestandteil dieses Slices

## Zweck

Voxy soll bei wachsendem Volumen nicht dauerhaft jeden unkritischen Beitrag vollständig manuell behandeln müssen. Gleichzeitig darf Skalierung nicht durch ungeprüftes Auto-Publish erkauft werden.

Der verbindliche Zwischenzustand lautet:

```text
menschliche Freigabe verpflichtend
+ Auto-Publish-Entscheidung im Shadow Mode berechnen
+ Entscheidung und Korrekturen auditierbar speichern
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
reviewDueAt = shadowStartedAt + 30 Kalendertage
```

Bei planmäßigem Start ist der Review am 20.09.2026. Verschiebt sich der reale Start, muss der Kalendertermin entsprechend verschoben werden.

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

1. deterministische technische Prüfung
2. Quellen- und Claim-Prüfung
3. Sicherheits-, Datenschutz- und Rechtsprüfung
4. Sprach- und Übersetzungsprüfung
5. Risikoentscheidung mit expliziten Blockern
6. menschliche Entscheidung

Generator und Reviewer müssen unabhängig benannt und versioniert sein. Ausfall einer Prüfinstanz führt fail-closed zu `would_hold` oder `would_block`.

## Evidence nach 30 Tagen

Getrennt nach Sprache, Kanal und Inhaltsklasse:

- Gesamtzahl und Zahl menschlich geprüfter Kandidaten
- Shadow-/Mensch-Übereinstimmung
- kritische Misses: Shadow hätte veröffentlicht, Mensch stoppt oder verlangt Änderungen
- Overblocks: Shadow blockiert, Mensch genehmigt
- Korrekturen nach Fakten, Quellen, Sprache, Übersetzung, Aussprache, Recht, Datenschutz und Format
- technische Fehlerrate
- Retry-, Duplikat-, Rollback- und Kill-Switch-Nachweis
- verwendete Policy-, Prompt- und Modellversionen

Schwellwerte werden vor der späteren Aktivierungsentscheidung ausdrücklich festgelegt. Dieser Slice erfindet keine automatische Prozentfreigabe.

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
