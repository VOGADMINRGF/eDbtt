# I18N Go-Programm

Datum: 2026-07-27

Status: verbindlicher Ziel- und Zerlegungscontract; noch keine Runtime-Freigabe

GitHub-Intake: Issue `#456`

Docs-Slice: Draft-PR `#457`

## Ziel

eDebatte muss systemweit sprachunabhängig funktionieren. Das Ziel ist nicht nur eine technische I18N-Grundlage, sondern ein objektiv prüfbares **I18N Go** für öffentliche, private und operative Kernflächen sowie für sprachübergreifende Inhalte.

Ein I18N Go darf erst ausgesprochen werden, wenn:

- Bedienoberfläche, Lesefassung, Original, Arbeitssprache, Ausgabesprache und Quellensprache getrennte, kanonische Zustände besitzen,
- alle aktiv beworbenen UI-Sprachen die definierten Kernflächen vollständig und konsistent bedienen,
- Inhalte unabhängig von ihrer Originalsprache nachvollziehbar gelesen, bearbeitet, geprüft und ausgegeben werden können,
- RTL, nichtlateinische Schriften, Mobile und Accessibility objektiv abgenommen sind,
- kritische Rechts-, Consent-, Pricing-, Payment-, Security- und Account-Texte feste geprüfte Sprachfassungen verwenden,
- keine Oberfläche eine größere Sprachabdeckung behauptet als technisch und fachlich belegt ist.

Der heutige No-Go-Befund ist damit ausschließlich der Ausgangspunkt. Er ist kein akzeptierter Zielzustand.

## Bereits erreichte Grundlage

### `I18N-FOUNDATION-01` — done

- SSR-/Client-Richtung und globales `lang`/`dir`
- RTL-Grundlage
- blockweises `lang`/`dir` auf vorhandenen Language-Bridge-Flächen
- arabische Basisnachrichten und Guardrails

Evidence: PR `#413`.

### `I18N-SURFACE-COVERAGE-02` — done

- öffentliche, Konto-, Review-, Organisations- und Behördenflächen inventarisiert
- Inline-Copy, Fallbacks, RTL- und Mobile-Lücken dokumentiert
- falsche Vollständigkeitsbehauptungen per Contract begrenzt

Evidence: PR `#420`, `docs/E150/V3_I18N_SURFACE_COVERAGE_MATRIX_2026-07-23.md`.

### `I18N-PREFERENCE-SEPARATION-03` — review

Technisch gemergt über PR `#427`:

- `uiLocale`
- `readingLocale`
- `preferredOutputLocales`
- `showOriginalByDefault`
- `preferredLocale` nur noch als Legacy-Mirror der Lesesprache

Die Evidence-Drift `PR-Phase: Draft` wird in PR `#457` auf `Merged` korrigiert.

Offen bis `done`:

- manueller Desktop-/Mobile-Smoke für Header, Settings und Account
- Reload-/Persistenzprüfung
- Beleg, dass UI- und Lesesprache sich nicht mehr gegenseitig überschreiben
- Beleg, dass Originalanzeige und Ausgabepräferenzen nicht still auf die UI-Sprache zurückfallen
- Ergebnis im kanonischen operativen Kopf von `docs/E150/OpenTasks.md` synchronisieren

### `I18N-CROSS-LINGUAL-RUNTIME-04` — blocked

Bleibt blockiert bis mindestens:

- `I18N-PREFERENCE-SEPARATION-03` auf `done`
- `PROD-RUNTIME-02` freigegeben
- `AI-RUNTIME-POLICY-01` für reale Modelle, Budgets, Logging, Datenschutz und Retention entschieden
- kanonische Draft-/Resume-Wahrheit auf `main`
- Quellen-/Review-Pfade für Original, Übersetzung, Retry und Audit belastbar

## Verbindliche Sprachrollen

| Rolle | Zweck | Darf nicht still ersetzt werden durch |
| --- | --- | --- |
| UI-Sprache | Navigation, Formulare, Status, Fehler, Bedienlogik | Lesesprache oder Browser-Autoübersetzung |
| Lesesprache | bevorzugte Fassung nutzerseitiger Inhalte | UI-Sprache |
| Originalsprache | unveränderte Herkunftsfassung | Übersetzung oder Zusammenfassung |
| Arbeitssprache | interne Bearbeitung und Moderation | globale UI-Präferenz |
| Ausgabesprache | Sprache erzeugter Antworten, Briefings und Artefakte | Original- oder Lesesprache ohne Nutzervertrag |
| Quellensprache | Sprache einer Quelle und ihres Evidenzstatus | Sprache des Dossiers oder der UI |

