from pathlib import Path

path = Path("docs/E150/OpenTasks.md")
text = path.read_text(encoding="utf-8")

start_marker = "## Kanonischer Operativteil"
end_marker = "## Historischer Katalog und Evidenz"
section_marker = "## Marketing Growth OS — Operative Queue"

if start_marker not in text or end_marker not in text:
    raise SystemExit("canonical OpenTasks boundaries missing")

head, history = text.split(end_marker, 1)

if section_marker in head:
    raise SystemExit("marketing operative section already exists")

task_ids = [
    "MARKETING-GROWTH-OS-FOUNDATION-01",
    "MARKETING-CONTROL-PLANE-01",
    "MARKETING-CAMPAIGN-ANALYTICS-DECISION-01",
    "MARKETING-REGIONAL-AGENT-CONTRACT-01",
    "MARKETING-REGISTRY-READMODEL-01",
    "ADMIN-MARKETING-OPERATING-DASHBOARD-02",
    "ADMIN-BOARD-INFORMATION-ARCHITECTURE-03",
    "MARKETING-REGIONAL-AGENT-RUN-READMODEL-01",
    "MARKETING-CAMPAIGN-ANALYTICS-01",
    "MARKETING-REGIONAL-SOURCE-DISCOVERY-02",
    "MARKETING-MULTILINGUAL-CIVIC-EVALUATION-03",
    "MARKETING-AGENT-CAMPAIGN-STUDIO-04",
    "MARKETING-AGENT-RECOMMENDATIONS-05",
    "MARKETING-PUBLISH-APPROVAL-06",
    "MARKETING-DELEGATED-DISTRIBUTION-07",
    "MARKETING-REGIONAL-MONITORING-08",
    "MARKETING-LIFECYCLE-02",
    "MARKETING-AGGREGATE-IMPORT-02",
    "MARKETING-PROVIDER-ANALYTICS-03",
    "MARKETING-COST-OUTCOME-INTEGRATION-04",
    "MARKETING-CRM-LIGHT-04",
    "MARKETING-WHITELABEL-EXPORT-05",
]
collisions = [task_id for task_id in task_ids if task_id in head]
if collisions:
    raise SystemExit(f"task IDs already present in operative head: {collisions}")

head = head.replace(
    "# E150 Open Tasks — Operativer Kopf 2026-07-23",
    "# E150 Open Tasks — Operativer Kopf 2026-07-27",
    1,
)
head = head.replace("- Stand: `2026-07-23`", "- Stand: `2026-07-27`", 1)
head = head.replace(
    "- Basis-Commit dieses Sync-Slices vor Merge von PR `#415`: `origin/main@163e66a3`",
    "- Letzter gezielter Kopf-Sync: Marketing Growth OS und fokussierte Admin-Informationsarchitektur nach PR `#460`; nicht berührte operative Zeilen behalten ihren zuletzt verifizierten Status.",
    1,
)
head = head.replace(
    "- PR `#415` (`docs/opentasks-head-sync-2026-07-23`) ist am 2026-07-23 noch offen und bleibt bis zum tatsächlichen Merge `in_progress`.",
    "- PR `#415` (`docs/opentasks-head-sync-2026-07-23`) wurde am 2026-07-23 gemergt; der damalige Governance-SSOT-Sync ist abgeschlossen.",
    1,
)

truth_heading = "## Aktueller Wahrheitsstand\n\n"
truth_block = (
    "- PR `#429` wurde gemergt und liefert die Marketing-Growth-OS-, White-Label-, Campaign-, Asset- und Control-Plane-Foundation ohne Runtime-Autonomie.\n"
    "- PR `#437` wurde gemergt und schließt die Marketing-Control-Plane-Entscheidungen: `/admin/marketing`, bestehender Admin-/2FA-Gate, read-only erster Slice, aggregierte BI und getrenntes CRM-light.\n"
    "- PR `#439` wurde gemergt und definiert Campaign Analytics, KPI-, Funnel-, Kosten-, Datenqualitäts- und Privacy-Grenzen.\n"
    "- PR `#441` wurde gemergt und definiert den regionalen, mehrsprachigen Civic Opportunity & Campaign Operator als review-first Orchestrierungsprofil ohne Auto-Publish.\n"
    "- PR `#443` wurde gemergt; `/admin/marketing` und `/api/admin/marketing` sind als typisierte, repo-backed, 2FA-geschützte Read-only-Registry umgesetzt.\n"
    "- PR `#460` wurde als Merge `f14659d298af34afbd036c987e3c28c6b3a0adfb` gemergt und überarbeitet ausschließlich die Informationsarchitektur und Bedienbarkeit von `/admin/marketing`; Produkt-Smoke und Nutzerabnahme stehen noch aus.\n"
    "- Issue `#459` hält die spätere Vereinfachung der übrigen Admin-Boards fest und bleibt bis zur Produktabnahme von `/admin/marketing` blockiert.\n"
    "- Issue `#445` und Issue `#440` sind die einzigen aktuell ausführbaren Marketing-Slices; externe Source Discovery und Publish Approval bleiben echte Manual Gates.\n"
)
if truth_heading not in head:
    raise SystemExit("current truth heading missing")
