# PR-WRAPPER-01 - Wrapper MVP Prep Inventory (2026-04-05)

## Scope

Kleiner Vorbereitungs-Slice fuer einen schlanken Wrapper-/Store-Track auf Basis der bestehenden Web-App:

- kein nativer Rebuild
- kein Full-App-Umbau
- kein Push-/Offline-/Kamera-/Chat-Programm
- kein Release-/Submission-Lauf
- nur belastbare MVP-Grenze + Readiness-Check + Folgeplan

## Wrapper-MVP Surface Scope

### MVP rein (erste Store-faehige Nutzungsstrecke)

| Surface | Pfad(e) | Grund |
| --- | --- | --- |
| Start / Einstieg | `/`, `/start` | Oeffentlicher Einstieg und Navigation vorhanden |
| Login / Session / Konto | `/login`, `/logout`, `/account`, `/account/payment`, `/account/security` | Session-/Profilstrecke fuer wiederkehrende Nutzung |
| Kanonischer Intake | `/create` | Produktkern fuer Einstieg in Anlass-/Beteiligungsfluss |
| Beteiligung | `/swipes`, `/swipes/[id]` | Mobile-relevante Beteiligungsflaeche |
| Anlassraum / Runden | `/runden`, `/anlassraum`, `/round/[slug]` | Betriebs-/Statusflaeche + Alias vorhanden |
| Dossier lesen | `/dossier/[id]` | Kernnutzen fuer strukturierte Information |
| Pricing / Vormerken | `/pricing`, `/vormerken` | Store-nahe Akquise-/Upgrade-Strecke |
| Pflichtseiten | `/impressum`, `/datenschutz`, `/agb`, `/widerrufsbelehrung`, `/barrierefreiheit` | Compliance-/Store-Minimum |

### Optional spaeter (kein Blocker fuer ersten Wrapper)

| Surface | Pfad(e) | Grund |
| --- | --- | --- |
| Atlas read-only | `/atlas`, `/atlas/weekly` | Produktiv nutzbar, aber nicht noetig fuer MVP-Store-Start |
| Companion / Reports | `/companion/[slug]`, `/report/[id]` | Sinnvoll, aber nicht Kern fuer erste Wrapper-Freigabe |
| Community Discovery | `/community` | Optionaler Ausbau nach Kernpfad-Validierung |

### Bewusst nicht im ersten Wrapper

| Surface | Pfad(e) | Grund |
| --- | --- | --- |
| Admin-/Operator-Surfaces | `/admin/**`, `/dashboard/**` | Operativ/sensibel, kein MVP-Store-Fokus |
| Review-/Governance-Operatorflaechen | `/atlas/social-review` | Kurations-/Backoffice-Kontext, nicht public-first MVP |
| Demo-/Legacy-/Embed-Surfaces | `/demo/**`, `/embed/**`, Legacy-Wrapper | Nicht kanonischer Endnutzerpfad fuer Store-MVP |
| Research-/Spezialflaechen | `/research/**`, `/studio`, `/overlay/**` | Kein MVP-Kern, potenziell hoehere Review-/Betriebslast |

## Technische Readiness-Matrix

| Bereich | Aktueller Stand | Risiko | Blocker | Klein vorbereitbar |
| --- | --- | --- | --- | --- |
| Build-/Deploy-Basis | Web-Build grün; Next App Router stabil | niedrig | nein | ja |
| Session im Wrapper-Webview | Session-Cookies sind httpOnly + sameSite=lax + secure(prod) gesetzt (`session_token`, `u_*`, `pending_2fa`) | mittel (Webview-Cookie-Verhalten je Plattform) | nein (bei HTTPS-Remote-URL als First-Party) | ja |
| Redirect-/Deep-Link-Sicherheit | Auth-Redirects werden intern sanitisiert (`sanitizeRedirect` -> nur `pathname+search`) | niedrig | nein | ja |
| Route-/Alias-Paritaet | Kernalias vorhanden (`/anlassraum` -> `/runden`, `/sw`/`/swipe` -> `/swipes`) | niedrig | nein | ja |
| Wrapper-spezifische Packaging-Basis | Kein bestehender nativer Wrapper-Stack (Capacitor/TWA/etc.) im Repo | mittel | nein (fuers Prep), ja (fuers Bauen) | ja |
| App-/PWA-Meta fuer mobile Packaging | Basis-Metadata/Viewport vorhanden; kein separater Wrapper-Track-Contract | mittel | nein | ja |
| Sensitive Surface-Abgrenzung | Trennung oeffentlich vs. operatorisch im Produkt vorhanden, aber kein Wrapper-Allowlist-Contract | mittel | nein | ja |

## Kritische Guardrails fuer den Wrapper-MVP

1. Web bleibt Produktkern; Wrapper ist nur Distributionskanal.
2. Kein Auto-Publish/keine Governance-Sonderpfade durch Wrapper.
3. Keine stille Oeffnung von Admin-/Operator-Surfaces im MVP.
4. Auth/Session bleibt serverseitig fuehrend; keine parallele Identity-Schicht.
5. Deep Links nur intern/kanonisch; externe Ziele explizit getrennt behandeln.

## Ergebnis des Slices

- Wrapper-MVP-Grenze ist klar geschnitten (rein / spaeter / bewusst raus).
- Technische Readiness ist inventarisiert; kein akuter Architektur-Blocker fuer den Start eines schlanken Wrappers.
- Echte Restarbeit ist in kleine Folgeaufgaben zerlegt (siehe OpenTasks: `PR-WRAPPER-01A`/`PR-WRAPPER-01B`).

## Bewusst nicht Teil dieses Slices

- Kein nativer Wrapper-Code (iOS/Android-Projektgeruest)
- Kein Store-Submission-Run
- Keine Push/Offline/Kamera/Chat-Erweiterung
- Kein Produkt-/Routing-/Governance-Umbau
