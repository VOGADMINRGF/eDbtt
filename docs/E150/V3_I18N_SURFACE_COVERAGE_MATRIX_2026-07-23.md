# V3 I18N Surface Coverage Matrix

Stand: 2026-07-24
Slice: `I18N-SURFACE-COVERAGE-02`

## Urteil

eDebatte ist im aktuellen Worktree **nicht systemweit UI-lokalisiert**. Der Code trennt Teile der Sprachrollen bereits fachlich, aber die Oberflächenrealität bleibt fragmentiert:

- `RootLayout` und `LocaleContext` setzen `lang` und `dir` korrekt für unterstützte Locales.
- `LocalizedContentDisplay` trennt Lesefassung und Original pro Textblock und ist der stärkste echte Language-Bridge-Baustein.
- Sichtbare UI-Lokalisierung läuft überwiegend **nicht** über `apps/web/src/app/messages/*.json`, sondern über Inline-JSX, einzelne `strings.ts`-Dateien und öffentliche Auto-Übersetzung.
- Öffentliche Auto-Übersetzung ist auf `it`, `ru`, `zh`, `fr`, `es`, `pl` beschränkt und ist für private Pfade wie `/account`, `/settings`, `/login`, `/register`, `/reset`, `/verify`, `/admin` deaktiviert.
- Im Worktree existieren 19 Message-Bundles; `zh.json` fehlt weiterhin.
- Der tatsächlich gerenderte Header-Sprachumschalter bietet aktuell nur `de` und `en`. Die 20er-Locale-Liste lebt in Konfiguration, `ContentLanguageSelect` und dem ungenutzten `LocaleSwitcher`, nicht als systemweit belegte UI-Abdeckung.

## Rollenwahrheit

Die Rollen sind im Code nicht deckungsgleich und dürfen nicht als derselbe Zustand gelesen werden:

| Rolle | Aktueller technischer Träger | Wahrheit |
|---|---|---|
| UI-Sprache | `LocaleContext`, `RootLayout`, Header-Locale-Auswahl | Real auf `de`/`en` im Haupt-Header bedienbar; weitere Locales sind konfiguriert, aber nicht flächig als UI nachgewiesen |
| Lesesprache | `useContentLang`, `preferredLocale`, `LocalizedContentDisplay` | Separat vorhanden, aber nur auf ausgewählten Analyse-/Review-/Content-Flächen wirklich wirksam |
| Originalsprache | `LocalizedContentRecord.originalLanguage` | In Language-Bridge-Flächen erhalten |
| Arbeitssprache | meist deutscher Inline-UI-Text | Nicht explizit als eigener globaler Zustand modelliert |
| Ausgabesprache | diverse Create-/Voxy-/Review-Contracts | Fachlich getrennt erwähnt, nicht als UI-weite Präferenz verdrahtet |
| Quellensprache | Content-/Evidence-/Review-Contracts | Fachlich getrennt, UI-seitig nur punktuell sichtbar |

## Bundle- und Switcher-Inventar

### `SUPPORTED_LOCALES`

`de`, `en`, `fr`, `pl`, `es`, `it`, `tr`, `ar`, `ru`, `zh`, `nl`, `pt`, `fi`, `sv`, `no`, `cs`, `hi`, `ro`, `el`, `uk`

### Gefundene Message-Bundles

`ar`, `cs`, `de`, `el`, `en`, `es`, `fi`, `fr`, `hi`, `it`, `nl`, `no`, `pl`, `pt`, `ro`, `ru`, `sv`, `tr`, `uk`

### Bekannte Drift

| Bereich | Ist-Zustand | Drift |
|---|---|---|
| Message-Bundles | 19 Dateien | `zh.json` fehlt |
| Aktiver Header-Locale-Picker | `de`, `en` | konfiguriertes Locale-Set ist größer als die echte UI-Auswahl |
| `ContentLanguageSelect` | 20 Sprachen | Lesesprache ist breiter als die aktive UI-Sprachauswahl |
| `LocaleSwitcher.tsx` | mappt über alle 20 `SUPPORTED_LOCALES` | Komponente ist nicht in produktiven Routen verdrahtet |
| Öffentliche Auto-Übersetzung | `it`, `ru`, `zh`, `fr`, `es`, `pl` | deckt nur einen Teil der konfigurierten Locales ab |
| Private Pfade | Auto-Übersetzung aus | `/account`, `/settings`, `/auth`, `/login`, `/register`, `/reset`, `/verify`, `/admin`, `/dashboard` bleiben operator-/inline-getrieben |
| Message-Bundle-Wiring | kein produktiver Loader gefunden | Bundles sind derzeit kein systemweites UI-SSOT |

