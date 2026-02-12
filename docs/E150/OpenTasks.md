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
| F | Streams | Done (PR-0031) | - | Stream-Kit Overlay/QR/Agenda produktisiert |
| G | Campaigns | Done (PR-0032) | - | CTA/UX-Polish + Reporting-Feinschliff |
| H | I18N/A11y/Social | Done (PR-0033) | - | Produktreife der Skeleton-Pfade |
| I | Unterstuetzen/Crowdfunding | Done | - | End-to-End SupportCampaign/SupportPledge live |
| M | Membership Apply | Done | - | Betrieb + Monitoring |

## Aktive Aufgaben

Aktuell keine Pflicht-Tasks offen. Optionales Nachlauf-Polish siehe unten.

### 1) Nachlauf (optional)

Funktion (Skizze):
- Kleinere UX-Polish-Backlogpunkte nach Bedarf (z.B. Sharing-Preview auf weiteren Seiten).

Ist/Unerledigt:

| Bereich | Ist | Unerledigt |
| --- | --- | --- |
| Social Preview | OG-Defaults im Root-Layout aktiv | Detailseiten sukzessive erweitern |
| Page Contracts (CI) | `scripts/check-page-contracts.mjs` aktiv im Web-Build (Headline/Button-Regeln) | `missing-h1`-Allowlist von 38 Seiten schrittweise abbauen |
| Type Hygiene (Pages) | Kernseiten `account`, `admin`, Auth-Flow nachgezogen | Restliche `any`-Verwendungen in `page.tsx` systematisch reduzieren |
| Admin Navigation | Hubs + Direktzugriff + Zusatzbereiche im Dashboard vorhanden | Kontextaktionen (Massenaktionen/Drilldown) gezielt erweitern |

## Arbeitsregel fuer jeden Run

1. `OpenTasks.md` zuerst lesen.
2. Genau ein aktives Paket umsetzen (max 6 Aufgaben im Drift).
3. `Part15.md` PR-Log aktualisieren.
4. `OpenTasks.md` Status/Naechster Run aktualisieren.
5. `Changes / Verification / Next Steps` ausgeben.
