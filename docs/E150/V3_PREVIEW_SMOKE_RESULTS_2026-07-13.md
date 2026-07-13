# V3 Preview Smoke Results 2026-07-13

Status: ausfüllbare Vorlage fuer den manuellen V3 Preview Smoke Test. Diese Datei enthält bewusst keine vorbefüllten Testergebnisse.

Referenzen:

- `docs/E150/V3_PREVIEW_SMOKE_READINESS_PLAN_2026-07-13.md`
- `docs/E150/V3_RELEASE_READINESS_REGRESSION_MATRIX_2026-07-13.md`

## Ausfüllhinweise

- Nur reale Beobachtungen, Screenshots und Folge-Links eintragen.
- Pro Testschritt eine Zeile verwenden; bei Bedarf weitere Zeilen direkt im jeweiligen Bereich ergaenzen.
- `Status`: `Pass` / `Fail` / `Blocked` / `Needs follow-up`
- `Schweregrad`: `P0` / `P1` / `P2` / `P3`
- `Umgebung`: `Local` / `Vercel Preview` / `Production`
- `Tatsächliches Ergebnis` leer lassen, bis der konkrete Lauf stattgefunden hat.

## Smoke-Run Ueberblick

| Feld | Wert |
| --- | --- |
| Smoke-Run-ID |  |
| Prüfleitung |  |
| Weitere Prüfer |  |
| Datum |  |
| Branch / Commit |  |
| Zielumgebung |  |
| Verwendete Rollen / Accounts |  |
| Verwendete Records / Dossiers / Fixtures |  |
| Referenzplan | `docs/E150/V3_PREVIEW_SMOKE_READINESS_PLAN_2026-07-13.md` |
| Referenzmatrix | `docs/E150/V3_RELEASE_READINESS_REGRESSION_MATRIX_2026-07-13.md` |
| Allgemeine Notizen |  |

## Gesamtentscheidung

| Entscheidung | Auswahl / Ergebnis | Begruendung | Verantwortlich | Folge-Issue/PR |
| --- | --- | --- | --- | --- |
| Preview-Go |  |  |  |  |
| Beta-Go |  |  |  |  |
| No-Go |  |  |  |  |

## Folgeentscheidungen

| Entscheidungspunkt | Auswahl / Ergebnis | Begruendung | Verantwortlich | Folge-Issue/PR |
| --- | --- | --- | --- | --- |
| Queue 03 noetig? |  |  |  |  |
| `V3-EXTERNAL-BROWSER-E2E-01` danach starten? |  |  |  |  |
| `V3-NOTIFICATIONS-REALTIME-MAIL-01` relevant? |  |  |  |  |
| `V3-MONITORING-ALERTING-ROLLBACK-01` relevant? |  |  |  |  |

## P0-Blocker-Liste

| ID | Bereich | Befund | Route / Surface | Owner | Status | Link |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

## P1-Fix-before-Beta-Liste

| ID | Bereich | Befund | Route / Surface | Owner | Status | Link |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

## P2/P3 Follow-up-Liste

| ID | Schweregrad | Bereich | Befund | Route / Surface | Owner | Status | Link |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |

## 1. Public Start / Route / Pricing / Order

| Prüfer | Datum/Uhrzeit | Umgebung | Route oder Surface | Testschritt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Schweregrad | Screenshot/Link | Folge-Issue/PR | Notizen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | `/` | Public Start aufrufen und Primaernavigation pruefen | Einstieg bleibt konsistent; `/order` ist der kanonische Paket-/Startpfad |  |  |  |  |  |  |
|  |  |  | `/pricing` | Pricing-Copy, CTA und Pakethinweise pruefen | Keine hidden costs; keine automatische Zahlung oder Aktivierung suggeriert |  |  |  |  |  |  |
|  |  |  | `/order` | Order-Start und Paketfluss bis zur klaren Uebergabe pruefen | Paketwahl bleibt sauber von Billing, Freischaltung und Aktivierung getrennt |  |  |  |  |  |  |
|  |  |  | `/vormerken`, `/mitglied-werden`, `/beitritt` | Legacy-/Aliaspfade pruefen | Keine widerspruechliche Hauptfunnel-Semantik; Aliase bleiben Fallback-/Bestandspfade |  |  |  |  |  |  |

## 2. Create -> Review -> Dossier -> Account

