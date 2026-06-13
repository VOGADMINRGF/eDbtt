# CREATE-QR-SWIPES-PUBLISH-PREP-07

Stand: 2026-06-04

## Umgesetzt

- `QR-Beteiligung vorbereiten` erzeugt jetzt ein echtes `CreateQrParticipationDraft` im bestehenden Branch-Ledger.
- `Swipe-Aussagen vorbereiten` erzeugt jetzt ein echtes `CreateSwipeDraft` im bestehenden Branch-Ledger.
- Beide Draft-Typen hängen an `packageId + branchId` und werden bei wiederholtem Speichern aktualisiert statt dupliziert.
- QR-Drafts enthalten Titel, Frage, Beschreibung sowie Pro-/Contra-/Folgen-Prompts, aber keine echten Share-/QR-Links.
- Swipe-Drafts enthalten nur branch-sichere Aussagen aus ClaimCandidates desselben Themenasts.
- Profil/Ledger zeigt Draft-Typen und Guardrails sichtbar als Arbeitsstand, ohne Teilen-/Veröffentlichen-CTA.

## Guardrails unverändert

- Keine automatische Veröffentlichung.
- Kein automatisches Teilen.
- Kein automatisches Vote.
- Kein automatisches Mitzählen.
- Kein automatisches Merge.
- Keine Fake-QR-Links.
- `shareUrl`, `qrCodeUrl` und `publishedAt` bleiben `null`.
- `high_risk` und `legal_sensitive` bleiben mindestens `needs_review`.

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/create-existing-match-counting.contract.test.tsx tests/create-qr-swipes-drafts.contract.test.tsx tests/account-organization-dashboard.page.test.tsx`

Ergebnis: grün.

## Bewusst offen

- echtes Publish/Teilen bleibt out of scope
- echte QR-Code-Generierung bleibt out of scope
- echtes Vote/Mitzählen bleibt out of scope
- echtes Merge in bestehende Claims/Themen bleibt out of scope
