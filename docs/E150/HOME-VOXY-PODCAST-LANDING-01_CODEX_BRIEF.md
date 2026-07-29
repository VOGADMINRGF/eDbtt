# Codex Brief — HOME-VOXY-PODCAST-LANDING-01

## Lies zuerst

1. `AGENTS.md`
2. `docs/E150/CODEX_RUN_PACK_CONTRACT.md`
3. den kanonischen operativen Kopf von `docs/E150/OpenTasks.md`
4. `docs/E150/HOME-VOXY-PODCAST-LANDING-01_2026-07-29.md`
5. `docs/E150/assets/HOME-VOXY-PODCAST-LANDING-01_TARGET.svg`

## Ziel

Gleiche die Implementierung der öffentlichen Startseite mit dem visuellen Zielbild ab, ohne eine neue Produktlogik, Route, Persistenzwelt oder Voxy-Variante einzuführen.

## Muss erhalten bleiben

- Hero-Claim: `Stimmen verbinden. Zusammenhänge sichtbar machen. Gemeinsam entscheiden.`
- eDebatte als Produktmarke; VoiceOpenGov nur als Trägerkontext
- Originalasset `apps/web/public/brand/voxy/voxy-podcast-stage.png`
- Launcher-Asset aus dem kanonischen `miniAvatar`
- vier Zielgruppen, sechs Nutzenbausteine und drei Voxy-Prozessschritte
- bestehende Ziele `/themen`, `/create`, `/swipes` und `/dossier`
- `prefers-reduced-motion`
- kein Auto-Publish, keine Fake-Zahlen und keine Demo-Runtime

## Darf optimiert werden

- responsive Abstände und Typografie
- Lesbarkeit und Kontrast
- Zuschnitt des vorhandenen Hero-Assets
- Scroll-Reveal-Timing
- Mobile-Reihenfolge und Launcher-Kollisionen
- semantische Struktur, Tastaturbedienung und Screenreader-Texte

## Darf nicht passieren

- Voxy neu zeichnen, spiegeln, umfärben oder durch generierte Varianten ersetzen
- Zielbildtexte ungeprüft als neue Produktwahrheit behandeln
- Fakten oder Wahrheit als Abstimmungsgegenstand formulieren
- neue Navigation, neue Routes oder neue Datenquellen erfinden
- OpenTasks auf `done` setzen, bevor Desktop- und Mobile-Sichtprüfung dokumentiert sind

## Abschluss

- fokussierte Landing-Contracts ausführen
- Lint, Typecheck, Build und `git diff --check` ausführen
- Desktop und Mobile gegen das Zielbild prüfen
- Abweichungen und bewusste technische Anpassungen in der Evidence dokumentieren
- Task maximal auf `review` setzen
- kein Auto-Merge
