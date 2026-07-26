# White-Label Brand Profile Contract

Status: `canonical_design_contract / runtime_not_started`

## Ziel

Dieses Dokument definiert eine markenneutrale, wiederverwendbare Kommunikations- und Assetlogik für eDebatte, VoiceOpenGov, Co-Branding und spätere White-Label-Ausprägungen.

White-Label bedeutet hier:

- wiederverwendbare Vorlagen,
- zentrale Brandprofile statt hart codierter Logos und Namen,
- konsistente Exporte über mehrere Formate,
- klare Trennung von veränderbarer Gestaltung und unveränderlicher Produktwahrheit,
- keine Abhängigkeit von ChatGPT, Codex, Canva, Adobe, HeyGen oder einem anderen einzelnen Anbieter.

## Brandprofile

Mindestens vier Modi werden unterschieden:

| Modus | Zweck | Beispiel |
| --- | --- | --- |
| `edebatte` | kanonische Produktkommunikation | eDebatte Onepager, Social, Produktvideo |
| `voiceopengov` | Mission-, Membership- und Partnerkommunikation | VoiceOpenGov Mitgliedschaft, Partnerprogramm |
| `co_branded` | gemeinsame Kommunikation mit gekennzeichnetem Partner | Kommune × eDebatte, Medium × VoiceOpenGov |
| `white_label` | freigegebene kunden- oder organisationsbezogene Ausgabe | Beteiligungsreport oder Kampagnenmaterial im Kundenauftritt |

Ein Modus erzeugt weder Rollen, Rechte, Stimmrechte noch Partnerstatus. Brandprofil und fachliche Berechtigung bleiben getrennt.

## Vererbung

```text
system_guardrails
→ product_truth
→ base_design_profile
→ brand_profile
→ campaign_profile
→ asset_variant
→ locale_variant
→ export
```

Je tiefer die Ebene, desto konkreter die Darstellung. Höhere Guardrails können nicht überschrieben werden.

## Nicht überschreibbare Ebenen

Unabhängig vom Brandprofil bleiben verbindlich:

- Quellenstatus und Quellenkennzeichnung,
- Originalsprache und Übersetzungskennzeichnung,
- Gegenpositionen und offene Fragen,
- Review-, Freigabe- und Auditstatus,
- Privacy- und Retention-Regeln,
- kein Auto-Publish,
- keine Fake-Partner, Fake-Zahlen oder Fake-Live-Daten,
- keine Mehrheit als objektive Wahrheit,
- Trennung zwischen eDebatte-Information, Stakeholderposition, Community-Ergebnis und offizieller VoiceOpenGov-Position,
- barrierearme Alternativtexte, Untertitel und Reduced-Motion-Verhalten.

## Veränderbare Ebenen

Nach Freigabe konfigurierbar:

- öffentlicher Absendername,
- Logo und Logo-Varianten,
- Akzentfarben innerhalb definierter Kontrastgrenzen,
- Primär- und Sekundärschrift aus freigegebenen Font-Stacks,
- Kontakt- und Rechtsangaben,
- Website- und CTA-Ziele,
- Cover- und Endframe-Anordnung,
- Co-Branding-Reihenfolge,
- zulässige Bildmotive,
- Standardformate,
- Export-Metadaten,
- lokale Sprachfassungen.

## Voxy-Modi

Voxy bleibt eine kanonische Figur und darf nicht durch automatisch erzeugte Ersatzfiguren verfälscht werden.

Erlaubte Modi:

- `canonical` – Voxy im eDebatte-Auftritt,
- `vog_context` – dieselbe Voxy mit eindeutigem VoiceOpenGov-Kontext,
- `co_branded` – Voxy und Partnerkennzeichnung nach Freigaberegeln,
- `hidden` – keine Voxy im Asset.

Nicht erlaubt:

- Voxy spiegeln,
- Voxy umfärben oder invertieren,
- VOG-Pin oder eDebatte-Kennzeichnung unkontrolliert verändern,
- aus Voxy ein Partner-, Behörden- oder Kundenmaskottchen machen,
- eine neue Figur als vermeintliche Voxy ausgeben.

Ein echtes kundenindividuelles Maskottchen wäre eine neue Brandentscheidung und gehört nicht in das White-Label-Profil.

## Empfohlenes BrandProfile-Modell

```ts
type BrandProfile = {
  id: string;
  key: string;
  mode: "edebatte" | "voiceopengov" | "co_branded" | "white_label";
  status: "draft" | "review_ready" | "approved" | "retired";
  displayName: string;
  shortName?: string | null;
  localeDefault: string;
  locales: string[];
  logoSet: {
    primary: AssetRef;
    inverse?: AssetRef | null;
    compact?: AssetRef | null;
    monochrome?: AssetRef | null;
  };
  colors: {
    canvas: string;
    surface: string;
    foreground: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    border: string;
    success?: string | null;
    warning?: string | null;
    danger?: string | null;
  };
  typography: {
    displayStack: string[];
    bodyStack: string[];
    monoStack?: string[];
  };
  shape: {
    radiusSmall: number;
    radiusMedium: number;
    radiusLarge: number;
    borderWidth: number;
  };
  contact: {
    website?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  legal: {
    imprintUrl?: string | null;
    privacyUrl?: string | null;
    termsUrl?: string | null;
  };
  voxyMode: "canonical" | "vog_context" | "co_branded" | "hidden";
  coBranding?: {
    partnerName: string;
    partnerLogo: AssetRef;
    order: "host_first" | "edebatte_first" | "equal";
    disclosure: string;
  } | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  version: number;
};
```

