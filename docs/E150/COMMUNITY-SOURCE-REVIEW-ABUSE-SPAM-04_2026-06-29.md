# COMMUNITY-SOURCE-REVIEW-ABUSE-SPAM-04

Stand: 2026-06-29
Repo: `edebatte-org`
Bezug: Stand nach `#260`

## Ausgangslage

Nach `#260` existieren bereits:

- ein persistenter `communitySourceReviewServer.ts`-Store
- eine bestehende Admin-Workbench in `/admin/review`
- typed Moderations-, Abuse-, Trust- und Risk-Guardrails
- explizite Review-first-Aktionen fuer `allow/hide/reject/escalate`

Was noch fehlte, war eine separate Signalebene fuer Spam, Missbrauch, Duplikate, Volumen und Eskalationsrisiken, ohne diese Signale still in Wahrheits- oder automatische Ablehnungslogik zu uebersetzen.

## Umgesetzter Slice

Neu in `apps/web/src/features/create/communitySourceReviewModeration.ts`:

- `CommunitySourceReviewAbuseSignalKind`
  - `possible_spam`
  - `possible_abuse`
  - `repeated_submission`
  - `possible_duplicate_hint`
  - `suspicious_source_url`
  - `low_information_value`
  - `coordinated_activity_signal`
  - `excessive_volume_signal`
  - `escalation_risk`
  - `moderation_history_risk`
- `CommunitySourceReviewAbuseSeverity`
- `CommunitySourceReviewAbuseDisposition`
- Detektion, Zusammenfassung und Blocker-Helfer fuer Abuse-/Spam-Signale
- klare Trennung zwischen harten bestehenden `abuseReasons` und weicheren Moderationssignalen

Neu im bestehenden Server-/Audit-Pfad:

- Abuse-/Spam-Signale werden im bestehenden Review-Record mitgefuehrt
- Audit-Trail kennt jetzt zusaetzlich:
  - `signal_detected`
  - `signal_reviewed`
  - `moderation_action_taken`
  - `escalation_recommended`
- Audit-Events tragen Signal-Kinds, Severity und Disposition fuer die UI mit

Neu in der bestehenden Admin-Workbench:

- Severity und Disposition fuer Community-Hinweise sichtbar
- Abuse-/Spam-/Duplicate-/Volume-Signale als eigene Lesart sichtbar
- Hinweis, ob ein Record trotz Signalen als Review-Hinweis lesbar bleibt
- explizite Blocker fuer Hint-Nutzung, Evidenz und Auto-Folgeaktionen
- Audit-Historie mit Signalereignissen
- zusaetzliche Admin-Aktionen:
  - `markAsSpamRisk`
  - `markAsAbuseRisk`
  - `clearAbuseSignal`
  - `escalateAbuseReview`

## Guardrails

Bewusst beibehalten:

- Abuse-/Spam-Signale sind Moderationshinweise, keine automatische Ablehnung
- Mehrfach- oder Volumensignale begruenden keine Wahrheit
- verdaechtige Hinweise werden geprueft, aber nicht automatisch veroeffentlicht, verifiziert oder in den Graph geschrieben
- kein Auto-Factcheck
- kein Auto-Publish
- kein Auto-Graph
- kein Auto-Merge
- keine Entitaetserstellung
- keine neue oeffentliche Community-Seite
- keine neue Moderationswelt neben der bestehenden `/admin/review`-Workbench

## Offen geblieben

Nicht umgesetzt:

- echte oeffentliche Runtime-Submission fuer Community-Source-Review
- externe Rate-Limits oder Replay-/Burst-Schutz an einer Public-Route
- Trust-/Reputation-Runtime
- Source-Quality-Scoring
- Zusammenfuehrung mit einer breiteren regionalen Review Queue

Der naechste explizite Folgepfad dafuer ist:

- `COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-HARDENING-05`

## Tests / Validierung

Revalidiert mit:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/community-source-review-abuse-spam.test.ts tests/community-source-review-abuse-spam-ui.test.tsx tests/community-source-review-moderation-ui.test.tsx tests/community-source-review-moderation.test.ts tests/admin-review.page.test.tsx`
- `pnpm -C apps/web run build`

## Ergebnis

Community Source Review kann jetzt im bestehenden Admin-Review nicht nur moderiert, sondern auch als Spam-/Abuse-/Duplicate-/Volume-Fall mit klarer Severity, Disposition, Blockern und Auditspur gelesen werden.

Die Wahrheitsgrenze bleibt unveraendert:

- Hinweise bleiben Hinweise
- Moderation bleibt menschlich
- Signale priorisieren oder blockieren Review-Nutzung, aber erzeugen keine Wahrheit
- oeffentliche Runtime-Verdrahtung bleibt bewusst separat
