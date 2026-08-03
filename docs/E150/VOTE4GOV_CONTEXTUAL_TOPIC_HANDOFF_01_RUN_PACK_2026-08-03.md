# VOTE4GOV-CONTEXTUAL-TOPIC-HANDOFF-01 · Codex Run-Pack

Stand: 2026-08-03

Status: `codex_ready`

Priorität: `P0`

Ausführungsbranch: `fix/vote4gov-contextual-topic-handoff-01`

Bestehender Draft-PR: `#562`

## 1. Zweck und Ausführungsgrenze

Dieses Run-Pack aktiviert ausschließlich die spätere Implementierung von
`VOTE4GOV-CONTEXTUAL-TOPIC-HANDOFF-01`. Der Governance-Intake selbst enthält
keine Produkt-, Runtime-, Routing-, Auth-, Vote-, Topic-, UI- oder
Teständerung.

Für die Implementierung gilt verbindlich:

- ausschließlich den bestehenden Branch
  `fix/vote4gov-contextual-topic-handoff-01` verwenden,
- ausschließlich im bestehenden Draft-PR `#562` weiterarbeiten,
- keinen weiteren Implementierungsbranch erstellen,
- keinen weiteren Worktree erstellen,
- keinen weiteren Implementierungs-PR erstellen,
- nicht mergen und nicht deployen,
- `docs/E150/OpenTasks.md` im Implementierungs-PR byte-identisch zu dessen
  dann aktueller `origin/main`-Basis halten.

Das vom Preflight ausgegebene `branchCreationAllowed: true` bestätigt die
Ausführbarkeit des Tasks, hebt das Verbot eines neuen Branches für diesen
bereits vorbereiteten Implementierungsslice aber nicht auf.

## 2. Verbindliche Vorprüfung

Vor der Produktimplementierung vollständig lesen und gegen den dann aktuellen
Stand neu prüfen:

1. `AGENTS.md`,
2. alle dort verbindlich referenzierten Canons,
3. `docs/E150/CODEX_RUN_PACK_CONTRACT.md`,
4. den kanonischen operativen Kopf von `docs/E150/OpenTasks.md`,
5. dieses Run-Pack,
6. `docs/E150/VOTE4GOV-CONTEXTUAL-TOPIC-HANDOFF-01_CODEX_BRIEF.md`
   aus Draft-PR `#562`,
7. den vollständigen aktuellen Stand von PR `#557`,
8. den vollständigen aktuellen Stand von PR `#520`,
9. den vollständigen aktuellen Stand von PR `#561`,
10. den bestehenden Public-Topic-, Anlassraum-, Runden-, Participation- und
    Session-Stack,
11. alle offenen Pull Requests und insbesondere parallele Änderungen an
    `docs/E150/OpenTasks.md` sowie an den vorgesehenen Implementierungsdateien.

Nach Merge dieses Intake-PRs muss der Preflight auf einem sauberen `main`
ausgeführt werden:

```bash
node scripts/codex-task-preflight.mjs VOTE4GOV-CONTEXTUAL-TOPIC-HANDOFF-01
```

Erwartete Ausgabe:

```json
{
  "taskId": "VOTE4GOV-CONTEXTUAL-TOPIC-HANDOFF-01",
  "status": "codex_ready",
  "executable": true,
  "branchCreationAllowed": true
}
```

Der negative Lauf in einem Nicht-`main`-Branch darf nicht umgangen,
umgeschrieben oder durch eine zweite Branch-Erstellung ersetzt werden. Nach
dem erfolgreichen Lauf auf sauberem `main` wird ausschließlich der vorhandene
Ausführungsbranch und Draft-PR `#562` aktualisiert.

## 3. Intake-Evidence vom 2026-08-03

Beim Governance-Intake wurden folgende Stände vollständig geprüft:

| Bezug | Stand beim Intake | Verbindliche Rolle |
| --- | --- | --- |
| `origin/main` | `174929af41b4d52a4834ac0322146172eed59e8a` | Basis des Intake-Slices |
| PR `#562` | Draft, Head `d0ca1d0fa166b820e7947004ef603951824939a2` | vorbereiteter Brief und einziger Implementierungs-PR |
| PR `#557` | Draft, Head `ae36a65772bb0c6d65282fc5db591141e17f069a` | ausschließlich Public-Ballot-Integrationsgate |
| PR `#520` | Draft, Head `1c7cec7f0c16372b8804d794915b327d3f558173` | ausschließlich Auth-/Redirect-Sicherheitsgate |
| PR `#561` | Draft, Head `5f6af8ab6fb125a7d222ef915ec4caafe61def01` | ausschließlich optionales Transparenzstatus-Gate |

Diese SHAs sind Intake-Evidence, keine Aufforderung zum Cherry-Pick und keine
dauerhafte Pinning-Entscheidung. Vor Implementierungsbeginn gewinnen die
aktuellen PR-Heads und ihre aktuellen Dateilisten. Kein Commit aus `#557`,
`#520` oder `#561` wird in `#562` kopiert, cherry-gepickt oder nachgebaut.

Beim Intake änderte unter den offenen PRs nur PR `#555` ebenfalls
`docs/E150/OpenTasks.md`; dessen Delta betraf ausschließlich die bestehende
Zeile `ECOSYSTEM-BRAND-RECOGNITION-01`. Vor jeder Aktualisierung von `#562` ist
dieser Kollisionscheck zu wiederholen.

## 4. Kanonischer Zielpfad

Der Zielpfad ist entschieden und für diesen Slice nicht mehr offen:

```text
/topic/[slug]?v4g=<base64url-context>
```

Verbindlich:

- `/topic/[slug]` bleibt der kanonische Public-Topic-Pfad.
- `v4g` ist ein additiver, untrusted Einstiegskontext.
- Der Vote4Gov-Modus erzeugt keine zweite Themen-, Anlassraum-, Runden- oder
  Participation-Oberfläche.
- Der Queryparameter verändert weder Canonical noch Sichtbarkeit, Lifecycle,
  Berechtigung, Beteiligungsklasse oder Stimmrecht.
- `/create` bleibt sekundär und darf nur als bewusste Aktion innerhalb des
  bereits sichtbaren Artikel- und Themenkontexts angeboten werden.
- Es gibt in diesem Slice keine offene Routingentscheidung.

## 5. Release- und Registry-Wahrheit

Die serverseitige Vote4Gov-Registry ist die alleinige Artikel-, Fragen-,
Lifecycle-, Sichtbarkeits-, Übersetzungs- und Freigabewahrheit.

Der Slice darf:

- einen validen lokalen Kontext einer bereits serverseitig registrierten
  Artikel-/Fragenzuordnung zuordnen,
- serverseitig freigegebene Artikel- und Fragentexte darstellen,
- vorhandene Public-Topic-, Anlassraum-, Dossier-, Runden-, Participation- und
  Wirkungsziele referenzieren.

Der Slice darf nicht:

- aus Querytexten einen Artikel, eine Frage, eine These oder eine Freigabe
  kanonisieren,
- einen realen Vote4Gov-Artikel oder reale Fragen ohne bestätigte
  Registrydaten erfinden oder veröffentlichen,
- durch den Queryparameter eine verborgene Themenseite sichtbar machen,
- fehlende Registry-, Lifecycle- oder Release-Wahrheit durch Fixtures,
  Clientzustand oder Defaults ersetzen,
- freie Quell-URLs, HTML oder Nutzeridentitäten aus dem Bundle übernehmen.

Bei Abweichungen gewinnt immer die serverseitige Registry. Unbekannte Artikel-
oder Frage-IDs, manipulierte Beziehungen und nicht freigegebene Zustände
schlagen fail-closed fehl.

## 6. Context-Bundle `vote4gov-context-v1`

Das Bundle wird Base64URL-sicher transportiert und vor jeder fachlichen
Auswertung streng validiert.

Pflichtgrenzen:

