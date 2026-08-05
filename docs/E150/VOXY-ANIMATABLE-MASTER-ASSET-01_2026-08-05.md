# VOXY-ANIMATABLE-MASTER-ASSET-01

Stand: 2026-08-05

## Ergebnis

Der bestehende Raster-/Fallback-Fixture erhält einen kanonischen Layer-, Pivot- und Bewegungsvertrag für ein echtes animierbares Voxy-Master. eDebatte und VoiceOpenGov verwenden dieselben Layer-IDs, Proportionen und Bewegungsgrenzen; nur die Theme-Tokens unterscheiden sich.

## Kanonische Ebenen

- Studiohintergrund und Studiobildschirme
- Jarvis-Waveform hinter der Figur
- Tisch, Mikrofon und Schatten
- Körper, Kopf, beide Arme und beide Hände
- beide Augen, Lider und Brauen
- neutrale geschlossene Mundebene ohne Lip-Sync
- Kopfhörer
- VOG-Pin und eDebatte-Pocket-Mark als getrennte Overlays
- eigenständige Logo-Zone

Alle Character-, Anatomy- und Expression-Layer besitzen dokumentierte Pivotpunkte. Beide Hände sind im Vertrag auf exakt fünf Finger festgelegt.

## Themes

- `edebatte`: Blau / Electric Blue
- `vog_member`: Türkis–Electric-Blue-Verlauf

Die Layerstruktur bleibt zwischen beiden Themes identisch.

## Motion-Runtime

`buildVoxyMasterMotionFrame` erzeugt begrenzte, deterministische Transformationen für Kopf, Arme und Lider. Die bestehenden Motion-Zustände können damit unabhängig von einem Mund- oder Viseme-System auf das Master angewendet werden.

## Fail-closed-Gates

- fehlende oder doppelte Pflichtlayer
- nicht unabhängige Layer
- fehlende Pivotpunkte
- vier- oder sechsfingrige Hände
- nichtkanonische Layerpfade
- Waveform vor der Figur
- zusammengeführte Waveform-/Logoebene
- unvollständige 16:9-, 9:16- oder 1:1-Crops
- Lip-Sync oder Viseme-Aktivierung
- fehlendes Human-Approval-Gate

## Grenzen

Dieser Slice liefert den ausführbaren Layer-/Rig-Vertrag und die Motion-Frame-Erzeugung. Die finale visuelle Layer-Illustration bleibt an den 200-%-Checkpoint aus Issue #580 gekoppelt. Es erfolgt kein Deployment, Upload oder Publishing.

## Tests

`apps/web/tests/voxy-animatable-master-asset.contract.test.ts` deckt beide Themes, unabhängige Layer, Pivotpunkte, Bewegungsgrenzen, Fingeranzahl, Waveform-Z-Order, Crops und Human Approval ab.