Jeder Datensatz und jede relevante Oberfläche muss explizit erkennen lassen, welche dieser Rollen gemeint ist.

## Capability-Vertrag

Sprachverfügbarkeit wird nicht mehr nur durch eine Locale-Liste beschrieben. Für jede Locale und relevante Surface muss ein Capability-Readmodel mindestens führen:

- `uiAvailable`
- `readingAvailable`
- `outputAvailable`
- `sourceProcessingAvailable`
- `rtl`
- `messageParityPassed`
- `coreSurfaceQaPassed`
- `legalCopyReviewed`
- `lastVerifiedAt`
- `fallbackLocale`

### Sichtbarkeitsregel

Eine Sprache darf im UI-Sprachumschalter nur als vollständig verfügbar erscheinen, wenn `uiAvailable`, `messageParityPassed` und `coreSurfaceQaPassed` wahr sind.

Eine breitere Lesesprache darf separat angeboten werden, muss aber als Lesesprache bezeichnet werden und darf keine vollständige UI-Abdeckung suggerieren.

Fallbacks müssen technisch und nutzerseitig ehrlich sein. Ein stiller Wechsel auf Deutsch oder Englisch ist kein erfolgreicher Sprachpfad.

## Kanonisches Message-SSOT

Das Ziel ist ein gemeinsamer, produktiv verdrahteter Message-Vertrag für nutzerseitige UI-Texte.

Verbindliche Regeln:

- Message-Key und Source-Text besitzen eine kanonische Version.
- Inline-JSX für nutzerseitige Kerntexte wird auf eine begründete Allowlist reduziert.
- `strings.ts`, Message-Bundles und externe Autoübersetzung dürfen keine konkurrierenden UI-Wahrheiten bleiben.
- SSR und Client verwenden dieselbe Locale-Auflösung.
- Fehlende Keys brechen in Test/CI sichtbar und fallen produktiv nur auf einen ausdrücklich ausgewiesenen Fallback zurück.
- maschinell erzeugte Bundles können einen Übersetzungsentwurf liefern, werden aber versioniert, geprüft und nicht als ungeprüfte kritische Copy veröffentlicht.
- Rechts-, Consent-, Pricing-, Payment-, Account-Security- und E-Mail-Texte benötigen feste freigegebene Fassungen.

## Vollständige operative Zerlegung

Die folgenden IDs sind als kanonische Folge-Slices in den operativen Kopf von `docs/E150/OpenTasks.md` zu übernehmen. Bis zu diesem SSOT-Sync und einem erfolgreichen Preflight ist keine Implementierung freigegeben.

### `I18N-MESSAGE-SSOT-05`

Status bei Intake: `blocked`

Priorität: P0

Abhängigkeiten:

- `I18N-PREFERENCE-SEPARATION-03` auf `done`
- `I18N-SURFACE-COVERAGE-02` auf `done`

Scope:

- Capability-Registry und produktiven Message-Loader kanonisieren
- Locale-, Fallback- und Message-Version-Vertrag schließen
- `zh`-Bundle-Lücke sowie Bundle-/Switcher-Drift bereinigen
- CI-Contracts für Key-Parität, Inline-Copy-Allowlist und falsche Verfügbarkeitsbehauptungen

Akzeptanz:

- genau ein produktiver UI-Message-Pfad
- UI- und Lesesprachen werden capability-basiert und getrennt angeboten
- fehlende Keys und stille Fallbacks sind regressionssicher
- keine Public-Core-Surface benötigt Browser-Autoübersetzung als kanonischen UI-Pfad

### `I18N-PUBLIC-CORE-MIGRATION-06`

Status bei Intake: `blocked`

Priorität: P0

Abhängigkeit: `I18N-MESSAGE-SSOT-05`

Scope:

- `/`, `/start`, Header, Footer
- `/themen`, Suche
- `/create`
- `/runden`
- `/dossier` und Dossier-Detail
- `/live` und öffentliche Live-/QR-Einstiege
- `/pricing`, `/order`, `/vormerken`

