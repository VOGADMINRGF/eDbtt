# Account/Social Consolidation (Runtime Truth)

Stand: 2026-03-16

## Was jetzt produktseitig sichtbar ist

- Account-Hub mit drei klaren Flächen: `Profil`, `Interessen`, `Inbox`.
- Mobile Quick-Utility unten mit Schnellzugriff auf `Profil`, `Interessen`, `Inbox`, `Einladen`.
- Avatar-Stift ist echte Aktion (Dateiauswahl + Persistenz via `/api/account/profile`).
- Interessen-Flow erzwingt mindestens 3 Themen für Speichern.
- Inbox lädt Social-Daten aus `core` über `/api/account/social-summary`.
- Founder-Welcome wird beim Laden aktiv sichergestellt.
- Invite-Funktion ist im Inbox-Kontext prominent und mobil schnell erreichbar.
- Matching-Preview (`/api/account/matches`) zeigt Gleichgesinnte über gemeinsame Interessen + Region.

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

### Founder-Welcome Kette

- `/api/account/social-summary` ruft `ensureFounderWelcomeForUser(...)` auf.
- Falls ein Founder-Account gefunden wird, wird Anfrage/Nachricht aus diesem Kontext gesichert.
- Falls kein Founder-Account auflösbar ist, wird ein stabiler Fallback-Absender (`founder:voiceopengov`) genutzt.
- Ergebnis wird in der API als Meta (`founderFlow`) an die UI geliefert.

## Direktnachrichten-Status (ehrlich markiert)

- Lesen/Anzeige von Social-Nachrichten in der Inbox: ja.
- Senden von Direktnachrichten zwischen Nutzern (UI + API end-to-end): noch nicht freigeschaltet.
- Produkttexte markieren diesen Zustand explizit als "noch im Ausbau".

## Community-Begriff (aktueller Scope)

`/community` ist aktuell ein Community-Hub mit Fokus auf:

- Discovery (Matching-Ausgangspunkt in Account/Inbox),
- Community-Beiträge (`/community/contributions`),
- Verlinkung in Streams/Campaigns.

Es ist aktuell kein vollwertiger Realtime-DM-Chat.