### Varianten für spätere Entscheidungen

1. UI-Sprachen auf die real bedienbaren Oberflächen einschränken.
2. Fehlende Bundles ergänzen und tatsächlich produktiv einbinden.
3. UI-Sprache und Lesesprache sichtbar getrennt ausweisen, statt beides implizit unter `locale` zu führen.

## Surface-Matrix

Legende:

- Textquelle: `MB` Message-Bundle, `STR` `strings.ts`, `JSX` Inline-JSX, `OP` Operator-/Contract-Text, `EXT` externer oder datengetriebener Inhalt, `AT` öffentliche Auto-Übersetzung
- UI-Sprachen: `de/en` = explizit gepflegt, `AT-6` = öffentliche Auto-Übersetzung für `it, ru, zh, fr, es, pl`
- RTL global: `<html dir>` / Locale-Kontext
- RTL Block: pro Textblock mit `lang`/`dir`

| Surface | Route | Hauptkomponente | Textquelle | UI-Sprachen | DE-Inline | EN-Fallback | Fehlende Keys / Drift | RTL global | RTL Block | Mobile | Original / Übersetzung | Index | Status | Objektive Abnahme je Surface |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Root-Shell | `/` global | `RootLayout` | OP | `de/en` + config | nein | nein | Bundles nicht verdrahtet | ja | nein | teilweise | nein | indexierbar | teilweise | SSR setzt `lang`/`dir`; kein Surface behauptet Vollabdeckung |
| Startseite | `/`, `/start` | `LandingStart` | JSX, OP | `de/en`, punktuell `AT-6` | ja | punktuell | `homeStrings.ts` existiert, wird aber nicht genutzt | ja | nein | ja | nein | indexierbar | teilweise | hero, CTA und Statuscopy ohne Mischsprung de/en/AT |
| Header | global | `SiteHeader` | JSX, OP, AT | aktiv `de/en`; Lesesprache 20 | ja | nein | UI-Picker filtert auf Core-Locales | ja | nein | ja | nein | indexierbar | teilweise | UI-Locale und Content-Locale dürfen nicht verwechselt werden |
| Footer | global | `SiteFooter` | JSX, AT | `de/en`, punktuell `AT-6` | ja | nein | Links bleiben de-lastig, Bundles ungenutzt | ja | nein | teilweise | nein | indexierbar | teilweise | alle Linklabels ohne stillen Englischfallback |
| Login | `/login` | `LoginPageShell` | JSX, OP | `de` | ja | nein | private Route ohne Auto-Übersetzung | ja | nein | getestet | nein | noindex implizit durch Login-Gate, keine Meta | nicht lokalisiert | Formcopy sauber getrennt von UI-Locale-Behauptungen |
| Registrierung | `/register` | `RegisterPageClient` | JSX, OP | `de` | ja | nein | mehrstufige Inline-Form, keine Bundle-Nutzung | ja | nein | teilweise | nein | noindex implizit | nicht lokalisiert | Schritt-Texte, Validierung und Felder ohne Sprachmix |
| Passwort-Reset | `/reset` | `ResetPage` | JSX | `de` | ja | nein | reine Inline-DE-Copy | ja | nein | nein | nein | noindex implizit | nicht lokalisiert | Request- und Setzen-Flows in definierter Sprache |
| Verifikation | `/verify` | `VerifyPage` | JSX | `de` | ja | nein | Inline-DE inkl. Fehlermeldungen | ja | nein | nein | nein | noindex implizit | nicht lokalisiert | Verify-/Resend-Texte konsistent und ohne Fallbackillusion |
| Account | `/account` | `AccountPage`, `AccountClient` | JSX, OP, EXT | `de` UI, Lesesprache per `preferredLocale` | ja | nein | private UI bleibt de-lastig; Content-Bridge nur für Beiträge | ja | ja | teilweise | ja, punktuell | privat | teilweise | Beitragskarten zeigen Original/Lesefassung ehrlich, Shell bleibt als de-only markiert |
| Einstellungen | `/settings` | `SettingsPage` | JSX | `de` | ja | nein | sogar Sprache im Lead nur behauptet, nicht als echte Lokalisierung umgesetzt | ja | nein | nein | nein | derzeit indexierbar mangels `noindex` | nicht lokalisiert | Consent-/Privacy-Copy ohne falsches Sprachversprechen |
| Themen | `/themen` | `ThemenPage` | JSX, OP | `de` | ja | nein | öffentliche Surface ohne Bundle- oder Auto-Translate-Wiring | ja | nein | getestet | nein | indexierbar | nicht lokalisiert | Titel, Chips und CTA in definierter UI-Sprache |
| Suche | verteilt: `/themen`, `/community/contributions`, `/api/search/civic` | keine eigene Search-Seite | JSX, EXT | uneinheitlich | ja | nein | keine dedizierte lokalisierte Search-Surface vorhanden | ja | teilweise | nein | punktuell | teils öffentlich | teilweise | separate Search-Surface erst grün, wenn UI-Rolle und Copy explizit sind |
| Create | `/create` | `CreatePage`, `CreateClient` | JSX, OP | gemischt, aber nicht bundlegetrieben | ja | punktuell | Tests gegen Mixed-Locale vorhanden, trotzdem kein Bundle-SSOT | ja | punktuell | teilweise | fachlich ja, UI nur punktuell | indexierbar | teilweise | kein stiller Sprachwechsel zwischen Planner, CTA und Guardrails |
| Dossiers | `/dossier`, `/dossier/[id]` | `DossierIndexClient`, Dossier-Detail | JSX, OP, EXT | überwiegend `de` | teilweise | nein | Detailseiten ohne belegte UI-Bundle-Nutzung | ja | punktuell | teilweise | fachlich vorbereitet, nicht flächig belegt | indexierbar | teilweise | Dossier-Shell, Metadaten und Content-Bridge müssen deckungsgleich sein |
| Runden | `/runden`, `/runden/new` | `RundenPage` | JSX, OP, EXT | `de` | ja | nein | große Inline-Copy-Insel | ja | nein | getestet | fachlich möglich, UI nein | indexierbar | nicht lokalisiert | Journey-, Share- und Statuscopy ohne Locale-Mix |
| Live | `/live`, `/live/[campaignId]` | `LivePage` | JSX | `de` intern | ja | nein | env-/admin-gated Stub | ja | nein | getestet | nein | intern/nicht nutzerseitig | intern/nicht nutzerseitig | solange Stub: keine Mehrsprachigkeitsbehauptung |
| QR | `/qr-studio`, `/qr/[qrId]` | `QrStudioPage`, QR-Detail | JSX, OP | `de` | ja | nein | QR-Studio inline; Detailroute ohne i18n-Beleg | ja | nein | teilweise | nein | indexierbar/teils dynamisch | nicht lokalisiert | Öffentliche QR-Einstiege dürfen Sprache nicht implizit wechseln |
| Swipes | `/swipes` | `SwipesHandoffShell` | JSX, OP | `de` UI | nein | nein | Shell selbst minimal; eigentliche Copy in Feature-Komponenten | ja | nein | getestet | nein | indexierbar | teilweise | Handoff-/Auth-Hinweise in definierter UI-Sprache |
| Organisationen | `/account/organization`, `/account/organization/dashboard` | Account-Org-Surfaces | JSX, OP | `de` | teilweise | nein | private Operator-Fläche | ja | nein | getestet | nein | privat | intern/nicht nutzerseitig | Org-Journey ohne falsche Public-Locale-Behauptung |
| Medien / Kultur | `/presse` | `PressePage` | JSX | `de` | ja | nein | sehr große Inline-DE-Insel | ja | nein | nein | nein | indexierbar | nicht lokalisiert | Tabs, Pressemitteilung und Kontakt in definierter Sprache |
| Verwaltung / Behörden | `/admin/regions` | `AdminRegionsPage` | JSX, OP, EXT | `de` | ja | nein | große Fachcopy, keine Bundle-Nutzung | ja | nein | nein | nein | intern | intern/nicht nutzerseitig | Region-/Behörden-Semantik bleibt explizit de-only bis echte Lokalisierung |
| Admin-Shell | `/admin`, `/admin/orgs` | diverse Admin-Surfaces | JSX, OP | `de` | ja | nein | komplett operator-getrieben | ja | nein | teilweise | nein | intern | intern/nicht nutzerseitig | keine öffentliche Mehrsprachigkeitsbehauptung |
| Review | `/admin/review`, `/admin/contributions` | Review-Workbench | JSX, OP, EXT | `de` UI, Lesefassung punktuell | ja | nein | UI de-only, Content-Bridge nur für Beiträge | ja | ja | teilweise | ja, punktuell | intern | teilweise | Review zeigt Original/Lesefassung, ohne UI als vollständig lokalisiert auszugeben |
| Pricing | `/pricing` | `PricingPage` | JSX, STR/OP | `de/en` | ja | ja | nur de/en explizit, keine 20er-UI | ja | nein | getestet | nein | indexierbar | teilweise | Preis-, CTA- und Paketcopy in de/en vollständig konsistent |
| Order | `/order`, `/vormerken` | `VormerkenPage` | JSX, OP | `de/en` teilweise | punktuell | ja | Handoff nutzt Query-`lang=en`, nicht Bundle-SSOT | ja | nein | getestet | nein | indexierbar | teilweise | Order-Entry, Follow-up und Pricing-Brücke in de/en deckungsgleich |
| Impressum | `/impressum` | `ImpressumPage` | STR, JSX | technisch `de/en`, gerendert `de` | nein | ja im Helper | Page ruft `getImpressumStrings("de")` fest auf | ja | nein | nein | nein | indexierbar | teilweise | Helper-Locale und gerenderte Locale dürfen nicht auseinanderlaufen |
| Datenschutz | `/datenschutz` | `DatenschutzPage` | STR, JSX | technisch `de/en`, gerendert `de` | nein | ja im Helper | Page ruft `getPrivacyStrings("de")` fest auf | ja | nein | nein | nein | indexierbar | teilweise | wie Impressum: keine falsche englische Verfügbarkeit behaupten |
| AGB | `/agb` | `AgbPage` | JSX, AT | `de/en`, punktuell `AT-6` | ja | nein | keine echte strukturelle Bundle-Lokalisierung | ja | nein | nein | nein | indexierbar | teilweise | rechtliche Platzhaltertexte dürfen nicht als voll lokalisiert gelten |
| Weitere Rechtsseiten | `/widerspruch`, `/widerrufsbelehrung`, `/privatsphaere` | diverse Legal Pages | JSX, STR, AT | meist `de`, teils `AT-6` | ja | punktuell | Privacy-Banner-Texte sind de-only; Rechtsseiten uneinheitlich | ja | nein | nein | nein | indexierbar | teilweise | jede Rechtsseite braucht explizite Sprachwahrheit statt impliziter Fallbacks |

