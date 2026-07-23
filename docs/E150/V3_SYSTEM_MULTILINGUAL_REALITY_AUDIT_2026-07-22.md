# V3 System Multilingual Reality Audit

Stand: 2026-07-22

## Urteil

eDebatte besitzt bereits wichtige Language-Bridge-Bausteine, ist aber noch **nicht systemweit mehrsprachig abgenommen**. Die Content-Übersetzungslogik ist weiter als die UI-Lokalisierung. Der sichtbare Sprachschalter überschätzt derzeit die reale Oberflächenabdeckung.

Das Ziel bleibt ausdrücklich:

> Ein Nutzer kann Inhalte unabhängig von der Originalsprache in seiner Lesesprache verstehen, jederzeit das Original prüfen und im selben Themen-, Quellen- und Beteiligungskosmos weiterarbeiten.

UI-Sprache, Lesesprache, Originalsprache, Arbeitssprache, Ausgabesprache und Quellensprache müssen getrennt bleiben.

## Bestätigte Grundlagen

- `SUPPORTED_LOCALES` enthält 20 Sprachen: Deutsch, Englisch und 18 erweiterte Sprachen einschließlich Arabisch, Türkisch, Französisch, Schwedisch und Norwegisch.
- Arabisch ist als Locale konfiguriert und im Locale-Switcher sichtbar.
- Es existieren Translation-Routen, ein OpenAI-Adapter, Persistenzmodelle für Original und Übersetzungen, Übersetzungsstatus sowie ein `LocalizedContentDisplay`.
- Der kanonische Language-Bridge-Vertrag verlangt Originalerhalt, sichtbare Übersetzungskennzeichnung, unsichere Status und RTL-Unterstützung.
- Die Produktionsübersetzung kann ein arabisches Original in eine deutsche Lesefassung übersetzen, weil Deutsch zu den Standard-Zielsprachen gehört.
- Cross-lingual Topic-/Claim-Matching und Review-first-Zuordnung sind als Contracts angelegt.

## Kritische Lücken vor diesem Slice

### 1. RTL war technisch deaktiviert

`core/locale/locales.ts` gab für jede Sprache `ltr` zurück; die Arabisch-Regel war auskommentiert. `LocaleContext` setzte `document.documentElement.dir` ebenfalls immer auf `ltr`.

### 2. Server- und Client-Richtung waren nicht konsistent

Das Root-Layout setzte nur `<html lang>`, aber kein `<html dir>`. Die Richtung wurde erst clientseitig und zudem falsch auf `ltr` gesetzt.

### 3. Arabische Basisnachrichten waren englische Platzhalter

`apps/web/src/app/messages/ar.json` enthielt englische Texte wie `Streams`, `Support`, `Join now` und `Contribute`.

### 4. 20 sichtbare Sprachen, aber nur sieben gefundene Message-Bundles

Im Message-Verzeichnis sind Bundles für `de`, `en`, `fr`, `pl`, `es`, `ar` und `ru` auffindbar. Der Locale-Switcher listet dagegen alle 20 `SUPPORTED_LOCALES`.

### 5. Ein Locale-Zustand übernimmt mehrere Aufgaben

`LocaleContext` verwaltet einen einzigen `locale`-Wert. Dieser steuert HTML-Sprache, URL und Cookie und wird zugleich als bevorzugte Lesesprache verwendet.

Folge: UI-Sprache und Lesesprache sind technisch noch nicht sauber getrennt.

### 6. Sichtbare Texte liegen in mehreren parallelen Systemen

Es existieren unter anderem:

- `apps/web/src/app/messages/*.json`
- seitenbezogene `*Strings.ts`
- Operator-Systemtexte
- direkt im JSX codierte deutsche Texte

Die neue Startseite enthält ihre Kernbotschaft und CTAs direkt in `HomeSplitVoxyLanding.tsx`.

### 7. Content-Übersetzung ist vorhanden, aber nicht auf allen Oberflächen E2E belegt

`LocalizedContentDisplay` kann Übersetzung und Original anzeigen. Es ist nicht nachgewiesen, dass Themen, Dossiers, Runden, Live, Swipes, Feed, Account und institutionelle Oberflächen denselben Contract durchgängig verwenden.

### 8. Sprachrichtung muss pro Textblock gelten

