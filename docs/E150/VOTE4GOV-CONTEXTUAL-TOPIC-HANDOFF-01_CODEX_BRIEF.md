# VOTE4GOV-CONTEXTUAL-TOPIC-HANDOFF-01 · Codex Brief

Stand: 2026-08-03

Branch: `fix/vote4gov-contextual-topic-handoff-01`

## Ausgangslage

Vote4Gov bindet in redaktionelle Beiträge eine lokale Vierer-Interaktion ein:

1. Zustimmen
2. Widersprechen
3. Später prüfen
4. bei eDebatte vertiefen

Vote4Gov bleibt selbst keine eigenständige Beteiligungsplattform. Die lokale Einordnung ist weder eine öffentliche Stimme noch ein Ergebnis. Sie soll Leserinnen und Leser niedrigschwellig aktivieren und anschließend in den zugehörigen eDebatte-Kontext führen.

Der aktuelle Übergang ist dafür noch nicht geeignet:

- Vote4Gov verlinkt auf den generischen Pfad `/create`.
- Die konkrete Frage und der Artikelkontext werden im eDebatte-Arbeitsraum nicht kanonisch wiederhergestellt.
- Im beobachteten Beispiel lautet die Vote4Gov-Frage sinngemäß `Welche historische Tradition oder Gegenposition fehlt?`, während eDebatte einen anderen allgemeinen Text über Demokratie vorbefüllt.
- Der Nutzer landet in einem freien Beitragseingang statt direkt im bereits zugeordneten Thema beziehungsweise Anlass.
- Mehrere lokale Einordnungen aus einem Artikel werden nicht als gemeinsamer Fragenstapel dargestellt.
- Die Vote4Gov-Vormerkung wird beim bloßen Öffnen von eDebatte derzeit als beendet behandelt, obwohl keine bestätigte Übernahme stattgefunden hat.
- Im beobachteten eingeloggten Zustand begrüßt Voxy den Nutzer mit Namen, während der globale Header gleichzeitig `LOGIN` anzeigt. Authentifizierungs- und Headerwahrheit widersprechen sich sichtbar.

## Produktziel

Ein Link aus Vote4Gov öffnet bei eDebatte unmittelbar den zugehörigen Artikel-, Themen- oder Anlasskontext — nicht einen generischen, kontextfreien `/create`-Einstieg.

Innerhalb der ersten Bildschirmhöhe müssen sichtbar sein:

- Herkunft `Vote4Gov Review`
- Ausgabe, Artikel und Rücklink zur Quelle
- zugehöriges Thema beziehungsweise Anlassraum
- zentrale Artikelthese
- alle für diesen Artikel freigegebenen Fragen
- bereits lokal gewählte Einordnungen als noch nicht übertragene Vorschläge
- klare Beteiligungsklasse
- schnelle Antwortmöglichkeit ohne vorgeschaltete Anmeldung, sofern der jeweilige Public-Ballot-Vertrag dies erlaubt
- direkte Vertiefungswege zu Quelle, Gegenposition, Beitrag, Wirkung und nächsten Schritten

## Leitbild für Medienhäuser, Vereine und weitere Herausgeber

Der Slice soll als wiederverwendbares Referenzmodell funktionieren:

- Herausgeber können analoge und digitale Beiträge mit einer kleinen, verständlichen Fragenserie verbinden.
- Leser erhalten nicht nur drei Smileys oder eine isolierte Stimmungsmessung.
- Eine schnelle Reaktion kann unmittelbar in strukturierte Quellenarbeit, Gegenpositionen, gemeinsame Beratung, mögliche Wirkungen und nachvollziehbare Ergebnisse übergehen.
- Der Herausgeber erhält keine parallele Abstimmungsdatenbank und kein verstecktes Tracking-System.
- eDebatte bleibt der einzige Beteiligungs-, Kontext-, Ergebnis- und Wirkungsraum.

## Verbindliche Architekturentscheidung

Keine neue parallele Themen- oder Beteiligungsoberfläche bauen.

Vor Umsetzung vollständig prüfen und wiederverwenden:

- `/topic/[slug]` und den bestehenden Public-Topic-Contract
- Anlassraum-/Runden-Runtime
- Dossier- und Participation-Readmodels
- bestehende Quellen-, Gegenpositions-, Wirkungs- und Ergebnisflächen
- Public-Ballot-Pfad und Beteiligungspass aus PR `#557`
- Auth-, Redirect- und Security-Verträge aus PR `#520`
- bestehende `/create`-Herkunftsparameter und Draft-Resume-Logik

Der kanonische Zielpfad ist nach Architekturprüfung festzulegen. Er muss auf dem bestehenden Topic-/Anlassraum-/Runden-Stack beruhen. `/create` darf nur noch eine bewusst gewählte Aktion innerhalb des bereits sichtbaren Kontextes sein, etwa `Eigenen Beitrag ergänzen`, nicht der erste Zielzustand.

## Kontext-Bundle v1

