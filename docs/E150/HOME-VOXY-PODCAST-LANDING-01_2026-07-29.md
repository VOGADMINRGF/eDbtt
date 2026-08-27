# HOME-VOXY-PODCAST-LANDING-01

Datum: 2026-07-29
Issue: `#526`
Draft-PR: `#527`
Branch: `pr/home-voxy-podcast-landing-01`

## Ziel

Die öffentliche eDebatte-Startseite übernimmt die freigegebene Dramaturgie der Video-Referenz: Voxy empfängt Menschen an einem gemeinsamen Podcast-Tisch; beim Scrollen werden Zielgruppen, Nutzen und Arbeitsweise verständlich sichtbar.

## Verbindliches Zielbild für Codex

- Zielbild: `docs/E150/assets/HOME-VOXY-PODCAST-LANDING-01_TARGET.svg`
- Das SVG ist die kanonische visuelle Referenz für Hierarchie, Reihenfolge, Gewichtung und Gesamtwirkung.
- Für das produktive Hero-Motiv wird trotzdem ausschließlich das vorhandene Originalasset `apps/web/public/brand/voxy/voxy-podcast-stage.png` verwendet.
- Das Zielbild darf nicht als Aufforderung verstanden werden, Voxy neu zu zeichnen, umzubauen, umzufärben oder durch ein generiertes Maskottchen zu ersetzen.
- Codex soll Abstände, Kontrast, Responsive-Verhalten und Barrierefreiheit technisch verbessern dürfen, ohne die freigegebene Inhaltsdramaturgie zu verändern.

## Verbindliche Produktentscheidungen

- Voxy bleibt unverändert im kanonischen Design.
- Produktiv wird das bereits vorhandene Asset `apps/web/public/brand/voxy/voxy-podcast-stage.png` eingebunden.
- Der kompakte Launcher nutzt ausschließlich `voxy-mini-avatar`.
- eDebatte führt als eigenständige offene Infrastruktur und Produktmarke; VoiceOpenGov ist eine internationale Mitgliederbewegung, aber weder Eigentümer noch exklusiver Träger von eDebatte.
- Fakten und Wahrheit werden nicht zur Abstimmung gestellt. Entscheidungen betreffen Positionen und nächste Schritte.
- Es gibt kein Auto-Publish und keine erfundene Live-, Partner- oder Nutzungsmetrik.

## Umsetzung

- Hero-Claim: `Stimmen verbinden. Zusammenhänge sichtbar machen. Gemeinsam entscheiden.`
- Podcast-Hero mit unverändertem Voxy-Brand-Asset
- klare CTA-Hierarchie: zuerst `Thema einbringen`, danach `Debatten entdecken`
- persönliche Ansprache `Hallo Nachbar.`
- kanonische öffentliche Marken-Narrative in drei natürlichen Absätzen ohne sichtbare Why–How–What-Zwischenüberschriften
- vier Zielgruppen:
  - Nachbarn und Bürger
  - Initiativen und Communities
  - Kommunen und Organisationen
  - Medien und Redaktionen
- sechs Nutzenbausteine:
  - Sprachen verbinden
  - Quellen sichtbar machen
  - Zusammenhänge erkennen
  - Debatten statt Kommentarchaos
  - Gemeinsam entscheiden
  - Von lokal bis global
- dreistufige Erklärung der Voxy-Begleitung
- abschließender Beteiligungsimpuls mit den bestehenden Zielen `/create` und `/themen`
- kompakter Voxy-Launcher unten rechts
- Scroll-Reveals mit `IntersectionObserver` und `prefers-reduced-motion`-Fallback

## Abgleich mit dem Zielbild

Beim technischen Soll-/Ist-Abgleich wurden folgende Abweichungen erkannt und korrigiert:

- Der Hero erzwang einen nahezu hochformatigen Bildausschnitt und verlor dadurch die Breite und Wirkung des Podcast-Motivs. Er nutzt jetzt einen responsiven `4:3`-/`6:5`-Zuschnitt des unveränderten Originalassets.
- Die Desktop-Headline war bei üblichen Viewports zu groß und wurde visuell angeschnitten. Die responsive Typografie ist jetzt viewportgebunden und bleibt auf Mobile und Desktop vollständig lesbar.
- Der Hero war vertikal zentriert, wodurch Bild und Text keinen gemeinsamen oberen Anker hatten. Beide Spalten sind jetzt am oberen Rand ausgerichtet.
- Die CTA-Priorität wich vom Zielbild ab. `Thema einbringen` führt jetzt als primäre Aktion; alle Ziele `/themen`, `/create`, `/swipes` und `/dossier` bleiben unverändert.
- Eine technische interne Shell-Beschreibung erschien als öffentlicher Hero-Text. Sie wurde entfernt.
- Die verbindliche dreiteilige Marken-Narrative fehlte. Sie steht jetzt unterhalb des Hero und wahrt ausdrücklich, dass nicht über Wahrheit abgestimmt wird.
- Zielgruppen und Nutzen waren auf Desktop zu breit gestaffelt. Vier Zielgruppen und sechs Nutzenbausteine bilden jetzt die im Zielbild erkennbare Querdramaturgie; mobil bleiben sie in sinnvoller Lesereihenfolge gestapelt.
- Der Abschlussimpuls aus dem Zielbild fehlte. Er wurde mit bestehenden Routen und ohne neue Produktlogik ergänzt.
- Der Launcher kollidierte mobil mit der festen Bottom-Navigation. Er ist deshalb auf kleinen Viewports ausgeblendet und erscheint erst ab `md` kompakt unten rechts.
- Das Launcher-Porträt ist für Screenreader dekorativ, während der Link einen eindeutigen Aktionsnamen trägt. Der Begleittext erscheint desktopseitig bei Hover und Tastaturfokus.

## Bewusste Abweichungen vom Zielbild

- Die im SVG gezeichnete Navigationsleiste ersetzt nicht den bestehenden globalen `SiteHeader`; das Zielbild definiert keine neue Navigations- oder Routingwahrheit.
- Die illustrative Debattenkarte mit Ortsname, Beteiligungszahlen und Fortschrittswert wird nicht übernommen. Stattdessen bleiben die vier realen Einstiege nach `/themen`, `/create`, `/swipes` und `/dossier` erhalten. So entstehen weder Fake-Zahlen noch eine Demo-Runtime.
- Die Voxy-Darstellung aus dem SVG wird nicht als Produktasset exportiert. Produktiv bleibt ausschließlich `apps/web/public/brand/voxy/voxy-podcast-stage.png`; der Launcher verwendet ausschließlich den kanonischen `miniAvatar`.
- Die vorhandenen Theme-Tokens und der globale Seitenrahmen bleiben erhalten. Das Zielbild wird in Hierarchie, Gewichtung und Scroll-Dramaturgie übernommen, nicht als pixelgenaue zweite Designwelt.
- Der Launcher bleibt auf kleinen Viewports vollständig ausgeblendet; dort führt bereits die feste Bottom-Navigation in den Create-Pfad. Ab `md` bleiben miniAvatar, zugänglicher Linkname und fokussierbarer Begleittext erhalten.
- Die kanonische Marken-Narrative bleibt trotz ihrer verkürzten Darstellung im Zielbild vollständig. Das folgt dem verbindlichen Brand-SSOT.

## Sicht- und Interaktionsprüfung

- Lokale Browserprüfung im Dark Theme: Desktop `1440 × 900` und Mobile `393 × 852`.
- Alle `22` Scroll-Reveal-Elemente wurden durch Scrollen aktiviert und blieben sichtbar.
- Unter `prefers-reduced-motion: reduce` blieb kein Reveal-Inhalt durch Opazität verborgen.
- Im geprüften mobilen `393 × 852`-Viewport ist der Launcher ausgeblendet und kann daher weder mit Hero-CTAs noch mit der festen Bottom-Navigation kollidieren.
- Der Consent-Dialog liegt in der bestehenden Overlay-Schicht über der Seitenshell und setzt sie `inert`/`aria-hidden`; der ab `md` sichtbare Launcher erzeugt deshalb keinen konkurrierenden Tastatur- oder Screenreader-Fokus.
- Überschriftenstruktur: genau ein sichtbares `h1`; die Hauptabschnitte folgen als `h2`, Karten und Prozessschritte als `h3`.
- Das Hero-Bild behält die priorisierte Next-Image-Auslieferung und eine responsive `sizes`-Angabe. Die Quelldatei wurde weder dupliziert noch verändert.