## Größte Inline-Copy-Inseln

1. `apps/web/src/app/admin/review/page.tsx`
2. `apps/web/src/app/register/RegisterPageClient.tsx`
3. `apps/web/src/app/presse/page.tsx`
4. `apps/web/src/app/runden/page.tsx`
5. `apps/web/src/app/themen/page.tsx`
6. `apps/web/src/app/settings/page.tsx`

## RTL- und Mobile-Stand

### RTL-Lücken

- Globales RTL ist im Root-Layout und im Locale-Kontext korrekt verdrahtet.
- Pro-Textblock-RTL ist nur dort explizit belegt, wo `LocalizedContentDisplay` verwendet wird: derzeit vor allem `Account`, `Community Contributions`, `Admin Contributions`, Teile von Profil-/Review-Flächen.
- Header, Footer, Startseite, Themen, Runden, Pricing, Login, Register, Reset und die meisten Rechtsseiten haben keine explizite blockweise RTL-Absicherung.
- `global-error.tsx` rendert weiter statisch `<html lang="de">` ohne sichtbaren Richtungsbezug.

### Mobile-Lücken

- Explizit getestete Mobile-/Surface-Contracts sind u. a. für Header, Start, Themen, Stream sowie Live-/QR-Einstiege vorhanden.
- Für Rechtsseiten, Settings, Presse, Admin Regions, Impressum und Datenschutz fand sich kein fokussierter Mobile-I18N-Beleg.
- Mobile ist deshalb derzeit nur für einen Teil der öffentlichen Kernflächen objektiv geprüft.