Eine deutsche UI kann ein arabisches Original enthalten. Eine arabische UI kann einen deutschen oder englischen Quellentext enthalten. Nur das globale `<html dir>` reicht deshalb nicht.

### 9. SEO für Sprachvarianten ist noch nicht abgenommen

`hreflang`, `x-default`, Canonical-Strategie, indexierbare Übersetzungsqualität und Duplicate-Content-Grenzen sind nicht systemweit belegt.

## In diesem konfliktfreien Foundation-Slice umgesetzt

- Arabisch wird kanonisch als `rtl` erkannt.
- `getDir` wird über die Web-Locale-Konfiguration bereitgestellt.
- Root-Layout setzt `lang` und `dir` bereits beim Server-Render.
- `LocaleContext` synchronisiert `lang` und `dir` nach URL-, Cookie-/Storage- und Nutzerwechsel.
- arabische Basis-Messages wurden von englischen Platzhaltern auf arabische Texte umgestellt.
- `LocalizedContentDisplay` setzt `lang` und `dir` getrennt für Lesefassung und Originaltext.
- Contract-Test deckt Arabisch-RTL sowie arabisches Original mit deutscher Lesefassung ab.

Nicht berührt:

- `docs/E150/OpenTasks.md`; der große operative SSOT bleibt unverändert
- `/create`-Debattenstand-Sidecar und Create-UX
- Feed-, Social-, Live-, Payment- oder Publishing-Runtime
- automatische Veröffentlichung

## Verbindliche Zielarchitektur

### Nutzerpräferenzen

```ts
type LanguagePreferences = {
  uiLocale: string;
  readingLocale: string;
  preferredOutputLocales: string[];
  showOriginalByDefault: boolean;
};
```

### Inhaltsobjekt

```ts
type LanguageBridgeContent = {
  originalLanguage: string | null;
  originalText: string;
  translations: Record<string, string | null>;
  translationStatus: "missing" | "pending" | "translated" | "failed" | "needs_review" | "uncertain";
  translationProvider: string | null;
  translationModel: string | null;
  translatedAt: string | null;
};
```

### Darstellungsregeln

- UI folgt `uiLocale`.
- Inhaltslesefassung folgt `readingLocale`.
- Jeder Textblock erhält sein eigenes `lang` und `dir`.
- Original ist jederzeit zugänglich.
- Übersetzung wird als Übersetzung bezeichnet.
- Unsicherheit, Providerfehler und fehlende Übersetzung werden nicht kaschiert.
- Cross-lingual Matching erzeugt Vorschläge, niemals ungeprüfte Merges.

## Abnahmematrix

### UI

- Startseite
- Header und Footer
- Login, Registrierung und Passwortpfade
- Account und Einstellungen
- Themen und Suche
- Dossiers
- Runden/Beteiligungsräume
- Live und QR-Einstiege
- Swipes
- Organisation/Medien/Kultur
- Verwaltung/Behörden
- Admin und Review
- Rechts- und Datenschutzseiten

Je Surface erfassen:

- vollständig lokalisiert
- teilweise lokalisiert
- Inline-Deutsch
- englischer Fallback
- nicht nutzerseitig
- RTL geprüft
- Mobile geprüft

### Content E2E

1. arabische Quelle importieren
2. Originalsprache erhalten
3. deutsche Lesefassung erzeugen
4. Übersetzungsstatus und Herkunft anzeigen
5. Original öffnen
6. Thema/Claim/Dossier review-first zuordnen
7. speichern und erneut öffnen
8. deutsche Rückfrage eingeben
9. arabische Lesefassung vorbereiten
10. Desktop und Mobile, LTR und RTL prüfen

## Go/No-Go

Systemweite Mehrsprachigkeit darf erst als produktionsreif markiert werden, wenn:

- Locale-Switcher nur tatsächlich unterstützte UI-Zustände verspricht oder UI-/Lesesprache klar trennt,
- Kernflows keine zufälligen deutschen/englischen Inseln enthalten,
- Arabisch↔Deutsch E2E mit realer Quelle funktioniert,
- Original-/Übersetzungsumschaltung auf den öffentlichen Kernflächen vorhanden ist,
- RTL pro Seite und Textblock getestet ist,
- Fehler-, Retry-, Kosten- und Reviewstatus ehrlich sind,
- SEO keine ungeprüften Teilübersetzungen indexiert.
