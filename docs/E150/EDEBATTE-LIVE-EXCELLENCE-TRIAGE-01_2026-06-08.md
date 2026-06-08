# EDEBATTE-LIVE-EXCELLENCE-TRIAGE-01

Datum: 2026-06-08

## Geprüfte Quellen

- `docs/E150/OpenTasks.md`
- PR #222 `docs: capture eDebatte Live excellence backlog`
- PR-Diff von PR #222, weil `docs/E150/OpenTasks_EDEBATTE_LIVE_EXCELLENCE_2026-06-07.md` im lokalen Checkout nicht vorhanden ist
- bereits isoliert und committed:
  - `be9d2702` `fix(runden): restore guided manual round entry`
  - `21b7a51f` `fix(ai): enforce truth guard across analyze surfaces`
  - `4a7e7cc7` `fix(factcheck): gate and run confirmed source checks`
  - `6ae14d43` `fix(graph): gate reviewed graph merge candidates`
  - `eb14ef4d` `fix(review): add guarded editorial review workflow`
  - `8ee787d5` `fix(start): preserve draft context across create surfaces`
  - `3d734b63` `test(e2e): validate closed process guardrails`

## Clusterung der Backlog-Ideen aus PR #222

### Operativ anschlussfähig

- QR / Print / Kampagnen-Entry
- Host Cockpit / Moderationssicht
- Trust Labels auf Live-/Campaign-/Embed-Flächen
- Report-Handoff nach Event/Kampagne
- schmaler Embed-/Media-Kit-Starter

### Backlog-Ideen, aber noch nicht operativ gezogen

- TV / Second Screen / HbbTV
- YouTube- und Social-Connectoren als echte Kanalintegration
- Newsletter-Automation
- Enterprise-/Datenhoheits-/Kostensteuerungs-Pakete
- Voxy Live Guide als eigene Führungsoberfläche
- AI-Gruppierung / Minority Radar / Prioritäts- und Confidence-Sonderpfade

### Entscheidungs- oder Schnittbedarf

- Session-Modell als eigene Produktsemantik
- Live-Namenswelt als neue kanonische Surface
- Externe Kanalrechte, Token-Handling und Retry-/Audit-Modell
- dedizierte Cost-Gates für Live-KI statt Nutzung bestehender Review-/Factcheck-/Truth-Guard-Gates

## Priorisierte Top-Slices

Empfohlene operative Reihenfolge:

1. `LIVE-CAMPAIGN-QR-ENTRY-01`
2. `LIVE-TRUST-LABELS-03`
3. `LIVE-HOST-COCKPIT-02`
4. `LIVE-REPORT-HANDOFF-04`
5. `LIVE-EMBED-MEDIA-KIT-05`

Begründung:

- `LIVE-CAMPAIGN-QR-ENTRY-01` hat den höchsten Live-/Pilotwert und kann direkt auf vorhandene Campaign-, QR-, Join- und Draft-Handoff-Pfade aufsetzen.
- `LIVE-TRUST-LABELS-03` ist der kleinste, risikoärmste Reuse-Slice und sichert alle späteren Live-Flächen gegen irreführende Wahrheits- oder Verifikationskommunikation ab.
- `LIVE-HOST-COCKPIT-02` wird erst sinnvoll, wenn ein kampagnenfähiger Entry vorhanden ist und dieselben Trust-/Review-Signale sichtbar machen kann.
- `LIVE-REPORT-HANDOFF-04` ist ein guter Folge-Slice, sobald Live-Einstieg und Trust-Status stabil ankommen.
- `LIVE-EMBED-MEDIA-KIT-05` bleibt absichtlich am Ende, weil Embeds/Media-Kit zwar MVP-nah sind, aber Social-, Newsletter- und TV-Ideen leicht zu groß werden; deshalb wurde der Scope bewusst schmal gehalten und noch nicht auf `codex_ready` gesetzt.

## Bewusst nicht operationalisiert

- keine vollständige Übernahme der PR-#222-Liste in `OpenTasks.md`
- keine TV-/HbbTV-/Second-Screen-Umsetzung
- keine YouTube-/Social-Live-Connectoren
- keine Newsletter- oder Media-Automation
- keine neuen Live-spezifischen Produktpfade außerhalb der bestehenden Campaign-/QR-/Draft-/Review-Kette
- keine Aufweichung der Guardrails `noAutoPublish`, `noAutoVote`, `noAutoGraph`, `noAutoDossier`, `noAutoAnlassraum`

## OpenTasks-Korrekturen

Aktualisiert in `docs/E150/OpenTasks.md`:

- `EDEBATTE-LIVE-EXCELLENCE-TRIAGE-01` von `codex_ready` auf `done`
- neu aufgenommen:
  - `LIVE-CAMPAIGN-QR-ENTRY-01` als `codex_ready`
  - `LIVE-HOST-COCKPIT-02` als `codex_ready`
  - `LIVE-TRUST-LABELS-03` als `codex_ready`
  - `LIVE-REPORT-HANDOFF-04` als `codex_ready`
  - `LIVE-EMBED-MEDIA-KIT-05` als `open`

## Guardrails

- Draft-first, review-first
- kein Vote ohne explizite Runde
- kein Auto-Publish
- kein Auto-Graph
- kein Auto-Dossier
- keine KI-Wahrheit
- keine Verifikation ohne echten `sealed_verified`-Pfad
- keine neue Parallel-Produktwelt neben Campaign-/QR-/Start-/Themen-/Review-/Report-Kern

## Nächster empfohlener Task

`LIVE-CAMPAIGN-QR-ENTRY-01`

Der Task ist nach dieser Triage operativ vorbereitet und kann als nächster `codex_ready`-Slice gestartet werden.
