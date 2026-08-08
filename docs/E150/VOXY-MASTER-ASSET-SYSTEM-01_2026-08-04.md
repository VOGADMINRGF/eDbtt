# VOXY-MASTER-ASSET-SYSTEM-01

Stand: 2026-08-04  
Status: `review`  
PR: #558  
Bezug: Issue #310, #569

## Entscheidung

Neue Voxy-Produktionen verwenden ausschließlich den kanonischen Pfad:

`apps/web/public/brands/voxy/`

Der ältere Pfad `apps/web/public/brand/voxy/` bleibt vorerst nur als
Kompatibilitätsschicht bestehen. Ältere Rastervarianten dürfen nicht neu für
Marketing aktiviert werden, solange Anatomie, Markenkennzeichen und
Nutzungsherkunft nicht einzeln geprüft wurden.

## Verbindlicher visueller Vertrag

- exakt fünf Finger an jeder sichtbaren Hand
- Aufstecker: `VOG`
- äußeres Brusttaschen-/Einstecktuch-Detail: `eDebatte`
- Grundfläche: tiefes Navy
- Primärakzent: Türkis nach Electric Blue
- genau eine kanonische Jarvis-artige Frequenz-/Sprechwelle
- Wellenform liegt hinter Voxy und niemals über der Logo-Zone
- keine dynamischen Texte in Charakterbilder einbrennen
- keine Lip-Sync-, Viseme- oder HeyGen-Abhängigkeit
- keine automatische Veröffentlichung

## Asset-Hierarchie

### Resolution-independent Master

- `characters/voxy-sitting-master.svg`
- `characters/voxy-standing-master.svg`
- `characters/voxy-gesturing-master.svg`
- `studio/voxy-studio-background-16x9.svg`
- `studio/voxy-studio-background-9x16.svg`
- `studio/voxy-studio-background-1x1.svg`

### Editierbare Video-/Website-Templates

- `templates/voxy-broadcast-template-16x9.svg`
- `templates/voxy-broadcast-template-9x16.svg`
- `templates/voxy-broadcast-template-1x1.svg`

Die Templates definieren feste, wiederverwendbare Zonen für On-Air-Status,
Thema/Datum, Quellenupdate, Gegenposition, offene Frage, Lower Third und
Untertitel. Text bleibt im späteren Admin-Studio editierbar.

### Unmittelbar nutzbare Marketing-Master

- `marketing/voxy-studio-marketing-master-16x9.svg`
- `marketing/voxy-studio-marketing-master-9x16.svg`
- `marketing/voxy-studio-marketing-master-1x1.svg`

Diese Wrapper verwenden den bislang stärksten freigegebenen Studio-Render,
setzen Logo und Farbführung als scharfe Vektorebenen neu und verdecken den
anatomisch nicht verlässlich geprüften Handbereich mit der editierbaren
Lower-Third-Zone. Damit wird die bekannte ungleichmäßige Fingerzahl nicht in
neue Marketingausgaben übernommen.

## Qualitätsprofile

| Profil | 16:9 | 9:16 | 1:1 | FPS |
| --- | --- | --- | --- | --- |
| Review | 1280×720 | 720×1280 | 1080×1080 | 24 |
| Production | 3840×2160 | 2160×3840 | 2160×2160 | 30 |
| Marketing 8K | 7680×4320 | 4320×7680 | 4320×4320 | 30 |

SVG bleibt Source of Truth. PNG, WebP und AVIF werden deterministisch daraus
erzeugt; manuelles Hochskalieren ist nicht zulässig.

## Code-Anschluss

- `apps/web/src/features/voxy/voxyMasterAssets.ts`
- `apps/web/scripts/export-voxy-master-assets.ts`
- Fixture v2 trennt Studio- und Character-Layer
- alle Fixture-Pfade zeigen auf `/brands/voxy/`
- zweite, über das Logo laufende Wellenform wurde entfernt
- lange Kartenüberschriften werden innerhalb ihrer Zone umgebrochen

## Abnahmegrenze

Die neue SVG-Figur behebt die Fingerzahl technisch und ist ein sauber
strukturierter, skalierbarer Master. Sie ist noch kein abschließend
kunst-/markenseitig freigegebener Premium-Character-Rig. Vor einer stillen
Ablösung des etablierten Looks bleiben erforderlich:

1. menschliche Sichtprüfung bei 200 % Zoom,
2. Bestätigung der finalen Proportionen und Gesichtswirkung,
3. dokumentierte Herkunft und Nutzungsrechte,
4. Pivot-/Layer-Abnahme für Kopf, Augen, Arme und Hände,
5. Test in Website, 16:9, 9:16 und 1:1.

Bis dahin sind die Marketing-Master mit geschützter Handzone der bevorzugte
kurzfristige Produktionspfad.

## Nachfolgende Umsetzung

1. `VOXY-VOICE-AND-CAPTION-FIXTURE-01` (#567)
2. `VOXY-LOCAL-COMPOSITION-RUNTIME-01` (#568)
3. `VOXY-ADMIN-VIDEO-STUDIO-01` für manuelle Vorschau und begrenzte Korrektur
4. finale Premium-Rig-Abnahme in `VOXY-ANIMATABLE-MASTER-ASSET-01` (#569)

Kein Asset oder Render wird ohne menschliche Review automatisch veröffentlicht.
