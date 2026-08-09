# VOXY-SMART-PRESENCE-FOUNDATION-01 — Implementation Evidence

Stand: 2026-08-09

Task: `VOXY-SMART-PRESENCE-FOUNDATION-01`

Issue: `#489`

Branch: `feat/voxy-smart-presence-foundation-01`

## Ergebnis

Die gemeinsame, read-only Smart-Presence-Grundlage ist implementiert und in der
realen Dossier-Detailfläche adoptiert:

- Der typisierte Kontextvertrag führt Surface, Objekt, Hilfethema, realen
  Status, höchstens drei Navigationsaktionen sowie getrennten Sprach- und
  Berechtigungskontext.
- `VoxyHelpTrigger` rendert ausschließlich für einen validen Hilfekontext und
  bleibt auf höchstens einen Trigger je fachlichem Block begrenzt.
- `VoxyPeek` ist nicht modal, übernimmt Objektkontext und Schreibrichtung,
  unterstützt Escape und gibt den Fokus an den Trigger zurück.
- `VoxySmartDock` startet ruhig minimiert, folgt Dossier-Modus beziehungsweise
  fokussiertem Objekt und lässt sich minimieren, stummschalten, ausblenden und
  wieder aktivieren.
- Die Dossier-Adoption erklärt nur reale Unsicherheit, widersprechende oder
  ungeprüfte Quellen sowie offene Fragen und Prüfstände. Aktionen navigieren
  ausschließlich zu vorhandenen Dossierobjekten.

Es wurde keine Voice-/Speech-Runtime, Mutation, neue Analyse-, Review- oder
Dossierwahrheit und kein Auto-Publish oder Auto-Handoff ergänzt.

## Wiederverwendung und Layout

Die neuen Bausteine verwenden `VoxyInlineHint` und damit die bestehende
Voxy-Avatar-/Asset- und Experience-Guard-Kette. Der Dock ist kein Fullscreen-
oder ungefragtes Chat-Pop-up, bleibt im Dokumentfluss, berücksichtigt die Mobile
Safe Area und enthält Reduced-Motion-, RTL- und Screenreader-Verträge. Bestehende
Nutzungen von `VoxyFloatingDock`, `VoxyBubble` und `VoxyGuide` bleiben
kompatibel.

## Verifikation

Ausgeführt mit Node `20.20.2`:

- fokussierte Contract-, Interaktions- und Dossier-Tests: `24/24` grün
- Web-PR-Critical-Guardrails: `72/72` grün
- Production-Guardrails: `36/36` grün
- Typecheck: grün
- Lint: grün
- Produktions-Build: grün (`255` Page-Contracts, `322` statische Seiten)
- `git diff --check`: grün

## Verbleibende Grenzen

- Cross-Surface- und Voice-Agent bleiben bei Issue `#486` und den dortigen
  Abhängigkeiten.
- Anlassraum, Runde und Beteiligung übernehmen diese Foundation erst in ihren
  jeweils freigegebenen Folgeslices.
- Keine Human-, Produkt- oder Deployment-Abnahme wird durch diese technische
  Evidence ersetzt.
