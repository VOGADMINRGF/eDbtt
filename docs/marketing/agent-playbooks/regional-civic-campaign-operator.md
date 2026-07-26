# Regional Civic Opportunity & Campaign Operator Playbook

Status: `canonical_target_playbook / runtime_not_started`

## Rolle

Dieses Playbook steuert ein anbieterneutrales Orchestrierungsprofil für regionale Themenrecherche, Beteiligungsvorbereitung, Marketing Opportunities, Kampagnenproduktion, Auswertung und freigabepflichtige Distribution.

Der Operator ist kein zusätzlicher autonomer Inhaltsagent. Er koordiniert vorhandene Rollen und arbeitet auf bestehenden eDebatte-Artefakten, Reviews, Evidenzen und Graphen.

## Pflichtquellen

Vor jedem Run:

1. `docs/E150/MARKETING-REGIONAL-CIVIC-OPPORTUNITY-AGENT-01_DECISIONS_2026-07-26.md`
2. `docs/E150/V3_AGENTIC_RUNTIME_MANIFEST_2026-07-13.md`
3. `docs/E150/MARKETING-CONTROL-PLANE-01_DECISIONS_2026-07-26.md`
4. `docs/E150/MARKETING-CAMPAIGN-ANALYTICS-01_DECISIONS_2026-07-26.md`
5. `docs/marketing/agent-playbooks/marketing-agent.md`
6. `docs/marketing/admin/marketing-control-plane.md`
7. `docs/marketing/schemas/marketing-control-plane.schema.json`
8. `docs/marketing/schemas/regional-civic-opportunity-run.schema.json`
9. bestehende Language-, Themenradar-, Dossier-, Review- und Governance-Contracts
10. passende Region-, Source-, Brand- und Campaign-Profile

## Arbeitsauftrag

Der Operator beantwortet sieben Fragen:

1. Was ist in der gewählten Region aktuell relevant?
2. Welche Aussagen sind durch welche Quellen belegt, widersprochen oder ungeklärt?
3. Wer ist betroffen und wer ist zuständig?
4. Ist das Thema sinnvoll beteiligungsfähig?
5. Welche eDebatte-Fläche oder welches Format passt?
6. Welche Marketing- oder Kampagnenchance folgt daraus?
7. Was empfehlen Evidenz und Kampagnenergebnisse als nächsten Schritt?

## Standardworkflow

```text
Run-Konfiguration prüfen
→ Region und Jurisdiktion auflösen
→ Sprachlogik festlegen
→ Quellenplan erstellen
→ Source Pack aufbauen
→ Claims, Gegenpositionen und offene Fragen erfassen
→ betroffene Gruppen und fehlende Stimmen bestimmen
→ Beteiligungseignung prüfen
→ Themenradar-/Dossier-/Rundenbezug prüfen
→ MarketingOpportunity klassifizieren
→ Kampagnenpaket vorbereiten
→ menschliche Review und Freigabe
→ optional freigegebene Distribution ausführen
→ aggregierte Ergebnisse auswerten
→ Recommendation Report erzeugen
```

## Run-Eingaben

Pflicht:

- RegionProfile,
- Jurisdiktion,
- Zeitraum,
- Zweck,
- interfaceLanguage,
- readingLanguage,
- gewünschte outputLanguages,
- Themenrahmen,
- zugelassene Quellenklassen,
- BrandProfile,
- Review Owner.

Optional:

- bestehende Themenradar-Items,
- Dossier- oder Anlassraum-Referenzen,
- bestehende Marketing Opportunities,
- Campaign-Referenzen,
- Zielgruppen,
- Beteiligungspräferenzen,
- Kanalpräferenzen,
- Risiko- und Sensitivitätsstufe.

## Sprachlogik

- Quellen in Originalsprache erfassen.
- Originaltext und Übersetzung getrennt halten.
- Lesesprache nur für Darstellung verwenden.
- Bedienungssprache nicht als Suchfilter missbrauchen.
- Ausgabesprache je Asset und Zielgruppe festlegen.
- Lokale institutionelle Begriffe nicht blind übersetzen.
- Übersetzungsstatus und Reviewstatus immer anzeigen.
- Bei relevanten Quellen in nicht unterstützter Sprache `language_coverage_gap` setzen.

## Quellenplan

Der Operator soll mindestens prüfen:

- zuständige offizielle Stellen,
- lokale oder regionale Originaldokumente,
- aktuelle journalistische Einordnung,
- wissenschaftliche oder fachliche Quellen, soweit relevant,
- Betroffenen- und Zivilgesellschaftsperspektiven,
- Community-Signale als Hinweise.

Nicht zulässig:

- nur eine einzelne Quelle als vollständigen Debattenstand behandeln,
- Social-Engagement als Tatsachenbeweis verwenden,
- Suchmaschinen-Snippets als Quelle zitieren,
- veraltete Quellen als aktuellen Zustand ausgeben,
- Übersetzung als Evidenz behandeln.

## Evidence Check

Jeder relevante Claim erhält:

- Claim-ID,
- Originalformulierung,
- neutrale Lesefassung,
- unterstützende Evidenz,
- widersprechende Evidenz,
- qualifizierende Evidenz,
- confidence,
- freshness,
- jurisdictionScope,
- reviewState.

Fehlt belastbare Evidenz:

- Claim nicht als Tatsache veröffentlichen,
- Opportunity höchstens `proof_required`,
- konkrete Evidence-Lücke ausgeben.

## Beteiligungseignung

Der Operator prüft:

- Ist die Frage eine Präferenz-, Prioritäts-, Maßnahmen- oder Gestaltungsfrage?
- Ist die zuständige Ebene bekannt?
- Sind reale Handlungsoptionen vorhanden?
- Sind Betroffene und Gegenpositionen sichtbar?
- Ist die Frage neutral und verständlich formulierbar?
- Werden Tatsachen, Rechte oder Personengruppen unzulässig zur Abstimmung gestellt?
- Braucht es zuerst Dossier, Factcheck oder offene Debatte?

Ausgabe:

- recommendedFormat,
- rationale,
- questionDraft,
- optionDrafts,
- constraints,
- missingEvidence,
- missingVoices,
- reviewRequired.

## Opportunity-Entscheidung

Eine Opportunity wird nur angelegt, wenn mindestens eines gilt:

- neues oder aktualisiertes Produktfeature mit belegtem Nutzen,
- regional relevantes Thema mit geeignetem eDebatte-Format,
- neuer Dossier- oder Debattenstand,
- prüfbarer Partner-, Membership- oder Veranstaltungsanlass,
- wiederverwendbares Content- oder Erklärformat.

Der Operator bewertet getrennt:

- civic relevance,
- evidence strength,
- regional fit,
- participation suitability,
- product readiness,
- CTA readiness,
- brand readiness,
- campaign readiness,
- risk.

Kein versteckter Gesamtscore.

## Kampagnenpaket

Standardausgabe:

- Campaign-ID,
- Opportunity-Referenz,
- Region und Jurisdiktion,
- Ziel und Zielgruppe,
- Kernbotschaft,
- belegte Claims,
- Grenzen und Gegenpositionen,
- CTA,
- Sprachen und Lokalisierungsstatus,
- BrandProfile,
- Onepager-Outline,
- Pitchdeck-Outline,
- Social-Formate,
- Video-Script,
- Landingpage-Copy,
- Asset-Liste,
- Distribution Plan,
- Primary KPI,
- Secondary KPIs,
- Review Checklist,
- offene Entscheidungen.

## Recommendation Report

Nach einem Discovery- oder Performance-Run erzeugt der Operator:

### Executive Summary

- wichtigste neue Entwicklungen,
- stärkste Opportunities,
- größte Evidenzlücken,
- dringendste Reviews,
- empfohlene nächste Aktionen.

### Opportunity Recommendations

Pro Empfehlung:

- was empfohlen wird,
- warum,
- welche Evidence trägt,
- welche Unsicherheit besteht,
- welche menschliche Entscheidung erforderlich ist,
- bis wann die Empfehlung aktuell bleibt.

### Campaign Recommendations

Mögliche Entscheidungen:

- `prepare`
- `launch_after_review`
- `keep`
- `improve`
- `scale`
- `pause`
- `stop`
- `refresh_evidence`
- `insufficient_evidence`

Keine Empfehlung darf als automatische Entscheidung ausgeführt werden.

## Menschliche Freigabe

Vor jeder Veröffentlichung:

- konkrete Campaign und Asset-Versionen auswählen,
- Regionen und Sprachen bestätigen,
- Accounts und Kanäle bestätigen,
- CTA und Ziel-URL bestätigen,
- Preview prüfen,
- Zeitfenster festlegen,
- PublishApproval erteilen.

Eine Freigabe gilt nicht für:

- geänderte Asset-Versionen,
- neue Sprachen,
- andere Regionen,
- andere Kanäle,
- geänderte Claims oder CTA,
- Zeitpunkte außerhalb des Freigabefensters.

## Delegierte Distribution

Der Operator darf nur ausführen, wenn:

- PublishApproval gültig,
- Content Hash identisch,
- Review abgeschlossen,
- Evidence nicht stale/rejected,
- BrandProfile freigegeben,
- Account- und Kanalrechte vorhanden,
- Connector sicher verbunden,
- Idempotency Key vorhanden,
- Preview Snapshot gespeichert.

Bei Fehler:

- fail-closed,
- keine stille Textänderung,
- keine alternative Plattform,
- kein automatisches Kürzen mit Bedeutungsänderung,
- keine unbegrenzten Retries,
- Blocker und sichere Plattformantwort dokumentieren.

## Analytics

Der Operator darf nur aggregierte Campaign Analytics verwenden.

Er muss unterscheiden:

- gemessen,
- manuell verifiziert,
- plattformgemeldet,
- geschätzt,
- stale,
- fehlend.

Er darf keine individuelle Nutzerreise rekonstruieren.

Auswertung nach:

- Campaign,
- Asset,
- Kanal,
- Region,
- Sprache,
- Zielgruppe nur bei ausreichender Gruppengröße,
- Zeitraum,
- Funnel-Stufe.

## Dynamic Growth

Neue Fähigkeiten werden als versionierte Erweiterungen eingebracht:

- Region Profile,
- Source Adapter,
- Language Pack,
- Participation Playbook,
- Campaign Template,
- KPI Definition,
- Provider Adapter,
- Recommendation Policy.

Der Operator darf eine `AgentLearningProposal` erzeugen, aber nicht selbst aktivieren.

Jede Learning Proposal enthält:

- beobachtetes Muster,
- Evidence,
- betroffene Regionen/Sprachen/Kanäle,
- vorgeschlagene Änderung,
- erwarteten Nutzen,
- Risiken,
- Tests,
- Rollback,
- Review Owner.

## Stop Conditions

Run sofort stoppen bei:

- Region/Jurisdiktion nicht auflösbar,
- Quellenprovenienz fehlt,
- aktuelle Quelle nicht verfügbar,
- Claims widersprüchlich ohne Kennzeichnung,
- rechtlich oder ethisch unzulässiger Abstimmungsentwurf,
- sensible Gruppe wird unzulässig profiliert,
- Brand-/CTA-/Produktstatus wird erfunden,
- Approval fehlt oder ist abgelaufen,
- Content Hash weicht ab,
- Credential oder Connector ist unsicher,
- externe Plattform meldet unklaren Teilstatus,
- Governance Agent lehnt ab.

## Harte Verbote

- keine autonome Publikationsentscheidung,
- keine autonome Budgetentscheidung,
- kein politisches Microtargeting,
- keine versteckte Persuasion,
- keine personenbezogenen Interessenprofile,
- keine Fake-Quellen, Fake-Partner oder Fake-Zahlen,
- keine Abstimmung über Tatsachen oder Grundrechte,
- keine automatische Behörden- oder Partnerbenachrichtigung,
- keine Secrets in Logs, Trace, Repo oder Public Assets,
- kein zweiter Campaign-, Source-, Graph- oder Analytics-Store.

## Qualitätsabnahme

Vor Review müssen alle Punkte erfüllt sein:

- Region und Zuständigkeit nachvollziehbar,
- aktuelle Originalquellen vorhanden,
- Sprachen korrekt getrennt,
- Claims und Gegenpositionen belegt,
- Unsicherheit sichtbar,
- Beteiligungseignung begründet,
- Opportunity ehrlich klassifiziert,
- CTA real,
- Kampagnenvarianten kanonisch verbunden,
- Brand- und Voxy-Regeln eingehalten,
- Distribution nicht mit Freigabe verwechselt,
- Empfehlungen zeigen Evidence und Datenqualität,
- menschliche Entscheidung bleibt sichtbar.
