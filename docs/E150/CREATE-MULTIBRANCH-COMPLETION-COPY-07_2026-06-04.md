# CREATE-MULTIBRANCH-COMPLETION-COPY-07

Stand: 2026-06-04

## Umgesetzt

- Die Abschlussführung nach vollständig gewählten Branch-Aktionen erscheint jetzt als zentriertes, dismissbares Modal statt nur als Inline-Box.
- Sichtbares `GPT`-Wording wurde aus dem Multi-Branch-/Einordnungs-UI entfernt; die interne technische Nutzung bleibt unverändert.
- `QR-Beteiligung vorbereiten` erklärt jetzt klar den Entwurfscharakter mit Pro/Contra und möglichen Folgen.
- `Swipe-Aussagen vorbereiten` erklärt jetzt klar schnelle Abstimmungen in der eDebatte-Community und den weiterhin nicht öffentlichen, nicht gezählten Status.
- `Prüfung oder Quellen ergänzen` bleibt bei `legal_sensitive` und `high_risk` sichtbar empfohlen.

## Guardrails unverändert

- Keine automatische Veröffentlichung.
- Keine automatische Stimme.
- Kein automatisches Mitzählen.
- Kein automatisches Mergen.
- QR- und Swipe-Pfade bleiben Draft/Preparation bis zur expliziten Bestätigung.

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx`

Ergebnis: grün.

## Bewusst offen

- `CREATE-EXISTING-MATCH-COUNTING-06`
- `CREATE-QR-SWIPES-PUBLISH-PREP-07`
