# V3 Voxy Runtime Path Choice

Datum: 2026-07-12
Task: `V3-VOXY-RUNTIME-PATH-CHOICE-02`
Status: done
Review class: Orange / decision closure

## Entscheidung

Die Produktentscheidung fuer `V3-VOXY-RUNTIME-PATH-CHOICE-02` ist getroffen:

- `selected_path = hybrid_external_render_adapter`
- `recommended_next_task = V3-VOXY-HYBRID-RUNTIME-FOUNDATION-03`

## Beschlossener Zielmodus

eDebatte bleibt Eigentuemer von:

- Script
- Review
- Approval
- Gates
- Asset-Pack
- Cost-/Credit-Policy
- Queue-Vertrag
- Storage-/Upload-/Scheduling-/Observability-/Cutover-Gates
- Distribution-Handoff

Ein externer Render-Adapter darf spaeter fuer eine erste Preview-Runtime
vorbereitet werden, aber nur:

- adapter-basiert
- austauschbar
- review-first
- ohne Auto-Publish

## Verbindliche Grenzen

Dieser Decision-Choice-Slice aktiviert weiterhin nichts:

- keine Runtime
- keine Secrets lesen
- keine Provider-Credentials eintragen
- keine Kosten ausloesen
- kein Render
- kein Upload
- kein Scheduling
- kein Publish
- kein Social Posting
- keine Feature-Flags aktivieren

## Wirkung auf den Folgepfad

`V3-VOXY-HYBRID-RUNTIME-FOUNDATION-03` darf nach dieser Entscheidung von
`blocked` auf `codex_ready` wechseln.

Dabei bleiben folgende Guardrails bindend:

- kein Provider-Secret-Read
- keine echte Runtime-Aktivierung
- keine Render-Ausfuehrung
- kein Upload
- kein Scheduling
- kein Publish
- kein Social Posting
- keine Kostenbuchung

## Bewusst weiter offen

- konkrete Providerwahl
- Provider-DPA / Residency / Credentialing
- spaetere Preview-Render-Klasse innerhalb des Hybrid-Pfads
- jeder echte Runtime-Cutover ueber die bestehende Noop-/Gate-Wahrheit hinaus

## Naechster Task

- `V3-VOXY-HYBRID-RUNTIME-FOUNDATION-03`
