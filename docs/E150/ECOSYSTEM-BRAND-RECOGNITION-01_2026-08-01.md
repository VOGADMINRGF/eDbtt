# ECOSYSTEM-BRAND-RECOGNITION-01

Datum: 2026-08-01  
Repository: `VOGADMINRGF/edebatte-org`  
Ausgangs-Head: `796951574caf21c606edfc8af94f6e025cf04fc0`  
Issue: #548  
Status: `review`
Verdict: `ecosystem_contract_ready`

## Auftrag

Dieser Run-Pack manifestiert die verbindliche Markenarchitektur, den gemeinsamen Wiedererkennungsvertrag und einen kollisionsarmen Umsetzungsplan. Er verändert keine Produktlogik, keine Beteiligungsprozesse und keine sichtbare Oberfläche.

## Verbindliche Markenarchitektur

- **eDebatte** ist die offene Infrastruktur für nachvollziehbare Erkenntnis, Orientierung und Beteiligung.
- **VoiceOpenGov** ist die internationale Mitgliederbewegung.
- **Vote4Gov** ist die gesellschaftliche Denkwerkstatt.
- **Voxy** ist die transparente, wiedererkennbare Begleitung innerhalb des Ökosystems.

### Abgrenzung

- eDebatte bleibt offen für Bürger, Kommunen, Unternehmen, Vereine, Parteien, Wissenschaft, Medien und NGOs.
- eDebatte ist nicht ausschließlich VoiceOpenGov.
- VoiceOpenGov nutzt eDebatte und besitzt eDebatte nicht.
- Vote4Gov ersetzt weder eDebatte noch VoiceOpenGov.
- Voxy ist Guide, nicht Eigentümer, Entscheider oder Veröffentlichungsautomatismus.
- Auth-, Create-, Studio-, Dossier-, Runden-, Account-, Review- und Veröffentlichungsverträge bleiben unangetastet.

## Auditbasis

Geprüft wurden insbesondere:

- `AGENTS.md`
- `docs/E150/CODEX_RUN_PACK_CONTRACT.md`
- `docs/E150/OpenTasks.md` als alleinige Implementierungs-SSOT
- `docs/brand/EDEBATTE_BRAND_NARRATIVE.md`
- `docs/E150/UX-VOXY-MOTION-GUIDE-01_2026-05-29.md`
- `apps/web/src/lib/brand.ts`
- `apps/web/src/config/links.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/(components)/SiteHeader.tsx`
- `apps/web/src/components/SiteFooter.tsx`
- `packages/ui/src/layout/Footer.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`
- `apps/web/src/app/transparenzbericht/page.tsx`
- offene beziehungsweise gerade integrierte PRs #520, #527, #529, #536 und #539

## Bestehende belastbare Grundlagen

### eDebatte als Primärmarke

`apps/web/src/lib/brand.ts` führt Name, Domain und Kontaktadressen zentral. Header und produktive Footer-Fläche zeigen eDebatte bereits als eigenständige Primärmarke.

### Gemeinsame visuelle DNA

Die bestehende Oberfläche besitzt zentrale Light-/Dark-Tokens für Hintergrund, Vordergrund, Karten, Grenzen und Akzente. Cyan, Blau und Türkis bilden den etablierten eDebatte-Infrastrukturakzent. Wiederverwendbare `vog-*`-Flächen-, Karten-, Button-, Fokus- und Voxy-Klassen sind breit eingebunden.

Der technische Namespace `vog-*` wird nicht global umbenannt. Eine solche Migration hätte keinen Markenwert, aber ein hohes Regressionsrisiko. Neue semantische Verträge dürfen kompatible Alias-Tokens ergänzen.

### Voxy

Der vorhandene Canon ist grundsätzlich tragfähig:

- Asset- und Copy-SSOT;
- definierte Varianten und Fallback-Kette;
- funktionale statt rein dekorative Verwendung;
- Motion in der Größenordnung 160–260 ms;
- statischer Fallback bei `prefers-reduced-motion`;
- keine Information ausschließlich durch Bild oder Animation;
- kein Auto-Publish und kein Entscheidungsersatz.

### Accessibility

Vorhanden sind unter anderem benannte Navigationen, `aria-current`, Fokuszustände, Reading-/Theme-Modus und ein Reduced-Motion-Vertrag. Diese Grundlagen werden vereinheitlicht und nicht ersetzt.

## Bestätigte Abweichungen

### Zwei Footer-Wahrheiten

Es bestehen mindestens zwei voneinander abweichende Footer-Implementierungen:

- `apps/web/src/components/SiteFooter.tsx`
- `packages/ui/src/layout/Footer.tsx`

