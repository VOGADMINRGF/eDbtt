# PRODUCTION-READY-CATEGORY-GAP-MAP-01

Stand: 2026-06-27
Status: done
Typ: Docs-/Readiness-Slice

## Ziel

Das Zielbild bleibt: `production_ready` in jeder relevanten Produktkategorie und jedem Bereich.

Dieser Slice behauptet **nicht**, dass das bereits erreicht ist. Er dokumentiert stattdessen
fuer die zentralen Kategorien:

- aktuellen Status
- Zielstatus `production_ready`
- konkrete fehlende Tasks
- technische Blocker
- organisatorische/operative Blocker
- Sicherheits-/Auth-/Audit-Anforderungen
- notwendige Tests, Builds und QA
- Prioritaet

Nicht Ziel:

- keine Runtime-Features
- keine falsche `production_ready`-Behauptung
- kein Auto-Publish
- kein automatisches `public_official`
- kein Social Publishing
- kein Payment-Feature bauen

## Gesamtergebnis

### 1. Was ist schon `production_ready`?

- Keine der angefragten externen Zielkategorien ist am 2026-05-22 ehrlich als
  `production_ready` einzustufen.
- Intern existiert mit `Ops Status Report / Runtime Reality` ein `live`-Pfad, aber das ist kein
  oeffentliches Produktversprechen fuer die hier gefragten Kategorien.

### 2. Was ist `production_candidate`?

- Review Queue
- Content Release / Visibility
- Topic Pages
- Dossier
- Anlassraum / Runden / QR / Share
- Organization Dashboard
- Region Cockpit
- Admin / Operator
- Auth / Membership / Directory
- Security / PII / AI Zones
- Public Routes
- Audit / Provenance
- International / generic region rollout

### 3. Was ist `pilot_ready`?

- Create / Intake
- Analyze / Claims
- Sources / Feeds / Snapshot / Import
- Pricing / Orders

### 4. Was ist `foundation`?

- Material / Upload / PDF / YouTube
- Payment / Billing / Entitlements
- Media / Partner / Funding
- Self-Provisioning

### 5. Leitbefund

Der groesste Abstand zu `production_ready` liegt nicht mehr in fehlender Grundarchitektur,
sondern in den noch offenen Produktionsluecken zwischen Pilot und belastbarem Rollout:

- externe Membership-/Directory-/Register-Anbindung
- Self-Provisionierung ohne Betreiberkante
- Billing-/Checkout-/Provisionierungsautomation
- breitere produktive Quellenabdeckung
- belastbare Material-/Upload-Runtime
- category-uebergreifende Langlauf-QA, Audit- und Betriebsdisziplin

### 2026-06-27 SSOT-Refresh

Der Docs-Abgleich nach PR #223, #225, #227 und #231-#236 veraendert diese Gap-Map nicht
nach oben, sondern macht die Trennlinie klarer:

- `POST-MERGE-PRODUCTION-SMOKE-22` bestaetigt historischen lokalen Build-/Smoke-Stand, aber liefert keinen neuen CI-/Vercel-Claim.
- `CREATE-PLANNER-CORE-FOLLOWUP-23` schliesst eine UX-/Flow-Luecke im Mehrthemen-Fall, nicht die qualitative Gesamtfrage fuer Planner/Analyze.
- `PR-VOXY-COCREATION-ACCESS-01` ist contract-ready fuer spaetere Studio-/Entitlement-Logik, nicht runtime-, paywall- oder checkout-ready.
- Die Participation-Slices `#231-#236` sind Shell-/Index-/Container-/Fixture-Readiness, keine Self-Service-, Persistenz-, Map-/Geo- oder Vollworkflow-Hochstufung.

Offen bleiben damit weiterhin vor allem Self-Service ohne Betreiberkante, breitere Source-Adapter-/Automation, Material-Extraction-Runtime, Checkout/Billing-Folgepfade und spaetere Live-Excellence-Ausbaustufen.

## Kategorische Gap-Map

