# ORG-REGION-ROLLOUT-CLOSURE-01

Stand: 2026-05-20
Status: done

## Ziel

Den bestehenden Organisations-/Regionen-Rollout generisch schliessen, sodass Reinickendorf nur
noch Beispiel-Seed oder erster moeglicher Pilot bleibt und kein Produkt-Sonderfall mehr ist.

## Umsetzung

- Onboarding- und Dashboard-Copy nennen jetzt Organisation, Region und Wirkraum generisch statt
  Reinickendorf-zentriert.
- Die sichtbare Typensprache wurde auf Verwaltung, Kommune, Verein/Verband/Traeger und
  Medienpartner nachgeschaerft.
- `features/region/server/sourceConnectionRuntime.ts` entfernt die letzte produktive
  Reinickendorf-Sonderbehandlung aus der Orts-/Scope-Hinweislogik; Regionnamen werden jetzt
  generisch aus dem aktiven Kontext abgeleitet.
- `/account/organization/dashboard`, `/account/organization`, `/admin/region` und
  `/admin/regions` erklaeren denselben review-first Rollout ohne Amtlichkeitsversprechen,
  Auto-Publish oder `public_official`.

## Guardrails

- Kein Auto-Publish.
- Kein automatisches `public_official`.
- Reinickendorf bleibt Beispiel-Seed oder erster Pilot, nicht Produktgrenze.
- Manuelle oder kuratierte Regions-/Wirkraum-Starts bleiben ehrlich als solche markiert, solange
  keine produktive Registerquelle verbunden ist.

## Tests

- generische Kommune ohne Reinickendorf-Sonderfall
- Verein/Verband/Traeger als Organisation ohne implizite Amtlichkeit
- Medienpartner als Organisation ohne implizite Amtlichkeit
- scoped Isolation zwischen Organisation A und B
- generischer Source-Connection-Dry-Run ohne Reinickendorf-Sonderlogik
- Typecheck, Lint und Build gruen

## Ergebnis

Der Produktpfad lautet jetzt explizit:

Organisation anmelden -> Region/Gebiet/Wirkraum waehlen -> Quelle oder Snapshot auswerten ->
eigene Review-Aufgaben sehen -> Dossier/Anlassraum/Topic Page vorbereiten -> bewusst sichtbar
machen -> Public URL/QR/Share erhalten -> Audit-Trail nachvollziehen.

Reinickendorf bleibt dafuer ein Beispiel-Seed und moeglicher erster Pilot, aber keine
hartverdrahtete Produktannahme.
