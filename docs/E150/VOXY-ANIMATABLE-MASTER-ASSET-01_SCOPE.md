# VOXY-ANIMATABLE-MASTER-ASSET-01 — Scope

Stand: 2026-08-11

## Ziel

Die akzeptierte Voxy-Identität gegen technische Eigenfreigabe absichern und den Übergang zu einem später menschlich ausgewählten Motion-/Retargeting-Verfahren provider-neutral vorbereiten.

## In Scope

- kanonische visuelle Quelle unverändert auf `apps/web/public/brand/voxy/voxy-podcast-stage.png` festschreiben;
- provider-neutralen Preflight-Contract für Providerwahl, Account/Credentials, externen Datentransfer, Privacy/Retention und Budget definieren;
- alle Provideraufrufe fail-closed halten, solange eines dieser Human Gates fehlt;
- Publishing eines erzeugten Artefakts zusätzlich an explizite Human Visual Acceptance binden;
- fokussierte Contract-Tests für diese Sperren.

## Explizit verworfen / aus dem Scope entfernt

- weitere lokale SVG-Rig-Verfeinerung;
- weitere Masken-, Crop- oder CSS-Affine-Animation der kanonischen Rasterquelle;
- lokale Segmentierungs-Hacks zur Erzeugung scheinbar unabhängiger Anatomie;
- die bisherigen Rig-Layer und lokalen Render-Evidence-Skripte als mergefähiger Produktionsweg.

## Out of Scope / Human Gates

- konkrete Providerwahl oder -aktivierung;
- Accountanlage und Credentials;
- Upload oder sonstiger externer Datentransfer;
- Zustimmung zu Retention-, Privacy- oder Löschbedingungen;
- Budget-/Spend-Freigabe;
- finale visuelle Abnahme eines generierten/retargeteten Voxy-Artefakts;
- Runtime-, Studio-, Publishing- oder Production-VOTES-Connectivity.

## Guardrail

Der Contract ist Architektur, keine aktive Providerintegration. Fehlt eine menschliche Freigabe, bleibt der jeweilige Schritt gesperrt. `#588` darf erst nach belastbarer Human Visual Acceptance der kanonischen animierbaren Identität fortgesetzt werden.