head = head.replace(truth_heading, truth_heading + truth_block, 1)

section = r'''
## Marketing Growth OS — Operative Queue

| ID | Status | Priorität | Abhängigkeiten | Scope | Akzeptanzkriterien |
| --- | --- | --- | --- | --- | --- |
| MARKETING-GROWTH-OS-FOUNDATION-01 | done | P1 | keine | Versionierte Marketing-, Brand-, White-Label-, Campaign-, Asset-, Relationship- und Control-Plane-Foundation aus PR `#429` | Foundation ist auf `main`; keine Runtime-, CRM-, Provider- oder Publishing-Implementierung wird daraus abgeleitet |
| MARKETING-CONTROL-PLANE-01 | done | P1 | MARKETING-GROWTH-OS-FOUNDATION-01 | Verbindlicher Decision-Contract aus PR `#437` für `/admin/marketing`, Rollen-/2FA-Grenzen, read-only Einstieg, BI, CRM-light, Distribution und White-Label | Produkt-, Rollen-, Privacy- und Autonomiegrenzen sind dokumentiert; Folge-Slices halten die Gates ein |
| MARKETING-CAMPAIGN-ANALYTICS-DECISION-01 | done | P1 | MARKETING-CONTROL-PLANE-01 | Campaign-Analytics-Zielmodell aus PR `#439` mit Primary KPI, Funnel, Kosten, Datenqualität, Attribution und Privacy | Reichweite ist nie alleiniger Erfolgsscore; personenbezogene Marketingprofile bleiben ausgeschlossen |
| MARKETING-REGIONAL-AGENT-CONTRACT-01 | done | P1 | MARKETING-CONTROL-PLANE-01 | Regionaler, mehrsprachiger Civic Opportunity & Campaign Operator aus PR `#441` inklusive Region, Jurisdiktion, vier Sprachrollen, Beteiligungseignung, Empfehlungen und freigabegebundener Distribution | Kein zweiter Agentenkosmos, kein Auto-Publish und keine private Chain-of-Thought; Evidence, Review und Governance bleiben kanonisch |
| MARKETING-REGISTRY-READMODEL-01 | done | P1 | MARKETING-CONTROL-PLANE-01 | Typisierte, repo-backed und ausschließlich lesende Registry sowie `/admin/marketing` und `/api/admin/marketing` aus PR `#443` | Admin-/2FA-Gate, DE/EN UI, Opportunities, MarketingCampaigns, Assets, Brands, Evidence und Blocker sind umgesetzt; keine Mutation oder neue Persistenzwelt |
| ADMIN-MARKETING-OPERATING-DASHBOARD-02 | review | P1 | MARKETING-REGISTRY-READMODEL-01 | Issue `#458` / PR `#460`: `/admin/marketing` als verständliche Betreiberübersicht mit priorisierten, klickbaren Kennzahlen, echten Ergebnissen, verständlichen nächsten Schritten und Übergaben in vorhandene Arbeitsbereiche überarbeiten | Merge `f14659d298af34afbd036c987e3c28c6b3a0adfb` und CI sind grün; Scope blieb lokal auf `/admin/marketing`, Registry-Readmodel, Navigation und fokussierten Tests; Produkt-Smoke und Nutzerabnahme sind vor `done` erforderlich |
| ADMIN-BOARD-INFORMATION-ARCHITECTURE-03 | blocked | P2 | ADMIN-MARKETING-OPERATING-DASHBOARD-02 produktseitig abgenommen | Issue `#459`: übrige `/admin`-Boards nach erfolgreicher Marketing-Abnahme auf Ergebnis, Risiko, Entscheidung und nächste Aktion prüfen und schrittweise vereinfachen | Kein Start vor Produktabnahme; offene PRs, Nutzung, Rollen, Routing und Dateikollisionen je Slice prüfen; keine stille globale Workspace- oder Designsystem-Migration |
| MARKETING-REGIONAL-AGENT-RUN-READMODEL-01 | codex_ready | P1 | MARKETING-REGISTRY-READMODEL-01 | Issue `#445`: `/admin/marketing/agent/runs`, Run-Konfiguration, Region/Jurisdiktion, Zeitraum, Themenrahmen, Original-/Lese-/Bedien-/Ausgabesprachen, manuelle Source Packs und user-safe Trace | Zwei validierte Fixture-Runs, nachvollziehbare Provenienz und Blocker, read-only Admin-/2FA-Gate; keine externe Suche, Providerkante, Kampagnenerstellung oder Distribution |
| MARKETING-CAMPAIGN-ANALYTICS-01 | codex_ready | P1 | MARKETING-REGISTRY-READMODEL-01, MARKETING-CAMPAIGN-ANALYTICS-DECISION-01 | Issue `#440`: read-only Scorecards und Insights für Kampagnen, Kanäle, Assets, Funnel, Kosten, Datenqualität und Learnings | Primary KPI und Messzeitraum sind verpflichtend; Aggregate und Mindestgruppengröße werden eingehalten; keine erfundenen ROI-Werte, Providerimporte oder autonome Optimierung |
| MARKETING-REGIONAL-SOURCE-DISCOVERY-02 | manual_gate | P1 | MARKETING-REGIONAL-AGENT-RUN-READMODEL-01 | Provider-, Allowlist-, Region-Profile-, Kosten-, Rate-Limit-, Lizenz-, Retention-, Caching-, Freshness- und Stale-Policy für aktuelle regionale Recherche entscheiden | Zugelassene Quellenklassen und technische/providerbezogene Grenzen sind menschlich freigegeben, bevor Live-Recherche beginnt |
| MARKETING-MULTILINGUAL-CIVIC-EVALUATION-03 | blocked | P1 | MARKETING-REGIONAL-AGENT-RUN-READMODEL-01, MARKETING-REGIONAL-SOURCE-DISCOVERY-02 | Originalquellen, Sprachbrücken, Claims/Gegenpositionen, Zuständigkeit, betroffene Gruppen, fehlende Stimmen und Beteiligungseignung auswerten | Fakten und Grundrechte werden nicht zur Mehrheitsfrage; Opportunity- und Formatempfehlungen bleiben evidence-basiert und reviewpflichtig |
| MARKETING-AGENT-CAMPAIGN-STUDIO-04 | blocked | P1 | MARKETING-MULTILINGUAL-CIVIC-EVALUATION-03, MARKETING-LIFECYCLE-02 | Mensch-Agent-Co-Creation für Brief, lokalisierte Varianten, Onepager, Deck, Social, Video, Review und Versionierung | Mehrsprachige Varianten bleiben kanonisch verbunden; keine Distribution ohne gesonderte Approval |
| MARKETING-AGENT-RECOMMENDATIONS-05 | blocked | P1 | MARKETING-CAMPAIGN-ANALYTICS-01 | Evidence-, Datenqualitäts- und Performance-Auswertung mit Keep/Improve/Scale/Pause/Stop und Learning Proposals | Jede Empfehlung zeigt Evidence, Confidence, Annahmen, Risiken und menschlichen Entscheidungsbedarf; keine autonome Änderung |
| MARKETING-PUBLISH-APPROVAL-06 | manual_gate | P1 | MARKETING-LIFECYCLE-02 | Capability-, 2FA-, Campaign-, Asset-, Hash-, Locale-, Region-, Kanal-, Account-, Zeitfenster-, Ablauf-, Widerrufs- und Ausführungslimit-Vertrag entscheiden | Nur konkrete unveränderte Versionen können delegiert werden; Inhaltsänderungen invalidieren die Approval; Audit und Preview sind verpflichtend |
| MARKETING-DELEGATED-DISTRIBUTION-07 | blocked | P1 | MARKETING-PUBLISH-APPROVAL-06, freigegebene Provider-Adapter | Sichere Connectoren, Credential-Verknüpfung außerhalb des Repos, Preflight, idempotente Ausführung, DistributionRecord und Audit | Keine autonome Publikationsentscheidung; Ausführung ist fail-closed, widerrufbar und vollständig belegbar |
| MARKETING-REGIONAL-MONITORING-08 | blocked | P2 | MARKETING-REGIONAL-SOURCE-DISCOVERY-02, MARKETING-MULTILINGUAL-CIVIC-EVALUATION-03, Governance-Review | Wiederkehrende regionale Runs, Evidence Refresh, Opportunity Updates und Reviewempfehlungen | Dynamisches Wachstum erfolgt nur über versionierte Region Profiles, Source Adapter, Language Packs und Policies; keine Distribution ohne separate Approval |
| MARKETING-LIFECYCLE-02 | blocked | P1 | MARKETING-REGISTRY-READMODEL-01, MARKETING-CONTROL-PLANE-01 | Schreibfähigen MarketingCampaign-/Asset-Lifecycle mit Review, Approval, Audit und Rollenmodell als separaten Slice definieren und umsetzen | Keine Mutation vor eigenem Scope-/Rollen-/Persistenzvertrag; bestehende Beteiligungs-Campaign bleibt getrennt |
| MARKETING-AGGREGATE-IMPORT-02 | blocked | P2 | MARKETING-CAMPAIGN-ANALYTICS-01, Provider-/Datenvertrag | Verifizierte aggregierte Plattformdaten importieren, ohne Credentials oder personenbezogene Profile in die Registry zu ziehen | Import ist idempotent, auditierbar und klar als gemessen, geschätzt, veraltet oder fehlend markiert |
| MARKETING-PROVIDER-ANALYTICS-03 | blocked | P2 | MARKETING-AGGREGATE-IMPORT-02, Provider-Decision | Provider-APIs für aggregierte Analytics kontrolliert anbinden | Secrets bleiben außerhalb des Repos; Rate Limits, Retention, Lizenz und Datenqualität sind freigegeben und getestet |
| MARKETING-COST-OUTCOME-INTEGRATION-04 | blocked | P2 | MARKETING-CAMPAIGN-ANALYTICS-01, MARKETING-AGGREGATE-IMPORT-02 | Belegte Media-, Produktions- und Outcome-Kosten sowie qualifizierte Conversion-Aggregate verbinden | ROI erscheint nur bei belastbarer Kosten-, Erlös- und Attributionsbasis; ansonsten `not_available` oder klar directional |
| MARKETING-CRM-LIGHT-04 | blocked | P2 | MARKETING-LIFECYCLE-02, Datenschutz-/Retention-Decision | Institutionelle Beziehungen, Stufen, nächste Schritte und aggregierte Kampagnen-Outcomes als CRM-light abbilden | Keine politischen Interessenprofile; PII, Rechtsgrundlage, Retention, Löschung und Berechtigungen sind getrennt geregelt |
| MARKETING-WHITELABEL-EXPORT-05 | blocked | P2 | MARKETING-LIFECYCLE-02, freigegebene BrandProfiles, Rechtszielprüfung | Versionierte Co-Branding-/White-Label-Exporte aus kanonischen Kampagnen und Assets erzeugen | Quellen-, Review-, Audit-, Privacy- und Governance-Wahrheit bleibt unveränderlich; nur freigegebene Brandprofile und reale Rechtsziele werden exportiert |

<!--
Marketing Growth OS evidence:
- PR #429 / Merge be39bab04679aafa2eaecb7298f962dc5c4007c4
- PR #437 / Merge 8a79ee2db5bc1cc2cad9d6939070cb9229da7824
- PR #439 / Merge d853b121df13b1952c7ca3e9ce29da884df93bc7
- PR #441 / Merge 8ea4368c4ac0a4c5287236a817961aae46c2701a
- PR #443 / Merge 05e0d20448b9e3d88741be5686800dc524cfa8cb
- PR #460 / Merge f14659d298af34afbd036c987e3c28c6b3a0adfb / Issue #458
- Issue #459
- Issues #440, #442, #445
- Source Discovery und Publish Approval bleiben echte Manual Gates.
-->

'''

path.write_text(head.rstrip() + "\n\n" + section + end_marker + history, encoding="utf-8")
