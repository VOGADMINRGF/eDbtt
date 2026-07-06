# V3 Canonical Completion Readiness Guardrails

Stand: 2026-07-06

## Zweck

Diese Datei ergaenzt `docs/E150/V3_CANONICAL_LANGUAGE_BRIDGE_RUNTIME_BACKLOG_2026-07-06.md` um die letzte Meta-Ebene: Abschlussfaehigkeit, Betriebsreife, Rollout, Sicherheit, Messbarkeit und saubere Grenzen.

Sie ist bewusst **keine neue Feature-Wunschliste**. Sie definiert, wann eine V3-Capability wirklich als fachlich abschliessbar gelten darf und wann nur ein sichtbarer Zwischenstand vorliegt.

## Grundsatz 1: Definition of Done fuer jede V3-Capability

Eine V3-Capability gilt erst als fachlich fertig, wenn mindestens diese Ebenen vorhanden sind:

- kanonische Doku / OpenTasks-Verankerung
- typed Contract oder begruendete Bridge zu bestehendem Contract
- relevante Contract-/Guardrail-Tests
- Admin- oder Review-Sicht, sofern die Capability operatorisch relevant ist
- Public-/User-Sicht, sofern die Capability nutzerseitig sichtbar wird
- Reviewpfad und Rollenbezug
- Fehlerstatus und Blockerstatus
- Recovery-/Retry- oder manuelle Korrekturmoeglichkeit
- Audit-/Provenance-Hinweis
- klare Non-Goals und Stop-Regeln
- keine falsche Readiness-Hochstufung

Kanonischer Satz:

> Eine Capability ist nicht fertig, nur weil sie sichtbar ist. Fertig ist sie erst, wenn Doku, Contract, Test, Review, Fehlerstatus, Rollout-Grenze und Audit zusammenpassen.

## Grundsatz 2: Preview ist nicht Runtime, Draft ist nicht Publish

Diese Unterscheidung muss repo-weit erhalten bleiben.

Nicht gleichsetzen:

- Preview ≠ Runtime
- Suggestion ≠ Entscheidung
- Draft ≠ Publish
- Publish-ready ≠ Published
- Handoff ≠ Vollzug
- Review-ready ≠ Approved
- Source hint ≠ verifizierte Quelle
- Trust hint ≠ Faktencheck-Siegel
- planned_handoff ≠ persistierte Runtime-Wahrheit
- operational_basic ≠ endstate_ready

Kanonischer Satz:

> Sichtbarkeit ist kein Endstand. Preview ist kein Runtime-Pfad. Draft ist kein Publish. Handoff ist kein Vollzug. Suggestion ist keine Entscheidung.

## Grundsatz 3: Demo-Journey als Abnahmepfad

Jede V3-Automation muss an einer realistischen Demo-/User-Journey pruefbar sein.

Mindestjourney:

```text
User schreibt etwas
-> Voxy/eDebatte ordnet ein
-> Sprache, Original und Uebersetzung bleiben sauber getrennt
-> Aussagen, Fragen und Quellenlage werden sichtbar
-> Unsicherheiten und offene Punkte werden markiert
-> passendes Beteiligungsformat wird vorgeschlagen
-> Vorschau entsteht
-> Review-ready Zustand entsteht
-> Publish-ready / Activation-ready Zustand entsteht
-> One-click Aktivierung ist erst nach Review moeglich
-> User sieht, was aus dem Beitrag wurde
```

Akzeptanz:

- Kein Beitrag verschwindet ohne Rueckmeldung.
- Kein oeffentlicher Output entsteht ohne passenden Review.
- Keine technische Runtime-Wahrheit wird oeffentlich als fertiger Status verkauft.
- Jeder Schritt zeigt, was vorbereitet wurde und was noch fehlt.

## Grundsatz 4: Rollen-, Rechte- und Organisationsgrenzen

Nicht jeder Nutzer darf jeden Schritt ausloesen oder freigeben.

Mindestens zu unterscheiden:

- Gast / nicht eingeloggter Nutzer
- eingeloggter Nutzer
- Beitragsersteller
- Moderator
- Redaktion / Operator
- Organisation / Kommune / Mandant
- Admin
- Superadmin
- Kosten-/Provider-verantwortliche Rolle