| Kategorie | Aktueller Status | Zielstatus `production_ready` | Konkrete fehlende Tasks | Technische Blocker | Organisatorische / operative Blocker | Sicherheits-/Auth-/Audit-Anforderungen | Nötige Tests / Builds / QA | Priorität |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Create / Intake | `pilot_ready` | Stabiler produktiver Intake mit belastbarer Mehrthemen-Qualitaet, sauberem Org-/Region-Scope und vollstaendiger Review-to-Publish-Anbindung | Qualitaetsaudit fuer komplexe Inputs; Org-/Region-Paritaet fuer Save/Finalize/Handoffs; Risk-Ladder- und Folgepfad-Hardening | Noch keine breite produktionsnahe Evaluationsmenge fuer schwierige Inputs; Downstream-Paritaet haengt an spaeteren Review-/Publish-Stufen | Wiederholbare Live-QA-Cases, Pilot-Skripte und Betreiber-Playbook fuer Intake-Fehler fehlen | bestehender Safety-Gate, Request-Scope, Audit fuer Handoffs und Save/Finalize muessen durchgaengig bleiben | `typecheck`, `lint`, `build`, Create-/Analyze-/Handoff-Suites, manuelle Mehrthemen-/Link-/Scoped-Journeys | hoch |
| Analyze / Claims | `pilot_ready` | Claims-/Fragen-/Open-Points-Erkennung mit reproduzierbarer Qualitaet und reviewbarer Claim-Pipeline | Multithemen-Qualitaetsgate; Claim-/Factcheck-Paritaet; Review-Kalibrierung fuer riskante Aussagen | Kein breiter produktionsnaher Bewertungsdatensatz; Factcheck-/Seal-Pfad ist nicht fertig produktisiert | Redaktionelle Akzeptanzkriterien und Pruefschwellen sind nicht als Betriebsstandard eingefroren | `factcheck_required`, Safety, Provenance und kein stiller Merge bleiben Pflicht | Analyze-/Claim-Contracts, Safety-Suites, Factcheck-Stichproben, Langlauf-QA mit realen Kommunaltexten | hoch |
| Material / Upload / PDF / YouTube | `foundation` | Verlaessliche Materialaufnahme, Extraktion, Persistenz und Reviewfuehrung | Material-Runtime-Hardening; belastbare Extraktion fuer PDF/YouTube/Upload; Material-Review-UI; Kosten-/Kontingentmodell | Adapter-/Provider-Zuverlaessigkeit, Dateipersistenz und Extraktionsqualitaet sind noch nicht produktionsbewiesen | Upload-Moderation, Copyright-/Quellenpruefung und Supportprozess fehlen | Dateisicherheit, PII-/Medienpruefung, Audit fuer Extraktion und Materialherkunft | Parser-/Route-/Fallback-Tests, Provider-Smokes, Build, manuelle QA mit PDFs, YouTube und Upload-Fehlerfaellen | hoch |
| Review Queue | `production_candidate` | Voll belastbare operatorische und org-scoped Queue mit rekonstruierbarer Persistenz, klaren Rollen und SLA-faehiger Arbeitsteilung | AllowedActions-Paritaet ueber alle Queue-Quellen; End-to-End-Review-Regressionspfad; ausformulierter Queue-Betriebsstandard | Queue ist teils derived Readside; nicht alle angrenzenden Fachpfade sind gleich tief integriert | Assignment-/Triage-/Escalation-Routinen und Verantwortlichkeiten muessen formalisiert werden | Scope-Haertung, kein Bulk-Approve, Audit pro Aktion, `public_official` nur explizit menschlich | Review-Queue-Readmodel-/Route-/Org-/Admin-Tests, Build, manuelle Triage-/Assign-/Revoke-QA | hoch |
| Content Release / Visibility | `production_candidate` | Persistente, widerrufbare und auditierbare Sichtbarkeitskette fuer Dossier, Anlassraum und Topic Page | Publish-/Factcheck-Paritaet; Freigabe-/Rollback-Runbooks; Official-Release-Abgrenzung weiter haerten | Sichtbarkeit ist persistiert, aber nicht ueberall gleich tief mit Folgeflaechen und Reviewlogik verknuepft | Release-Verantwortung, Archivierungsregeln und Rollback-Disziplin muessen als Betriebspfad stehen | Audit aller Visibility-Aktionen, kein Auto-Publish, `public_official` getrennt | Content-Release-Repo-/Route-/Dashboard-Suites, Build, manuelle Sichtbar/Widerruf/Archiv-QA | hoch |
| Topic Pages | `production_candidate` | Leichte oeffentliche Themenseiten als belastbarer produktiver Zielpfad | Vollstaendige Workbench-/Ownership-Paritaet; Redaktions-/SEO-/Archive-Prozess; feinere Authoring-Handoffs | Topic Pages haengen voll an Workbench-/Visibility-Wahrheit; Authoring ist noch indirekt | Redaktionelle Pflege-, Archiv- und Update-Routinen fehlen | Preview-Zugriff, noindex-Holding-States, Audit fuer Visibility und Revoke muessen bleiben | `topic-public-page`, Holding-State-, Preview-, Build- und anonyme Browser-QA | mittel |
| Dossier | `production_candidate` | Persistentes Dossier mit klaren Rechten, Review, Studio und oeffentlicher Leseflaeche | Breitere Ownership-/Isolation ueber alle Dossier-Pfade; Locking-/Review-UX; Factcheck-/Publish-Paritaet | Studio-Pfad ist staerker gehaertet als alle Dossier-Mutationsrouten zusammen | Redaktioneller Review-, Archiv- und Revisionsprozess ist noch nicht als Vollbetrieb gefasst | Preview-/Public-Trennung, Revisionsaudit, kein stiller Demo-Fallback | Dossier-Route-/Studio-/Workspace-/Public-Tests, Build, manuelle Langsitzungs-QA | hoch |
| Anlassraum / Runden / QR / Share | `production_candidate` | Vollstaendig produktionsfaehiger Anlassraum fuer Oeffentlichkeit und verifizierte Organisationen inkl. QR-/Share-Betrieb | Verwaltungsruntime fuer Anlassraum; geschlossener Draft->Review->Visible-Pfad; Share-/QR-Betriebsregeln | Der oeffentliche Pfad ist stark, aber die belastbare Verwaltungsoberflaeche bleibt unvollstaendig | Moderation, Event-/Workshop-Betrieb, QR-Disziplin und Widerrufsprozess muessen operativ stehen | Sichtbarkeit vor QR/Share, Public-Input-Moderation, Audit fuer Visibility-/Share-Aktionen | `runden`-, QR-/Share-, Public-Input-, Acceptance-Suites, Build, manuelle Event-/Workshop-QA | hoch |
| Organization Dashboard | `production_candidate` | Belastbarer Arbeitsraum fuer verifizierte Organisationen mit echten Self-Service- und Review-Funktionen | Self-Service-Aktionen erweitern; tiefere Dossier-/Anlassraum-Paritaet; Entitlement-/Provisioning-Anbindung | Haengt an externer Membership-/Directory-Aufloesung und fehlender Self-Provisionierung | Support-, Onboarding- und Freischaltungsprozess ist noch betreibergetragen | Nur eigener Scope, eigener Audit-Trail, keine fremden Pending-/Unverified-Daten | Dashboard-Readmodel-/Page-/Org-Review-/Content-Release-Tests, Build, manuelle First-Run-QA | hoch |
| Region Cockpit | `production_candidate` | Belastbares Regionen-Cockpit mit Register-, Quellen-, Review- und Draft-/Publish-Paritaet | Autoritative Registeranbindung; breitere Source-Coverage; Anlassraum-Verwaltung; Multi-Region-QA | Lokaler Runtime-Store und manuelle Regionseinrichtung begrenzen breiten Rollout | Quellenkuration, Refresh-Prozess und Regionsverantwortung muessen als Betriebspfad feststehen | Region-Scope, Entitlement, Review-Audit, kein Auto-Official | `admin-region`-/`admin-regions`-/Cockpit-Route-/Readmodel-Tests, Build, manuelle Multi-Region-QA | hoch |
| Admin / Operator | `production_candidate` | Belastbarer Betreiberbereich mit vollstaendiger Surface-Inventur, least-privilege und Betriebsdisziplin | Restinventur fuer breite Betreiberflaechen; Route-/Hub-Paritaet; least-privilege-Aufraeumen | Grosse Surface-Breite, unterschiedliche Reifegrade der Hubs | Staffing, Escalation, Incident- und Rollback-Prozesse muessen dokumentiert sein | 2FA, sichtbarer Betreiber-Modus, Admin-Audit, Zonendisziplin | Admin-Route-/Hub-/Access-/Build-Sweeps, manuelle Route-Audits, Langlauf-QA | hoch |
| Auth / Membership / Directory | `production_candidate` | Externe Membership-/Directory-/Register-Wahrheit mit sauberem Scope-, Rollen- und Freischaltungsmodell | Externe Provider-/Directory-Anbindung; Konflikt-/Sync-Modell; Register-/Membership-Handoff; org-/region-sichere Self-Service-Aufloesung | Lokaler persistenter Membership-Store ist jetzt sauberer Produktpfad, aber noch keine autoritative externe Directory-Wahrheit; `external_directory_pending` bleibt echter Uebergangszustand | Verification-Reviews, Ausnahmebehandlung und Directory-Betrieb fehlen als Vollprozess | Kein stiller Admin-Fallback, sichtbare Source-of-Truth-/Confidence-Marker, vollstaendiger Auth-/Scope-Audittrail, klare Suspend-/Revoke-Herkunft | RequestScope-/RuntimeAdapter-/Org-/Admin-/Studio-Regressionssuiten, Build, manuelle Account-/Role-Journeys | sehr hoch |
| Security / PII / AI Zones | `production_candidate` | Pfaduebergreifend erzwungene Zonen-, PII-, Safety- und Audit-Disziplin | Breiterer Trace-/Review- und Incident-Layer; harte Regressionsabdeckung ueber weitere Pfade | Nicht jede Randroute ist gleich tief gegen Zonen-/PII-Drift abgesichert | Incident-, Privacy-, Retention- und Reviewprozess muessen als Betriebspfad fixiert werden | `GOV-SEC-02`/`03`, Create-Safety, PII-Zonen, High-impact-Audit und Human-Approval muessen verpflichtend bleiben | Security-/Safety-/Zone-Suites, Build, Privacy-/Red-Team-nahe manuelle QA | sehr hoch |
| Sources / Feeds / Snapshot / Import | `pilot_ready` | Breiter review-first Quellen- und Importpfad mit autoritativer RegionRegistry und reproduzierbaren Refreshes | Breitere produktive Quellenabdeckung; explizite Refresh-/Import-Flows; autoritative RegionRegistry-/Directory-Anbindung | Kein allgemeiner Crawler, keine breite Ingestion-Orchestrierung, kein fertiger Registry-Importbetrieb | Quellenpflege, Importbesitz und Refresh-Rhythmus sind noch nicht als Betriebsstandard formuliert | URL-Disziplin, Provenance, Audit fuer Dry Runs und Importpfade | Source-Connection-/Snapshot-/Import-/Review-Suites, Build, manuelle Dry-Run- und Missing-File-QA | hoch |
| Payment / Billing / Entitlements | `foundation` | Voll belastbarer kommerzieller Pfad von Checkout ueber Billing bis Provisioning und Entitlement-Sync | Checkout-/Billing-Engine; automatische Provisionierung; Retry-/Invoice-/Lifecycle-Prozesse; Entitlement-Sync | Zahlungslaufzeit ist bewusst nicht gebaut; Entitlements sind nur Pilot-/Admin-Grant | Finance-/Support-/Refund-/Provisioning-Betrieb fehlt | Zahlungs-/Entitlement-Audit, Rollen-/PII-Trennung, kein Rechteanstieg ohne verifizierte Identity | Spaetere Vertrags-, Integrations-, Security- und Finance-QA; heutige Entitlement-Suites nur Foundation | sehr hoch |
| Pricing / Orders | `pilot_ready` | Preis-/Order-Pfade mit ehrlichem Produktversprechen und echter Automationsanbindung | Order->Entitlement-Automation; kommerzielle Copy-/Legal-Freeze; Paket-/Quote-/Self-Service-Trennung weiter schaerfen | Kein Checkout-/Provisioning-Backend, daher nur Vormerk-/Angebotspfad | Angebots-, Quote- und Handoff-Betrieb bleibt manuell | Pricing-Control-Audit, Membership-/Produkt-Trennung, keine overpromises | Pricing-/Order-/Vormerken-Contracts, Build, manuelle Handoff- und Copy-QA | mittel bis hoch |
| Public Routes | `production_candidate` | Robuste anonyme Lese- und Share-Routen mit ehrlichen States und sauberer Performance | Vollstaendige Public-Route-Matrix-QA; Governance fuer Archive/Blocked/Holding-States | Abhaengigkeit von sauberer Visibility-Wahrheit und Route-Paritaet | Oeffentliche Moderations- und Archivregeln muessen durchhaltbar sein | Keine Preview-Leaks, keine falschen Share-/QR-Flaechen, Audit fuer Statewechsel | Public-Route-/Topic-/Dossier-/Runden-Contracts, Build, manuelle anonyme Browse-QA | hoch |
| Audit / Provenance | `production_candidate` | Durchgehender, scope-sicherer Audit-Trail ueber alle produktrelevanten Mutationspfade | End-to-End-Audit-Abdeckung fuer Randpfade; Retention-/Export-/Review-Regeln; feinere Tooling-Sichten | Nicht alle Domaenen liefern bereits gleich tiefe einheitliche Auditgranularitaet | Audit-Review-Cadence und Betreiberprozess muessen festgelegt sein | Unified Audit, Source-of-Truth, Official-Release-Grenze und High-impact-Audit bleiben Pflicht | Audit-Readside-/Repo-/Item-Trail-Suites, Build, manuelle Trace-Walkthroughs | hoch |
| Media / Partner / Funding | `foundation` | Klares Partner-/Medien-/Funding-Produkt mit Rechten, Grenzen und ehrlichen Claims | Produktpaketierung; Rechte-/Scope-Modell; Funding-/Partner-Landing und Runtime-Handoffs | Kein priorisierter Runtime-Hauptpfad; Packaging bleibt docs-/contract-nah | Partnerverantwortung, Legal-/Governance-Review und Supportpfad fehlen | Partner-/Funding-Audit, Rechtebegrenzung, keine Wahrheits-/Signal-Sondermacht | Derzeit vor allem Docs-/Contract-QA; spaeter Runtime- und Scope-QA | mittel |
| Self-Provisioning | `foundation` | Organisation -> Region -> Verifikation -> Freischaltung -> Arbeitsraum ohne Betreiberkante | Voller Self-Provisioning-Flow; Abuse-/Verification-Gates; Request-/Approval-Layer | Haengt an externer Directory-Aufloesung, Entitlement-Automation und fehlender Workflow-Orchestrierung | Review-SLAs, Support, Ausnahmefaelle und Missbrauchsschutz fehlen | Verification-Audit, Anti-Abuse, no silent elevation, Scope-/Entitlement-Audit | Spaetere End-to-End-Onboarding-QA, Abuse- und Rollback-QA | sehr hoch |
| International / generic region rollout | `production_candidate` | Generischer Regionenrollout ohne Berlin-/DE-Annahmen, anschlussfaehig fuer weitere Laender/Regiontypen | Locale-/Register-/Directory-Abstraktion; generische Seed-/Onboarding-Pfade; internationale Copy-/Policy-QA | Teile der Register-/Directory- und Policy-Lesart sind noch DE-/Berlin-nah | Lokale Partner-, Rechts- und Datenqualitaetspruefung fehlen | Locale-/Region-Scope, Import-/Policy-Audit, kein verdeckter Reinickendorf-/Berlin-Bias | Locale-/Route-/Region-Seed-/Import-QA, Build, manuelle Multi-Region-/Multi-Locale-Checks | hoch |

