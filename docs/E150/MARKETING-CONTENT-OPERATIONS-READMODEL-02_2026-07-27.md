# MARKETING-CONTENT-OPERATIONS-READMODEL-02

Stand: 2026-07-27  
Status: `review`

## Ziel

`/admin/marketing` verwendet ein explizites, typisiertes und repo-backed Content-Operations-Readmodel für konkrete Posts, Videos und Kanalvarianten. Kanäle, Caption-/Script-Entwürfe, Sprache, Verantwortlichkeit, Termin, Freigabestatus und nächste Aktion werden nicht mehr aus technischen Asset-Typen geraten.

## Umgesetzt

### Contract

`MarketingContentOperation` enthält:

- Content-ID,
- Campaign- und Asset-Referenz,
- Titel und Format,
- Status,
- Original- und Ausgabesprache,
- konkrete Zielkanäle,
- Caption- und/oder Script-Entwurf,
- realen oder leeren Veröffentlichungstermin,
- verantwortliche Rolle und verständliche Zuständigkeit,
- CTA und reale Zielroute,
- Freigabestatus und Review-Referenz,
- DistributionRecord-Referenzen,
- konkrete nächste Aktion,
- verbindlich `autoPublishEligible: false`.

### Deterministische Inhalte

Der erste repo-backed Bestand umfasst:

1. `MCO-CONTENT-02-DE-01`
   - Debattenstand der Woche · Carousel
   - Instagram, LinkedIn, Facebook
   - Caption-Entwurf vorhanden
   - Status `review_ready`
   - noch nicht terminiert
   - Zuständigkeit: Inhalt und Quellenbezug prüfen

2. `MCO-VOXY-03-DE-01`
   - Voxy erklärt · Was ist ein Debattenstand?
   - TikTok, Instagram Reels, YouTube Shorts
   - Caption- und Script-Entwurf vorhanden
   - Status `review_ready`
   - noch nicht terminiert
   - Zuständigkeit: Script, Visual und Untertitel prüfen

Es werden keine Veröffentlichungen, Termine oder Performancewerte erfunden.

### Readmodel-Guardrails

Das Readmodel:

- referenziert vorhandene `MarketingCampaign`- und `MarketingAsset`-Objekte,
- validiert die Campaign-/Asset-Zuordnung,
- referenziert vorhandene `DistributionRecord`s statt eine zweite Veröffentlichungswahrheit einzuführen,
- akzeptiert `published` nur mit realem öffentlichen Link und Veröffentlichungszeit,
- akzeptiert `scheduled` nur mit realem Termin oder geplantem DistributionRecord,
- hält Veröffentlichungen bei fehlendem Beleg leer.

### Betreiberoberfläche

`/admin/marketing` zeigt jetzt:

- anklickbare Kennzahlen für `In Arbeit`, `Zur Freigabe`, `Freigegeben`, `Eingeplant` und `Veröffentlicht`,
- konkrete Caption- und Script-Vorschauen,
- explizite Kanäle,
- Sprache,
- Verantwortlichkeit,
- reale oder ehrlich fehlende Termine,
- CTA,
- Freigabestand,
- nächste Aktion mit bestehendem Review-Ziel,
- belegte Veröffentlichungen ausschließlich aus `DistributionRecord`s,
- sonstige Marketingmaterialien separat.

## Grenzen

- kein Auto-Publish,
- keine Provider-Credentials,
- keine Publishing-Mutation,
- keine neue globale Queue,
- keine personenbezogenen Marketingprofile,
- keine Änderungen an `/create`, `/runden` oder `/dossier`,
- keine Root-Layout-, Token- oder Shared-Component-Änderung,
- keine Änderung an Beteiligungskampagnen unter `/admin/campaigns`.

## Geänderte Dateien

- `apps/web/src/features/marketing/contentOperations/contracts.ts`
- `apps/web/src/features/marketing/contentOperations/data.ts`
- `apps/web/src/features/marketing/contentOperations/readModel.ts`
- `apps/web/src/app/admin/marketing/page.tsx`
- `apps/web/tests/marketing-content-operations.contract.test.ts`
- `apps/web/tests/admin-marketing.page.test.tsx`
- `apps/web/package.json`
- diese Evidenz

## Abnahme

Der Slice bleibt bis zu grüner CI und Produkt-Sichtprüfung auf `review`. Eine spätere technische Ausspielung benötigt weiterhin einen separaten Publish-Approval- und Provider-Slice.
