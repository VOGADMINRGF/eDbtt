# CREATE-MULTIBRANCH-MICROCOPY-04

## Was wurde gebaut?

- Die Multi-Branch-Subline wurde geglättet: `Du kannst jedes Thema anders behandeln: als Swipe vorbereiten, per QR teilen, prüfen lassen oder nur speichern.`
- Im Mehrthemen-Fall bleibt `Haben wir dich richtig verstanden?` sichtbar, wird aber oberhalb des Beitragspakets nur noch sekundär dargestellt.
- Die Haltungsanzeige gibt `mixed` jetzt nutzerfreundlich als `teilweise / mit Bedingungen` aus.
- Der QR-CTA lautet präziser `QR-Frage vorbereiten`.

## Was wurde bewusst nicht geändert?

- Keine Produktlogik.
- Keine Branch-Zuordnung.
- Keine Save-, Publish-, Vote- oder Merge-Logik.

## Verifikation

- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx`
