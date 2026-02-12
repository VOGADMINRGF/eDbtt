# E150 Open Tasks (Single Source of Truth)

## Zweck

Diese Datei ist der kanonische Aufgabenstand fuer E150.  
Wenn `Part14`, `Part15` oder Drift-Prompts abweichen, gewinnt diese Datei.

Stand: 2026-02-12

## Block-Board

| Block | Thema | Status | Naechster Run | Ziel |
| --- | --- | --- | --- | --- |
| A | Orchestrator | Done | - | Stabil halten, nur Fehlerfixes |
| B | Consequences/Responsibility | Done | - | Stabil halten, nur Fehlerfixes |
| C | Graph/Reports | Done | - | Monitoring/Polish bei Bedarf |
| D | Eventualities | Done | - | Monitoring/Polish bei Bedarf |
| E (R2) | Research Workflow | Done | - | Betrieb/Qualitaet absichern |
| F | Streams | Done (MVP) | PR-0031 | Stream-Kit Overlay/QR/Agenda |
| G | Campaigns | Done (MVP) | PR-0032 | CTA/UX-Polish + Reporting-Feinschliff |
| H | I18N/A11y/Social | Done (Skeleton) | PR-0033 | Produktreife der Skeleton-Pfade |
| I | Unterstuetzen/Crowdfunding | Done | - | End-to-End SupportCampaign/SupportPledge live |
| M | Membership Apply | Done | - | Betrieb + Monitoring |

## Aktive Aufgaben

### 1) Block F (naechster Ausbau)

Funktion (Skizze):
- Stream-Kit fuer sachliche Debattenstreams produktisieren.
- Overlay zeigt aktiven Tagespunkt.
- QR-Ziel wechselt je Agenda-Item.
- Host kann den aktiven Punkt mit 1 Klick steuern.

Ist/Unerledigt:

| Bereich | Ist | Unerledigt |
| --- | --- | --- |
| Stream-Basis | Sessions/Agenda/Overlay vorhanden | Stream-Kit Overlay-URL pro Session fehlt |
| QR | Campaign-/Session-QR vorhanden | Dynamischer QR je Agenda-Item fehlt |
| Host-Flow | Session-Verwaltung vorhanden | 1-Klick "Aktiver Tagespunkt" + Overlay-Sync fehlt |
| Produktseite | Vision in Part11 vorhanden | `/howtoworks/streamer` bzw. `/streamer/werden` fehlt |

### 2) Doku- und Strukturhygiene (parallel, docs-only)

Funktion (Skizze):
- E150-Doku muss fuer Externe lesbar und widerspruchsfrei sein.

Ist/Unerledigt:

| Bereich | Ist | Unerledigt |
| --- | --- | --- |
| Part14/15 Konsistenz | weitgehend synchron | Bei jedem neuen PR-Log sofort nachziehen |
| Part09 R2-Status | als done konsolidiert | Betriebsmetriken als Appendix ergaenzen |
| Part11/12 Struktur | Hauptfehler behoben | Restliche alte Fliesstextblöcke schrittweise harmonisieren |

## Arbeitsregel fuer jeden Run

1. `OpenTasks.md` zuerst lesen.
2. Genau ein aktives Paket umsetzen (max 6 Aufgaben im Drift).
3. `Part15.md` PR-Log aktualisieren.
4. `OpenTasks.md` Status/Naechster Run aktualisieren.
5. `Changes / Verification / Next Steps` ausgeben.
