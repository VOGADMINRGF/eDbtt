# CREATE-MULTIBRANCH-UX-POLISH-03

## Was wurde gebaut?

- Das Multi-Branch-Action-Board nutzt auf Desktop jetzt die volle Hauptfläche statt einer leeren zweiten Grid-Spalte.
- Das Beitragspaket ist als primärer Zustand geschärft: `Wir haben X Themen erkannt.` plus klare Subline pro Thema.
- Die linke Themenliste ist als deutlicher Themen-Selector mit Nummern und Status lesbarer.
- Aktionsvorschauen sind kompakter und sichtbarer: QR-/Swipe-Entwurf, Prüfung und reines Speichern sind direkt als nicht-öffentliche Entwürfe erkennbar.
- Bei `high_risk` und `legal_sensitive` wird `Prüfung oder Quellen ergänzen` visuell als empfohlene Aktion markiert.
- Die untere Detailsektion zeigt bei Mehrthemen keine zweite große Verständnisanalyse mehr, sondern nur noch optionale Kontextdetails.

## Was wurde bewusst nicht geändert?

- Keine neue Produktlogik.
- Keine neue Branch-/Claim-Zuordnung.
- Kein Auto-Publish, Auto-Vote oder Auto-Merge.
- Keine neuen Backend-Pfade.

## Folge-Slice

- Browsernahe Live-QA für unterschiedliche Bildschirmbreiten und sehr lange Themenlisten.
- Optional noch feinere visuelle Abstufung zwischen `standard`, `civic_sensitive`, `legal_sensitive` und `high_risk`.

## Guardrails

- Alle Branch-Aktionen bleiben Entwürfe.
- `Prüfung` ist nur eine Empfehlung, keine Sperre.
- Bestehende GPT-first-Guardrails und der Verzicht auf lokale Fachheuristik bleiben unverändert.

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-multibranch-actions.contract.test.tsx`