Diese technische Sichtprüfung ist keine Desktop-/Mobile-Produktabnahme. Die menschliche Produktabnahme bleibt Voraussetzung für `done`.

## PR- und Kollisionsprüfung

- PR `#527` ist der bestehende offene Draft-PR auf `pr/home-voxy-podcast-landing-01`; es wurde weder ein Branch noch ein weiterer PR angelegt.
- PR `#519` berührt ebenfalls `docs/E150/OpenTasks.md`, jedoch einen anderen operativen Taskbereich. Das ist ein beherrschbares Rebase-/Merge-Konfliktrisiko für die gemeinsame Datei.
- PR `#520` weist keine erkennbare Datei- oder Produktkollision mit dieser Landingpage auf.
- PR `#521` berührt Foundation-/Governance-Dokumentation, nicht die Landing-Implementierung; die dort sichtbaren Guardrails zu Review-first, Auto-Publish und Faktenwahrheit stehen nicht im Widerspruch zu diesem Slice.

## Geänderte Dateien dieses Abgleichs

- `apps/web/src/features/home/HomeSplitVoxyLanding.tsx`
- `apps/web/src/features/home/HomeScrollReveal.tsx`
- `apps/web/tests/landing-clarity.contract.test.tsx`
- `apps/web/tests/landing-information-architecture.contract.test.tsx`
- `apps/web/tests/start-privacy-gate-links.contract.test.ts`
- `apps/web/tests/start-shared-create-composer.contract.test.tsx`
- `docs/E150/HOME-VOXY-PODCAST-LANDING-01_2026-07-29.md`
- `docs/E150/HOME-VOXY-PODCAST-LANDING-01_CODEX_BRIEF.md`
- `docs/E150/HOME-VOXY-PODCAST-LANDING-01_CODEX_ENTRY.md`
- `docs/E150/HOME-VOXY-PODCAST-LANDING-01_VISUAL_HANDOFF.md`
- `docs/E150/assets/HOME-VOXY-PODCAST-LANDING-01_TARGET.svg`

## Prüfstand

- Fokussierte Landing- und Start-Tests: `pnpm -C apps/web exec vitest run tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/start-privacy-gate-links.contract.test.ts tests/start-shared-create-composer.contract.test.tsx tests/start-cta-immediate-navigation.contract.test.tsx` — `5` Testdateien und `10` Tests grün.
- `pnpm lint` — grün; `1/1` Turbo-Task erfolgreich in `39,185 s`.
- `pnpm -C apps/web run typecheck` — grün; `tsc --noEmit -p tsconfig.json` ohne Diagnose.
- `pnpm -C apps/web run build` — grün mit ausschließlich lokalen, nicht-produktiven Platzhalterwerten für die verpflichtende Infrastrukturkonfiguration; Page-Check über `255` Seiten mit `0` fehlenden `h1` und `0` Button-Verstößen, Next.js-Kompilierung erfolgreich, `322/322` statische Seiten generiert.
- Ein vorausgehender Build ohne lokale Infrastrukturvariablen kompilierte erfolgreich und scheiterte erwartungsgemäß erst beim Page-Data-Collect an der strikten Env-Validierung. Es wurden keine echten Secrets verwendet und keine Datenbankverbindung vorausgesetzt.
- `git diff --check` — grün.
- Lokale Laufzeit für fokussierte Tests, Lint, Typecheck und Build: Node `v20.20.2`, entsprechend der Repository-Vorgabe `20.x`.

## Offene Gates

- dokumentierte menschliche Desktop-Produktabnahme
- dokumentierte menschliche Mobile-Produktabnahme
- Realgeräteprüfung von Safe Area, Bottom-Navigation und Consent-Overlay, insbesondere Mobile Safari
- geschützte Vercel-Preview durch einen berechtigten menschlichen Reviewer öffnen und abnehmen
- kein Auto-Merge

Der Task steht maximal auf `review`; `done` ist ausdrücklich nicht gesetzt.
