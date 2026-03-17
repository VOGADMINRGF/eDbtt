# Account/Social Consolidation (Runtime Truth)

Stand: 2026-03-17

## Was jetzt produktseitig sichtbar ist

- Account-Hub mit drei klaren Flächen in fester Reihenfolge: `Interessen` -> `Inbox` -> `Profil`.
- `/account` startet ohne Hash standardmäßig im Tab `Interessen`.
- Hashes behalten Vorrang (`#interessen`, `#inbox`, `#profil`).
- Mobile Bottom-Navigation auf Kernprodukt umgestellt: `Swipes` -> `Create` -> `Dossier` -> `Profil`.
- Inbox ist mobil als separate Utility (Floating-Briefkasten mit Badge) schnell erreichbar.
- Mobile Utility und Bottom-Navigation reagieren auf Scrollrichtung (nach unten reduziert, nach oben wieder sichtbar).
- Avatar-Stift ist echte Aktion (Dateiauswahl + Persistenz via `/api/account/profile`).
- Interessen-Flow erzwingt mindestens 3 Themen für Speichern.
- Interessen-Tab ist als primärer Startbereich formuliert:
  - Nutzenkette sichtbar (`Interessen -> Debatten -> Matches`),
  - Save-Flow + CTA Richtung Inbox,
  - Match-Vorschau direkt im Interessen-Tab,
  - Debatten-/Themen-Ergebnisse direkt im Tab (heuristisch aus `feed_statements` via `/api/swipeStatements`).
- Ergebnislogik im Interessen-Tab ist sofort sichtbar:
  - Treffer nach Interessen-Keywords,
  - lokales Label, wenn Stadt/Region im Profil verfügbar ist,
  - ehrlicher Fallback (`vorbereitete Vorschläge`), wenn noch keine exakten Treffer vorhanden sind.
- Inbox lädt Social-Daten aus `core` über `/api/account/social-summary`.
- Founder-Welcome wird beim Laden aktiv sichergestellt.
- Social-Listen sind jetzt drill-down-fähig:
  - Freundschaftsanfragen klickbar,
  - Nachrichten klickbar,
  - Matches klickbar.
- Alle Social-Items nutzen Personenanker mit Avatar (wenn vorhanden) oder Initialen-Fallback.
- Klick auf Anfrage/Nachricht/Match öffnet ein einheitliches Detail-Sheet (konsistentes Interaktionsmuster).
- Social-Detail-Sheets sind jetzt handlungsorientiert:
  - Anfrage: `Annehmen` / `Ablehnen`
  - Match: `Verbindung anfragen`
  - Nachricht: lesbar, Antwortfunktion weiterhin ehrlich als "kommt bald"
- Inbox ist in drei Blöcke gegliedert:
  - `Wichtig jetzt` (Counts, Founder-/System-Momente, offene Signale),
  - `Menschen & Matches` (Interessen-/Region-Matching),
  - `Aktionen` (Einladen, Community, nächste Schritte).
- Invite-Funktion ist im Inbox-Kontext prominent und mobil schnell erreichbar.
- Matching-Preview (`/api/account/matches`) zeigt Gleichgesinnte über gemeinsame Interessen + Region.
- Desktop-Hierarchie ist breiter und stärker gestaffelt:
  - größere Seitenbreite in `/account`,
  - zweispaltige Ergebnis-/Aktionsbereiche bei großen Breakpoints,
  - bessere Trennung von primärem Inhalt vs. Aktionen/Meta.
- Profil ist nachgelagert und UX-seitig eindeutig:
  - klare Profil-Vorschau (nicht pseudo-editierbar),
  - expliziter Edit-Trigger für Name/Tagline/Bio,
  - direkter Edit-Bereich mit Trennung `Interne Registrierungsdaten` vs. `Öffentliche Darstellung`.

## Social/Founder Runtime

### Stores

- `core`:
  - `users`
  - `social_friend_requests`
  - `social_messages`
  - `product_onboarding_events` (Onboarding-Events)
- `pii`:
  - persönliche Profildaten (`/api/account/personal`)
- `votes`:
  - nicht Teil des Account/Social-Flows

### Social Actions API

- Neue Route: `/api/account/social-actions`
- Unterstützte Aktionen:
  - `request.accept`
  - `request.reject`
  - `match.request`
- Wird vom Account-Detail-Sheet genutzt und aktualisiert danach Summary + Matches.

### Founder-Welcome Kette

- `/api/account/social-summary` ruft `ensureFounderWelcomeForUser(...)` auf.
- Falls ein Founder-Account gefunden wird, wird Anfrage/Nachricht aus diesem Kontext gesichert.
- Falls kein Founder-Account auflösbar ist, wird ein stabiler Fallback-Absender (`founder:voiceopengov`) genutzt.
- Ergebnis wird in der API als Meta (`founderFlow`) an die UI geliefert.

## Direktnachrichten-Status (ehrlich markiert)

- Lesen/Anzeige von Social-Nachrichten in der Inbox: ja.
- Senden von Direktnachrichten zwischen Nutzern (UI + API end-to-end): noch nicht freigeschaltet.
- Produkttexte markieren diesen Zustand explizit als "noch im Ausbau".
- Im Detail-Sheet wird Antworten bewusst als "kommt bald" und deaktiviert dargestellt (keine Scheininteraktion).

## Community-Begriff (aktueller Scope)

`/community` ist aktuell ein Community-Hub mit Fokus auf:

- Discovery (Matching-Ausgangspunkt in Account/Inbox),
- Community-Beiträge (`/community/contributions`),
- Verlinkung in Streams/Campaigns.

Es ist aktuell kein vollwertiger Realtime-DM-Chat.