- exakt unterstützte Version `vote4gov-context-v1`,
- enges Schema ohne unbekannte privilegierende Felder,
- harte Gesamtgrößenbegrenzung vor und nach dem Decoding,
- maximale Fragenanzahl,
- Längenbegrenzung für jede Stringkomponente,
- nur erlaubte Enums und stabile IDs,
- nur HTTPS für eine zulässige Quellreferenz,
- keine HTML-Übernahme,
- keine PII,
- keine Cookies, Tokens, Account-IDs oder Fingerprints,
- keine Berechtigung aus `source`, `articleId`, `questionId`, `locale`,
  `response`, `remembered`, Zeitstempeln oder Querytexten.

Parser und Decoder müssen kontrolliert fehlschlagen bei:

- ungültigem Base64URL,
- falscher Version,
- ungültigem JSON,
- Schemaabweichung,
- zu großem Payload,
- zu vielen Fragen,
- zu langen Feldern,
- unbekannter Artikel-ID,
- unbekannter oder nicht zum Artikel gehörender Frage-ID,
- doppelten, manipulierten oder widersprüchlichen IDs.

Eine und mehrere Fragen verwenden die stabile Reihenfolge der serverseitigen
Registry. Die Reihenfolge im Query-Bundle darf sie nicht umsortieren.

## 7. Semantik der Fragen und lokalen Vormerkungen

Lokale Vote4Gov-Einordnungen sind Vorschläge, keine Stimme und kein Ergebnis.
Beim Öffnen muss ausdrücklich erkennbar bleiben:

> Diese Auswahl wurde bei Vote4Gov nur lokal vorgemerkt und noch nicht öffentlich gezählt.

Ein bloßer Seitenaufruf markiert keine Vormerkung als übertragen, gezählt oder
abgeschlossen.

Verbindliche Fragesemantik:

- Ja-/Nein-Aktionen erscheinen ausschließlich bei einer dafür serverseitig
  klassifizierten zustimmungsfähigen These.
- Offene Fragen erhalten keine Aktionen `Zustimmen` oder `Widersprechen`.
- Eine und mehrere Fragen bleiben per Tastatur und Screenreader stabil
  navigierbar.
- Quelle, Gegenposition, eigener Beitrag sowie Wirkung und nächste Schritte
  sind direkt aus dem sichtbaren Kontext erreichbar.
- `Eigenen Beitrag ergänzen` darf nach `/create` führen, bleibt aber sekundär.
- Keine lokale Vormerkung wird automatisch verworfen, übertragen oder mit
  einem Nutzerkonto verbunden.

## 8. Public-Ballot-Integrationsgate PR #557

PR `#557` ist ausschließlich das Integrationsgate für einen realen
Public-Ballot-Write.

Vor Merge und sauberer Integration von `#557` gilt zwingend:

- sichtbarer Status `Public Ballot noch nicht freigegeben`,
- kein Vote-Write,
- keine simulierte Erfolgsbestätigung,
- kein Cookie-, Token-, Rate-Limit-, CSRF-, Idempotenz-, Persistenz- oder
  Beteiligungspass-Nachbau,
- keine Kopie des Pfads `/vog/fragen/[code]/[questionId]` oder seiner APIs,
- lokale Vormerkungen bleiben ausdrücklich ungezählt.

Nach späterer Integration von `#557` darf der Topic-Kontext ausschließlich
über einen kleinen Adapter an dessen zentralen Public-Ballot-Vertrag anbinden.
Der Adapter verleiht keine Freigabe und überschreibt weder dessen Registry,
Release-, Eligibility-, Beteiligungsklassen-, Security-, Write- noch
Ergebniswahrheit.

Der Implementierungs-PR verändert oder kopiert keine Datei aus der dann
aktuellen Dateiliste von PR `#557`.

## 9. Auth-/Redirect-Sicherheitsgate PR #520

PR `#520` bleibt alleinige Integrationsgrenze für sein Auth-, Redirect-, 2FA-,
QR-, Studio- und Allowlist-Hardening.

Der Slice darf nicht:

- eine von `#520` geführte Datei ändern oder kopieren,
- eine zweite Login-, 2FA-, Redirect-, `return_to`- oder Allowlist-Wahrheit
  einführen,
- einen abgelehnten Redirect still umschreiben,
- Auth- oder Redirectlogik aus `#520` nachbauen.