## Welche Tasks bringen die Kategorien auf `production_ready`?

### Bereits explizit im SSOT oder klar aus der Matrix ableitbar

- externe Membership-/Directory-/Register-Anbindung ueber den lokalen Runtime-Store hinaus
- Self-Provisionierung fuer Organisation/Wirkraum/Freischaltung
- Billing-/Checkout- und Provisionierungsautomation
- breitere produktive Quellenabdeckung ueber explizite Einzel-URLs hinaus
- Material-Runtime-Hardening fuer Upload/PDF/YouTube
- Factcheck-Review-/Seal-Produktisierung
- Anlassraum-Verwaltungsruntime
- pfaduebergreifende Langlauf-QA fuer Review-to-Publish, Public Routes und Audit

### Kategorieuebergreifende Pflichtblöcke

1. Identity-/Scope-Truth schliessen
   - externer Membership-/Directory-/Register-Layer
   - verifizierbare Self-Service-Rollen- und Regionszuordnung
2. Quellen- und Materialpfad schliessen
   - breitere produktive Source-Coverage
   - Upload-/PDF-/YouTube-Runtime
3. Review-to-Publish-Kette bis zum Vollbetrieb schliessen
   - Review Queue
   - Content Release
   - Topic/Dossier/Runden/Public Routes
   - Unified Audit
