# V3 Voxy Render Cost Credit Policy Noop Audit

Datum: 2026-07-10
Task: `V3-VOXY-RENDER-COST-CREDIT-POLICY-NOOP-01`
Status: done

## Ziel

Nach `Render-Request-Draft` und `Render-Queue-Vertrag` wurde ein ehrlicher `Kosten & Credits`-Layer ergänzt:

- zeigt nur, welche Cost-, Credit-, Limit-, Account- und Metering-Prüfungen ein späterer echter Voxy-Renderlauf bräuchte
- schreibt keine Billing-Wahrheit
- bucht keine Kosten
- zieht keine Credits ab
- erzeugt keine Invoice
- startet keine Queue
- startet keinen Worker
- startet keinen Provider
- erzeugt keine Medien-Datei
- lädt nichts hoch
- veröffentlicht nichts

Der Slice ist bewusst `policy_preview_only` / `needs_*` / `noop_billing`, nie Billing-Runtime.

## Umgesetzte Artefakte

- `apps/web/src/features/create/voxyRenderCostCreditPolicyContract.ts`
- `apps/web/src/features/create/voxyRenderCostCreditPolicyStore.ts`
- `apps/web/src/features/create/VoxyRenderCostCreditPolicyPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-cost-credit-policies/route.ts`

Integration additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Repo-Inventur: echte Cost-/Credit-/Limit-Strukturen

### Vorhanden

1. `apps/web/src/features/voxy/accessContract.ts`
   Enthält echte Voxy-Plan- und Capability-Matrix (`public`, `member`, `author_plus`, `partner`, `operator`, `admin`) inkl. `voxy_visual_brief_generate`.

2. `apps/web/src/lib/server/entitlements/createEntitlements.ts`
   Enthält echte Create-/Account-Entitlements wie `monthlyContributionLimit`, `contributionCredits`, `nextCreditIn`, `creditRequiredForContribution`, `canDeepResearch`.

3. `apps/web/src/app/api/admin/entitlements/route.ts` und `apps/web/src/app/api/admin/entitlements/[id]/route.ts`
   Enthalten echte Admin-Entitlement-Limits wie `maxDraftsPerMonth`, `factcheckCredits` und weitere Paketgrenzen.

4. `apps/web/src/app/api/admin/telemetry/ai/usage/route.ts`
   Enthält echte AI-Usage-/Budget-/Warn-Sicht, aber keine Voxy-Render-Preise.

5. `apps/web/src/features/admin/v3DeepsearchCostGovernanceReadModel.ts`
   Enthält ein echtes Governance-Muster für AI-/Deepsearch-Kosten, jedoch nicht für Voxy-Render-Billing.

### Nicht vorhanden

1. Keine belastbare Voxy-Render-Provider-Preisquelle
   Es gibt im Repo keine ehrliche Preiswahrheit für Avatar-, Voice- oder Render-Provider, die hier als Betrag ausgegeben werden dürfte.

2. Keine Voxy-Render-Credit-Policy
   Bestehende Credits und Entitlements sind nicht automatisch Voxy-Render-Credits und wurden deshalb nicht still umgedeutet.

3. Keine Voxy-Render-Limit-Policy
   Es existiert keine belastbare Policy für `perAccountLimit`, `perDayLimit`, `perDossierLimit` oder `perProviderLimit`, die heute als echte Freigabewahrheit gelten dürfte.

4. Keine Voxy-Render-Metering-Wahrheit
   Es gibt keine per-run Usage-/Cost-Metering-Schicht für Voxy-Renderläufe.

5. Keine Billing-Runtime
   Kein Cost-Debit, kein Credit-Debit, keine Invoice, kein Payment, keine Providerabrechnung.

## Warum dieser Slice nichts bucht und nichts abzieht

Der neue Layer ist absichtlich unterhalb jeder Ausführung gebaut:

- alle Billing-Flags bleiben `false`
- alle Queue-/Worker-/Provider-/Media-/Upload-/Publish-Flags bleiben `false`
- `costEstimateStatus` zeigt nur `provider_pricing_needed`, `estimate_not_claimed`, `blocked` oder `not_available`
- `creditStatus` und `limitStatus` behaupten keine Live-Freigabe
- `estimatedCostAmount`, `creditsRequired`, `creditsAvailable` und Limits bleiben leer, solange keine belastbare Quelle existiert

Damit gilt ausdrücklich:

- `cost_policy` ist nicht Billing
- `cost_estimate` ist keine Buchung
- `credit_check` ist keine Abbuchung
- `limit_check` ist keine Ausführungsfreigabe
- `queue_contract` ist nicht `queue_runtime`
- `request_draft` ist nicht `render_job`

## Statuslogik des Slices

Der Contract unterscheidet u. a.:

- `blocked_by_missing_request_draft`
- `blocked_by_missing_queue_contract`
- `blocked_by_missing_provider`
- `blocked_by_missing_assets`
- `blocked_by_runtime_truth`
- `keep_as_script_only`
- `needs_account_context`
- `needs_provider_pricing`
- `needs_credit_policy`
- `needs_limit_policy`
- `needs_runtime_metering`
- `policy_preview_only`
- `noop_billing`

Damit wird sichtbar, ob ein späterer Renderlauf aktuell an Provider-, Asset-, Account-, Pricing-, Credit-, Limit- oder Metering-Wahrheit scheitert, ohne diese Wahrheit vorzutäuschen.

## Persistenzgrenze

Der Slice nutzt dasselbe Muster wie die vorherigen Voxy-Render-Slices:

- Mongo-Primary, wenn verfügbar
- In-Memory-Fallback mit ehrlicher Kennzeichnung
- Admin-only `GET`/`POST` unter `/api/admin/voxy-render-cost-credit-policies`
- nur Preview-/Audit-Records
- keine Buchung, keine Abbuchung, kein Payment, keine Queue

## UI-Lesart

Die Oberflächen zeigen jetzt additiv:

- `Kosten & Credits`
- `Noch keine Buchung`
- `Keine Credit-Abbuchung`
- `Keine Providerkosten behauptet`
- `Keine Queue-Ausführung`

Sichtbar werden:

- Cost-Policy-Status
- Credit-Policy-Status
- Limit-Policy-Status
- Account-Kontext
- Provider-Pricing-Hinweis
- Runtime-/Metering-Hinweis
- Blocker
- nächste Policy-Aktion

Keine Oberfläche zeigt:

- `Jetzt buchen`
- `Credits abbuchen`
- Fake-Preise
- Fake-Credits
- Fake-Limits

## Tests

Neu:

- `apps/web/tests/voxy-render-cost-credit-policy.contract.test.tsx`
- `apps/web/tests/voxy-render-cost-credit-policy.route.test.ts`

Erweitert:

- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

## Was für einen späteren echten Renderlauf zusätzlich fehlt

Ein echter Folgeslice bräuchte mindestens:

1. belastbare Provider-Pricing-Wahrheit pro Avatar-/Voice-/Render-Partner
2. kanonische Voxy-Render-Credit-Policy mit klarer Account-Zuordnung
3. kanonische Voxy-Render-Limit-Policy für Account, Tag, Dossier und Provider
4. per-run Metering-Wahrheit
5. echte Billing-/Debit-/Invoice-/Payment-Runtime
6. sichere Korrelation zwischen Policy-Prüfung und späterem Queue-/Worker-/Providerlauf
7. eigene Guardrails gegen stille Preis- oder Credit-Behauptungen

## Nächster sinnvoller Slice

Sinnvoller Follow-up:

- separate, reine Readmodel-Slice für belastbare Provider-Pricing-Quellen
- erst danach Credit-/Limit-Policy-Härtung
- Billing-/Debit-/Payment-Runtime weiterhin getrennt und deutlich später
