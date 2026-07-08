# V3-HOME-SPLIT-VOXY-LANDING-01 Audit

Datum: 2026-07-08
Branch: `pr/v3-home-split-voxy-landing-01`

## Ausgangslage

Die bisherige Startseite auf `/` und `/start` wirkte wie eine lange Erklaerstrecke:

- zu viele konkurrierende Bloecke oberhalb und knapp unterhalb des Folds
- ein eingebetteter Create-Light-Intake als primaere Hero-Interaktion
- mehrere gleich laute CTA-Gruppen fuer Beitrag, Beispiel, Institution, Demo, Anlassraum und Dossier
- Voxy war vorhanden, aber nicht als klarer visueller Guide fuer den Produkteinstieg gesetzt
- Desktop-Komposition war zu schmal und zu textlastig

Das Ergebnis war kein klarer erster Produktentscheid fuer Nutzerinnen und Nutzer.

## Verwendete Referenzbilder

Als Designrichtung wurden nur die folgenden Repo-Assets herangezogen:

- `docs/E150/assets/home-split-voxy-landing/2026-07-08-current-homepage-state.png`
- `docs/E150/assets/home-split-voxy-landing/2026-07-08-target-split-voxy-landing-01.png`
- `docs/E150/assets/home-split-voxy-landing/2026-07-08-target-split-voxy-landing-02.png`

Sie dienten nur als visuelle Richtung fuer:

- dunklen, hochwertigen Einstieg
- prominente Voxy-Flaeche
- klare Split-CTA-Hierarchie
- reduzierte Textmenge

Es wurden keine Screenshot-Karten oder Bildmockups als produktive UI uebernommen.

## Gewaehlte Mitmach-Route

Die Karte `Abstimmen & mitmachen` fuehrt auf `/swipes`.

Begruendung:

- `/swipes` existiert bereits als produktive oeffentliche Route.
- Die Route ist im Repo breit referenziert und bereits Teil der oeffentlichen Journey.
- Es war deshalb keine Fake-CTA und kein Platzhalter noetig.

## Umgesetzte Startseitenaenderung

Die Startseite wurde in eine echte Split-Voxy-Landing umgebaut:

- Headline: `Was bewegt dich?`
- kurze Subline mit Guardrail: `Voxy hilft beim Sortieren. Veroeffentlicht wird nichts ohne Pruefung.`
- zwei grosse klickbare Einstiegskarten:
  - `Etwas beitragen` -> `/create`
  - `Abstimmen & mitmachen` -> `/swipes`
- prominente Voxy-Flaeche mit echten Brand-Assets aus `apps/web/public/brand/voxy`
- nur noch kleine Sekundaerlinks zu `/themen` und `/dossier`
- fuer eingeloggte Kontexte ein kompakter Arbeitsbereichslink statt einer zweiten langen Landing-Erklaerung

## Visuelle Nachschaerfung auf PR #330

Im zweiten Schritt auf demselben Branch wurde die Hero-Buehne visuell weiter gestrafft:

- der grosse aeussere Hero-Kasten wurde zurueckgenommen
- die Desktop-Breite wird jetzt deutlich staerker genutzt
- Voxy sitzt nicht mehr als kleines Bild in einer Nebenkarte, sondern als groessere Guide-Buehne rechts
- CTA-Flaechen wurden vergroessert und im Groessenkontrast staerker getrennt
- dekorative Klein-Pills und Rahmen wurden reduziert
- Sekundaerlinks wurden von Karten auf kleine, untergeordnete Textlinks reduziert
- Trust-Hinweise bleiben sichtbar, aber knapper und ruhiger

## Voxy-Hero-Asset-Korrektur

Im naechsten Nachschliff auf demselben Branch wurde nur die Voxy-Startseitenfigur lokal korrigiert:

- `HomeSplitVoxyLanding` nutzt fuer die Hero-Figur nicht mehr direkt `voxy-presenting.webp`
- stattdessen rendert die Startseite `createGuideLight` im Light Mode und `createGuideDark` im Dark Mode
- die Hero-Figur liegt jetzt in einem 4:5-Wrapper statt in einer 1:1-Bildkarte
- die Stage arbeitet mit engerem Crop, weicher Aura und gemeinsamer Canvas statt mit sichtbarer Rechteck-Flaeche
- die dunklen Notizkarten ueber der Figur wurden entfernt; uebrig bleibt nur noch eine deutlich ruhigere Kennzeichnung

Damit wirkt Voxy weniger wie ein eingefuegtes Screenshot-Bild und staerker wie eine integrierte Host-Figur der Landingpage.

## Voxy-Asset-Inventar und finale Home-Wahl

Das lokale Inventar der Brand-Dateien zeigt fuer die relevanten Startseiten-Assets:

