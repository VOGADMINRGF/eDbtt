# Regional Civic Opportunity & Campaign Operator

Status: `product_decision / implementation_not_started`

Date: 2026-07-26

OpenTasks-ID: `MARKETING-REGIONAL-CIVIC-OPPORTUNITY-AGENT-01`

## Produktentscheidung

eDebatte behält den vollständigen Marketing-Control-Plane-, Campaign-Analytics-, White-Label-, Mehrsprachigkeits- und Agentic-Runtime-Umfang bei.

Zusätzlich wird ein kontrolliertes Orchestrierungsprofil eingeführt:

> **Regional Civic Opportunity & Campaign Operator**

Der Operator bewertet regionale und überregionale Entwicklungen, bereitet Evidenz und Beteiligungsoptionen auf, leitet Marketing- und Kampagnenempfehlungen ab, erzeugt reviewfähige Kampagnenartefakte und darf nach einer expliziten, begrenzten Freigabe eine bereits finalisierte Veröffentlichung technisch ausführen.

Er entscheidet niemals autonom, was als Wahrheit gilt, was zur Abstimmung gestellt wird oder was veröffentlicht werden darf.

## Architekturentscheidung

Der Operator ist **kein achter Inhaltsagent** und keine zweite Agentenarchitektur.

Er ist ein versioniertes Orchestrierungsprofil über der bestehenden V3-Agentik und verbindet:

- Research & Source Agent,
- Claims & Factcheck Agent,
- Intake & Format Agent,
- Participation & Moderation Agent,
- Dossier & Briefing Agent,
- Governance & Compliance Agent,
- Marketing Production Agent Playbook,
- Themenradar,
- Marketing Control Plane,
- Campaign Analytics,
- Review Queue,
- Language Bridge,
- bestehende Dossier-, Anlassraum-, Runden- und Campaign-Wahrheiten.

Der deterministische Orchestrator bleibt Koordinationsinfrastruktur. Der Operator darf keinen eigenen Graphen, keine eigene Quellenwelt, keine parallele Campaign-Persistenz und keine eigene Rollen- oder Authentifizierungslogik aufbauen.

## Zielbild

Ein berechtigter Admin kann beispielsweise festlegen:

- Region: Berlin, Bezirk Treptow-Köpenick,
- Jurisdiktion: Kommune und Land,
- Betrachtungszeitraum: letzte 72 Stunden,
- Quellsprachen: automatisch,
- Lesesprache: Deutsch,
- Ausgabesprachen: Deutsch, Englisch und Türkisch,
- Themenfelder: Mobilität, Schule, Wohnen und lokale Verwaltung,
- Ziel: relevante Themen, Dossierkandidaten, Beteiligungsoptionen und vermarktbare eDebatte-Anlässe finden.

Der Operator liefert danach keine unstrukturierte Linkliste, sondern:

1. einen nachvollziehbaren Source Pack,
2. geprüfte Themen- und Opportunity-Kandidaten,
3. Zuständigkeits- und Regionsbezug,
4. Claims, Gegenpositionen, Unsicherheiten und fehlende Stimmen,
5. eine Beteiligungseignung,
6. eine Empfehlung für Dossier, Runde, Umfrage, Priorisierung, Konsultation oder reine Information,
7. eine MarketingOpportunity,
8. einen mehrsprachigen Kampagnenvorschlag,
9. benötigte Assets und CTA,
10. einen Review- und Freigabepfad,
11. nach Veröffentlichung aggregierte Auswertung und Empfehlungen.

## Admin-Informationsarchitektur

Kanonischer Einstieg bleibt:

```text
/admin/marketing
```

Der Operator wird additiv eingebunden:

```text
/admin/marketing
├── overview
├── opportunities
├── campaigns
├── assets
├── insights
├── brands
├── agent
│   ├── runs
│   ├── regions
│   ├── source-packs
│   ├── recommendations
│   ├── approvals
│   └── activity
└── distribution
```

### `/admin/marketing/agent`

Zeigt:

- aktive und abgeschlossene Agent Runs,
- ausgewählte Region und Jurisdiktion,
- Zeitfenster und Quellabdeckung,
- Original-, Lese-, Bedien- und Ausgabesprachen,
- gefundene Evidenz und Datenqualitätswarnungen,
- Opportunity- und Kampagnenempfehlungen,
- Beteiligungseignung,
- offene Review- und Entscheidungsfragen,
- freigegebene Ausführungsaufträge,
- Agent Trace ohne private Chain-of-Thought,
- Ergebnis- und Learning-Empfehlungen.

## Run-Konfiguration

Jeder `RegionalOpportunityRun` benötigt eine explizite Konfiguration.

### Identität und Zweck

- `runId`
- `operatorProfileVersion`
- `requestedBy`
- `createdAt`
- `purpose`
- `status`
- `brandProfileId`

Zulässige Zwecke:

- `discover_civic_topics`
- `evaluate_existing_opportunities`
- `prepare_participation_candidates`
- `prepare_campaign_candidates`
- `analyze_campaign_performance`
- `refresh_region_briefing`

### Region und Jurisdiktion

- Staat,
- Bundesland/Region,
- Kommune oder Bezirk,
- optionale geografische Referenz,
- politische Ebene,
- zuständige Institutionen, soweit belegt,
- Zeitzone,
- regionale Namensvarianten,
- lokale Sprach- und Dialekthinweise,
- Ausschlussgebiete.

Regionen werden über stabile IDs und versionierte Region Profiles referenziert. Freitext allein darf keine Zuständigkeitswahrheit erzeugen.

### Zeit und Aktualität

- `timeWindowStart`
- `timeWindowEnd`
- `freshnessPolicy`
- `staleAfter`
- `retrievedAt`

Aktuelle Themen müssen aus aktuellen Quellen stammen. Historische Quellen dürfen Kontext liefern, aber nicht als aktueller Status ausgegeben werden.

### Themen- und Suchrahmen

- Themenfelder,
- Suchbegriffe,
- Ausschlüsse,
- Zielgruppen,
- betroffene Gruppen,
- gewünschte Beteiligungsarten,
- gewünschte Kampagnenkanäle,
- Risiko- und Sensitivitätsstufe,
- maximale Kandidatenzahl,
- Mindestanforderung an Evidenzdiversität.

## Sprachmodell

eDebatte behandelt Sprache nicht als einzelnes `locale`-Feld.

Jeder Run und jedes Folgeartefakt unterscheidet:

- `originalLanguage` – Sprache der Quelle oder des Originalbeitrags,
- `readingLanguage` – Sprache, in der ein Admin oder Nutzer Inhalte liest,
- `interfaceLanguage` – Sprache der Bedienoberfläche,
- `outputLanguage` – Sprache eines Kampagnen-, Dossier- oder Beteiligungsartefakts,
- `sourceLanguages` – tatsächlich abgedeckte Quellsprachen,
- `translationStatus` – maschinell, menschlich geprüft oder freigegeben.

Regeln:

- Originale bleiben erhalten.
- Übersetzung ist Lesehilfe, keine Evidenz.
- Quellen werden in ihrer Originalsprache bewertet und mit Übersetzungsstatus angezeigt.
- Lokalisierung ist nicht bloß wörtliche Übersetzung.
- Regionale Rechtsbegriffe, Institutionen, Zuständigkeiten und kulturelle Kontexte müssen separat geprüft werden.
- Mehrsprachige Varianten derselben Kampagne bleiben über eine kanonische Campaign-ID verbunden.
- Eine lokalisierte Tatsachenbehauptung braucht dieselbe oder eine zusätzliche passende Evidenz.
- Das System darf nicht aufgrund der Bedien- oder Lesesprache relevante Originalquellen ausblenden.

## Quellenstrategie

### Quellklassen

Der Operator darf Quellen suchen und klassifizieren als:

1. `official_primary`
   - Behörden,
   - Parlamente,
   - Gerichte,
   - öffentliche Register,
   - amtliche Statistiken,
   - Originalbeschlüsse und Dokumente.

2. `scientific_primary`
   - Originalstudien,
   - Forschungsdaten,
   - institutionelle Forschungsberichte.

3. `professional_context`
   - Fachverbände,
   - anerkannte Institute,
   - Berufs- und Branchenorganisationen.

4. `journalistic_context`
   - lokale, regionale, nationale und internationale journalistische Quellen.