Die Unterschiede betreffen Claims, Routen, Labels, Transparenzziele, Mobile-Verhalten, Übersetzung und Aussagen zu Finanzierung beziehungsweise Trägerkontext. Vor einer Migration ist zu ermitteln, welche Consumer den Package-Footer noch verwenden. Ziel ist genau eine kanonische Komponente beziehungsweise ein klarer Adaptervertrag.

### Fehlender Ökosystem-Linkvertrag

`apps/web/src/config/links.ts` enthält aktuell nur einen zentralen VoiceOpenGov-Unterstützungslink. Es fehlt eine typsichere Wahrheit für:

- eDebatte;
- VoiceOpenGov;
- Vote4Gov;
- Voxy;
- aktuelle Domain;
- interne und externe Ziele;
- verfügbare und noch nicht verfügbare Zielseiten.

Keine Domain oder URL darf erfunden oder verteilt hart codiert werden. Voxy erhält keine behauptete Standalone-Domain ohne reale Destination.

### Fehlende Zielseiten

Belegt sind unter anderem:

- `/transparenzbericht`
- `/datenschutz`
- `/impressum`

Nicht belegt sind produktive Ziele für:

- `/charta`
- `/grundlagen`

Diese Footerpunkte bleiben bis zu einer realen Zielseite nicht klickbar beziehungsweise werden ehrlich als in Vorbereitung behandelt. Tote Navigation ist unzulässig.

### Terminologiedrift

Beobachtet wurden unter anderem:

- „Beitrag einreichen“, „Beitragen“, „Thema einbringen“;
- `/create`, `/start`, `/statements`;
- „Abstimmen“, „Swipe“, „Swipes“;
- „Stream“, „Streams & Events“, „Präsentieren“;
- „Transparenz“ und „Transparenzbericht“;
- „Initiative“ und „Mitgliederbewegung“.

Branding darf keine Produktpfade still umbenennen. Zuerst wird ein sprachlicher Canon festgelegt; die bestehende Route bleibt technische Wahrheit.

### Übersetzung

Der produktive Footer behandelt Deutsch und Englisch teilweise als native Sprachen, verwendet aber dieselben deutschen Link-Arrays. Ein kanonischer Footer braucht getrennte DE-/EN-Copy und einen kontrollierten Fallback für weitere Sprachen.

### Mobile

Der aktuelle Mobile-Footer ist inhaltlich auf eDebatte, Impressum, Datenschutz und Hilfe reduziert. Die spätere Ökosystemerklärung muss auch mobil vollständig, kompakt, tastatur- und screenreaderfreundlich erreichbar sein.

## Kanonischer Ökosystemvertrag

### Gemeinsame Elemente

Alle Marken teilen:

- dieselbe typografische Grundfamilie und Lesbarkeitsregeln;
- dieselben neutralen Light-/Dark-Surfaces;
- dieselben Fokus-, Kontrast-, Radius- und Spacingprinzipien;
- denselben Motion- und Reduced-Motion-Vertrag;
- dieselbe Icon-Strichlogik;
- dieselbe sichere External-Link-Semantik;
- denselben Voxy-Asset- und Accessibility-Canon.

### Eigenständigkeit

- Die besuchte Domain bleibt Primärmarke in Header, Seitentitel und Hauptclaim.
- Andere Ökosystemmarken dienen der Orientierung, nicht dem permanenten Co-Branding.
- eDebatte behält Cyan/Blau/Türkis als primären Infrastrukturakzent.
- Andere Domains dürfen eigene Akzentfarben besitzen, aber keine zweite Komponenten-, Typografie- oder Accessibility-Welt.
- VoiceOpenGov wird auf eDebatte weder als Eigentümer noch als exklusive Nutzergruppe dargestellt.

### Iconografie

- eine bevorzugte kanonische Iconquelle;
- konsistente Strichstärke und optische Größe;
- dekorative Icons mit `aria-hidden`;
- interaktive Icons nie ohne zugänglichen Namen;
- externe Ziele mit konsistenter, nicht ausschließlich visueller Kennzeichnung.

### Motion

- Standarddauer ungefähr 160–260 ms;
- Motion nur für Orientierung, Zustandswechsel und räumliche Kontinuität;
- kein verborgener Inhalt bei deaktivierter Animation;
- keine kontinuierliche Bewegung ohne Pause- oder Reduced-Motion-Vertrag.

## Footer-Contract

### Bereich „Ökosystem“

- **eDebatte** — Offene Infrastruktur für nachvollziehbare Erkenntnis, Orientierung und Beteiligung.
- **VoiceOpenGov** — Internationale Mitgliederbewegung, die offene demokratische Zusammenarbeit organisiert.
- **Vote4Gov** — Gesellschaftliche Denkwerkstatt für die Weiterentwicklung demokratischer Repräsentation und Beteiligung.
- **Voxy** — Transparente Begleitung, die Orientierung gibt und nächste Schritte nachvollziehbar macht.