Ein optionaler Rückweg darf erst über den zentralen, integrierten Vertrag
angebunden werden. Bis dahin entsteht kein eigener Cross-Site-Receipt- oder
Redirectmechanismus.

## 10. KI-Transparenzgate PR #561

PR `#561` ist ausschließlich ein optionales Gate für den zentralen
KI-Transparenzstatus.

Verbindlich:

- keine alternative KI-Transparenzwahrheit einführen,
- keine von `#561` geführte Datei ändern oder kopieren,
- fehlenden Transparenzstatus kontrolliert auslassen,
- keine Kennzeichnung aus Querydaten ableiten,
- nach späterer Integration ausschließlich den zentralen eDebatte-Vertrag
  verwenden.

Fehlender Transparenzstatus blockiert nicht die ehrliche Darstellung eines
ansonsten freigegebenen Registryartikels, darf aber niemals durch ein
erfundenes Label ersetzt werden.

## 11. Auth- und globale Headerwahrheit

Der tatsächlich global verwendete Headerpfad ist:

```text
apps/web/src/app/(components)/SiteHeader.tsx
```

Er ist eingebunden durch:

```text
apps/web/src/app/layout.tsx
```

Die Dateien

```text
apps/web/src/components/auth/HeaderLoginInline.tsx
apps/web/src/components/layout/HeaderLoginInline.tsx
```

sind nicht der globale Headerpfad und werden für diesen Fehler nicht als
Parallelwahrheit ausgebaut.

Die spätere Korrektur verwendet ausschließlich:

- `initialUser` als serverseitig aufgelösten Initialzustand,
- `useCurrentUser` als vorhandene gemeinsame Client-Revalidierung.

Verbindliche Zustände:

| Zustand | Sichtbare Wahrheit |
| --- | --- |
| Gast | Login-/Anmeldeaktion, keine Personalisierungsbehauptung |
| Auth-Unknown | neutraler Loading-/Unknown-Zustand, weder falscher Login noch falsches Profil |
| eingeloggt | Account-/Profilaktion oder verständlicher Anzeigename, kein gleichzeitiges `LOGIN` |

Gast, Auth-Unknown und eingeloggter Nutzer müssen aus derselben Sessionwahrheit
abgeleitet werden. Kein zweiter Authhook, kein paralleler Clientstore und kein
Flackern zu einer nachweislich falschen Behauptung.

## 12. Erlaubter Implementierungsscope

Der spätere Implementierungs-Slice bleibt additiv und klein:

- enger Contract und Parser für `vote4gov-context-v1`,
- serverseitige Vote4Gov-Registry beziehungsweise Adapter auf belegte
  Registrydaten,
- additive Darstellung im bestehenden `/topic/[slug]`-Pfad,
- kleine kontextuelle UI-Bausteine für Artikel, Fragen und lokale
  Vormerkungen,
- ausschließlich erforderliche Korrektur im real globalen Headerpfad auf Basis
  von `initialUser` und `useCurrentUser`,
- fokussierte Contract-, Registry-, Render-, Auth-, Security- und
  Accessibility-Tests,
- Abschluss-Evidence im bestehenden Draft-PR `#562`.

Ausdrücklich ausgeschlossen:

- Änderungen an `docs/E150/OpenTasks.md`,
- Dateien aus PR `#557`, `#520` oder `#561`,
- neuer Topic-, Anlassraum-, Runden-, Participation-, Vote-, Auth-, Redirect-,
  Session- oder Transparenz-SSOT,
- neue Persistenzwelt,
- automatische Artikel- oder Fragenanlage,
- Auto-Publish, Auto-Poll oder automatischer Vote,
- repräsentative Ergebnisbehauptung,
- Tracking-Pixel, Cross-Site-Profil oder Verbindung eines Gasttokens mit einem
  späteren Konto,
- Merge oder Deployment.

Vor dem ersten Produktedit wird die geplante Dateiliste gegen die aktuellen
Dateilisten von `#557`, `#520` und `#561` geprüft. Jede Überschneidung stoppt
den Slice bis zur kollisionsfreien Neuabgrenzung; geschützte Dateien werden
nicht kopiert.