## Priorisierung

### P0

- Sichtbare Sprachwahrheit dokumentieren: Header-UI-Locale (`de/en`) vs. Lesesprache vs. ungenutzter 20er-Switcher.
- `zh`-Bundle-Lücke schließen oder die UI-/Lesesprachen-Wahrheit bewusst enger fassen.
- Große de-only Auth-/Settings-/Operator-Surfaces nicht als systemweit mehrsprachig labeln.

### P1

- Öffentliche Kernflächen (`/start`, `/themen`, `/create`, `/runden`, `/pricing`, `/order`) auf einen echten UI-Lokalisierungspfad vereinheitlichen.
- `Impressum`/`Datenschutz`-Helper-Lokalisierung auch im Page-Entry wirklich nutzen.
- Mehr `LocalizedContentDisplay` oder gleichwertige blockweise `lang`/`dir`-Semantik in Content-Surfaces nachweisen.

### P2

- Unbenutzte Altpfade (`LocaleSwitcher`, `homeStrings.ts`) entscheiden: integrieren oder zurückbauen.
- Rechtsseiten, Presse und weitere Public-Longform-Flächen mit Mobile-/RTL-Contracts versehen.

## Abhängigkeit zur späteren Präferenztrennung

Die spätere Trennung von `uiLocale` und `readingLocale` bleibt direkt von diesem Audit abhängig:

