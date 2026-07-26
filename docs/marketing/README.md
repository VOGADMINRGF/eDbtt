# eDebatte Marketing & Growth OS

Status: `canonical_working_source`

## Zweck

Dieser Bereich ist die versionierte Arbeitsgrundlage für Marketing, Vertrieb, Social Media, Video, Presse, Partnerschaften und wiederverwendbare Kommunikationsvorlagen von eDebatte und VoiceOpenGov.

Er ersetzt keine Produkt-, Governance-, Pricing-, Rollen- oder Routingentscheidung. Marketing folgt der dokumentierten Produktwahrheit und darf keine Funktionen, Partner, Reichweiten, Ergebnisse oder Freigaben behaupten, die im Produkt und Repository nicht belegt sind.

## Verbindliche Trennung

- `docs/marketing/**` enthält Strategie, Copy, Kampagnenpläne, Briefings, Storyboards, Vorlagen und Agentenregeln.
- `apps/web/public/marketing/**` enthält ausschließlich freigegebene, auslieferbare statische Assets und deren Manifest.
- `apps/web/public/brand/**` bleibt die kanonische Quelle für bestehende Brand- und Voxy-Assets.
- `docs/E150/OpenTasks.md` bleibt die operative Implementierungs-SSOT.

## Kanonische Grundlagen

Vor jeder Kampagne oder Zielgruppenunterlage sind mindestens zu prüfen:

- `apps/web/public/brand/README.md`
- `apps/web/public/brand/voxy/manifest.json`
- `apps/web/src/features/voxy/voxyAssets.ts`
- `docs/E150/UX-VOXY-MOTION-GUIDE-01_2026-05-29.md`
- `docs/E150/V3_VOXY_SELF_RENDER_AND_MARKETING_PILOT_ROADMAP_2026-07-13.md`
- `docs/E150/VOG-MISSION-LAYER-01_2026-07-26.md`
- `docs/E150/membership_pricing.md`
- `docs/E150/Part04_B2G_B2B_Models.md`

## Arbeitsbereiche

- `brand/` — aus dem Repository abgeleitete Marketing-Designsprache
- `campaigns/` — Kampagnenplan und kampagnenspezifische Briefings
- `sales/` — Zielgruppenbotschaften, Onepager- und Pitchdeck-Strukturen
- `social/` — Content-Serien, Social-Formate und Videosystem
- `voiceopengov/` — Membership- und Partnermarketing innerhalb der bestehenden Decision-Grenzen
- `templates/` — wiederverwendbare Briefings und Produktionsvorlagen
- `agent-playbooks/` — Regeln für GPT, Codex und weitere Marketingagenten

## Qualitätsregeln

1. **Product truth first.** Jede Aussage muss auf einer realen Funktion, dokumentierten Entscheidung oder klar gekennzeichneten Vision beruhen.
2. **Content before activism.** eDebatte ordnet Inhalte, Quellen, Argumente, Entwicklungen und Beteiligung. VoiceOpenGov vertritt nur nachvollziehbar zustande gekommene Positionen.
3. **Eine Voxy.** Keine zweite Figur, KI, Runtime, Datenbasis oder Persönlichkeit für VoiceOpenGov.
4. **Keine Fake-Signale.** Keine erfundenen Nutzerzahlen, Partner, Live-Daten, Stimmen, Quellen, Erfolge oder Testimonials.
5. **Review first.** Politische, gesellschaftliche und partnerbezogene Kommunikation wird vor Veröffentlichung geprüft.
6. **Mehrsprachigkeit mit Originalerhalt.** Originalsprache, Lesefassung, UI-Sprache und Ausgabesprache dürfen nicht vermischt werden.
7. **CI aus dem Repo.** Keine generische Sci-Fi-, Government-Tech-, Neon-HUD- oder Stock-KI-Bildwelt.
8. **Barrierearm und mobil.** Untertitel, Kontrast, verständliche Sprache, reduzierte Bewegung und mobile Lesbarkeit sind Standard.

## Freigabestufen

- `draft` — intern, nicht veröffentlichen
- `review_ready` — fachlich und visuell prüfbar
- `approved` — zur Produktion oder Ausspielung freigegeben
- `published` — veröffentlicht und mit realem Ziel verknüpft
- `retired` — nicht mehr verwenden

## Kampagnenablauf

```text
Produkt-/Governance-Wahrheit
→ Zielgruppe und Problem
→ beobachtbarer Nutzen
→ Kernbotschaft und CTA
→ Onepager / Pitchdeck / Landingpage
→ Social- und Videoableitungen
→ Review und Freigabe
→ Veröffentlichung
→ KPI- und Lernnotiz
```

## Nicht-Ziele dieses Foundations-Slices

- keine Website-, Routing- oder Rollenimplementierung
- keine Änderung an Membership, Pricing oder Governance
- keine automatische Veröffentlichung
- keine neuen Brand-Assets oder Voxy-Varianten
- keine Produktionsbehauptung über noch nicht vorhandene Funktionen