| Prüfer | Datum/Uhrzeit | Umgebung | Route oder Surface | Testschritt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Schweregrad | Screenshot/Link | Folge-Issue/PR | Notizen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | `/create` | Create-Einstieg mit Review-first Erwartung pruefen | Draft bleibt Draft; keine falsche Publish-Semantik |  |  |  |  |  |  |
|  |  |  | `/admin/review` | Review-Handoff und Statussprache pruefen | `suggestion != decision`, `review_ready != approved` |  |  |  |  |  |  |
|  |  |  | `/dossier/[id]`, `/dossier/[id]/studio` | Dossier-Ansicht und Studio-Handoff pruefen | Review-Status bleibt von Publish-Status getrennt; Handoff ist nicht finale Veroeffentlichung |  |  |  |  |  |  |
|  |  |  | `/account`, `/account/organization/dashboard` | Account-/Resume-Pfade und naechste Schritte pruefen | Nutzer sieht sichere naechste Schritte; keine falsche Runtime-/Publish-Behauptung |  |  |  |  |  |  |

## 3. Dossier Export / Share / Publish-ready

| Prüfer | Datum/Uhrzeit | Umgebung | Route oder Surface | Testschritt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Schweregrad | Screenshot/Link | Folge-Issue/PR | Notizen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | `/dossier/[id]/studio` | Export-/Share-Panel und Labels pruefen | `publish_ready != published`, `share_preview != public publish` |  |  |  |  |  |  |
|  |  |  | `Public Dossier Runtime` | Oeffentliche Dossier-Sichtbarkeit mit nicht veroeffentlichten Faellen pruefen | Review-only Dossiers leaken nicht oeffentlich |  |  |  |  |  |  |
|  |  |  | `/api/dossier/[id]/export`, `/api/dossiers/[dossierId]/export.json`, `/api/dossiers/[dossierId]/export.csv` | Export-Grenzen und Guardrails pruefen | Kein Auto-Export, kein implizites Publish, kein ungedeckter Export nicht freigegebener Dossiers |  |  |  |  |  |  |
|  |  |  | `/admin/review` | Review-Kontext fuer Export-/Publish-ready pruefen | Export- und Share-Hinweise bleiben manuell und review-first |  |  |  |  |  |  |

## 4. Feed / Source / Intake / Factcheck

| Prüfer | Datum/Uhrzeit | Umgebung | Route oder Surface | Testschritt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Schweregrad | Screenshot/Link | Folge-Issue/PR | Notizen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | `/admin/feeds` | Feed-Sprache, Statuslabels und Materialhinweise pruefen | `source candidate != evidence`; kein versteckter Import-/Research-Automatismus |  |  |  |  |  |  |
|  |  |  | `/admin/region` | Regions-/Source-Ansicht pruefen | Snapshot-/Material-Sprache verkauft ungepruefte Inputs nicht als bestaetigte Quelle |  |  |  |  |  |  |
|  |  |  | `/factcheck` | Factcheck-Handoff und semantische Grenzen pruefen | `factcheck candidate != verified factcheck`; Uebersetzung ist keine Evidenz |  |  |  |  |  |  |
|  |  |  | `/admin/review`, Dossier Evidence-/Source-Hinweise | Review-Darstellung von Quellen und Evidenz pruefen | Keine Fake-Quellen; keine automatische Quellenpruefung behauptet |  |  |  |  |  |  |

## 5. Membership / Entitlement / Payment Copy

| Prüfer | Datum/Uhrzeit | Umgebung | Route oder Surface | Testschritt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Schweregrad | Screenshot/Link | Folge-Issue/PR | Notizen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | `/order` | Paketwahl, CTA und Payment-Copy pruefen | `package selected != package active`; keine versteckten Kosten |  |  |  |  |  |  |
|  |  |  | `/account/payment`, `/account/organization`, `/account/organization/dashboard` | Account-/Payment-/Entitlement-Darstellung pruefen | `billing copy != payment execution`; sichtbare Entitlements sind nicht automatisch aktive Nutzung |  |  |  |  |  |  |
|  |  |  | `/admin/pricing/orders`, `/admin/entitlements`, `/admin/memberships` | Admin-Support- und Provisioning-Surfaces pruefen | Admin-Aktionen bleiben manuell und review-first; kein Checkout-Automatismus |  |  |  |  |  |  |
|  |  |  | `/dashboard/memberships` | Membership-Status und Freischaltungssemantik pruefen | `membership != automatische Paketaktivierung` |  |  |  |  |  |  |

## 6. Language Bridge / Multilingual

