# ALPHA2-MARKETING-SOCIAL-EXECUTOR-02

Stand: 2026-08-24
Status: `implementation / in_progress`

## Ziel

Marketing-Content aus eDebatte, VoiceOpenGov und Vote4Gov soll über die bestehende Social-Distribution-Runtime persistent in denselben review-first Queue-Pfad übergeben werden können. Keine zweite Queue, kein Auto-Publish.

## Reihenfolge

1. Multibrand-Basis und CI von PR #641 konsistent halten.
2. Bestehenden Social-Source-Contract um einen ehrlichen Marketing-Kontext erweitern.
3. Brand-/CTA-sichere `distribution_prepare`-Records über `createOrReplaceDraft` persistieren.
4. Review, Scheduler und Audit der bestehenden Runtime wiederverwenden.

## Guardrails

- Marketingkampagnen werden nicht als Dossier, Topic, Round oder Claim ausgegeben.
- VoiceOpenGov und Vote4Gov dürfen nicht auf eDebatte-Branding zurückfallen.
- externe Veröffentlichung bleibt approval-pflichtig;
- keine Synthetic-Support-/Astroturfing-Logik;
- kein sensibles politisches Microtargeting;
- TikTok/Facebook/YouTube bleiben bis zu echten Connector-Contracts explizit unsupported.