## 13. Verbindliche Abnahmekriterien

Der Slice ist erst technisch abnahmefähig, wenn vollständig belegt ist:

- `vote4gov-context-v1` ist größenbegrenzt und fail-closed,
- die serverseitige Registry gewinnt gegen Querytexte,
- eine und mehrere Fragen bleiben stabil geordnet,
- offene Fragen erhalten keine Ja-/Nein-Aktionen,
- Quelle, Gegenposition, Beitrag und Wirkung sind direkt erreichbar,
- `/create` bleibt sekundär,
- ohne gemergten PR `#557` erscheint ehrlich
  `Public Ballot noch nicht freigegeben`,
- ohne PR `#557` erfolgt kein Vote-Write,
- Gast, Auth-Unknown und eingeloggter Nutzer verwenden dieselbe
  Sessionwahrheit,
- keine Datei aus PR `#557`, `#520` oder `#561` ist verändert oder kopiert,
- DE/EN, Mobile, Accessibility, Security, Typecheck, Lint, Build und
  `git diff --check` sind grün,
- `docs/E150/OpenTasks.md` ist im Implementierungs-PR byte-identisch zu dessen
  dann aktueller `origin/main`-Basis.

## 14. Pflichtprüfungen im Implementierungs-PR

Mindestens ausführen und im Draft-PR dokumentieren:

- Contract-, Größen-, Schema- und Manipulationstests für das Bundle,
- Registry-, Lifecycle- und Release-Tests,
- Querytext verliert gegen kanonischen Registrytext,
- Einzelfrage und Mehrfragenstapel in stabiler Reihenfolge,
- offene Frage ohne Ja-/Nein-Aktion,
- ehrlicher unavailable-Handoff ohne `#557`,
- expliziter Nachweis, dass ohne `#557` keine Vote-Mutation erreichbar ist,
- direkte Wege zu Quelle, Gegenposition, Beitrag und Wirkung,
- `/create` nicht als erster Zielzustand,
- Gast-, Auth-Unknown- und eingeloggter Headerzustand,
- kein `LOGIN` bei bereits personalisierter Session,
- DE/EN und getrennte Original-/Lesesprache,
- Mobile-, Tastatur-, Fokus- und Screenreader-Vertrag,
- Security- und Production-Guardrails,
- Typecheck,
- Lint,
- vollständiger Build,
- `git diff --check`,
- Dateikollisionsprüfung gegen die aktuellen PRs `#557`, `#520` und `#561`,
- Byte-Identität von `docs/E150/OpenTasks.md` zur aktuellen
  `origin/main`-Basis.

## 15. Abschluss und verbleibende Gates

Der Implementierungs-PR bleibt Draft. Er dokumentiert mindestens:

- Root Cause des kontextfreien `/create`-Handoffs,
- Root Cause des widersprüchlichen Headerzustands,
- den kanonischen `/topic/[slug]?v4g=...`-Pfad,
- Context-Bundle- und Registry-Vertrag,
- Einzelfrage und Mehrfragen-Flow,
- lokale Vormerkung, Gastbeteiligung und gegebenenfalls getrennte
  Mitgliederklasse,
- Datenschutz und Security,
- aktuelle Kollisionsmatrix zu `#557`, `#520` und `#561`,
- geänderte Dateien,
- Tests und Smokes,
- bewusst offene Punkte,
- finalen Commit-SHA.

Getrennte Merge- beziehungsweise Integrationsgates bleiben:

1. reale Artikelfreigaben in der serverseitigen Vote4Gov-Registry,
2. Public-Ballot-Write ausschließlich über PR `#557`,
3. Auth-/Redirect-Hardening ausschließlich über PR `#520`,
4. KI-Transparenzintegration ausschließlich über PR `#561`,
5. manueller DE-/EN-, Desktop-, Mobile-, Tastatur- und Screenreader-Smoke,
6. menschliche Review- und Mergeentscheidung.

Keines dieser Gates darf durch den Kontextparameter, den Adapter, lokale
Vormerkungen, Demo-/Fixture-Daten oder einen zweiten technischen Vertrag
vorweggenommen werden.