5. `civil_society_context`
   - Initiativen,
   - NGOs,
   - Betroffenenorganisationen,
   - Interessenvertretungen.

6. `community_signal`
   - öffentliche Community-Beiträge,
   - Hinweise,
   - Kommentare,
   - Social-Signale.

Community- und Social-Signale dürfen Themenrelevanz anzeigen, sind aber ohne weitere Prüfung keine Tatsachenevidenz.

### Source Pack

Jeder Source Pack dokumentiert mindestens:

- Quelle und Herausgeber,
- URL oder stabile Referenz,
- Abrufzeitpunkt,
- Veröffentlichungszeitpunkt,
- Originalsprache,
- Jurisdiktion,
- Quellklasse,
- Lizenz-/Nutzungshinweis, soweit relevant,
- Evidenzstatus,
- Aktualität,
- welche Aussage die Quelle stützt, widerspricht oder qualifiziert,
- Übersetzungsstatus,
- bekannte Einschränkungen.

## Regionaler Discovery-Workflow

```text
Admin wählt Region, Zeitraum, Sprachen und Ziel
→ Quellen- und Suchplan erzeugen
→ aktuelle regionale und überregionale Quellen abrufen
→ Dubletten, Wiederholungen und veraltete Signale kennzeichnen
→ Source Pack mit Provenienz erstellen
→ Claims, Gegenpositionen und offene Fragen extrahieren
→ Zuständigkeit und Regionsbezug prüfen
→ betroffene Gruppen und fehlende Stimmen bestimmen
→ Themenkandidaten bewerten
→ Beteiligungseignung bestimmen
→ MarketingOpportunity ableiten
→ Kampagnen- und Assetvorschlag vorbereiten
→ menschliche Review
→ explizite Freigabe
→ optionale delegierte Distribution
→ aggregierte Auswertung
→ evidenzbasierte Empfehlung
```

## Themenkandidat

Ein `RegionalTopicCandidate` enthält mindestens:

- Titel,
- neutrale Kurzbeschreibung,
- Region und Jurisdiktion,
- Aktualitätsfenster,
- Source Pack,
- Hauptclaims,
- Gegenpositionen,
- Unsicherheiten,
- betroffene Gruppen,
- fehlende Perspektiven,
- zuständige Akteure,
- Dringlichkeit,
- Alltagsrelevanz,
- Evidenzstärke,
- Kontroversität,
- Manipulations- und Sensitivitätsrisiken,
- Themenradar-Referenz, falls vorhanden,
- empfohlener nächster Schritt.

Es gibt keinen einzelnen undurchsichtigen Gesamtscore. Dimensionen, Begründungen und Unsicherheiten bleiben sichtbar.

## Beteiligungseignung

Der Operator prüft ausdrücklich, **ob und wie** ein Thema sinnvoll beteiligungsfähig ist.

Zulässige Empfehlungen:

- `information_only`
- `dossier_first`
- `claim_factcheck`
- `open_debate`
- `structured_round`
- `survey`
- `preference_poll`
- `proposal_collection`
- `prioritization`
- `consultation`
- `co_creation`
- `not_suitable`

### Harte Grenzen

Nicht als Mehrheitsabstimmung behandeln:

- überprüfbare Tatsachen,
- Grund- und Menschenrechte,
- rechtlich nicht disponible Ansprüche,
- Sicherheit oder Würde einzelner Gruppen,
- diskriminierende Ausschlussfragen,
- laufende vertrauliche Verfahren,
- Sachverhalte ohne geklärten Zuständigkeits- oder Handlungsrahmen.

Eine Abstimmung darf Präferenzen, Prioritäten, Maßnahmenalternativen oder Zustimmung zu klar beschriebenen Optionen erfassen. Sie darf nicht bestimmen, ob ein belegter Fakt wahr ist.

### Participation Readiness

Jeder Kandidat erhält:

- `participationSuitability`
- `recommendedFormat`
- `questionDraft`
- `optionDrafts`
- `responsibleActorRefs`
- `decisionScope`
- `legalOrGovernanceConstraints`
- `missingEvidence`
- `missingVoices`
- `reviewState`

## MarketingOpportunity

Eine MarketingOpportunity darf entstehen, wenn:

- ein reales Produkt-, Themen-, Dossier-, Beteiligungs- oder Partnerartefakt vorliegt,
- Evidence nachvollziehbar ist,
- Region, Zielgruppe und Nutzen plausibel verbunden sind,
- Produktstatus und CTA ehrlich sind,
- offene Entscheidungen sichtbar bleiben.

Marketability bleibt:

- `not_marketable`
- `concept_only`
- `preview_only`
- `proof_required`
- `review_ready`
- `publicly_marketable`
- `retired`

Ein aktuelles Thema ist nicht automatisch eine Marketingchance. Ein Merge ist nicht automatisch eine Freigabe. Hohe Reichweite ist nicht automatisch gesellschaftliche Relevanz.

## Agentenempfehlungen

Der Operator darf Empfehlungen erzeugen, aber keine verbindliche Entscheidung vortäuschen.

Jede Empfehlung enthält:

- `recommendationId`
- `recommendationType`
- `summary`
- `rationale`
- `evidenceRefs`
- `confidence`
- `dataQuality`
- `assumptions`
- `risks`
- `missingEvidence`
- `requiredHumanDecision`
- `suggestedNextAction`
- `expiresAt` oder Aktualitätsgrenze.

Empfehlungstypen:

- Thema weiter untersuchen,
- Dossier erstellen oder aktualisieren,
- Beteiligungsformat vorbereiten,
- Opportunity zurückstellen,
- Kampagne vorbereiten,
- Asset überarbeiten,
- zusätzliche Sprache oder Region ergänzen,
- Kanal priorisieren,
- Kampagne fortsetzen,
- iterieren,
- skalieren,
- pausieren,
- stoppen,
- Evidenz erneuern.

## Kampagnenproduktion

Aus einer freigegebenen Opportunity kann der Operator einen Campaign Draft erzeugen:

- Ziel und Zieltyp,
- Zielgruppe,
- Region,
- Primary KPI und Secondary KPIs,
- Kernbotschaft,
- Claims mit Evidence,
- Gegenpositionen und Grenzen,
- CTA,
- BrandProfile,
- Original- und Ausgabesprachen,
- Onepager,
- Pitchdeck,
- Social-Formate,
- Video-Script und Storyboard,
- Landingpage-Copy,
- Distribution Plan,
- Review Checklist,
- Analytics Plan,
- anbieterneutrale Dateinamen.

Der Operator darf Varianten für Regionen, Sprachen, Kanäle und Zielgruppen vorschlagen. Jede Variante bleibt versioniert und auf dieselbe kanonische Campaign und Evidence zurückführbar.

## Mensch-Agent-Zusammenarbeit

Der Kampagnenprozess ist kooperativ:

```text
Agent erzeugt begründeten Draft
→ Admin/Editor korrigiert Ziel, Aussage, Format oder Region
→ Agent aktualisiert abhängige Assets konsistent
→ Reviewer prüft Quellen, Sprache, CI, CTA, Privacy und Governance
→ Approver gibt konkrete Versionen und Kanäle frei
→ Operator führt optional die freigegebene Distribution aus
```

Eine Änderung an Kernbotschaft, Claim, CTA, Region, Sprache, Asset-Version oder Ziel-URL nach der Freigabe invalidiert die Veröffentlichungsfreigabe.

## Veröffentlichungsentscheidung

Die bestehende Regel `no autonomous publication` bleibt bestehen.

Gleichzeitig wird **delegierte Ausführung nach expliziter Freigabe** als Zielbild erlaubt.

Das bedeutet:

- Der Agent entscheidet nicht, ob veröffentlicht wird.
- Ein berechtigter Mensch genehmigt eine konkrete Kampagne, konkrete Asset-Versionen, Sprachen, Accounts, Kanäle und ein Zeitfenster.
- Der Agent darf danach ausschließlich diesen freigegebenen Auftrag technisch ausführen.
- Diese Ausführung ist kein Auto-Publish-Bypass.

### PublishApproval

Jede delegierte Ausführung benötigt ein nicht übertragbares `PublishApproval` mit:

- Approval-ID,
- Campaign-ID,
- freigegebenen Asset-Versionen,
- freigegebenen Locales,
- Region und Jurisdiktion,
- Kanälen,
- Publisher-/Account-Referenzen,
- Ziel-URLs,
- CTA,
- frühestem und spätestem Zeitpunkt,
- optionalem exakten Schedule,
- Freigebendem,
- Freigabezeitpunkt,
- Ablaufzeitpunkt,
- einmaliger oder begrenzter Ausführungsanzahl,
- Widerrufsstatus,
- Hash der freigegebenen Inhalte,
- Governance- und Preflight-Status.

### Preflight vor Distribution

Vor jeder Ausführung muss der Operator prüfen:

- Approval gültig und nicht widerrufen,
- Content Hash unverändert,
- Asset und BrandProfile freigegeben,
- Quelle und Evidence nicht stale oder rejected,
- CTA und Ziel-URL erreichbar und freigegeben,
- Locale und Region stimmen,
- Kanal und Account stimmen,
- Credentials über sicheren Connector verfügbar,
- keine Secrets im Repo oder Trace,
- keine Doppelveröffentlichung,
- Plattformgrenzen und Zeichenlängen eingehalten,
- finaler Preview-Snapshot vorhanden.

Bei Abweichung wird nicht veröffentlicht. Der Run stoppt mit einem verständlichen Blocker.

### DistributionResult

Nach der Ausführung werden dokumentiert:

- Erfolg, Teilfehler oder Fehler,
- externe ID und URL,
- tatsächlicher Zeitpunkt,
- verwendete Asset-Version,
- Approval-ID,
- idempotency key,
- Plattformantwort in sicherer, reduzierter Form,
- Retry-Status,
- DistributionRecord,
- Audit Event.

Keine automatische Wiederholung ohne Idempotenz- und Fehlercontract.

## Campaign Analytics und Learning Loop

Der Operator liest ausschließlich zulässige aggregierte Campaign-Analytics-Daten.

Er darf auswerten:

- Kampagnenziel und Primary KPI,
- Funnel-Stufen,
- Kanal- und Assetvergleich,
- Sprach- und Regionsvarianten,
- qualifizierte Reichweite,
- Video Completion,
- CTA-Klicks,
- begonnene oder abgeschlossene Produktaktionen,
- qualifizierte Anfragen und aggregierte Outcomes,
- Produktionszeit und Review-Schleifen,
- Kosten, soweit belegt,
- Datenqualität,
- Learnings.

Er darf daraus Empfehlungen ableiten, aber nicht autonom:

- Budget ändern,
- Kampagnen stoppen oder starten,
- Botschaften verändern,
- Zielgruppenprofile bilden,
- neue Veröffentlichungen freigeben,
- personenbezogene Journeys erzeugen.

Ergebnisempfehlungen:

- `keep`
- `improve`
- `scale`
- `pause`
- `stop`
- `insufficient_evidence`

Jede Empfehlung zeigt Evidenz, Datenqualität und Unsicherheit.

## Dynamisches Mitwachsen

Der Operator wächst nicht durch unkontrollierte Selbstmodifikation, sondern über versionierte Bausteine:

- Region Profiles,
- Source Adapters,
- Language Packs,
- Topic Taxonomies,
- Participation Playbooks,
- Campaign Templates,
- BrandProfiles,
- KPI Definitions,
- Provider Adapters,
- Recommendation Policies,
- Safety Policies.

Jede Änderung braucht:

- Version,
- Owner,
- Changelog,
- Tests,
- Review,
- Rollback-Möglichkeit,
- Kompatibilitätsangabe.

Der Operator darf aus Ergebnissen Vorschläge für neue Regeln oder Templates erzeugen. Er darf seine Produktionsregeln, Gewichte, Quellenlisten oder Freigabegrenzen nicht selbst freischalten.

## Wiederkehrende regionale Beobachtung

Später kann ein Admin einen wiederkehrenden Regional Run konfigurieren.

Zulässige Modi:

- manuell,
- täglich,
- werktäglich,
- wöchentlich,
- ereignisbezogen nach explizit freigegebenem Trigger.

Ein wiederkehrender Run darf:

- neue Quellen und Themenkandidaten erfassen,
- stale Evidence markieren,
- bestehende Opportunities aktualisieren,
- Empfehlungen erzeugen,
- Reviewbedarf melden.