Vote4Gov darf einen kompakten, versionierten Übergabekontext mitsenden. Dieser Kontext ist vollständig untrusted und verleiht niemals Sichtbarkeit, Abstimmungsrecht, Mitgliedsstatus oder andere Berechtigungen.

Erwartete semantische Form:

```ts
type Vote4GovContextBundleV1 = {
  version: "vote4gov-context-v1";
  source: "vote4gov";
  articleId: string;
  issue: "01" | string;
  sourceUrl: string;
  locale: string;
  questions: Array<{
    questionId: string;
    prompt?: string;
    response?: "agree" | "disagree" | null;
    remembered?: boolean;
    updatedAt?: string | null;
  }>;
};
```

Verbindliche Guardrails:

- Base64URL oder gleichwertig sicher transportierbar
- enges Schema und Versionsprüfung
- harte Gesamtgrößenbegrenzung
- maximale Fragenanzahl
- Längenbegrenzung je Feld
- nur HTTPS-Quell-URL
- keine HTML-Übernahme
- keine PII
- keine Cookies, Tokens, Account-IDs oder Fingerprints im Bundle
- Querytexte sind nur Hinweise; kanonische Frage, Artikel, Anlass und Freigabe stammen serverseitig aus einer Source-Registry beziehungsweise einem Release-Contract
- unbekannte Artikel- oder Frage-IDs schlagen fail-closed fehl
- Herkunftsparameter dürfen keine Berechtigung verleihen

## Source-Registry und kanonische Zuordnung

Eine serverseitige, versionierte Zuordnung muss mindestens enthalten:

- `source = vote4gov`
- `articleId`
- Ausgabe
- kanonischer Artikeltitel
- kanonische Quell-URL
- zugehöriges öffentliches Thema beziehungsweise Anlassraum
- freigegebene Fragen mit stabiler `questionId`
- zentrale These
- mögliche Beteiligungsaktionen
- Sprachfassungen und Übersetzungsstatus
- Sichtbarkeits- und Lifecycle-Status

Die im URL-Bundle enthaltenen Formulierungen dürfen niemals die kanonische Registry überschreiben. Sie dienen nur dazu, lokale, noch nicht übertragene Einordnungen dem richtigen Frage-Set zuzuordnen.

## Zieloberfläche: Artikel-Anlasskarte

Beim Einstieg zeigt eDebatte eine kompakte, hochwertige Artikel-Anlasskarte:

- Vote4Gov-Logo beziehungsweise Herkunft
- `Ausgabe 01`
- Artikeltitel
- Kurzkontext in zwei bis vier Sätzen
- Link `Originalbeitrag öffnen`
- Status der KI-/Übersetzungskennzeichnung, sofern vom Source-Contract geliefert
- Beteiligungsklasse, zum Beispiel `öffentliche Konsultation`
- methodischer Hinweis zur Nicht-Repräsentativität

Darunter folgt ein Fragenstapel. Bei mehreren Fragen müssen Nutzer schnell zwischen ihnen wechseln können, etwa über Karten, Tabs oder zugängliche Swipe-Navigation. Jede Frage bietet:

- Zustimmen
- Widersprechen
- Später prüfen
- Quellen ergänzen
- Gegenposition erarbeiten
- Wirkung und nächste Schritte bearbeiten
- eigenen Beitrag ergänzen

`Zustimmen` und `Widersprechen` dürfen nur bei einer zustimmungsfähigen These erscheinen. Offene Fragen wie `Welche Perspektive fehlt?` benötigen stattdessen passende Aktionen und dürfen nicht blind mit Ja/Nein-Buttons kombiniert werden.

## Übernahme lokaler Vote4Gov-Einordnungen

Beim Öffnen des Kontextes zeigt eDebatte zunächst:

> Diese Auswahl wurde bei Vote4Gov nur lokal vorgemerkt und noch nicht öffentlich gezählt.

Die Übernahme erfolgt nur nach einer ausdrücklichen Handlung in eDebatte.

Mögliche Zustände:

- `Noch nicht übernommen`
- `Als offene Gastbeteiligung übernommen`
- `Als verifizierte Mitgliederentscheidung übernommen`, nur bei bestehendem und freigegebenem Membership-/Eligibility-Vertrag
- `Nur für später vorgemerkt`
- `Verworfen`

Ein bloßer Seitenaufruf darf die lokale Vote4Gov-Auswahl nicht als übertragen markieren. Ein optionaler Rückgabe- oder Receipt-Mechanismus muss datensparsam, kurzlebig und ohne Cross-Site-Tracking entworfen werden. Der `return_to`-Wert ist streng allowlist-validiert und verleiht keine Berechtigung.

## Auth- und Header-Bug

Der globale Header muss dieselbe Auth-Wahrheit verwenden wie die Voxy-/Workspace-Oberfläche.

Beobachteter Fehler:

- personalisierte Begrüßung `Hallo Ricky`
- gleichzeitig sichtbarer Header-Button `LOGIN`

Verbindliches Ziel:

- nicht eingeloggt: `Login`
- eingeloggt: Account-/Profilaktion, verständlicher Anzeigename oder neutrales Profilmenü
- kein paralleler Clientzustand, der dem serverseitigen Sessionzustand widerspricht
- kein Flackern von `Login` nach bereits aufgelöster Session
- sauberer Loading-/Unknown-State ohne falsche Behauptung
- Logout und Accountzugang bleiben erreichbar

Zu prüfen sind insbesondere:

- `apps/web/src/components/auth/HeaderLoginInline.tsx`
- `apps/web/src/components/layout/HeaderLoginInline.tsx`
- der tatsächlich verwendete globale Header
- Session-/User-Hooks und serverseitig geladene Authdaten
- Voxy-Personalisierung und deren Authquelle

## Abhängigkeiten und Kollisionen

### PR #557

`VOG-PUBLIC-BALLOT-ENTRY-01` liefert den direkten öffentlichen VOG-Fragenpfad, Gasttoken, Beteiligungsklassen und Beteiligungspass. Diese Verträge nicht kopieren oder abschwächen.

Dieser Task erweitert die kontextuelle Artikel-/Fragenübergabe und kann den Public-Ballot-Pfad für freigegebene Fragen verwenden.

### PR #520

Auth-, Redirect-, QR- und interne Navigationssicherheit bleiben geschützt. Keine eigene Redirect-Allowlist oder Login-Kopie implementieren.

### Vote4Gov PR #9

Vote4Gov erzeugt bereits lokale Einordnungen und einen untrusted Kontextentwurf. Die eDebatte-Seite muss unbekannte oder manipulierte Daten ablehnen beziehungsweise auf den kanonischen Registry-Stand zurückfallen.

## Zustände

Mindestens abdecken:

- gültiger Artikel mit einer Frage
- gültiger Artikel mit mehreren Fragen
- Frage ohne Ja-/Nein-Semantik
- unbekannte Artikel-ID
- unbekannte Frage-ID
- manipuliertes oder zu großes Bundle
- geschlossener oder geplanter Anlass
- Public Ballot nicht freigegeben
- bereits als Gast beteiligt
- Rate Limit
- Netzwerkfehler
- eingeloggter Nutzer
- Gastnutzer
- Authzustand noch unbekannt
- fehlende Übersetzung
- Mobile, Tastatur und Screenreader

## Datenschutz

- kein Werbe- oder Marketingtracking
- keine Übernahme des Vote4Gov-Browserverlaufs
- keine Speicherung der Quell-URL über das für Herkunft und Audit notwendige Maß hinaus
- kein Verbinden eines Gasttokens mit einem späteren Benutzerkonto ohne getrennte, erklärte Produktentscheidung
- keine öffentliche Namenszuordnung aus dem Kontext-Bundle
- keine rohe IP oder vollständiger User-Agent im neuen Kontext-/Vote-Datensatz

## Tests

Mindestens:

- Contract-Test für `vote4gov-context-v1`
- Größen-, Schema- und Manipulationstests
- Registry- und Release-Tests
- exakter Artikel-/Fragenkontext statt Query-Text
- mehrere Fragen in stabiler Reihenfolge
- offene Frage ohne unpassende Zustimmen-/Widersprechen-Aktion
- schnelle Gastbeteiligung über freigegebenen Public-Ballot-Vertrag
- Quellen-, Gegenpositions-, Beitrags- und Wirkungsaktionen
- kein automatisches `/create` als erster Zustand
- Auth-Header eingeloggt versus ausgeloggt
- kein `LOGIN` bei bereits personalisierter Session
- Rücklink nur zu erlaubter Vote4Gov-URL
- DE/EN sowie Original-/Lesesprache
- Accessibility und Mobile
- Production Guardrails, Security, Typecheck, Lint, Build und `git diff --check`

## Nicht im Scope

- keine neue allgemeine Abstimmungsplattform
- keine globale Anonymisierung aller eDebatte-Abstimmungen
- keine automatische Anlage sämtlicher Vote4Gov-Artikel und Fragen
- kein Auto-Publish
- kein Auto-Poll
- keine Ergebnisbehauptung auf Vote4Gov
- keine repräsentative Bevölkerungsumfrage ohne methodischen Vertrag
- keine Übernahme freier Querytexte als kanonische Inhalte
- kein Tracking-Pixel oder Cross-Site-Profil
- kein Merge von PR #557 oder PR #520 innerhalb dieses Tasks

## Abschlussdokumentation

Im Draft-PR dokumentieren:

- Root Cause der beiden sichtbaren Fehler
- tatsächlich verwendete Header- und Auth-Wahrheit
- gewählter bestehender Topic-/Anlassraum-Zielpfad
- Context-Bundle- und Registry-Vertrag
- Einzelfrage und Mehrfragen-Flow
- Gast-, Mitglieder- und lokale Vormerkungsklassen
- Datenschutz und Security
- Kollisionen mit #557 und #520
- geänderte Dateien
- Tests und Smokes
- bewusst offene Punkte
- Commit-SHA