Regeln:

- One-click Publish/Activate setzt passende Rolle plus passenden Reviewstatus voraus.
- Organisations- oder kommunale Sichtbarkeit braucht Organisations-/Mandantenfreigabe.
- Moderations- und Abuse-Faelle brauchen Moderationsreview.
- Kostenrelevante Schritte koennen eigene Freigabe brauchen.
- Public Output darf nicht allein aus technischer Fertigstellung folgen.

## Grundsatz 5: Entitlement, Paywall, Credits und Kontingente

Automatisierung darf nur so weit laufen, wie Rolle, Paket, Credits und Reviewstatus es erlauben.

Zu klaeren / spaeter zu operationalisieren:

- Was ist frei nutzbar?
- Was braucht Login?
- Was ist Demo-only?
- Was ist hinter Paywall?
- Was verbraucht Credits?
- Was braucht Organisations-/Admin-Plan?
- Welche Providerkosten duerfen automatisch vorbereitet werden?
- Wann wird nur ein Vorschlag gezeigt statt ein Lauf gestartet?

Kanonischer Satz:

> Auto-Prepare darf attraktiv wirken, aber kosten- und paketpflichtige Schritte brauchen klare Entitlement-, Credit- und Review-Grenzen.

## Grundsatz 6: Public Safety, Abuse, PII und sensible Inhalte

Public-ready ist nicht nur technisch publish-ready.

Zusaetzlich zu pruefen:

- personenbezogene Daten / PII
- Minderjaehrige
- Beleidigung, Hass, Hetze, Drohung
- sensible politische Inhalte
- Gesundheits-, Rechts- oder Finanzbehauptungen
- private Anschuldigungen
- manipulierte oder unklare Quellen
- koordinierte Kampagnen / Spam
- Standortdaten oder identifizierende Details
- Bild-, Voice- oder Avatarrechte

Regeln:

- Sensitive Inhalte brauchen erhoehten Review.
- Voxy darf sensible Zuspitzung nicht ungeprueft als Fakt ausgeben.
- Public Output darf bei PII-/Abuse-/Safety-Blockern nicht aktivierbar sein.
- User-facing soll klar sagen, dass vor Aktivierung noch Schutz-/Pruefschritte offen sind.

## Grundsatz 7: Versionierung und Audit von KI-Ableitungen

Jede KI-Ableitung muss nachvollziehbar bleiben.

Mindestens zu dokumentieren / spaeter technisch abzubilden:

- urspruengliche Eingabe
- Zeitpunkt der Verarbeitung
- genutzte Sprachebenen
- Quellenstand / SourcePack
- Provider/Modell, sofern reale Runtime-Wahrheit vorhanden ist
- Prompt-/Run-Referenz oder RunReceipt, sofern vorhanden
- erzeugte Ableitung: Zusammenfassung, Einordnung, Formatvorschlag, Script, Draft
- Reviewentscheidung
- Reviewrolle
- Veraenderungen nach Review
- final aktivierte/veroeffentlichte Version

Kanonischer Satz:

> Jede KI-Ableitung braucht Version, Herkunft, Quellenstand und Reviewhistorie. Ohne diese Provenance bleibt sie Draft oder Vorschlag.

## Grundsatz 8: Feature-Flags, Admin-Gates und Rollout-Grenzen

Neue V3-Funktionen duerfen vorbereitet, aber nicht unkontrolliert oeffentlich aktiviert werden.

Regeln:

- Neue Public-Flows brauchen Feature-Flag oder Admin-Gate.
- Beta-/Demo-Flows muessen als solche erkennbar sein.
- Provider-, Rendering-, DeepSearch- und Publishing-Pfade brauchen separate Aktivierung.
- Public Routes duerfen keine internen Debug-/Runtime-Begriffe leaken.
- Rollback oder Deaktivierung muss moeglich bleiben.

Kanonischer Satz:

> V3 darf sichtbar wachsen, aber neue oeffentliche Wirkung braucht Rollout-Gate, Review-Gate und deaktivierbaren Pfad.