4. Kommerzielle und operative Automatisierung schliessen
   - Billing/Checkout
   - Entitlements/Provisioning
   - Pricing/Order-Handoffs
5. Erweiterungspfade erst danach
   - Media/Partner/Funding
   - breiter internationaler Rollout

## Sinnvolle Reihenfolge

### Stufe 1: Trust-, Scope- und Rollout-Grundlage

- Auth / Membership / Directory
- Self-Provisioning
- Organization Dashboard
- Region Cockpit
- International / generic region rollout

Begruendung:
Ohne belastbare externe Rollen-/Directory-Wahrheit und ohne self-service-faehige
Freischaltungslogik bleibt fast jede andere Kategorie auf Betreiberkanten angewiesen.

### Stufe 2: Input- und Quellenqualitaet

- Create / Intake
- Analyze / Claims
- Material / Upload / PDF / YouTube
- Sources / Feeds / Snapshot / Import

Begruendung:
Vor breiter Produktion muss die Eingangsqualitaet fuer Text, Material und Quellen belastbar
werden; sonst skaliert die Review-Kette nur Unsicherheit.

### Stufe 3: Review-to-Public Vollbetrieb

- Review Queue
- Content Release / Visibility
- Topic Pages
- Dossier
- Anlassraum / Runden / QR / Share
- Public Routes
- Audit / Provenance

