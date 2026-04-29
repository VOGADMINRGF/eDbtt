# Output Engine / Studio SSOT (Foundation)

Status: 2026-04-29 foundation baseline (Issues #27, #29, #30)

## Purpose

This document defines the canonical foundation for dossier-bound public outputs in eDebatte.

- Dossier = truth/source/structure core.
- Output Engine = controlled, deterministic transformation layer from dossier -> output package.
- eDebatte Studio = review and preview workspace for output editing and approval.
- Distribution outputs = format-specific deliverables generated from one reviewed package.

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

## Review Model

Allowed review states:

- `draft`
- `needs_review`
- `approved`
- `rejected`
- `published`
- `archived`

Foundation behavior:

- default = `draft` when dossier has required source/options
- fallback = `needs_review` when required input is missing
- never auto-transition to `published`

## Scope Boundary for Foundation PR

Included:

- SSOT docs
- contracts/types/schemas
- deterministic `generateOutputPackage(...)`
- demo dossier fixture -> valid output package
- tests

Excluded:

- full Studio UI
- Social Carousel renderer implementation
- external social integrations
- auto-publication
- mandatory external AI-provider execution path

## Output Engine Program Slices (#27-#36)

1. `PR-OUT-ENGINE-01` Foundation SSOT + contracts baseline (Issue #27)
2. `PR-OUT-ENGINE-02` Deterministic generator + review markers (Issue #29)
3. `PR-OUT-ENGINE-03` Demo dossier + validation tests (Issue #30)
4. `PR-OUT-ENGINE-04` Studio review workspace shell
5. `PR-OUT-ENGINE-05` Format mapper layer (article/briefing/letter/note)
6. `PR-OUT-ENGINE-06` Social carousel mapper + visual templates
7. `PR-OUT-ENGINE-07` Voiceover/podcast/reel scripting mapper
8. `PR-OUT-ENGINE-08` QR/print package composition and print contracts
9. `PR-OUT-ENGINE-09` Distribution handoff pipeline (manual release only)

The foundation implemented in this slice covers only slices 01-03.
