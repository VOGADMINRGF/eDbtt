# TOPIC-PAGE-PUBLIC-TARGET-01

Stand: 2026-05-20
Scope: Leichter öffentlicher Themen-Zielpfad auf bestehendem Workbench-/Topic-/Dossier-/Runden-Stack

## Ziel

Nach Review Queue, Dossier-/Anlassraum-Vorbereitung und bewusster Sichtbarkeit fehlte noch ein schlanker öffentlicher Zielpfad für Themen selbst.

Die bestehende Kette wurde deshalb ohne neue Parallelwelt um einen dritten Public Target ergänzt:

`Quelle oder /create -> Review Queue -> topic_page -> /topic/[slug] -> Dossier/Anlassraum als Vertiefung`

## Umsetzung

- `topic_page` ist jetzt drittes Target im bestehenden `ContentReleaseWorkbench`
- derselbe Persistenz-, Audit- und Visibility-Pfad gilt jetzt für:
  - `dossier`
  - `anlassraum`
  - `topic_page`
- `/topic/[slug]` rendert sichtbare Topic-Targets öffentlich
- nicht sichtbare Topic-Targets bleiben nur als berechtigte Vorschau erreichbar
- Dossier-Studio zeigt verbundene Themenseite, falls vorhanden
- `/runden` zeigt verbundenes Thema, falls vorhanden
- Organisationsdashboard und `/admin/review` kennen die neue Zielart `Öffentliche Themenseite`

## Public Topic Contract

Ergänzt wurden:

- `PublicTopicPage`
- `PublicTopicPageSource`
- `PublicTopicPageStatus`
- `PublicTopicPageLink`
- `PublicTopicPageRelatedContent`
- `PublicTopicPageAction`

Die öffentliche Themenseite zeigt:

- Titel und Kurzbeschreibung
- Status / Sichtbarkeit
- zentrale Aussagen
- offene Fragen
- Quellenhinweise
- verbundene Dossiers
- verbundene Anlassräume / Runden
- bestehende Beteiligungspfade zurück nach `/create`
- Public URL / Share / QR nur bei sichtbarem Status

## Guardrails bleiben aktiv

- kein Auto-Publish
- kein automatisches `public_official`
- `public_official` bleibt Official Release
- keine automatische amtliche Antwort
- keine automatische Dossier-/Anlassraum-Finalisierung
- kein Social Publishing
- kein Payment/Checkout
- kein GeoReferenceLayer
- keine neue AI-/Source-Adapter-Logik

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/content-release-workbench.test.ts tests/review-queue.readmodel.test.ts tests/organization-dashboard.readmodel.test.ts tests/admin-review.page.test.tsx tests/account-organization-dashboard.page.test.tsx tests/dossier-output-studio.page.contract.test.ts tests/runden-page.acceptance.test.ts tests/topic-public-page.contract.test.tsx`
- `pnpm --filter @vog/web build`

## Offene Folgepunkte

- Social Publishing bleibt bewusst separater Folgepfad
- breitere kuratierte / produktive Quellenabdeckung bleibt offen
- feinere AllowedActions außerhalb des Regionpfads bleiben ein separater Härtungspfad