Akzeptanz:

- keine große unkontrollierte Inline-DE-Insel auf den öffentlichen Kernflächen
- Lade-, Fehler-, Retry-, Empty-, Consent- und CTA-Zustände lokalisiert
- SEO-Metadaten, Canonical, OG- und strukturierte Daten folgen dem Locale-Vertrag
- Original und Lesefassung bleiben auf Content-Flächen getrennt
- Desktop und Mobile ohne stillen Sprachwechsel

### `I18N-AUTH-ACCOUNT-ADMIN-07`

Status bei Intake: `blocked`

Priorität: P0

Abhängigkeit: `I18N-MESSAGE-SSOT-05`

Scope:

- Login, Registrierung, Verifikation, Reset
- Account, Settings, Resume und persönliche Workbench
- Organisations- und Behördenflächen
- Admin-, Review- und Moderationsoberflächen
- Fehler-, Security-, 2FA-, Mail- und Sessiontexte

Akzeptanz:

- private Pfade sind nicht länger systematisch de-only
- sicherheitsrelevante Texte besitzen feste geprüfte Fassungen
- Nutzerpräferenzen bleiben nach Login, Reload und Gerätewechsel korrekt getrennt
- Original-/Lesefassung ist in Review und Account nachvollziehbar
- keine interne Operator-Copy wird fälschlich öffentlich als lokalisierte Produktcopy dargestellt

### `I18N-LEGAL-LONGFORM-08`

Status bei Intake: `blocked`

Priorität: P0

Abhängigkeiten:

- `I18N-MESSAGE-SSOT-05`
- `LEGAL-PUBLIC-PAGES-01`
- verifizierte deutsche Quelltexte und fachliche Freigabe je Sprachfassung

Scope:

- Impressum, Datenschutz, AGB
- Widerruf, Kündigung, Widerspruch, Privatsphäre
- Consent- und Cookie-Texte
- FAQ, Kontakt, Über uns, Transparenzbericht, Verhaltenskodex, Mitgliedschaft, How-to-Flächen und Presse-Longform

Akzeptanz:

- keine automatische ungeprüfte Rechtsübersetzung
- pro Fassung Version, Freigabestatus und Quelldatum
- Page-Entry nutzt tatsächlich die gewählte geprüfte Locale
- Mobile-, Druck-, Link- und Accessibility-Abnahme
- nicht freigegebene Fassungen werden nicht als vollständig verfügbar beworben

### `I18N-RTL-MOBILE-A11Y-09`

Status bei Intake: `blocked`

Priorität: P0

Abhängigkeiten:

- `I18N-PUBLIC-CORE-MIGRATION-06`
- `I18N-AUTH-ACCOUNT-ADMIN-07`
- `I18N-LEGAL-LONGFORM-08`

Scope:

- globale und blockweise RTL-Semantik
- Responsive Layout, Navigation, Dialoge, Tabellen, Formulare und Fokusführung
- Screenreader, Tastatur und Zoom
- gemischte Original-/Übersetzungsblöcke
- Datum, Uhrzeit, Zahl, Plural, Name und Region ohne westliche Formatannahmen

Akzeptanz:

- Arabisch als RTL-Härtetest
- Mandarin als nichtlateinischer Schrift-/Umbruchtest
- Spanisch als verbreiteter LTR-Qualitätsfall
- Deutsch und Englisch als gepflegte Referenzpfade
- automatisierte Locale-Parität für alle aktivierten Locales
- manueller Desktop-/Mobile-Smoke auf repräsentativen Sprachklassen

### `I18N-CROSS-LINGUAL-RUNTIME-04`

Status bleibt: `blocked`

Scope-Ergänzung:

- providerunabhängiger Übersetzungsadapter
- Originalerhalt und versionierte Lesefassungen
- Qualitäts-, Unsicherheits- und Sprachstatus
- Retry, Cache, Kosten, Rate Limits, Audit und Löschung
- sprachübergreifendes Matching nur als Review-Vorschlag
- keine ungeprüfte Zusammenführung von Quellen, Claims, Beiträgen oder Dossiers

Akzeptanz:

- reale Quelle in beliebiger unterstützter Sprache wird mit Original, Lesefassung und Evidenzstatus verarbeitet
- Fehler erzeugen keine erfundene Übersetzung und keinen semantischen Fallback
- sensible/private Inhalte verlassen keine freigegebene Datenverarbeitungsgrenze
- Output-Sprache folgt dem expliziten Ausgabevertrag

### `I18N-GO-CERTIFICATION-10`

Status bei Intake: `blocked`

Priorität: P0

Abhängigkeiten:

- `I18N-MESSAGE-SSOT-05`
- `I18N-PUBLIC-CORE-MIGRATION-06`
- `I18N-AUTH-ACCOUNT-ADMIN-07`
- `I18N-LEGAL-LONGFORM-08`
- `I18N-RTL-MOBILE-A11Y-09`
- `I18N-CROSS-LINGUAL-RUNTIME-04`
- `PROD-AUTHENTICATED-SMOKE-03C`

Scope:

- abschließende Capability-Matrix gegen produktive Kernflächen
- End-to-End-Smokes für UI, Lesen, Original, Arbeit und Ausgabe
- Fallback-, Fehler-, Offline-/Retry-, Reload- und Resume-Pfade
- Rechts-/Consent-Freigaben
- Performance, Caching und Kostenkontrolle

Go-Kriterien:

1. Alle aktiv beworbenen UI-Sprachen bestehen Key-Parität und Core-Surface-QA.
2. Keine Kernfläche enthält unkontrollierte de-only oder en-only Nutzertexte.
3. UI- und Lesesprache bleiben durch Navigation, Login, Reload und Resume getrennt.
4. Original bleibt erhalten und Übersetzung ist markiert.
5. RTL, Mobile, Tastatur und Screenreader sind belegt.
6. Rechtlich kritische Sprachfassungen sind freigegeben.
7. Cross-lingual Runtime ist auditierbar, providerunabhängig und fail-closed.
8. Öffentliche Sprachclaims entsprechen exakt der Capability-Registry.
9. Reproduzierbarer Production-Smoke mit Commit, Domain, Locale, Gerät und Ergebnis liegt vor.
10. Kein Auto-Publish, ungeprüftes Cross-lingual Merge oder stilles Provider-Fallback wurde eingeführt.

Erst danach wird der Systemstatus von I18N No-Go auf I18N Go gesetzt.

## Vorgeschlagene OpenTasks-Zeilen

Diese Zeilen sind in einem fokussierten SSOT-Sync in den kanonischen operativen Kopf zu übernehmen:

| ID | Status | Priorität | Abhängigkeiten | Scope | Akzeptanzkriterien |
| --- | --- | --- | --- | --- | --- |
| I18N-MESSAGE-SSOT-05 | blocked | P0 | I18N-PREFERENCE-SEPARATION-03, I18N-SURFACE-COVERAGE-02 | Capability-Registry, produktiven Message-Loader, Locale-/Fallback-/Versionsvertrag und CI-Parität kanonisieren | Ein UI-Message-SSOT; ehrliche Capability-Anzeige; keine stillen Fallbacks oder konkurrierenden Bundle-/Inline-Wahrheiten |
| I18N-PUBLIC-CORE-MIGRATION-06 | blocked | P0 | I18N-MESSAGE-SSOT-05 | Öffentliche Kernflächen einschließlich Create, Runden, Dossier, Live, Pricing und Order auf den kanonischen UI-Lokalisierungspfad migrieren | Öffentliche Kernflächen vollständig, responsive, SEO-konsistent und ohne unkontrollierte Inline-Copy-Inseln |
| I18N-AUTH-ACCOUNT-ADMIN-07 | blocked | P0 | I18N-MESSAGE-SSOT-05 | Auth-, Account-, Settings-, Organisations-, Behörden-, Admin-, Review- und Security-Flächen lokalisieren | Private und operative Kernflächen sind sprachfähig; Security- und Mailtexte geprüft; Präferenzen bleiben getrennt persistent |
| I18N-LEGAL-LONGFORM-08 | blocked | P0 | I18N-MESSAGE-SSOT-05, LEGAL-PUBLIC-PAGES-01 | Recht, Consent und öffentliche Longform mit versionierten und geprüften Sprachfassungen schließen | Keine ungeprüfte Rechtsübersetzung; Page-Entry, Mobile, Druck, Links und Freigabestatus je Locale belegt |
| I18N-RTL-MOBILE-A11Y-09 | blocked | P0 | I18N-PUBLIC-CORE-MIGRATION-06, I18N-AUTH-ACCOUNT-ADMIN-07, I18N-LEGAL-LONGFORM-08 | RTL, nichtlateinische Schrift, Mobile, Tastatur, Screenreader und Locale-Formatierung systemweit härten | Repräsentative Sprachklassen manuell und alle aktivierten Locales automatisiert abgenommen |
| I18N-GO-CERTIFICATION-10 | blocked | P0 | I18N-MESSAGE-SSOT-05, I18N-PUBLIC-CORE-MIGRATION-06, I18N-AUTH-ACCOUNT-ADMIN-07, I18N-LEGAL-LONGFORM-08, I18N-RTL-MOBILE-A11Y-09, I18N-CROSS-LINGUAL-RUNTIME-04, PROD-AUTHENTICATED-SMOKE-03C | Systemweite I18N-Abnahme und öffentliche Capability-Freigabe | Alle zehn Go-Kriterien sind mit reproduzierbarer Production-Evidence erfüllt |