Er darf nicht ohne separate PublishApproval veröffentlichen oder externe Empfänger kontaktieren.

## Daten- und Privacy-Grenzen

- keine individuellen politischen Interessenprofile,
- keine personenbezogenen Cross-Channel-Journeys,
- keine Kontakt- oder Gesprächsdaten in Campaign Analytics,
- keine personenbezogenen UTM-Keys,
- keine Speicherung von Social- oder Plattform-Credentials im Repository,
- keine unkontrollierte Rohdatenhaltung,
- keine verdeckte Überwachung regionaler Gruppen,
- öffentliche Social-Signale nur als Hinweis und nicht als Personenakte,
- Mindestgruppengrößen und Suppression aus dem Campaign-Analytics-Contract bleiben verbindlich,
- PII bleibt in dafür vorgesehenen sicheren Stores.

## Governance-Grenzen

Der Operator darf nicht:

- Tatsachen zur Abstimmung stellen,
- künstlichen Konsens erzeugen,
- politische Positionen manipulativ priorisieren,
- Minderheitenperspektiven wegen geringer Interaktion entfernen,
- offizielle VoiceOpenGov-Positionen erfinden,
- Partnerinteressen als neutrale Wahrheit darstellen,
- lokale Zuständigkeit behaupten, wenn sie nicht belegt ist,
- eine kommunale oder institutionelle Beteiligung als offiziell darstellen, solange keine entsprechende Freigabe vorliegt,
- Behörden oder Partner automatisch benachrichtigen,
- `autoPostEligible=false` umgehen.

## Rollen und Capabilities

Der Operator nutzt das bestehende Admin-/2FA-Gate.

Ziel-Capabilities:

- `marketing_agent_run_view`
- `marketing_agent_run_create`
- `marketing_agent_recommendation_review`
- `marketing_agent_campaign_prepare`
- `marketing_publish_approve`
- `marketing_publish_execute`
- `marketing_publish_revoke`
- `marketing_agent_policy_manage`
- `marketing_agent_region_manage`
- `marketing_agent_source_manage`

Diese Capabilities sind keine automatischen globalen Rollen. `admin`, `editor`, `partner`, `member` oder `reviewer` erhalten daraus keine impliziten Rechte.

Für Publish Approval, Credential-Verknüpfung und Policy Management sind 2FA, Audit und erhöhte Berechtigung zwingend.

## Kernobjekte

- `RegionalOpportunityRun`
- `RegionProfile`
- `SourcePlan`
- `SourcePack`
- `SourceEvidence`
- `RegionalTopicCandidate`
- `ParticipationSuitabilityAssessment`
- `MarketingOpportunity`
- `AgentRecommendation`
- `CampaignDraft`
- `CampaignLocalizationVariant`
- `PublishApproval`
- `DistributionExecution`
- `DistributionResult`
- `AgentLearningProposal`
- `AgentRunTrace`

Die maschinenlesbare Zielshape liegt unter:

- `docs/marketing/schemas/regional-civic-opportunity-run.schema.json`

## Safe Trace

Jeder Run zeigt nutzersicher:

- Auftrag und Konfiguration,
- verwendete Agentenrollen,
- Quellenanzahl und Quellklassen,
- abgedeckte Sprachen,
- Regions- und Jurisdiktionsannahmen,
- Kandidaten und Ausschlussgründe,
- Evidence- und Datenqualitätsstatus,
- Review- und Approval-Schritte,
- Distribution-Preflight,
- Ergebnis und Blocker.

Keine private Chain-of-Thought, keine Secrets, keine unnötigen personenbezogenen Daten.

## Umsetzungsslices

### Slice A — Contract, Schema und Playbook

Status nach Merge dieses Decision-PRs: `done`

- E150 Decision Contract,
- Operator Playbook,
- maschinenlesbares Schema,
- OpenTasks- und Issue-Zerlegung.

### Slice B — Regional Agent Run Registry und Admin Readmodel

Status: `blocked_by_MARKETING-REGISTRY-READMODEL-01`

- `/admin/marketing/agent/runs`,
- Run-Konfiguration,
- read-only Trace,
- Region-, Sprach- und Source-Plan-Anzeige,
- keine externen Suchprovider,
- Fixtures und manuell gepflegte Source Packs.

