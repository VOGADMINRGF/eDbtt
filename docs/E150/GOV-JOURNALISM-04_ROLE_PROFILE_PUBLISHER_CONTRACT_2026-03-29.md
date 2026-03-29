# GOV-JOURNALISM-04 Role/Profile/Publisher Contract (2026-03-29)

Ziel: journalistische Rollen-/Profilanschluesse produktnah absichern,
ohne Medien-Sondermacht und ohne Parallelkanon.

## 1) Scope des Slices

- Journalistische Rollen-/Profiltypen kontraktnah typisieren.
- Einzeljournalisten, kleine Formate und regionale Kontexte explizit anschlussfaehig halten.
- Publisher-/Redaktionskontext als professioneller Arbeitskontext einordnen, nicht als Wahrheitsprivileg.
- Explainability-/Audit- und Konsistenzrahmen fuer den Journalism-Stack einfrieren.

## 2) Repo-nahe Implementierungsanker

- Shared Role/Profile-Contract:
  - `features/anlassraum/journalismRoleProfileContract.ts`
- Route-nahe Meta-Einbindung:
  - `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
  - `meta.journalismRoleProfile`
  - `meta.journalismConsistency`
- Regressionstests:
  - `apps/web/tests/journalism-role-profile-contract.test.ts`
  - `apps/web/tests/admin-governance-anlassraum.route.test.ts`

## 3) Contract-Kern aus GOV-JOURNALISM-04

- Typed Profile:
  - `public_journalism_context`
  - `solo_journalist_creator`
  - `editorial_team`
  - `publisher_context`
- Typed Actions sind pro Profil begrenzt und nachvollziehbar.
- Reason-/Audit-pflichtige Aktionen bleiben explizit.
- Guardrails bleiben verpflichtend:
  - kein Wahrheitsprivileg
  - kein Prioritaetsprivileg
  - keine Statusableitung fuer Factcheck/Dossier aus Rollenprivileg
  - kein epistemischer Abschluss durch redaktionellen oder Publisher-Kontext

## 4) Konsistenzrahmen (zusammenfuehrend)

`validateJournalismContractConsistency` prueft uebergreifend:
- Truth-Guardrails + Companion-Contract + Role/Profile-Contract bleiben konsistent.
- `source_anchor`-Kontext driftet nicht zwischen den Contract-Ebenen.
- oeffentliche Companion-Kontexte behalten den offenen Dossier-Kern.
- `public_journalism_context` bekommt kein verstecktes Publisher-Privileg.

## 5) Ergebnis

- Journalism-Stack ist als zusammenhaengender Contract aus Anlassgeber, Guardrails,
  Companion-Anschluss und Rollenprofil regressionssicherer.
- Teamfaehige redaktionelle Nutzung bleibt moeglich, ohne Medien-Sonderkanal.
- Kleine/freie/redaktionelle Formate bleiben explizit anschlussfaehig.

## 6) Bewusst nicht Teil dieses Slices

- Kein neuer Publisher-Workspace.
- Kein gesondertes Medien-Routing.
- Kein UI-Grossumbau fuer Companion/Embed/QR.
