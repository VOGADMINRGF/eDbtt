# V3 Production Queue Normalization

## Ausgangslage

Nach den gemergten Clustern `#361` (Pricing / Order / Membership) und `#362` (Editorial Series / Review-first Export) blieb der Lean Continuous Runner praktisch stehen.

Die operative Queue in `docs/E150/OpenTasks.md` hatte zuletzt nur noch drei `codex_ready` Eintraege:

- `WORKTREE-COMMIT-CREATE-LEDGER-HANDOFF-14B2`
- `GOV-B2B-01`
- `GOV-CIVIC-ECON-01`

Das reichte nicht fuer einen autonomen produktionsrelevanten Runner-Durchlauf:

- `WORKTREE-COMMIT-CREATE-LEDGER-HANDOFF-14B2` ist Maintenance-only und kein Produktcluster.
- `GOV-B2B-01` war trotz `Decision open = yes` faelschlich als `codex_ready` markiert.
- `GOV-CIVIC-ECON-01` ist ein legitimer docs-/contract-first Slice, aber kein priorisierter Produktionsreife-Cluster fuer Auth, Dossier, Public QA oder Admin.

## Ziel dieses Slices

- `OpenTasks.md` so normalisieren, dass wieder mehrere echte produktionsrelevante `codex_ready` Cluster existieren.
- Keine Produktfeatures implementieren.
- Keine offene Produktentscheidung still treffen.
- Kuenftige Runner-Laeufe nicht mehr von einem externen Branch-Prompt abhaengig machen.

## Geaenderte Queue-Entscheidungen

### Neu als `codex_ready`

1. `V3-AUTH-ACCOUNT-ORG-DIRECT-START-PATH-01`
   Cluster: Auth / Registrierung / Account / Organisation
   Grund: die benoetigten Surfaces existieren bereits (`/login`, `/register`, `/account`, `/account/organization`, `/order`), der direkte Startpfad ist kanonisch, `/vormerken` ist nur noch Legacy/Fallback.

2. `V3-ROLES-PERMISSIONS-ENTITLEMENTS-SURFACE-AUDIT-01`
   Cluster: Roles / Permissions / Entitlements
   Grund: Membership-, Entitlement- und Pricing-Wahrheit ist produktiv vorhanden; der breite Parent-Task war zu grob und wurde in einen ausfuehrbaren Surface-Slice geschnitten.

3. `V3-DOSSIER-CLAIMS-FACTCHECK-REVIEW-HARMONIZATION-01`
   Cluster: Dossier / Claims / Factcheck / Review
   Grund: Claims-, Factcheck-, Review- und Dossier-Studio-Surfaces existieren bereits und koennen ohne Provider- oder Publish-Runtime semantisch harmonisiert werden.

4. `V3-FEED-SOURCE-INTAKE-REVIEW-HANDOFF-01`
   Cluster: Feed / Source / Material / Review-Handoff
   Grund: Source Connections, Snapshot Templates, Material Intake und Create-Handoffs sind produktiv oder review-first vorhanden; die sichtbare Handoff-Wahrheit ist noch nicht kanonisch zusammengezogen.

5. `V3-PUBLIC-QA-MOBILE-DEBUG-LEAK-PASS-01`
   Cluster: Public QA / Mobile / Debug Leak
   Grund: die oeffentlichen Einstiegsrouten und Leak-/Route-Tests sind vorhanden; es fehlt ein klar geschnittener Produktionsreife-Pass ueber CTA-Kanon, mobile Lesbarkeit und Debug-Leak-Schutz.

6. `V3-ADMIN-OPERATOR-REVIEW-WORKBENCH-HARDENING-01`
   Cluster: Admin / Operator / Review Workbench
   Grund: `/admin`, `/admin/review`, `/admin/errors`, `/admin/system`, `/admin/entitlements` und `/admin/pricing/orders` existieren bereits und koennen ohne neue Runtime auf gemeinsame Status- und Next-Step-Wahrheit gehaertet werden.

### Bewusst nicht neu `codex_ready`

- `GOV-B2B-01`
  Entscheidung: von `codex_ready` auf `needs_decision` gesetzt.
  Grund: `Decision open = yes` blieb offen; der Task darf nicht autonom gestartet werden.