Regeln:

- aktuelle Domain semantisch und visuell hervorgehoben;
- Hervorhebung nicht ausschließlich über Farbe;
- `aria-current="page"` oder semantisch gleichwertiger Zustand;
- externe Ziele sicher und verständlich gekennzeichnet;
- Ziele ausschließlich aus zentraler Konfiguration;
- fehlende Ziele nicht als funktionsfähig behauptet;
- Voxy verweist nur auf eine real vorhandene Erklärfläche oder einen vorhandenen Anker.

### Bereich „Grundlagen & Transparenz“

Kanonische Punkte:

- Transparenz;
- Charta;
- Grundlagen;
- GitHub;
- Datenschutz;
- Impressum.

Bis zu einer eigenen Aliasentscheidung zeigt Transparenz auf den realen Pfad `/transparenzbericht`. Charta und Grundlagen bleiben von realen Inhaltsseiten abhängig.

### Mobile und Accessibility

- gleiche inhaltliche Linkmenge wie Desktop;
- semantische Gruppen oder zugängliche `details`-Elemente zulässig;
- sichtbarer Fokus und ausreichend große Touch-Ziele;
- keine Hover-only-Interaktion;
- kein horizontaler Overflow bei langen Übersetzungen;
- externe Linkkennzeichnung auch für Screenreader nachvollziehbar.

## Kollisionsmatrix

| PR | Fläche | Integrationsentscheidung |
|---|---|---|
| #529 | `/create`, Voxy-Fehlerflächen, Account-Tickets | am 2026-08-01 in `main` integriert; Brand-Folgearbeit erst gegen den neuen Main-Stand |
| #539 | Mail-Canon | integriert; Maildesign bleibt eigener Vertrag |
| #520 | Studio, QR, Navigation und Auth-Weiterleitungen | sichtbare Navigation und Shell warten auf konfliktfreien Main-Sync |
| #527 | `/start`, Voxy-Hero, Claims, Scroll-Dramaturgie | keine parallele Landing-/Voxy-Migration vor Stabilisierung |
| #536 | Admin-Region, Light/Dark und Handoffs | keine globale Tokenmigration in diesem PR |

## Umsetzungsslices

### A — Marken- und Designvertrag

Dokumentation, zentrale Typen und statischer Testvertrag. Keine sichtbare Migration. Nach kontrollierter SSOT-Aufnahme und erfolgreichem Preflight ausführbar.

### B — Zentrale Ökosystemkonfiguration

Typsichere Marken-, Domain- und Linkdefinition mit aktivem Domainzustand, internen/externen Zielen und fehlenden Destinationen. Abhängig von bestätigten produktiven Domains und Inhaltsseiten.

### C — Gemeinsamer Footer

Genau eine kanonische Footer-Wahrheit, Consumer-Migration, Mobile, DE/EN, Light/Dark, Fokus, Screenreader und External-Link-Vertrag. Abhängig von A/B sowie stabilisierten #527/#529-Flächen.

### D — Navigation und aktive Domain

Diskrete Ökosystemorientierung außerhalb der primären Produktnavigation. Abhängig von #520 und vollständiger Shell-/Auth-Abnahme.

### E — Voxy und Iconografie

Konsolidierung der bestehenden SSOT, keine neue Figur. Abhängig von #527 und dem integrierten #529.

### F — Terminologie und Buttons

Sprachlicher Canon ohne Route- oder Produktumbau. Abhängig von stabilen Create-/Start-Entscheidungen.

### G — Accessibility und Motion

Schließt nachweisbare Lücken in den Komponenten aus C–F. Fokus, Tastatur, Kontrast, Touch-Ziele, Reduced Motion und lange Übersetzungen sind Pflicht.

### H — Flächenweise Migration

Reihenfolge:

1. öffentliche Shell;
2. Marketing- und Informationsseiten;
3. Account;
4. Admin;
5. Create, Studio und Start erst nach ihren jeweiligen Integrations- und Produktgates.

## Test- und Abnahmevertrag

Je nach Slice mindestens:

- statische Markenrollen- und verbotene-Eigentümeraussagen-Contracts;
- URL-, External-Link-, Active-Domain- und Missing-Target-Contracts;
- Footer-Render-, Routing-, A11y-, Übersetzungs- und Mobile-Overflow-Tests;
- Light-/Dark- und Reduced-Motion-Tests;
- bestehende kritische Web- und Production-Guardrails;
- Typecheck, Lint, vollständiger Build und `git diff --check`;
- manuelle Desktop-/Mobile-, Light-/Dark-, DE-/EN-, Tastatur- und Screenreader-Abnahme für sichtbare Slices.

## Risiken

