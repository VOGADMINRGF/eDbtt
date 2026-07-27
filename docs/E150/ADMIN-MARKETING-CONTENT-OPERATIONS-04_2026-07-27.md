# ADMIN-MARKETING-CONTENT-OPERATIONS-04

Stand: 2026-07-27  
Status: `review`

## Nutzerbefund

Die erste Überarbeitung von `/admin/marketing` war weiterhin falsch priorisiert. Sie zeigte strategische MarketingCampaigns und MarketingOpportunities als tägliche Betreiberarbeit. Dadurch erschienen Einträge wie Produktbeleg, Governanceentscheidung, Recherche oder Evidence-Übergabe dort, wo konkrete Posts, Videos, Termine und Veröffentlichungen erwartet wurden.

Die verbindliche Nutzerkorrektur lautet:

> `/admin/marketing` ist die operative Marketing-Zentrale. Primär sichtbar sind konkrete Posts, Videos, Kanalvarianten, Freigaben, Termine, Veröffentlichungen und Ergebnisse. Produktentwicklung und Programmieraufgaben gehören nicht in diese Oberfläche.

## Tatsächliche Datenlage

Im aktuellen repo-backed Marketing-Register bestehen:

- zwei reviewfähige Social-Inhalte:
  - `MAS-CONTENT-CAROUSEL-01` — Debattenstand der Woche · Carousel,
  - `MAS-VOXY-SCRIPT-01` — Voxy erklärt · Video-Storyboard,
- vier weitere Marketingmaterialien:
  - Onepager,
  - Pitchdeck,
  - Partner-Kit,
  - Membership-/Landingpage-Text,
- keine geplanten oder terminierten DistributionRecords,
- keine belegten veröffentlichten Posts,
- keine belastbaren Performancewerte.

Diese Wahrheit wird sichtbar gemacht. Fehlende Veröffentlichungen oder Termine werden nicht erfunden.

## Umgesetzte Informationsarchitektur

### Primäre Kennzahlen

1. `Zur Freigabe`
2. `In Arbeit`
3. `Eingeplant`
4. `Veröffentlicht`

Alle Kennzahlen sind anklickbar und filtern die Beitragsansicht.

### Beiträge & Videos

Die Hauptansicht zeigt ausschließlich Social- und Content-Assets:

- Carousel-Posts,
- Social-Posts,
- Stories,
- Reels,
- Kurzvideos und Videos,
- Presse-/LinkedIn-Beiträge,
- Newsletter.

Je Inhalt werden verständlich angezeigt:

- Titel und Inhaltsvorschau,
- Format,
- vorgesehene Kanäle,
- Bearbeitungsstand,
- realer Termin oder klarer Leerzustand,
- zugehörige Serie/Kampagne,
- reale Zielaktion,
- nächster operativer Schritt,
- Übergabe in die bestehende Editorial Queue.

### Veröffentlichungen

Nur reale `DistributionRecord`s mit Status `published` zählen als veröffentlicht. Ohne öffentlichen Beleg erscheint ein klarer Leerzustand.

### Weitere Materialien

Onepager, Präsentationen, Partner-Kits und Landingpage-Texte bleiben sichtbar, aber klar von Posts und Videos getrennt.

## Entfernt aus der Betreiberansicht

- MarketingOpportunities,
- Entwicklungs- und Produktreifeaufgaben,
- Governance- und Angebotsentscheidungen als operative Karten,
- Produktbeleg-/Runtime-Beleg-Aufgaben,
- Research- und Evidence-Übergaben,
- Blocker-Keys und technische Registry-Sprache,
- technische Pfade, IDs und Repository-Inventar.

## Grenzen

- kein neues globales Designsystem,
- keine alternative Workspace-Architektur,
- keine Änderungen an `/create`, `/runden` oder `/dossier`,
- keine Root-Layout-, Token- oder Shared-Component-Änderung,
- keine Publishing-Mutation,
- kein Auto-Publish,
- keine erfundenen Posts, Termine, Ergebnisse oder Plattformwerte,
- keine Änderung an Beteiligungskampagnen unter `/admin/campaigns`.

## Geänderte Dateien

- `apps/web/src/app/admin/marketing/page.tsx`
- `apps/web/tests/admin-marketing.page.test.tsx`
- diese E150-Evidenz

## Folgearbeit

Die derzeitige Registry kennt Assets und DistributionRecords, aber noch kein eigenständiges Content-Operations-Objekt mit explizitem Caption-Entwurf, Kanalvarianten, Veröffentlichungszeit, Verantwortlichkeit und Freigabeverlauf.

Diese Folgearbeit wird als eigener kleiner Readmodel-/Contract-Slice manifestiert. Bis dahin leitet die Oberfläche Kanalvorschläge ausschließlich aus dem realen Asset-Typ ab und kennzeichnet fehlende Termine ausdrücklich.