## Grundsatz 9: Migration, Altbestand und Terminologie

Public Copy darf modernisiert werden, aber Runtime- und Datenmodell-Migrationen brauchen eigene Pfade.

Regeln:

- Alte Begriffe nicht blind loeschen.
- Interne Begriffe wie Dossier koennen erhalten bleiben, waehrend Public Copy `Debatte & Argumente` nutzt.
- Bestehende URLs, Slugs und Daten duerfen nicht unabsichtlich brechen.
- Neue Terminologie braucht Mapping, nicht Hard-Cut.
- Migrationen brauchen Tests oder zumindest dokumentierte Nicht-Ziele.

Kanonischer Satz:

> Public-Sprache darf schneller modernisiert werden als Runtime-Modelle. Datenmodell- und URL-Migrationen brauchen explizite Migrationspfade.

## Grundsatz 10: Messbarkeit und KPI-Faehigkeit

V3 ist erst produktiv, wenn Fortschritt, Blocker, Kosten und Beteiligung sichtbar werden.

Zu messen / spaeter operatorisch sichtbar zu machen:

- wie viele Eingaben eingehen
- wie viele eingeordnet werden
- wie viele Formatvorschlaege entstehen
- welche Formate vorgeschlagen werden
- wie viele Outputs `review_ready` erreichen
- wie viele `publish_ready` erreichen
- wie viele nach Review aktiviert/veroeffentlicht werden
- wo Nutzer abbrechen
- welche Review-Blocker haeufig sind
- welche Quellen-/Trust-Luecken haeufig sind
- welche Providerkosten entstehen
- welche Automationen fehlschlagen
- wie viele Beitraege zu echter Beteiligung fuehren

Kanonischer Satz:

> V3-Erfolg misst sich nicht an erzeugten Vorschlaegen, sondern an nachvollziehbar vorbereiteten, geprueften und sinnvoll aktivierten Beteiligungspfaden.

## Grundsatz 11: Abschlussfaehigkeit statt endloser Zwischenstand

Jede neue V3-Aufgabe braucht einen Abschlussmodus:

- Was ist der kleinste ehrliche Endstand?
- Was ist bewusst nur docs-only?
- Was ist contract-only?
- Was ist operational_basic?
- Was ist endstate_ready?
- Welche Folgepfade bleiben offen?
- Welche Tests belegen den Stand?
- Was darf oeffentlich sichtbar sein?
- Was bleibt intern/admin?

Kanonischer Satz:

> Keine halbe Zwischenloesung gilt als final. Jeder Slice muss sagen, ob er Doku, Contract, Preview, Runtime, Review oder Public-Endstand liefert.

## Einbindung in den morgigen Codex-Autopilot

Der Codex-Autopilot soll diese Datei als zweite kanonische Referenz nutzen:

- `docs/E150/V3_CANONICAL_LANGUAGE_BRIDGE_RUNTIME_BACKLOG_2026-07-06.md`
- `docs/E150/V3_CANONICAL_COMPLETION_READINESS_GUARDRAILS_2026-07-06.md`

Ergaenzende Anweisung fuer den Autopilot:

```text
Nutze zusaetzlich docs/E150/V3_CANONICAL_COMPLETION_READINESS_GUARDRAILS_2026-07-06.md als Meta-Guardrail.
Jede neu angelegte oder aktualisierte V3-Task muss klar unterscheiden:
- docs_only
- contract_only
- preview_only
- operational_basic
- endstate_ready

Stufe nichts hoch, wenn Tests, Reviewpfad, Rollout-Gate, Fehlerstatus oder Provenance fehlen.
Halte in OpenTasks fest, welche Capabilities zwar sichtbar, aber noch nicht abgeschlossen sind.
```

## Nicht-Ziel dieser Datei

- keine neue Runtime
- keine neue UI
- keine neuen Provider
- keine neuen Tests
- keine OpenTasks-Aenderung
- keine ProductionReadiness-Hochstufung

Diese Datei manifestiert nur die Abschluss- und Betriebsreife-Regeln, damit Codex morgen nicht nur Features sortiert, sondern auch Abschlussfaehigkeit und Grenzen sauber fuehrt.