- globale Ersetzung des `vog-*`-Namespaces;
- erfundene oder tote Footerziele;
- VoiceOpenGov als scheinbare Eigentümer- oder Dachmarke;
- Vermischung von Domainnavigation und Produktnavigation;
- stille Route- oder Produktumbenennung;
- zweite Footer- oder Token-Wahrheit;
- visuelle Hervorhebung nur über Farbe;
- dekorative Voxy-Nutzung ohne Funktion;
- Regressionen in laufenden Create-, Studio-, Start- und Admin-Flächen.

## Bewusste Abweichungen dieses Intake-PRs

- keine Änderung an `docs/E150/OpenTasks.md`, weil der GitHub-Connector die große Datei im aktuellen Lauf nur als Blob, nicht als verlässlichen Textinhalt geliefert hat;
- kein behaupteter Preflight;
- kein Implementierungsbranch für sichtbare Komponenten;
- keine Änderung an Footer, Header, `globals.css`, Voxy, Navigation oder Produktlogik;
- keine neuen Charta- oder Grundlageninhalte;
- keine erfundenen Domainziele.

## Eintrittskriterien für Slice A

1. Alpha nimmt `ECOSYSTEM-BRAND-RECOGNITION-01` kontrolliert in `docs/E150/OpenTasks.md` auf.
2. Run-Pack-Felder und Status entsprechen `CODEX_RUN_PACK_CONTRACT.md`.
3. Keine konkurrierende Brand-/Footer-Aufgabe ist ausführbar.
4. Der echte lokale Clean-main-Preflight ist grün.
5. Erst danach entsteht ein eigener Implementierungsbranch.

## CI-Status

Zum Zeitpunkt der Dateierstellung wurde noch kein CI-Lauf für diesen Dokumentationsbranch ausgewertet. Es werden keine Ergebnisse vorweggenommen.

## Implementierungsnachweis — 2026-08-02

### Technischer Umfang

- `apps/web/src/config/ecosystem.ts` führt den zentralen typsicheren Vertrag für
  exakt eDebatte, VoiceOpenGov, Vote4Gov und Voxy.
- Jede Marke besitzt stabile ID, Anzeigename, eindeutige kanonische Rolle,
  sachliche Beschreibung, Beziehung zu eDebatte und einen diskriminierten
  Zielvertrag.
- Verfügbare Ziele werden als validierter interner Pfad oder validiertes
  externes HTTPS-Ziel geführt. Nicht verfügbare Ziele tragen ausschließlich
  `status: "unavailable"`, `kind: "none"` und `href: null`; der zentrale
  Resolver liefert dafür keinen Fallback.
- Das eDebatte-Ziel wird aus `BRAND.baseUrl` abgeleitet. VoiceOpenGov nutzt
  ausschließlich den bestehenden zentralen `VOG_SUPPORT_URL`. Vote4Gov und
  Voxy bleiben mangels belegter kanonischer Destination nicht verfügbar.
- Die vorherige sichtbare Altimplementierung aus zwei Logo-SVGs,
  `EcosystemChrome.tsx` und der Layout-Einbindung wurde vollständig entfernt.
  Header, Footer, Navigation, `globals.css`, Voxy- und Produktflächen bleiben
  gegenüber `origin/main` unverändert.

### Validierung

- Fokussierter Contract: `1` Testdatei / `13` Tests grün.
- Gemeinsame Brand-/Routing-Regression einschließlich des fokussierten
  Contracts: `7` Testdateien / `28` Tests grün; davon `6` bestehende
  Testdateien / `15` bestehende Tests.
- `pnpm -C apps/web run typecheck`: grün.
- `pnpm -C apps/web run lint`: grün, keine Befunde.
- `pnpm -C apps/web run build`: vollständig grün; 255 Seitenverträge geprüft
  und 322 statische Seiten erzeugt. Der Abschlusslauf verwendete ausschließlich
  explizite, nicht geheime, prozesslokale Build-Platzhalter. Keine ENV-Datei
  wurde gelesen, erstellt, verändert oder ausgegeben.
- `git diff --check`: grün.
- Lokale Umgebung: Node `25.9.0`; das Repository verlangt Node `20.x`. pnpm
  meldete die Abweichung als Engine-Warnung, alle Abschlussprüfungen blieben
  dennoch grün.

### Bewusst verbleibende Folge-Slices

- Sichtbare Footer-, Header-, Navigations-, Domain- und Produktflächenmigration
  bleibt getrennt.
- Vote4Gov bleibt bis zu einer belegten kanonischen Destination nicht klickbar.
- Voxy bleibt bis zu einer realen eigenständigen Erklärfläche oder einem
  belegten internen Anker nicht klickbar.
- Gemeinsamer Footer, aktive Domain, Iconografie, Terminologie, Accessibility,
  Motion und flächenweise Migration bleiben den getrennten Folge-Slices
  vorbehalten.
- Dieser Nachweis ist keine sichtbare Produktabnahme.