`AssetRef` verweist auf freigegebene Assets. Keine Base64-Dateien, lokalen Nutzerpfade oder Toolnamen im Profil.

## Dateinamen

Dateinamen sind fachlich, stabil und anbieterneutral.

Schema:

```text
<brand>-<campaign>-<asset-type>-<audience>-<locale>-<format>-v<version>.<ext>
```

Beispiele:

```text
edebatte-why-edebatte-onepager-media-de-de-a4-v1.pdf
edebatte-debattenstand-carousel-public-de-de-1080x1350-v3.png
voiceopengov-media-partner-deck-media-de-de-16x9-v2.pdf
stadt-beispiel-edebatte-participation-report-public-de-de-a4-v1.pdf
```

Nicht verwenden:

- `chatgpt-*`
- `codex-*`
- `final-final-*`
- `neu-*`
- `test123-*`
- Tool-, Prompt- oder Sitzungsnamen,
- personenbezogene Namen ohne fachlichen Grund,
- Leerzeichen oder uneinheitliche Sonderzeichen.

## Ordnerstruktur

Arbeitsquellen:

```text
docs/marketing/
├── brand/
├── white-label/
├── campaigns/
├── sales/
├── social/
├── templates/
├── admin/
├── schemas/
└── agent-playbooks/
```

Freigegebene Exporte:

```text
apps/web/public/marketing/
├── edebatte/
├── voiceopengov/
├── co-branded/
├── white-label/
├── shared/
└── manifest.json
```

Jede exportierte Datei muss im Manifest referenziert werden. Arbeitsdateien, Prompts, Rohdaten, Notizen und vertrauliche Kontaktdaten gehören niemals nach `public`.

## Vorlagenlogik

Eine Vorlage besteht aus:

- Layout-Contract,
- Content-Slots,
- Brand-Slots,
- Pflichtkennzeichnungen,
- Formatregeln,
- Accessibility-Regeln,
- Exportregeln.

Beispiel Onepager-Slots:

```text
brand.logo
brand.displayName
campaign.eyebrow
campaign.headline
campaign.problem
campaign.value
campaign.workflow
campaign.proof
campaign.boundaries
campaign.cta
campaign.contact
legal.disclosure
```

Kein Slot darf unbelegt mit einem Toolnamen oder technischen Platzhalter exportiert werden.

## Co-Branding-Regeln

- Partnerstatus muss real und freigegeben sein.
- Logos stehen nicht als Beleg für inhaltliche Zustimmung.
- Rolle, Zweck und Laufzeit der Zusammenarbeit werden benannt.
- Förderer, Partner, Kunden und redaktionelle Quellen dürfen visuell und sprachlich nicht gleichgesetzt werden.
- Co-Branding erzeugt keine Review-, Ranking-, Fakten- oder Publikationsrechte.
- Bei institutionellen Materialien ist erkennbar, wer Absender, Betreiber und fachlich Verantwortlicher ist.

## White-Label-Regeln

- Ein White-Label-Auftritt darf die technische oder fachliche Herkunft nur dort ausblenden, wo Vertrag, Governance, Transparenz und Recht dies zulassen.
- Quellen-, Datenschutz-, Audit- und Verfahrensinformationen dürfen nicht entfernt werden.
- Produktclaims richten sich nach real freigegebenen Funktionen des jeweiligen Tenants oder Projekts.
- Mandanten- oder kundenspezifische Features dürfen nicht als allgemeine eDebatte-Funktion beworben werden.
- Ein White-Label-Export erhält eine eigene BrandProfile-ID und Versionsnummer.

## Sprachlogik

Jedes Brandprofil definiert eine Default-Sprache, aber kein Asset überschreibt die systemweite Sprachtrennung.

Pro Asset werden geführt:

- Originalsprache,
- Kommunikationssprache,
- Übersetzungsstatus,
- Reviewer,
- Freigabedatum,
- ggf. lokale Rechtsfassung.

## Qualitäts- und Exportcheck

Vor Freigabe:

- korrekte BrandProfile-ID und Version,
- nur freigegebene Logos und Assets,
- keine Toolnamen in Datei, Metadaten oder sichtbarer Copy,
- keine Platzhalter,
- korrekter CTA,
- reale Kontakt- und Rechtsangaben,
- Kontrast- und Lesbarkeitsprüfung,
- Mobile-/Print-Crop geprüft,
- Original-/Übersetzung korrekt gekennzeichnet,
- Quellen- und Governance-Hinweise erhalten,
- Manifest-Eintrag erstellt,
- Vorgängerversion abgelöst oder weiterhin gültig markiert.

## Acceptance Criteria

- dasselbe Kampagnenbriefing kann mit unterschiedlichen freigegebenen Brandprofilen exportiert werden,
- Dateinamen und Metadaten sind anbieterneutral,
- eDebatte, VoiceOpenGov, Co-Branding und White-Label bleiben unterscheidbar,
- Voxy wird nur in erlaubten Modi eingesetzt,
- unveränderliche Produkt-, Quellen-, Review-, Privacy- und Governance-Regeln können nicht durch ein Brandprofil überschrieben werden,
- jeder Export ist über BrandProfile-ID, Kampagne, Asset-Version und Manifest nachvollziehbar.
