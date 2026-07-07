# V3 Voxy Video Briefing Flow

Stand: 2026-07-07
Status: `docs_only`
Mastertask: GitHub Issue `#310` (`V3: Voxy Video Briefing Flow vollständig umsetzen`)

## Zweck

Diese Doku kanonisiert den V3-Zielpfad fuer Voxy-Video-Briefings, ohne eine
Video-Runtime, einen Provider oder ein Publishing-System als bereits gebaut zu
behaupten.

Sie haelt fest:

- eDebatte besitzt Workflow, Datenmodell, Review, Branding, Quellenlogik und
  Publishing-Queue.
- Externe Tools bleiben austauschbare Adapter und nicht Produktkern.
- Auto-Prepare ist erlaubt.
- Auto-Publish ist nicht erlaubt.
- `publish_ready` ist nicht `published`.
- One-click Publish oder Activate ist erst nach passendem Review oder Approval
  zulaessig.
- Voxy ist Mascot und Einordner, nicht echte Person, nicht Amt und nicht
  Wahrheitsrichter.

## Zielbild

```text
Diskussion / Dossier / Mitmachraum / Claim-Kontext
-> Voxy-Einordnung und Sprachbruecke
-> Zusammenfassung, These, Gegenposition, offene Fragen
-> Evidence-/Source-Pack
-> Voxy-Briefing
-> Script-Entwurf
-> Review
-> Render-Vorbereitung
-> Publishing-Draft
-> oeffentliche Aktivierung erst nach Review/Approval
```

Der Flow ist review-first. Er erzeugt Vorbereitung, Vorschau und
Publish-Readiness, aber keine automatische oeffentliche Sichtbarkeit.

## Produktbesitz

eDebatte besitzt im Zielzustand:

- den fachlichen Workflow
- das Statusmodell
- die Review- und Approval-Gates
- die Brand- und Template-Regeln
- die Quellen- und Transparenzlogik
- die Audit- und Publishing-Queue-Lesart

Externe Tools duerfen hoechstens folgende Adapterrollen einnehmen:

- `LLMProvider`
- `VoiceProvider`
- `AvatarProvider`
- `RenderProvider`
- `PublishProvider`

Diese Adapter sind austauschbar. Kein V3-Slice darf einen bestimmten
Provider als Produktkern fest verdrahten.

## Kanonische Inputs

Der Voxy-Flow startet nicht als eigene Parallelwelt, sondern aus bestehenden
review-first Kontexten:

- Diskussionen und Contribution-Kontexte
- Dossiers und Dossier-Updates
- Mitmachraeume und Beteiligungsformate
- Claims, Gegenpositionen und offene Fragen
- Evidence-/Source-Packs
- Sprachbruecken- und Trust-Hinweise

Damit bleibt Voxy Anschluss an denselben fachlichen Kern und denselben
Review-Pfaden schuldig.

## Guardrails

Verbindlich fuer diesen Flow:

- Auto-Prepare: ja
- Auto-Publish: nein
- Auto-Rendering: nein ohne Freigabe
- Auto-Distribution: nein
- Auto-Social-Posting: nein
- `publish_ready`: Vorbereitungszustand, nicht oeffentliche Sichtbarkeit
- `published`: erst nach passendem Review/Approval und echtem Publish-Schritt
- `active_or_published`: erst nach echtem Runtime- oder Publish-Vollzug

Review bleibt rollen- und objektbezogen. Ein Video-Briefing, Script, Renderjob
oder Publishing-Draft darf nicht allein durch Existenz, Sprache, Quellenvolumen
oder Provider-Antwort in einen oeffentlichen Zustand wechseln.

## Sprachbruecke und Quellenlage

Der Voxy-Flow nutzt dieselben V3-Grundsaetze wie der restliche
Canonical-Language-Bridge-Scope:

- Originalsprache bleibt erhalten.
- Uebersetzung ersetzt das Original nicht.
- Zusammenfassung ersetzt keine Quelle.
- Unsicherheit bleibt sichtbar.
- Quellenlage, offene Fragen und Kontextluecken werden als Hinweise transportiert.
- Mehrsprachigkeit dient Verstaendigung, nicht stiller Normalisierung.

Ein spaeteres Video-Briefing darf deshalb nur auf typed Sprach-, Trust- und
Evidence-Contracts aufbauen.

## Review-First Handoffs

Der kanonische Handoff bleibt mehrstufig:

1. Input wird eingeordnet.
2. Briefing und Script werden vorbereitet.
3. Quellenlage und offene Punkte werden sichtbar gemacht.
4. Review oder Approval entscheidet ueber Freigabe.
5. Erst danach darf Rendering oder Publishing vorbereitet werden.

Zulaessige Folgeobjekte sind:

- `briefing_ready`
- `script_ready`
- `needs_review`
- `publish_ready`
- `render_queued`
- `publishing_draft`

Nicht behauptet in diesem Slice:

- echte Render-Jobs
- echte TTS- oder Avatar-Ausfuehrung
- echte externe Publishing-Connectoren
- automatische Aktivierung

## Non-Goals dieses Slices

Bewusst nicht Teil dieser Doku- und Contract-Phase:

- kein Video-Rendering
- keine Provider-Integration
- keine Voice- oder Avatar-Implementierung
- kein Auto-Publish
- keine Social-API-Anbindung
- keine neue Persistenzbehauptung
- keine neue Produktparallelwelt neben Dossier, Mitmachraum und Review Queue

## Evidenz

- `docs/E150/V3_CANONICAL_LANGUAGE_BRIDGE_RUNTIME_BACKLOG_2026-07-06.md`
- GitHub Issue `#310`
- `apps/web/src/features/create/canonicalPreparationStatusContract.ts`
- `apps/web/src/features/create/languageBridgeTrustFormatContract.ts`
- `apps/web/src/features/create/canonicalSourcePackContract.ts`

## Naechste sichere Slices

- review-spezifischer Approval-/Rollen-Contract
- user-contribution lifecycle contract
- persistierter downstream handoff contract
- dossier workspace / unified review queue / multilingual thread contracts
- spaeter optional `apps/web/src/features/voxyVideo/` mit reinen Types und
  Tests, aber weiter ohne Provider- oder Render-Runtime
