# QR-PUBLIC-ENTRY-02

Datum: 2026-07-25  
Produktkorrektur: 2026-07-29  
OpenTasks-Status: done  
Ursprüngliche Evidence: PR #425  
Integrations- und Produktkorrektur: Draft-PR #520

## Ziel

Einen sicheren, kanonischen QR-Unterbau bereitstellen, alte QR-Routen kontrolliert weiterführen und unsichere Ziele fail-closed blockieren, ohne einen zweiten Inhalts-, Beteiligungs- oder Veröffentlichungsfluss zu erzeugen.

## Produktkorrektur 2026-07-29

Die ursprüngliche Bezeichnung `/qr-studio` vermischte drei verschiedene Aufgaben:

1. öffentliche Teilnahme,
2. QR-/Zielvalidierung,
3. Betreiber-, Event- und Verteilungsarbeit.

Der verbindliche Surface-Contract lautet deshalb jetzt:

- `/studio` ist die Betreiber-, Event-, Live-, Zugangs-, Verteilungs- und Auswertungsfläche,
- `/qr/[code]` ist der direkte öffentliche Einstieg für codebasierte Beteiligung,
- ein QR für Anlassraum, Runde, Dossier, Beteiligungsraum oder Begleitformat enthält das kanonische öffentliche Ziel direkt,
- `/qr-studio` bleibt ausschließlich als kompatible Redirect-Route auf `/studio` bestehen,
- `/qrcodegenerator` und `/qrcodewizard` bleiben kontrollierte Legacy-Einstiege und dürfen keinen zweiten QR-Kanon eröffnen.

## Kanonischer Produktfluss

```text
/create
→ Inhalt verstehen und strukturieren

/anlassraum bzw. /runden
→ Anlass, Kontext, Region, Beteiligte und Ziel halten

/dossier
→ Quellen, Positionen, Claims, Evidenzen und offene Fragen ordnen

/runden bzw. Beteiligungsraum
→ konkrete Beteiligungsphase vorbereiten und freigeben

/studio
→ Zugang, QR, Branding-Handoff, Event, Live und Auswertung steuern

/qr/[code] oder kanonisches Public-Ziel
→ direkte Teilnahme ohne erneute Inhaltseingabe
```

## Studio-Semantik

`/studio` ist kein eigenständiger Inhaltseditor und keine parallele Runtime.

Die Fläche unterstützt drei Einsatzarten auf demselben Beteiligungsgegenstand:

- **öffentlich**: Bürgerdialoge, Kampagnen und offene Runden,
- **intern**: Unternehmen, Vereine, Verbände, Teams und Gremien,
- **Event & live**: Workshops, Townhalls, Mitgliederversammlungen, Konferenzen und moderierte Sessions.

Rollen, Einladungen, Branding, Zugangspolitik, Moderation, Ergebnisfreigabe und Reporting bleiben an bestehende Organisations-, Runden-, Beteiligungs- und Live-Kontexte gebunden. Dieser Slice führt dafür keine neue Persistenz ein.

## Sicherheitscontract

Erlaubt bleiben:

- interne öffentliche Pfade wie `/dossier/...`, `/topic/...`, `/anlassraum?...`, `/runden...`, `/beteiligung...` und `/live...`,
- freigegebene HTTPS-Ziele auf bekannten eDebatte-Hosts.

Blockiert werden:

- `javascript:`-, `data:`-, `file:`- und `vbscript:`-Ziele,
- Netzwerkpfade wie `//example.com`,
- fremde Hosts,
- URLs mit Zugangsdaten,
- sensible Query-Parameter und Identifikatoren,
- Admin-, API- und interne Systempfade.

## Caller-Inventar

- `content_release_workbench`
- `public_topic_page`
- `organization_dashboard`
- `legacy_qrcodegenerator`
- `legacy_qrcodewizard`
- `qr_studio` als technischer historischer Caller-Key

Der Caller-Key ist technische Kompatibilität und keine Freigabe für die alte öffentliche Produktbezeichnung.

## Guardrails

- kein Open Redirect,
- genau ein Betreiber-Studio unter `/studio`,
- direkte öffentliche Teilnahme bleibt von Betreiberarbeit getrennt,
- keine automatische Freigabe, Aktivierung, Veröffentlichung oder Mutation,
- keine parallele QR-, Beteiligungs- oder Event-Runtime,
- kein QR-Code mit sensiblen Daten,
- Print-, Share- und Review-Hrefs bleiben auf bestehende öffentliche Ziele beschränkt,
- ein QR-Ziel ist weder Wahrheits-, Prioritäts- noch Stimmgewichtssignal.

## Bewusst nachgelagert

Der automatische Beteiligungs-Composer gehört nicht in das Studio. Er ist als separater Folge-Slice im kanonischen Create-/Dossier-/Runden-Pfad zu führen und umfasst später insbesondere:

- Anlass, Claims, Vorschläge, Gegenpositionen und offene Fragen erkennen,
- Quellen- und Factcheck-Bedarf markieren,
- Beteiligungsreife und geeignetes Format ableiten,
- Fragen mit eigenem Typ und eigenen Optionen vorbereiten,
- Bias-, Neutralitäts-, Minderheiten- und Sprachprüfung,
- menschlichen Review und Handoff in Anlassraum, Dossier, Runde oder Beteiligungsraum,
- kein Auto-Poll, kein Auto-Publish und keine erfundene Quellenwahrheit.

## Abnahme

Erforderlich sind weiterhin:

- fokussierte Security-, QR-, Share-, Live-, Mobile- und Redirect-Tests,
- Typecheck, Lint und Production Build,
- Desktop- und Mobile-Produktprüfung von `/studio`,
- realer Kamera-/Geräte-Smoke mit einem freigegebenen persistenten Referenzziel,
- keine Mergefreigabe allein aufgrund eines Fixture- oder Preview-Tests.
