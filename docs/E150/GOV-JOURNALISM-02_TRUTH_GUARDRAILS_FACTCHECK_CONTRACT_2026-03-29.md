# GOV-JOURNALISM-02 Truth Guardrails + Factcheck Contract (2026-03-29)

Ziel: Den manifestierten Journalismus-Kanon (`GOV-JOURNALISM-01`) kontraktnah verankern,
ohne Sonderwahrheit, ohne Prioritaetsprivileg und ohne neue Leitentscheidung.

## 1) Scope dieses Slices

- `source_anchor` bleibt legitimer Startkontext.
- Journalistische Kontexte bleiben an Review-/Factcheck-/Dossier-Pfade anschlussfaehig.
- Kein Anchor-basierter Wahrheits- oder Prioritaetsstatus.
- Keine neue Queue-, UI- oder Payment-Logik.

## 2) Repo-nahe Ist-Anker

- Anlassraum-Create-Gate:
  - `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- Anlassraum-Governance und Publish-Gate:
  - `features/anlassraum/governance.ts`
- Anlassraum-Origin-Typen:
  - `features/anlassraum/types.ts` (`originType` inkl. `source_anchor`)
- Factcheck/Finding-Routen:
  - `apps/web/src/app/api/factcheck/enqueue/route.ts`
  - `apps/web/src/app/api/factcheck/status/route.ts`
  - `apps/web/src/app/api/finding/upsert/route.ts`

## 3) Kontrakt-Haertung aus GOV-JOURNALISM-02

### Shared Guardrail-Resolver

- Datei: `features/anlassraum/journalismGuardrails.ts`
- Resolver: `resolveJournalismTruthGuardrails({ originType })`
- Liefert einen typed Contract mit:
  - Kontext (`source_anchor` vs. Standardkontext)
  - expliziten Verboten:
    - kein Wahrheitsstatus aus Anchor
    - kein Prioritaetsprivileg aus Medienstatus
    - keine Statusableitung fuer Factcheck/Finding/Dossier aus Anchor
  - expliziten Pflichten:
    - offene Fragen sichtbar halten
    - Gegenperspektiven sichtbar halten
    - Auditspur beibehalten
  - zulaessigen journalistischen Staerken (Anlass ausloesen, strukturieren, Pruefpfade sichtbar machen)

### Route-nahe Einbindung

- `apps/web/src/app/api/admin/governance/anlassraum/route.ts` liefert Guardrail-Meta in der Antwort:
  - `meta.journalismTruthGuardrails`
- Das ist rein kontrakt-/explainability-seitig; keine neue Sonderroute, kein neuer Privilegpfad.

## 4) Testabdeckung

- `apps/web/tests/journalism-truth-guardrails.test.ts`
  - source_anchor-Kontext ohne Wahrheits-/Prioritaetsprivileg
  - Standardkontext mit identischen Kern-Guardrails
  - Alias-Normalisierung (`Source-Anchor`)
- `apps/web/tests/admin-governance-anlassraum.route.test.ts`
  - Route liefert Guardrail-Meta fuer source_anchor und non-source Kontexte

## 5) Bewusst nicht Teil dieses Slices

- Kein neuer journalistischer Sonderkanal fuer Publish/Review.
- Keine automatische Factcheck-/Finding-/Dossier-Statusableitung aus Medienstatus.
- Kein UI-Ausbau fuer journalistische Queues.
- Keine neue Leitentscheidung zu `GOV-JOURNALISM-03` oder `GOV-JOURNALISM-04`.
