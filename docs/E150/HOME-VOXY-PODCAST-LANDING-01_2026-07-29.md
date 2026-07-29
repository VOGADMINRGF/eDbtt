# HOME-VOXY-PODCAST-LANDING-01

Datum: 2026-07-29  
Issue: `#526`  
Draft-PR: `#527`  
Branch: `pr/home-voxy-podcast-landing-01`

## Ziel

Die öffentliche eDebatte-Startseite übernimmt die freigegebene Dramaturgie der Video-Referenz: Voxy empfängt Menschen an einem gemeinsamen Podcast-Tisch; beim Scrollen werden Zielgruppen, Nutzen und Arbeitsweise verständlich sichtbar.

## Verbindliche Produktentscheidungen

- Voxy bleibt unverändert im kanonischen Design.
- Produktiv wird das bereits vorhandene Asset `apps/web/public/brand/voxy/voxy-podcast-stage.png` eingebunden.
- Der kompakte Launcher nutzt ausschließlich `voxy-mini-avatar`.
- eDebatte führt als Produktmarke; VoiceOpenGov erscheint als Träger- und Initiativkontext.
- Fakten und Wahrheit werden nicht zur Abstimmung gestellt. Entscheidungen betreffen Positionen und nächste Schritte.
- Es gibt kein Auto-Publish und keine erfundene Live-, Partner- oder Nutzungsmetrik.

## Umsetzung

- Hero-Claim: `Stimmen verbinden. Zusammenhänge sichtbar machen. Gemeinsam entscheiden.`
- Podcast-Hero mit unverändertem Voxy-Brand-Asset
- zwei primäre Einstiege: Debatten entdecken und Thema einbringen
- persönliche Ansprache `Hallo Nachbar.`
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
- kompakter Voxy-Launcher unten rechts
- Scroll-Reveals mit `IntersectionObserver` und `prefers-reduced-motion`-Fallback

## Geänderte Dateien

- `apps/web/src/features/home/HomeSplitVoxyLanding.tsx`
- `apps/web/src/features/home/HomeScrollReveal.tsx`
- `apps/web/tests/landing-clarity.contract.test.tsx`
- `apps/web/tests/landing-information-architecture.contract.test.tsx`
- `docs/E150/HOME-VOXY-PODCAST-LANDING-01_2026-07-29.md`

## Prüfstand

- TSX-Syntax der geänderten lokalen Entwürfe wurde mit dem TypeScript-Parser geprüft.
- Die zwei fokussierten Landing-Contracts wurden an Claim, Asset, Zielgruppen, Nutzen, Prozess, Launcher und No-Fake-Data-Guardrails angepasst.
- GitHub Web CI ist für den Draft-PR maßgeblich.
- Kein lokaler vollständiger Typecheck, Lint oder Build wurde über den GitHub-Connector ausgeführt.

## Offene Gates

- Web CI vollständig grün
- Desktop-Sichtprüfung
- Mobile-Sichtprüfung
- Zusammenspiel des fixierten Voxy-Launchers mit Consent- und Mobile-Overlays
- operativen Kopf von `docs/E150/OpenTasks.md` vor Merge um `HOME-VOXY-PODCAST-LANDING-01` ergänzen und auf `review` setzen
- kein Auto-Merge
