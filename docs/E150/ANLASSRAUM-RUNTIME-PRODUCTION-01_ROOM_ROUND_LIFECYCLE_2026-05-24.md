# ANLASSRAUM-RUNTIME-PRODUCTION-01

Stand: 2026-05-24
Status: abgeschlossen
Issue: #213

## Ziel

Den bestehenden Anlassraum-/Runden-Pfad auf `production_ready-v1` heben, ohne neue Produktparallelwelt, ohne Auto-Publish, ohne automatisches `public_official` und ohne Demo-Fallbacks als Produktionswahrheit.

## Produktentscheidung v1

- Anlassraum/Runden sind fuer v1 produktionsfaehig, wenn verifizierte Organisationen und Betreiber reale Raeume/Runden erstellen, konfigurieren, reviewen, aktivieren, pausieren, archivieren, schliessen und bewusst oeffentlich teilen koennen.
- Public URL, Share und QR entstehen nur nach bewusster Sichtbarkeitsentscheidung.
- Review-only bleibt intern.
- Oeffentliche Eingaben, Vorschlaege und Beteiligung bleiben review-first.
- Kein Auto-Publish, kein Auto-Vote, kein Silent Merge, kein automatisches `public_official`.

## Umgesetzte Haertung

- Lifecycle-States fuer Anlassraum/Runden auf bestehenden Runtime-Pfaden erweitert:
  - `review_required`
  - `ready_for_public_link`
  - `active`
  - `paused`
  - `archived`
  - `closed`
  - `follow_up_required`
- `/runden` nutzt jetzt produktive Lifecycle- und Public-Share-States statt grober Rollenannahmen:
  - produktive Verwaltung nur mit Request-Scope, verifizierter Membership, passenden Entitlements und aktiver Vertragslage
  - Public-Share-Aktivierung nur mit explizitem `public_share`-Scope
  - ehrliche Hinweise fuer `review_only`, `paused`, `archived` und `closed`
- Share-/QR-Aktionen erscheinen nur auf bewusst freigegebenen, aktiven Raeumen.
- Public-Input bleibt an dieselbe review-first Runtime gekoppelt; kein direkter Publish-Pfad.
- Review Queue zeigt Anlassraum-/Runden-Kontext fuer oeffentliche Eingaben sichtbar an.
- Lifecycle-Entscheidungen werden auditierbar erfasst:
  - `anlassraum.create_from_feed`
  - `anlassraum.create_manual`
  - `anlassraum.configure`
  - `anlassraum.review`
  - `anlassraum.ready_for_public_link`
  - `anlassraum.publish_link`
  - `anlassraum.revoke_link`
  - `anlassraum.pause`
  - `anlassraum.close`
  - `anlassraum.reopen`
  - `anlassraum.archive`

## Guardrails

- Org A sieht oder verwaltet nicht Org B.
- Betreiberkontext bleibt explizit.
- `review_only` erzeugt keinen Public Share und keinen QR-Link.
- `paused`, `archived` und `closed` behalten ehrliche oeffentliche Zustandskommunikation, aber keinen aktiven Teilnahmepfad.
- Kein Contract, keine Membership und kein Anlassraum-Lifecycle setzen automatisch `public_official`.
- Keine neue AI-Logik, kein Social Publishing, keine Demo- oder Fixture-Wahrheit als Produktionsersatz.

## Reifestufe

`production_ready-v1` fuer Anlassraum/Runden ist jetzt begrenzt vorhanden:

- reale Room-/Round-Verwaltung auf bestehenden Pfaden
- review-first Moderations- und Beteiligungskette
- scope-, entitlement- und contract-gebundene Aktivierung
- bewusste, auditierbare Public-Link-/QR-Freigabe

Nicht Teil dieser v1-Aussage:

- Auto-Publish
- automatisches `public_official`
- Social Publishing
- neue AI-Automation

## Validierung

- `pnpm -C apps/web exec vitest run tests/runden-page.acceptance.test.ts tests/runden-public-sharing-guide.contract.test.tsx tests/runden-qr-participation-language.contract.test.tsx tests/runden-public-input.route.test.ts tests/admin-region-page.render.test.tsx tests/review-queue.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `rm -rf apps/web/.next`
- `pnpm --filter @vog/web build`