- `voxy-create-guide-light.png`: `290 x 367`, PNG, mit Alpha
- `voxy-create-guide-dark.png`: `290 x 367`, PNG, mit Alpha
- `voxy-create-guide.png`: `290 x 367`, PNG, mit Alpha
- groessere Hero-Posen wie `voxy-confident.*`, `voxy-open.*` oder `voxy-presenting.*`: meist `1254 x 1254`, aber ohne Alpha und damit mit sichtbarer Raster-Hintergrundflaeche fuer diese Landing ungeeignet

Final fuer Home bleibt deshalb:

- Light Mode: `createGuideLight`
- Dark Mode: `createGuideDark`

Die Home-Darstellung begrenzt die sichtbare Voxy-Breite bewusst, weil diese Assets mit `290 x 367` fuer eine sehr grosse Hero-Skalierung nicht scharf genug sind.

Ein spaeteres echtes Home-Hero-Asset mit hoeherer Aufloesung und sauberem Alpha-Cutout bleibt weiterhin empfohlen.

## Kompositorischer Hero-Umbau

Im naechsten PR-Feinschliff wurde die Startseite bewusst naeher an die hinterlegten Zielreferenzen gezogen:

- links steht die Homepage jetzt als klare Claim-/Headline-/CTA-Spalte statt als Textblock mit grossen Formular-Karten
- rechts hat Voxy eine eigene Buehne mit Orbit-Linien, Glow und vier echten klickbaren Produktmodulen
- die Module verlinken direkt auf `Beitrag starten`, `Mitmachen`, `Themen ansehen` und `Debatte & Argumente`
- Light und Dark Mode nutzen nun bewusst getrennte Flaechenstimmungen, statt nur dieselbe Kartenlogik auf anderem Hintergrund zu zeigen

Damit wirkt die Startseite nicht mehr wie `Text links, Bild rechts`, sondern deutlich staerker wie eine Produkt-Landingpage mit Voxy als Host-Figur.

## Spacing- und Wording-Schaerfung

Im darauffolgenden Feinschliff wurde die bestehende Hero-Richtung nicht erneut umgeworfen, sondern ausbalanciert:

- die beiden Hauptkarten links bekamen mehr Innenabstand, breitere Textspalten und klarere Staffelung zwischen Primaer- und Sekundaerweg
- die rechte Voxy-Buehne wurde etwas ruhiger gesetzt; Figur, Orbit-Deko und Floating Cards kollidieren nun weniger
- die oeffentliche Ansprache wurde weg von binärer Abstimmungslogik und naeher an konstruktiver gesellschaftlicher Ausarbeitung gezogen
- `/swipes` bleibt technisch der zweite Hauptweg, wird sprachlich aber nicht mehr vor allem als `Abstimmen` verkauft

## Entfernte oder stark gekuerzte Bereiche

Folgende Bereiche sind nicht mehr Teil der primaeren Homepage-Lesestrecke:

- das eingebettete Create-Light-Formular als primaerer Hero-Inhalt
- Beispielkarten als oeffentlicher Homepage-Hauptfluss
- die langen Themen-/Factcheck-/Anlassraum-/Dossier-/Membership-Erklaerbloecke
- die Institution-/Demo-CTA-Batterie im anonymen Hero
- die ausgedehnte Footer-Erklaerung zur Initiative als Teil des Homepage-Hauptflusses

Die bestehende Create-Light-Logik (`LandingCreateLightEntry`, `landingCreateLight`) bleibt im Code bestehen, ist aber nicht mehr der primaere Einstieg auf `/start`.

## Keine Fake-Daten oder Fake-Live-Elemente

Der Slice fuehrt bewusst keine unechten Runtime-Elemente ein:

- keine Fake-Zahlen
- keine Fake-Partner
- keine Fake-Live-Polls
- keine Fake-Participation-Metriken
- keine behauptete automatische Recherche oder automatische Veroeffentlichung

Damit bleibt die Startseite konsistent mit review-first/no-auto-publish Guardrails.

## Keine ENV- oder Admin-Steuerung in diesem Slice

Der Umbau bleibt absichtlich ein statischer Frontend-Slice:

- keine neue ENV-Konfiguration
- kein Admin Board
- keine Home-Surface-Settings
- keine neue Runtime
- keine Provider- oder Publishing-Aenderung

Das reduziert den Scope auf eine testbare IA-/UX-Veraenderung der oeffentlichen Homepage.

## Relevante Codeaenderungen

- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/features/home/HomeSplitVoxyLanding.tsx`
- `apps/web/src/features/start/startExperience.ts`
- angepasste Landing-/Start-Contracts unter `apps/web/tests/...`

## Follow-ups

- Admin Home Surface Settings
- echte Homepage-Kacheln aus Dossier-/Poll-Runtime
- bessere Voxy-Produktassets fuer Hero und Mobile
- A/B-Variante Split CTA vs Single CTA
- spaeter dynamische, review-freigegebene Themen-/Poll-Previews