### Slice C — Regional Source Discovery und Provenance

Status: `needs_provider_and_source_policy_decision`

- freigegebene Quellenadapter,
- aktuelle regionale Suche,
- Originalsprache und Provenienz,
- Freshness und Stale-Erkennung,
- keine Kampagnengenerierung ohne Evidence.

### Slice D — Multilingual Topic, Participation und Opportunity Evaluation

Status: `blocked_by_slices_B_and_C`

- Claim- und Gegenpositionsanalyse,
- Jurisdiktions- und Zuständigkeitsprüfung,
- Beteiligungseignung,
- MarketingOpportunity,
- mehrsprachige, reviewfähige Ausgabe.

### Slice E — Campaign Co-Creation Studio

Status: `blocked_by_slice_D_and_MARKETING_LIFECYCLE-02`

- Kampagnenbrief,
- lokalisierte Varianten,
- Asset- und Videoentwürfe,
- konsistente Agent-Mensch-Iteration,
- keine Distribution.

### Slice F — Campaign Recommendation and Learning Agent

Status: `blocked_by_MARKETING-CAMPAIGN-ANALYTICS-01`

- Performance-Auswertung,
- Evidence- und Datenqualitätsbewertung,
- Keep/Improve/Scale/Pause/Stop-Empfehlungen,
- keine automatische Änderung.

### Slice G — Scoped Distribution Approval

Status: `needs_security_privacy_and_credential_decision`

- PublishApproval,
- Hash- und Versionsbindung,
- Freigabe, Ablauf und Widerruf,
- kein Providerzugriff.

### Slice H — Delegated Distribution Executor

Status: `blocked_by_slice_G_and_provider_adapters`

- sichere Connectoren,
- Preflight,
- einmalige oder begrenzte Ausführung,
- DistributionRecord und Audit,
- keine autonome Veröffentlichung.

### Slice I — Recurring Regional Monitoring

Status: `blocked_by_slices_C_D_and_governance_review`

- wiederkehrende Runs,
- Aktualitäts- und Evidence-Refresh,
- neue Empfehlungen,
- keine automatische Distribution.

## Acceptance Criteria für das Zielbild

- ein Admin kann eine Region, Jurisdiktion, Zeitspanne und Sprachlogik festlegen,
- der Operator findet aktuelle Quellen in relevanten Originalsprachen,
- Quellen, Übersetzungen und Provenienz bleiben nachvollziehbar,
- Themenkandidaten zeigen Claims, Gegenpositionen, betroffene Gruppen und Unsicherheit,
- die Eignung für Dossier, Runde, Umfrage oder Abstimmung wird explizit geprüft,
- Tatsachen und Rechte werden nicht zur Mehrheitsentscheidung gemacht,
- Opportunities und Kampagnen bleiben evidence-basiert,
- mehrsprachige Kampagnenvarianten sind kanonisch verbunden,
- das System erzeugt vollständige reviewfähige Kampagnenpakete,
- der Agent leitet aus aggregierter Performance nachvollziehbare Empfehlungen ab,
- der Agent darf nur nach konkreter, versionierter und widerrufbarer Freigabe veröffentlichen,
- Änderungen nach Freigabe invalidieren die PublishApproval,
- Distribution ist idempotent, auditierbar und fail-closed,
- keine zweite Agenten-, Quellen-, Campaign-, Graph-, Auth- oder Analytics-Wahrheit entsteht,
- Region Packs, Source Adapters, Languages, Templates und Policies können versioniert erweitert werden,
- keine unkontrollierte Selbstmodifikation oder autonome politische Entscheidung ist möglich.

## Verbindliche Statusentscheidung

- ursprünglicher Marketing-Control-Plane-Umfang: `retained`
- Mehrsprachigkeit und regionale Steuerung: `required`
- regionaler Civic Opportunity Operator: `approved_as_target_architecture`
- autonome Themen- oder Publikationsentscheidung: `forbidden`
- menschlich freigegebene delegierte Distribution: `approved_as_target_architecture`
- unmittelbare technische Umsetzung des Operators: `blocked_by_registry_and_followup_slices`
- nächster technischer Marketing-Slice bleibt: `MARKETING-REGISTRY-READMODEL-01`