| Prüfer | Datum/Uhrzeit | Umgebung | Route oder Surface | Testschritt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Schweregrad | Screenshot/Link | Folge-Issue/PR | Notizen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | `/create`, `/admin/review` | Eingabe-, Review- und Sprachhinweise pruefen | Originalsprache bleibt Evidenz; Uebersetzung bleibt Lesehilfe |  |  |  |  |  |  |
|  |  |  | `/dossier/[id]/studio`, `/account` | Studio-/Account-Sprache und Statushinweise pruefen | Review-/Approval-Semantik wird nicht aus Uebersetzungsstatus abgeleitet |  |  |  |  |  |  |
|  |  |  | `/community/contributions`, `/admin/contributions` | Contribution-Flows und Sprachdarstellung pruefen | Keine English-first-Verengung; keine externe Translation Runtime suggeriert |  |  |  |  |  |  |
|  |  |  | `/profile/[shareId]` | Oeffentliche Sprachdarstellung pruefen | Uebersetzung wird nicht wie Evidenz, Quelle oder Verifikation gerahmt |  |  |  |  |  |  |

## 7. AI Trace / Orchestration Transparency

| Prüfer | Datum/Uhrzeit | Umgebung | Route oder Surface | Testschritt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Schweregrad | Screenshot/Link | Folge-Issue/PR | Notizen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | `/create`, `/runden/new` | User-facing AI-Hinweise und Trace-Zusammenfassungen pruefen | `user-facing trace != debug trace`; keine Fake-Orchestrierung |  |  |  |  |  |  |
|  |  |  | `/admin/review`, `/dossier/[id]/studio`, `/account` | Normale Arbeitsoberflaechen auf Debug-/Provider-Leaks pruefen | Keine Prompt-, Chain-of-Thought-, Provider-, Token- oder Kosten-Leaks |  |  |  |  |  |  |
|  |  |  | `/admin/telemetry/ai/orchestrator` | Operator-Transparenz und Grenzen pruefen | `orchestration step != provider execution`; Retrieval-Hinweise werden nicht als gepruefte Quelle verkauft |  |  |  |  |  |  |
|  |  |  | Public / normale Operator-Surfaces | Sichtbare Debug-/Schema-/Parse-Felder pruefen | Keine rohen Debugfelder in user-facing oder regulaeren Operator-Surfaces |  |  |  |  |  |  |

## 8. Admin / Operator Workbench

| Prüfer | Datum/Uhrzeit | Umgebung | Route oder Surface | Testschritt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Schweregrad | Screenshot/Link | Folge-Issue/PR | Notizen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | `/admin`, `/admin/review` | Zentrale Review-/Operator-Wahrheit pruefen | Klare review-first Arbeitsstaende; keine falsche Publish-/Runtime-Semantik |  |  |  |  |  |  |
|  |  |  | `/admin/editorial/queue`, `/admin/feeds`, `/admin/region` | Queue-/Feed-/Region-Sprache pruefen | Keine rohen Debug-, Enum- oder Runtime-Flags als Primaersprache |  |  |  |  |  |  |
|  |  |  | `/admin/access`, `/admin/entitlements` | Access-/Entitlement-Arbeitsflaechen pruefen | Konsistente zentrale Operator-Sprache ohne Aktivierungs-Fake |  |  |  |  |  |  |
|  |  |  | `/admin/errors`, `/admin/system` | Fehler-/System-Surfaces pruefen | Keine neue operative Parallelwelt; ehrliche Links oder `noch nicht vorhanden` statt Fake-Actions |  |  |  |  |  |  |

## 9. Voxy Boundary

| Prüfer | Datum/Uhrzeit | Umgebung | Route oder Surface | Testschritt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Schweregrad | Screenshot/Link | Folge-Issue/PR | Notizen |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | Voxy Review-first Architektur | Boundary gegen aktive Runtime pruefen | Voxy Runtime bleibt disabled |  |  |  |  |  |  |
|  |  |  | Voxy Hybrid Foundation | Aktivierungs- und Integrationsgrenzen pruefen | Keine Provider-/Kosten-/Secret-Freigabe |  |  |  |  |  |  |
|  |  |  | `#369` Self-Render / Marketing Roadmap | Dokumentations- und Produktcopy-Abgrenzung pruefen | Roadmap bleibt Doku; keine Fake-Video-Runtime |  |  |  |  |  |  |
|  |  |  | Alle sichtbaren Voxy-bezogenen Surfaces | Sichtbare Runtime-Aktivierung, Upload, Scheduling oder Publish pruefen | Keine produktive Runtime-Aktivierung; keine Surface verkauft Roadmap als live |  |  |  |  |  |  |