Begruendung:
Diese Kette ist heute schon stark. Sie ist der naechste grosse Kandidat fuer echtes
`production_ready`, wenn Scope, Audit, QA und Vollbetriebsregeln geschlossen werden.

### Stufe 4: Betreiber- und Sicherheitsregime

- Admin / Operator
- Security / PII / AI Zones

Begruendung:
Die vorhandene Architektur ist stark, aber `production_ready` verlangt nicht nur Code, sondern
auch einen wiederholbaren sicheren Betrieb.

### Stufe 5: Kommerzielle Produktionsfaehigkeit

- Payment / Billing / Entitlements
- Pricing / Orders

Begruendung:
Der heutige Pilot kann mit manuellen Grants und Angebots-/Vormerkpfaden arbeiten. Breiter
produktionsfaehiger Self-Service braucht erst danach Checkout, Billing und Provisioning.

### Stufe 6: Ausbaupfade

- Media / Partner / Funding

Begruendung:
Diese Bereiche sollten nicht die Kernkette blockieren. Sie werden erst glaubwuerdig
`production_ready`, wenn Scope, Audit, Distribution und kommerzielle Automation schon stehen.

## Ergebnis

Die Kategorie-Gap-Map bestaetigt die bestehende Matrix-Lesart:

- kein angefragter externer Bereich ist am 2026-05-22 ehrlich `production_ready`
- mehrere Kernketten sind bereits `production_candidate`
- der kontrollierte Pilot ist real, aber noch mit sichtbaren Betreiberkanten
- der schnellste Weg zu `production_ready` fuehrt jetzt nicht ueber neue Grundarchitektur,
  sondern ueber Scope-/Identity-Wahrheit, Self-Provisionierung, Quellen-/Materialhaertung,
  Review-to-Public-Vollbetrieb und kommerzielle Automatisierung

## Validierung

Docs-only-Slice. Keine Runtime-Tests ausgefuehrt, da keine Code- oder Runtime-Aenderung erfolgt ist.
