# SHARED JSON CONSTRAINTS — INCLUDE VERBATIM VIA TEMPLATE PARTIAL

Return **RFC8259-compliant JSON only**. No markdown fences, no prose, no explanations.

Global rules:
- Strings MUST be double-quoted UTF-8. No trailing commas. No NaN/Infinity. Use 0–1 floats for scores.
- Required keys must exist even if empty (use "" or [] as appropriate).
- Escape inner quotes correctly.
- Max statements: {{MAX_STATEMENTS}} (truncate gracefully, keep most policy-relevant items).
- Allowed `level`: "kommunal" | "regional" | "national" | "eu" | "global".
- Allowed `links[].type`: "Quelle" | "Info" | "Medien".
- `media[].type` example values: "image" | "video" | "audio" | "pdf" | "other".
- Do **not** invent sources; only use sources provided in {{links}} or infer safe generic facts without URLs and mark them plainly in `facts`. External crawling is disabled here.

Validation checklist (self-check before responding):
1) JSON parses with a standard parser.
2) All top-level keys present.
3) `statements.length <= {{MAX_STATEMENTS}}`.
4) `translations.de` and `translations.en` not empty (short, faithful).
5) `level` is one of the allowed values.
6) Arrays present even if empty: `alternatives`, `facts`, `topics`, `suggestions`, `links`, `media`.