## Ausführungsreihenfolge

```text
I18N-PREFERENCE-SEPARATION-03 review closure
  -> I18N-MESSAGE-SSOT-05
     -> I18N-PUBLIC-CORE-MIGRATION-06
     -> I18N-AUTH-ACCOUNT-ADMIN-07
     -> I18N-LEGAL-LONGFORM-08
        -> I18N-RTL-MOBILE-A11Y-09

parallel nach Runtime-/Policy-Freigabe:
I18N-CROSS-LINGUAL-RUNTIME-04

anschließend:
I18N-GO-CERTIFICATION-10
```

Public Core, Auth/Account/Admin und Legal/Longform dürfen nach abgeschlossenem Message-SSOT in getrennten PRs parallel bearbeitet werden, sofern keine Dateikollisionen bestehen. Die Go-Zertifizierung bleibt strikt nachgelagert.

## Kalenderbezug

| Datum | Task | Zweck |
| --- | --- | --- |
| 2026-08-11, 13:00–15:00 | `I18N-PREFERENCE-SEPARATION-03` | Review schließen; keine erneute Implementierung |
| 2026-08-12, 13:00–15:00 | `I18N-CROSS-LINGUAL-RUNTIME-04` | Readiness-/Gate-Review; keine externe Runtime-Aktivierung bei offenen Blockern |
| 2026-08-19, 13:00–15:00 | `I18N-MESSAGE-SSOT-05` | Message-SSOT und Capability Registry, nur nach SSOT-Sync und Preflight |
| 2026-08-20, 13:00–15:00 | `I18N-PUBLIC-CORE-MIGRATION-06` | Public Core, nur nach abgeschlossenem Message-SSOT |
| 2026-08-21, 13:00–15:00 | `I18N-AUTH-ACCOUNT-ADMIN-07` | private und operative Flächen, nur nach abgeschlossenem Message-SSOT |
| 2026-08-25, 13:00–15:00 | `I18N-LEGAL-LONGFORM-08` | Recht/Longform, bei offenem Legal-Gate nur Review |
| 2026-08-26, 13:00–15:00 | `I18N-RTL-MOBILE-A11Y-09` | RTL-, Mobile- und Accessibility-Härtung nach Migrationen |
| 2026-09-04, 13:00–15:00 | `I18N-GO-CERTIFICATION-10` | Go/No-Go nur bei vollständig grünen Abhängigkeiten |

## Guardrails

- Kein Auto-Publish.
- Kein ungeprüftes Cross-lingual Merge.
- Keine Übersetzung ersetzt das Original.
- Keine Sprache wird als vollständig unterstützt beworben, solange ihre Capability nicht grün ist.
- Keine automatische Rechtsübersetzung als freigegebene Fassung.
- Keine Provider-, Credential-, Budget- oder Datenverarbeitungsfreigabe durch diesen Contract.
- Keine parallele zweite Locale-, Message-, Translation- oder Draft-Wahrheit.
- Vor jedem Implementierungsbranch gilt `docs/E150/CODEX_RUN_PACK_CONTRACT.md` und der taskbezogene Preflight auf sauberem `main`.
