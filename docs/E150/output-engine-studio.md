# Output Engine / Studio SSOT (Foundation)

Status: 2026-04-29 foundation baseline (Issues #27, #29, #30)

## Purpose

This document defines the canonical foundation for dossier-bound public outputs in eDebatte.

- Dossier = truth/source/structure core.
- Output Engine = controlled, deterministic transformation layer from dossier -> output package.
- eDebatte Studio = publication and distribution workspace with review and approval gates.
- Distribution outputs = format-specific deliverables generated from one reviewed package.

## Studio Product Framing (B2B)

eDebatte Studio is positioned as a distribution and publication layer for participation professionals:

- target users: Beteiligungsbüros, Moderationsbüros, Planungsbüros, Kommunikationsagenturen, Dialogprofis
- workflow: `Dossier -> Master-Post -> Kanal-Versionen -> Review -> Planung -> Export/Veröffentlichungsvorbereitung`
- purpose: professional communication outputs from participation work (not a moderation replacement)

Guardrails:

- Studio does not replace moderation, process design, or participation offices.
- Dossier remains source of truth for all derived outputs.
- No fake live publishing and no fake connected social channels.
- External channels stay export/copy only until real adapters exist.
- No claim of legal advisory or formal governance replacement.

## Core Principles

1. Every output is dossier-bound and must link back to the dossier.
2. Every output is review-required before publication.
3. Source traces, uncertainties and open questions stay visible.
4. No auto-publish behavior.
5. No external social API dependency in the required path.
6. No founder/personality framing; neutral, verifiable and participation-oriented language.

## OutputPackage Canon

`OutputPackage` is the SSOT transfer object from Output Engine to Studio/Distribution.

Minimum required fields:

- `dossierId`
- `generatedAt`
- `sourceState`
- `sourceTraces`
- `cta`
- `dossierBacklinkTarget`
- `qrCodeTarget`
- `reviewStatus`
- `distributionOutputs`

`published` is never the default review status.

If dossier evidence/options are incomplete, package completeness is marked as `needs_input` and review status as `needs_review`.

## DistributionOutput Canon

A `DistributionOutput` (`DossierOutput`) is a format stub generated from the package. In this foundation slice it is mapper-ready metadata only, not final channel rendering.

Supported formats:

- `web_article`
- `short_briefing`
- `social_carousel`
- `reel_script`
- `voiceover_text`
- `podcast_script`
- `qr_poster`
- `citizen_letter`
- `administrative_note`
- `mandate_summary`

## Voxy Default Debate Template

The default visual and editorial pattern for future eDebatte / VoiceOpenGov / Voxy debate outputs is defined in:

- `docs/E150/voxy-default-debate-template.md`

This template is the canonical default for debate-style social posters, carousels, studio previews and prompt/design briefs unless a dossier explicitly requires a different format.

Default intent:

- Voxy acts as host / debate moderator, not as a decorative mascot.
- Each output starts with one strong public question and one clear thesis.
- The structure combines observed patterns, both-sides obligations and a concrete reform / governance block.
- The visual system defaults to a dark VOG/eDebatte debate-studio look with neon-blue accents, microphone / On-Air cues and strong civic branding.
- Tone is pointed, humorous and systemic, but not personally bitter or accusatory.
- The existing dossier-bound, review-required and no-auto-publish guardrails remain mandatory.

### Voxy Access / Entitlement Readiness

Voxy co-creation is prepared as a staged studio capability, not as a hard paywall on public reading.

- public debate intake may stay open or low-friction
- member scope may stop at light intake / topic submission
- premium author, partner and operator scopes may unlock full co-creation, visual briefing, export preparation or campaign management
- operator review and publish preparation still do not authorize auto-publish
- published public debates remain publicly readable in this slice

Guardrails stay unchanged:

- no auto-publish
- no auto-dossier
- no auto-Anlassraum
- no payment or checkout provider in the required path
- no fake social integration
- author confirmation gate and editorial review gate remain mandatory before productive output release

## Social Carousel Mapper (local slice)

The first concrete format mapper is `Social Carousel` as a deterministic local output.

- Source: `OutputPackage`
- Target: `SocialCarouselOutput` with 5-7 slides
- Slide canon: headline question, anlass, documented state, disputed/open state, options, CTA, optional review note
- Every slide keeps a dossier backlink target
- Review warnings stay visible when sources/options are incomplete
- No auto-publish, no external social APIs, no tracking, no export automation
- Variant metadata is prepared for later export (`square`, `story`, `linkedin`, `print_preview`) without enabling export runtime
- Studio renders a reusable visual card preview (mobile-first, dark/light safe, review-gated)
- Post-ready metadata is deterministic and local only: `suggestedPostText`, `suggestedHashtags`, `suggestedPostingWindows`, `suggestedChannelFit`, `regionalContext`, `participationQuestion`, `motifHint`
- Publication guardrails stay explicit: `publicationStatus=draft_review_required`, `canAutoPublish=false`, `automationHint` documents policy boundary

## Social Distribution Studio (local prototype)

The Studio now includes a local distribution planning surface for social outputs.

- Post preview remains review-gated and dossier-bound.
- Distribution planning is deterministic and local via `SocialDistributionPlan`.
- Channel targets cover `instagram`, `facebook`, `linkedin`, `tiktok`, `youtube_shorts`, `x_twitter`, `mastodon`, `bluesky`, `whatsapp_channel`, `telegram`, `website_embed`.
- Scheduling options are prepared (`manual`, `suggested_window`, `scheduled_at`, `immediate_after_review`) without live publishing.
- Policy gate is explicit via `getSocialPublishingPolicy()`:
  - `externalApisEnabled=false`
  - `autoPublishEnabled=false`
  - `canRealtimePublish=false`
  - `requiresManualReview=true`
- Connector/OAuth integration is intentionally deferred; this slice only provides contracts/UI/policy readiness.
- UX-Fokus ist als Publishing-Cockpit ausgerichtet:
  - Master-Post-first statt Format-first
  - Kanalorientierte Planung (Auswahl, Verbindungen, Modus, Verteilplan)
  - `Dossier-Qualität & Hinweise` als kollabierter Detailbereich statt technischer Startansicht

## Master-Post-First Workflow (local hardening)

Aktueller Studio-Flow ist lokal auf ein produktnahes Arbeitsmodell gehärtet:

1. Dossier-Kontext
2. Fertiger Beitrag / Dossier-Post (primäres Objekt)
3. Hauptaktionen (`Bearbeiten`, `Kopieren`, `Als Entwurf speichern`, `Review anfordern`, `Zeitpunkt planen`, `Veröffentlichung vorbereiten`)
4. Kanäle auswählen
5. Kanalverbindungen
6. Veröffentlichungsmodus
7. Empfohlener Verteilplan
8. Kanal-Versionen (sekundär, aus dem Master-Post abgeleitet)
9. Dossier-Qualität & Hinweise (kollabiert)

### Guardrails

- Kein Auto-Publish.
- Keine Fake-Live-Veröffentlichung auf externen Kanälen.
- Externe Kanäle ohne Adapter sind explizit als `Kanal nicht verbunden` / `Konfiguration erforderlich` / `Nur Export/Kopieren möglich` markiert.
- Dossier bleibt Source of Truth, Studio bleibt review-gebundener Veröffentlichungsraum.

### Interaktionsstatus (lokal)

- Teile der Aktionen sind bewusst lokal umgesetzt (Component State / localStorage), um produktive UX-Flows vorzubereiten ohne externe API-Integrationen.
- Interne Veröffentlichungsvorbereitung bleibt review-gebunden; externer Live-Publish ist weiterhin nicht implementiert.

## Master Post Contract (local slice)

Der Studio-Flow besitzt nun einen zentralen `MasterPost` als verbindliches Vorveröffentlichungsobjekt.

- Erzeugung aus `OutputPackage` ohne AI-Call (`generateMasterPost(...)`).
- Pflichtfelder: `backlinkTarget`, `participationQuestion`, `sourceState`, `reviewStatus`, `publicationStatus`.
- Standard-Guardrails bleiben hart:
  - `canAutoPublish=false`
  - `canRealtimePublish=false`
  - `externalApisUsed=false`
  - `publicationStatus=draft_review_required`
- Copy bleibt neutral-civic, anlassbezogen und ohne Gründer-/Persönlichkeitsframing.
- Offene Fragen/Quellenwarnungen werden als `reviewGuardrails` sichtbar weitergetragen.

## Social Distribution Contract (local slice)

`buildSocialDistributionPlan(masterPost, carouselOutput, options?)` bildet den manuellen Verteilpfad ohne Live-APIs:

- Vollständige Kanalliste:
  - `website_embed`, `instagram`, `facebook`, `linkedin`, `tiktok`, `youtube_shorts`, `x_twitter`, `mastodon`, `bluesky`, `whatsapp_channel`, `telegram`, `newsletter`, `qr_print`
- Connector-Status transparent und ehrlich:
  - `internal_available`, `not_connected`, `configured`, `disabled_by_policy`, `requires_review`, `available_later`
- Planungsmodi:
  - `manual`, `suggested_window`, `scheduled_at`, `immediate_after_review`
- Policy bleibt restriktiv:
  - `externalApisEnabled=false`
  - `autoPublishEnabled=false`
  - `canRealtimePublish=false`
  - `requiresManualReview=true`

## Distribution Export Helpers (local slice)

Manuelle Export-/Handoff-Flows sind contract-first und ohne externe APIs umgesetzt:

- `buildCopyText(...)`
- `buildDraftRecord(...)`
- `buildDistributionPlan(...)`
- `buildQrPrintPreview(...)`
- `validateDistributionExport(...)`

Guardrails:

- Kein externer Publish-Call.
- `Kanal nicht verbunden` blockiert nicht Entwurf/Kopieren/Export.
- QR/Print bleibt an Pflichtfelder gebunden (`cta`, `dossierBacklink`, `qrTarget`), sonst `review_required`.
- Print-/QR-Vorschau zeigt Review- und Quellenstatus sichtbar.

## Admin / Queue / Review Routing (local slice)

Studio enthält einen lokalen operativen Block für:

- Connector-Status pro Kanal verwalten
- Queue-Einträge bearbeiten/stornieren
- Review-Checkpoints markieren
- Realtime-Vorbereitung nur explizit und reversibel

Dabei gilt weiterhin:

- kein offizielles Social-Autoposting
- kein externer Live-Publish
- nur interne Planung/Vorbereitung und Export-Handoff

## Internal Studio Telemetry Stub (local slice)

Ohne externe Tracker ist eine interne, austauschbare Event-Schnittstelle vorhanden:

- `master_post_generated`
- `copied`
- `draft_saved`
- `plan_adopted`
- `connector_missing`
- `review_prepared`

Implementiert als lokaler Adapter (`features/outputEngine/studioTelemetry.ts`) für spätere Infrastruktur-Anbindung, ohne zusätzliche externe Telemetrie-Abhängigkeit.

## No Fake Publish Boundary

- Kein externer Publish-Call und kein OAuth-Connect-Bypass.
- Publish-nahe UI bleibt als Vorbereitung kenntlich (deaktivierte Publish-Aktion).
- Studio bleibt ein Review-/Planungs-Workspace, kein Live-Distribution-Service.

## Future Connector/OAuth Work (deferred)

Spätere Slices können echte Connector-Pfade ergänzen, aber nur mit:

- expliziter Adapter-Verfügbarkeit pro Kanal
- separaten Secret-/Credential-Flows
- auditierbarer Review-/Freigabelogik
- klarer Trennung zwischen internem Entwurf und externer Veröffentlichung

## Chat Backlog Anchor (Issue #74)

Unresolved follow-up ideas from the Studio/Dossier chat are tracked in the SSOT task queue under:

- `PR-CHAT-BACKLOG-01` (collector)
- `PR-OUT-STUDIO-CHANNELS-01`
- `PR-DOSSIER-EVIDENCE-FIRST-01`
- `PR-DOSSIER-NUMBERS-AUDIT-01`
- `PR-DOSSIER-PARTICIPATION-AUDIT-01`
- `PR-DEMO-MASTER-DOSSIER-02`
- `PR-OUT-POST-GENERATOR-01`
- `PR-OUT-EXPORT-01`
- `PR-OUT-TELEMETRY-01`
- `PR-BETEILIGUNGSRADAR-00` (scope/docs only, no implementation)
