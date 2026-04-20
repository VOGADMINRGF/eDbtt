# PR-WRAPPER-01B - Wrapper Stack / Plattform / MVP-Entscheidung (2026-04-05)

## Ziel des Decision-Slices

Klarer, belastbarer Abschluss von `PR-WRAPPER-01B` auf Basis von:

- `docs/E150/PR-WRAPPER-01_WRAPPER_MVP_PREP_INVENTORY_2026-04-05.md`
- `docs/E150/PR-WRAPPER-01A_RUNTIME_ROUTING_PREP_2026-04-05.md`
- aktuellem Repo-Stand (Web-Kern, Routing-/Session-/Redirect-Contracts, MVP-Allowlist-Prep)

Kein nativer Full-Bau, keine Submission, keine neue Produktlogik.

## Entscheidungsuebersicht

| Dimension | Entscheidung | Begruendung | Hauptrisiko | Folgeimplikation |
| --- | --- | --- | --- | --- |
| Wrapper-Stack | **Capacitor** | Passt zum bestehenden Next/Web-Kern mit geringstem Umbau; reuse der bestehenden Surfaces/Contracts; schneller Start fuer Store-Distributionsziel | Webview-spezifische Unterschiede (Cookies/Navigation) | Native Shell-Slices koennen direkt auf bestehende Web-Routen aufsetzen |
| Plattform-Reihenfolge | **Android zuerst** | Niedrigerer Startwiderstand fuer erstes Distributionslernen; schnelleres Feedback auf Runtime-/Webview-Kanten | iOS-spezifische Kanten kommen spaeter | iOS folgt nach Android-Beta-Haertung als zweiter Rollout-Schritt |
| MVP-Surface-Grenze | **Kernpfade nur** (Start/Login/Account/Create/Swipes/Runden+Alias/Dossier/Pricing+Vormerken/Pflichtseiten) | Kleinster tragfaehiger Store-MVP ohne Operator-Overreach | Zu enger Scope kann Erwartung anfangs begrenzen | Klare Kommunikation + spaetere kontrollierte Erweiterung ueber Folgeslices |
| Stream im MVP | **Ja, als Nutzerpfad** (`/stream`, `/stream/[slug]`) | Public-/User-naher Konsumpfad; passt zu Beteiligungs-/Kontextlogik ohne Produktionsbetrieb | Medien-/Player-Verhalten je Device/Webview | Stream bleibt read-/participation-first; Betriebs-/Studio-Funktionen nicht Teil des MVP |
| Explizite Ausschluesse | **Admin/Demo/Research/Operator-Spezialflaechen raus** (`/admin/**`, `/dashboard/**`, `/demo/**`, `/embed/**`, `/research/**`, `/atlas/social-review`, Studio-/Overlay-Spezialpfade) | Reduziert Risiko, Review-/Ops-Komplexitaet und Store-Angriffsflaeche im ersten Schritt | Einige interne Nutzerpfade mobil noch nicht verfuegbar | Ausschluesse bleiben bewusst bis nach MVP-Stabilisierung |

## Stream-Entscheidung konkret

### Im MVP enthalten

- `/stream`
- `/stream/[slug]`

als normaler Nutzerpfad:
- ansehen
- Kontext erfassen
- in anschliessende Beteiligungspfade uebergehen

### Nicht im MVP enthalten

- Produktions-/Moderations-/Operator-aehnliche Stream-Spezialflaechen (z. B. Studio-/Backoffice-nahe Pfade)
- keine neue Streaming-Produktlogik

## Guardrails (verbindlich)

1. Web bleibt Produktkern; Wrapper ist Distributionskanal.
2. Kein Auto-Publish-/Governance-Bypass durch Wrapper.
3. Keine stille Oeffnung ausgeschlossener Operatorflaechen.
4. Session-/Redirect-Contracts aus `PR-WRAPPER-01A` bleiben massgeblich.
5. Keine Scope-Ausweitung in Push/Offline/Kamera/Chat in diesem Programmabschnitt.

## Ergebnis

`PR-WRAPPER-01B` ist als Decision-Step abgeschlossen.  
Naechster Schritt ist kein neuer Entscheidungsblock, sondern ein separater, kleiner Umsetzungs-Slice fuer den tatsaechlichen nativen Wrapper-Start auf Basis dieser Festlegung.
