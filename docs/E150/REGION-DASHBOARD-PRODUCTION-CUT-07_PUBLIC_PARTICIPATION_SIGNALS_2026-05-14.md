# REGION-DASHBOARD-PRODUCTION-CUT-07

## Ziel

Öffentliche Beteiligungssignale im bestehenden RegionDashboard sichtbar machen, ohne eine zweite Dashboard-Logik aufzubauen und ohne personenbezogene Überwachung, Repräsentativitätsbehauptung oder automatische amtliche Übernahme.

## Was wurde gebaut?

- Neuer Contract `features/region/regionParticipationSignals.ts` für:
  - `RegionParticipationSignal`
  - `RegionParticipationSignalSource`
  - `RegionParticipationAggregate`
  - `RegionParticipationReviewItem`
  - `RegionParticipationPrivacyMode`
  - `RegionParticipationAggregationMode`
- Der Contract deckt jetzt diese Public-Participation-Typen ab:
  - `public_claim`
  - `public_contribution`
  - `public_question`
  - `public_source_hint`
  - `swipe_interest`
  - `swipe_counterpoint`
  - `saved_topic`
  - `support_signal`
- `features/region/store.ts` erweitert das bestehende RegionDashboardReadModel um:
  - `participationSignals`
  - `participationAggregates`
  - `publicClaimsSummary`
  - `publicQuestionsSummary`
  - `swipeInterestSummary`
  - `counterpointSummary`
  - `communitySourceHints`
  - `reviewItemsFromPublicInput`
- `/admin/region` zeigt jetzt einen eigenen Public-Participation-Readout innerhalb der bestehenden Surface.
- `regionSignalDrafts.ts` kann akzeptierte, bereinigte Public-Participation-Signale in den bestehenden Draft-Pfad überführen. Nicht akzeptierte oder reviewbeschränkte Signale bleiben geblockt.

## Welche öffentlichen Inputs werden eingebunden?

- Pilot-/Fixture-Signale für Reinickendorf und Magdeburg
- vorhandene Runtime-Inputs aus:
  - `contributions`
  - `statements`
  - aggregierten `swipe_votes`

Die Laufzeit bleibt konservativ:

- unsichere Regionzuordnung wird nicht automatisch Reinickendorf oder einer anderen Region zugeschlagen
- stattdessen bleibt der Fall `needsRegionReview`
- solche Signale erscheinen nicht als interne Regionwahrheit

## Privacy, Anonymisierung und Datensparsamkeit

Hart abgesichert:

- keine `userId` im RegionDashboardReadModel
- keine personenbezogene Liste von Swipe-Nutzer:innen
- keine Sicht "Person X unterstützt Thema Y"
- keine politischen Profile
- keine Repräsentativitätsbehauptung
- keine Verwaltungssicht auf individuelle Bürgerpräferenzen

Technisch im Contract verankert:

- `noPersonalProfiling: true`
- `noPoliticalScoring: true`
- `noRepresentativeClaim: true`
- `privacyMode`
- `aggregationMode`

Swipes werden nur als anonymisierte/aggregierte Signale ausgegeben.

## Warum Swipes nur aggregiert angezeigt werden

Swipe-Daten sind für diesen Slice keine Bürgerprofile und keine politische Vermessung. Im Dashboard tauchen sie nur als:

- aggregiertes Interesse
- aggregierte Gegenpositionen
- unterstützte Themen

auf. Die Ausgabe enthält nur Zähl-/Hinweisstruktur, Themen und Zusammenfassungen, aber keine Personenreferenz.

## Warum nichts automatisch amtlich wird

Public Participation Signals bleiben:

- ungeprüft oder reviewpflichtig
- nicht amtlich
- nicht repräsentativ
- ohne automatische Veröffentlichung
- ohne automatische Dossier-/Anlassraum-Erstellung

Akzeptierte, bereinigte Public-Signale können den bestehenden Draft-Pfad erst nach Review nutzen. Reviewbeschränkte oder nicht akzeptierte Signale bleiben blockiert.

## Wie Membership und Entitlement weiter respektiert werden

CUT-07 umgeht weder Membership noch Paid Entitlement:

- das Cockpit bleibt serverseitig an persistierte Memberships und Entitlements gebunden
- Public-Participation-Signale ändern keine Rechte
- der Draft-Pfad für Public-Signale nutzt dieselben Access- und Entitlement-Gates wie der bestehende Signal-Draft-Pfad

## Wiederverwendete Bausteine

- bestehende Region-Familie in `features/region/*`
- bestehendes RegionDashboardReadModel
- bestehende `/admin/region`-Surface
- bestehender Signal-zu-Draft-Pfad aus CUT-03
- bestehende persistierte Membership-/Entitlement-Runtime aus CUT-04 und CUT-06

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/regional-feed-signals.contract.test.ts tests/regional-dashboard-readmodel.test.ts tests/admin-region-cockpit.route.test.ts tests/admin-region-page.render.test.tsx tests/region-signal-drafts.contract.test.ts tests/admin-region-signal-draft.route.test.ts tests/region-participation-signals.contract.test.ts tests/admin-region-participation-signals.test.tsx`

## Bewusst offen

- eigene persistente Review-/Moderationslaufzeit für Public Participation Signals
- feinere Regionzuordnung jenseits konservativer Hints
- GeoReferenceLayer
- OSM/PostGIS
- Payment/Billing/Checkout
- Veröffentlichung
- Social Publishing
- personenbezogene Participation-Ansichten

Folgepunkt:

- `REGION-DASHBOARD-PRODUCTION-CUT-09` für eine eigene persistente Review-Laufzeit der Public Participation Signals
