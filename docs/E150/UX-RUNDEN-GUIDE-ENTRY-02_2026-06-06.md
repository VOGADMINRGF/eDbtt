# UX-RUNDEN-GUIDE-ENTRY-02

## Kontext

`/runden` und `/runden/new` hatten lokal bereits ein visuelles Guide-Update, wichen aber in Claim, CTA-Hierarchie und Schrittlogik vom dokumentierten `codex_ready`-Task ab.

## Umsetzung

- `/runden` zeigt wieder den dokumentierten First-Screen mit klarem Anlassraum-Claim, Primär-CTA `Neuen Anlassraum anlegen`, Sekundär-CTA `Bestehenden Anlass weiterführen` und ruhigem Voxy-Guide.
- Die ersten Folgemodule erklären jetzt kompakt `Gesprächsraum`, `Beiträge`, `Sichtbarkeit & Review` und `Schnellstart`.
- `/runden/new` ist wieder als sichtbarer Vier-Schritte-Flow `Rahmen`, `Optionen`, `Sichtbarkeit`, `Unterstützung & Start` lesbar.
- Schritt 1, 3 und die CTA-Reihenfolge wurden auf die in `OpenTasks.md` festgelegte Copy zurückgeführt.
- Schritt 4 erklärt explizit, dass KI, Graph und Dossier optionale Folgeschritte ohne Auto-Start bleiben.
- Bestehende Start-Draft-Handoffs bleiben erhalten, wurden aber nicht zum neuen Kanon erhoben.

## Tests

- `pnpm test -- --run apps/web/tests/runden-page.acceptance.test.ts apps/web/tests/runden-manual-create.page.contract.test.tsx apps/web/tests/runden-working-surface-copy.contract.test.ts`
