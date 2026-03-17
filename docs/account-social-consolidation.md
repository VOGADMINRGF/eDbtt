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
- Inbox unterscheidet sichtbarer zwischen:
  - Founder/System-Signalen
  - echten Direktnachrichten.
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
  - Nachricht: Verlauf lesen + kurze Nachricht senden (DM-v1, wenn Verbindung bestätigt)
- Anfrage-Flow ist jetzt zuerst inline:
  - `Annehmen`, `Ablehnen`, `Profil öffnen` direkt in der Anfrage-Liste.
  - Nach `Annehmen` wechselt dieselbe Karte auf `Verbunden` + `Nachricht schreiben`.
  - Detail-Sheet bleibt optionaler Zusatz, nicht Pflicht.
- Founder-/Systemkontakt ist klar getrennt:
  - in eigener Kanal-Darstellung (`Founder & System Kanal`),
  - nicht mehr als normale private Freundschaftsanfrage inszeniert.
- Thread-UX in DM-v1 ist ruhiger gestaffelt:
  - eindeutige Du/Kontakt-Bubbles,
  - freundlicher Empty-State,
  - Zeitstempel dezent,
  - Intro-Hinweis bei erster Nachricht.
- Composer-Polish in DM-v1:
  - `Enter` sendet,
  - `Shift+Enter` erzeugt Zeilenumbruch,
  - Fokus bleibt nach dem Senden stabil im Eingabefeld.
- Öffentliche Profilseiten (`/profile/[shareId]`) sind jetzt als Kontaktfläche nutzbar:
  - Verbindungsstatus sichtbar,
  - Anfrage annehmen/ablehnen oder Verbindung anfragen,
  - Direktnachricht v1 bei bestätigter Verbindung.
- Target-Linking ist robuster:
  - Detailflächen nutzen `targetShareId`/`targetProfileHref` als bevorzugten Profilanker,
  - ehrlicher Fallback ohne kaputten Link.
- Inbox ist in drei Blöcke gegliedert:
  - `Wichtig jetzt` (Counts, Founder-/System-Momente, offene Signale),
  - `Menschen & Matches` (Interessen-/Region-Matching),
  - `Aktionen` (Einladen, Community, nächste Schritte).
- Invite-Funktion ist im Inbox-Kontext prominent und mobil schnell erreichbar.
- Matching-Preview (`/api/account/matches`) zeigt Gleichgesinnte über gemeinsame Interessen + Region.
- Match-Karten transportieren zusätzlich Kontaktstatus:
  - `Verbunden`
  - `Eingehende Anfrage`
  - `Anfrage gesendet`
  - `Keine Verbindung`
  - plus zustandsbasierten nächsten Schritt (z. B. `Nachricht schreiben` / `Verbindung anfragen`).
- Social-Items tragen jetzt optionalen Herkunftskontext (`originContext`):
  - `origin.type`: `interest_match` | `dossier` | `topic_round` | `regional_group` | `founder` | `system`
  - `origin.topicKey` / `origin.topicLabel`
  - `origin.dossierId` / `origin.dossierTitle` (vorbereitet)
  - `origin.regionKey` / `origin.regionLabel`
  - `origin.communityKey` / `origin.communityLabel`
  - `origin.scope`: `regional` | `ueberregional`
  - `origin.reasonLabel` für direkte UI-Erklärung („Warum sehe ich diese Person?“).
- Community-Ableitung ist produktlogisch vorbereitet:
  - Thema + Region => regionale Gruppe (z. B. `Mobilität · Berlin`)
  - Thema ohne Region => überregionale Gruppe
  - Dossier-Kontext ist über `originContext` strukturell anschlussfähig.
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
- Route ist idempotent gehärtet:
  - mehrfaches Accept/Reject bleibt stabil,
  - `match.request` verhindert Pending-Duplikate,
  - Self-Requests und ungültige Targets werden geblockt.

### Social-State-Wahrheit (Request/Connection)

- `pending`: offene Anfrage.
- `accepted`: Verbindung aktiv (unabhängig von Quelle wie Founder/Referral/Sync).
- `rejected`: explizit abgelehnt.
- `canceled`: deaktivierte Altanfrage (z. B. Gegenlauf nach Ablehnung).
- Verbindungslogik bewertet immer das Paar beider Richtungen (A->B / B->A), nicht nur einen Eintrag.
- Bei Annahme werden offene Pending-Einträge des Paars auf konsistenten Zustand gebracht und ein Spiegelzustand (`social_accept_sync`) sichergestellt.

### Founder-Welcome Kette

- `/api/account/social-summary` ruft `ensureFounderWelcomeForUser(...)` auf.
- Falls ein Founder-Account gefunden wird, wird Anfrage/Nachricht aus diesem Kontext gesichert.
- Falls kein Founder-Account auflösbar ist, wird ein stabiler Fallback-Absender (`founder:voiceopengov`) genutzt.
- Ergebnis wird in der API als Meta (`founderFlow`) an die UI geliefert.

## Direktnachrichten-Status (ehrlich markiert)

- Lesen/Anzeige von Social-Nachrichten in der Inbox: ja.
- DM-v1 aktiv (bewusst klein):
  - Thread lesen,
  - kurze Direktnachricht senden,
  - kein Realtime-Chat, keine Attachments, keine Gruppen.
- Mobile Composer/Thread-Verhalten:
  - Composer bleibt in Safe-Area erreichbar,
  - Fokus scrollt den Composer in Sicht,
  - Senden/Loading-Zustände bleiben stabil ohne hektisches UI.
- Schreiben ist nur in sinnvollen Beziehungskontexten erlaubt:
  - `connected` -> `can_message = true`
  - `incoming_pending` / `outgoing_pending` / `none` -> `can_message = false` mit Grund.
- API liefert dafür explizit:
  - `relationshipState`
  - `canMessage`
  - `cannotMessageReason` / `cannotMessageReasonLabel`
- Doppelklick-/Spam-Basisabsicherung:
  - identische Direct-Message innerhalb kurzer Zeit wird serverseitig als Duplikat behandelt.
- Read/Unread-Polish:
  - Thread-Öffnen markiert eingehende Nachrichten des Kontakts als gelesen.
  - Summary liefert gesplittete Unread-Sicht (`unreadDirectCount` / `unreadSystemCount`) für plausiblere Badges.

## Community-Begriff (aktueller Scope)

`/community` ist aktuell ein Community-Hub mit Fokus auf:

- Discovery (Matching-Ausgangspunkt in Account/Inbox),
- Community-Beiträge (`/community/contributions`),
- Verlinkung in Streams/Campaigns.

Es ist aktuell kein vollwertiger Realtime-DM-Chat.