- Der Header benutzt heute bereits zwei Denkwelten zugleich: `locale` und `contentLang`.
- `LocalizedContentDisplay` kann Lesefassung vs. Original sauber rendern.
- Solange UI-Locale und Lesesprache nicht explizit getrennt ausformuliert werden, bleibt jede Aussage über „20 Sprachen“ technisch missverständlich.

## Bewusst nicht übersetzte oder nicht produktiv verdrahtete Dateien

- `apps/web/src/app/homeStrings.ts` existiert, ist aber im aktuellen Start-/Home-Pfad ungenutzt.
- `apps/web/src/components/LocaleSwitcher.tsx` listet 20 Locales, ist aber im aktuellen Routing nicht eingehängt.
- `apps/web/src/app/privacyStrings.ts` enthält primär de-only Banner-/Consent-Strings und ist kein systemweites Bundle-SSOT.
- `apps/web/src/app/impressum/strings.ts` und `apps/web/src/app/datenschutz/strings.ts` tragen `en`, werden auf den Pages aber fest mit `"de"` aufgerufen.

## Nächste drei Implementierungsslices

1. Header-/Locale-Truth-Hardening: sichtbare UI-Sprachauswahl, Lesesprache und Drift-Hinweis explizit machen.
2. Public-Core-I18N-Hardening: `/start`, `/themen`, `/pricing`, `/order`, `/create` auf einen ehrlichen UI-Lokalisierungspfad ziehen.
3. Legal-Longform-I18N-Hardening: Impressum/Datenschutz/AGB/Widerspruch/Widerruf mit einheitlicher Locale-Quelle plus Mobile-/RTL-Contracts schließen.

## Go / No-Go

Kein Go für die Aussage „vollständig mehrsprachig“, solange mindestens einer dieser Punkte offen ist:

- fehlendes `zh`-Bundle,
- keine produktive Message-Bundle-Einbindung als UI-SSOT,
- de-only Auth-/Account-/Admin-Surfaces,
- öffentliche Kernflächen mit großen Inline-DE-Inseln,
- fehlende blockweise RTL-Belege außerhalb von `LocalizedContentDisplay`,
- keine klare Trennung zwischen UI-Sprache und Lesesprache.