- `GOV-CIVIC-ECON-01`
  Entscheidung: bleibt `codex_ready`.
  Grund: legitim umsetzbarer docs-/contract-first Slice.
  Zusatz: explizit als nicht vorrangiger Produktionsreife-Cluster markiert.

- `WORKTREE-COMMIT-CREATE-LEDGER-HANDOFF-14B2`
  Entscheidung: bleibt `codex_ready`.
  Zusatz: explizit als Maintenance-only markiert, damit der Produktionsrunner daran nicht haengen bleibt.

- `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
  Entscheidung: bleibt `in_progress`.
  Grund: laufender breiter Parent-Slice, noch kein sauberer neuer Runner-Einstieg.

- `V3-UNIFIED-REVIEW-QUEUE-01`
  Entscheidung: bleibt `in_progress`.
  Grund: breite Parent-Arbeit mit laufender Review-Queue-Harmonisierung, nicht der naechste kleine autonome PR-Slice.

- `V3-DOSSIER-WORKSPACE-REVIEW-SURFACE-01`
  Entscheidung: bleibt `in_progress`.
  Grund: noch Teil derselben breiteren V3-Review-/Workspace-Lesart.

- `V3-ROLES-PERMISSIONS-ENTITLEMENTS-01`
  Entscheidung: bleibt `open`.
  Grund: Parent-Task ist weiterhin sinnvoll, aber fuer den Runner zu breit; erster startbarer Kind-Slice ist jetzt `...SURFACE-AUDIT-01`.

## Empfohlene naechste Runner-Reihenfolge

1. `V3-AUTH-ACCOUNT-ORG-DIRECT-START-PATH-01`
2. `V3-ROLES-PERMISSIONS-ENTITLEMENTS-SURFACE-AUDIT-01`
3. `V3-PUBLIC-QA-MOBILE-DEBUG-LEAK-PASS-01`
4. `V3-DOSSIER-CLAIMS-FACTCHECK-REVIEW-HARMONIZATION-01`
5. `V3-FEED-SOURCE-INTAKE-REVIEW-HANDOFF-01`
6. `V3-ADMIN-OPERATOR-REVIEW-WORKBENCH-HARDENING-01`
7. `GOV-CIVIC-ECON-01`
8. `WORKTREE-COMMIT-CREATE-LEDGER-HANDOFF-14B2`

## Cluster-Prioritaet

1. Auth / Registrierung / direkt loslegen / Account / Organization
2. Dossier / Claims / Factcheck / Feeds / Review Queue
3. Public QA / Mobile / Debug Leak / CTA-Integritaet
4. Admin / Moderation / Operator-Reife
5. Governance nur dann, wenn kein besserer Produktcluster verfuegbar ist
6. Worktree-/Commit-Hygiene nur bei realer Blockade

## Stop-Bedingungen fuer den Runner

- `needs_decision`, `blocked`, `research_only`, `in_progress` oder `done`
- roter Pflichtcheck nach zwei Reparaturversuchen
- erforderliche Secrets, Provider-Credentials, externe API-Calls oder Kosten
- fehlende Produktentscheidung zu Route, Rolle, Sichtbarkeit, Pricing oder Governance
- fachlich weit entfernter naechster Task nach Abschluss eines Clusters

## Lokaler Runner-Prompt

Da `.codex/prompts/lean-continuous-slice-runner.md` im Repo fehlte, wurde eine lokale Fassung angelegt.

Zweck:

- künftige Codex-Laeufe koennen den Lean Runner direkt aus dem Repo lesen;
- die Cluster-Logik ist darin explizit verankert;
- kein externer Branch- oder Remote-Prompt ist fuer Standardlaeufe mehr noetig.

## Nicht Teil dieses Slices

- keine Produktfeatures
- keine App-Surface-Umbauten
- keine Runtime-Aktivierung
- kein Auto-Publish
- keine externen API-Calls
- keine Secrets
- keine Kosten
- keine neue Zahlung
- keine Fake-Daten, Fake-Zahlen oder Fake-Quellen
