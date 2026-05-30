# UX-VOXY-MOTION-GUIDE-01

Datum: 2026-05-29
Status: done

## Erwartete Assets

- Manifest: `apps/web/public/brand/voxy/manifest.json`
- Charaktervarianten:
  - `voxy-neutral`
  - `voxy-thinking`
  - `voxy-check`
  - `voxy-hint`
  - `voxy-welcome`
  - `voxy-presenting`
  - `voxy-mini-avatar`
  - `voxy-podcast-stage`
- Overlays:
  - `apps/web/public/brand/voxy/overlays/vog-pin.svg`
  - `apps/web/public/brand/voxy/overlays/edebatte-gradient.svg`
  - `apps/web/public/brand/voxy/overlays/voxy-wordmark.svg`

Aktueller Stand:
- Alle im Manifest erwarteten Dateien sind vorhanden.
- Der VOG-Pin bleibt aus Betrachterperspektive rechts dokumentiert.
- Falls eDebatte als Asset erscheint, soll das saubere SVG-Overlay genutzt werden statt eingebrannter Rastertypografie.

## Gebaute Komponenten und Grundlage

- Asset- und Copy-SSOT:
  - `apps/web/src/features/voxy/voxyAssets.ts`
  - `apps/web/src/features/voxy/voxyCopy.ts`
- Guide-Komponenten:
  - `apps/web/src/components/voxy/VoxyGuide.tsx`
  - `apps/web/src/components/voxy/VoxyBubble.tsx`
  - `apps/web/src/components/voxy/VoxyInlineHint.tsx`
- Motion-Bausteine:
  - `apps/web/src/components/motion/MotionReveal.tsx`
  - `apps/web/src/components/motion/MotionStep.tsx`
  - `apps/web/src/components/motion/MotionPresencePanel.tsx`
  - `apps/web/src/components/motion/motionVariants.ts`

Implementierungsnotizen:
- Varianten fallen bei unbekanntem oder ungueltigem Wert auf `neutral` zurueck.
- Bildquellen werden als Kandidatenkette `webp -> png -> neutral.webp -> neutral.png` gehalten.
- Bildcontainer nutzen feste Aspect-Ratio-Rahmen, damit keine Layout-Shifts entstehen.
- Motion bleibt bei ca. 160-260 ms und faellt bei `prefers-reduced-motion` auf statisches Rendering zurueck.

## Wo Voxy eingesetzt werden darf

- Als seriöser Guide fuer Orientierung, Guardrails und naechste Schritte.
- In kleinen, kompakten Hilfsflaechen wie `/runden`-Schnellstart, Inline-Hinweisen oder spaeteren Review-/Dossier-Hilfen.
- `podcastStage` nur fuer explizite Hero-/Stage-Flaechen, nicht als Standardfigur.

Nicht vorgesehen:
- Keine dekorative Vollflaechen-Nutzung ohne Funktion.
- Keine Nutzung als alleinige Vermittlung von Status oder Information.
- Keine harte Abhaengigkeit von einzelnen Asset-Dateien im Renderpfad.

## Guardrails

- Kein Auto-Publish.
- KI bleibt optional.
- Voxy ist Guide, nicht Entscheidungsersatz.
- Animation ist nie die einzige Informationsquelle.
- Fehlende Varianten oder fehlgeschlagene Bildquellen brechen die App nicht, sondern fallen kontrolliert zurueck.

## Sichtbarer Einsatz

- `/runden` zeigt im Schnellstartbereich einen kleinen `VoxyGuide` mit:
  - "Du entscheidest zuerst den Rahmen. KI und Prüfung kommen nur dazu, wenn du sie auswählst."

## Tests

Befehle:

```bash
pnpm -C apps/web exec vitest run tests/voxy-guide.render.test.tsx tests/voxy-copy.contract.test.ts tests/motion-foundation.render.test.tsx tests/runden-page.acceptance.test.ts
pnpm -C apps/web typecheck
```

Ergebnisnotiz:
- Beide Befehle erfolgreich am 2026-05-29 lokal ausgefuehrt.
- `vitest`: 4 Dateien, 16 Tests, alle gruen.
- `typecheck`: erfolgreich ohne Typfehler.
