# PR-QUALITY-HARM-02 – E2E- und Manual-QA-Hardening (2026-04-12)

## Pflichtcharakter (nicht optional)

Dieser Slice ist ein verbindlicher Qualitäts- und Vertrauensblock.
Er ist kein optionaler Polish.

Ohne diesen Slice ist **keine belastbare Produktgarantie** ableitbar für:
- Registrierung
- Rollenrouting
- Dashboard-Zielbilder
- Pricing-/Order-Followups
- Add-on-Reifestand

Erst mit diesem Slice gelten die wichtigsten Nutzerreisen als produktisch abgesichert.

## Ziel

Bestehende Contracts (Auth, Rollenrouting, Pricing/Order, Add-ons) durch echte Journey-Absicherung und klare Manual-QA-Checks ergänzen.
Keine neue Feature-Welt bauen.

## Abgesicherte Kernreisen (A-E)

1. Bürger:innen
- Registrierung-/Login-Zielpfad auf Account-Kontext
- Privatpaket-Bestellung direkt bestellbar
- Follow-up/Next-Step und Status konsistent

2. Freie Journalist:innen
- Rollenrouting auf Journalismus-Kontext
- Paketwahl inkl. optionalem Faktencheck-Kontingent
- Add-on-Follow-up transparent statt überversprochen

3. Organisationen / Verbände / Vereine
- öffentliche Bestellbarkeit bleibt erhalten
- Initialstatus bleibt reviewbar (`under_review`)
- Follow-up klar als interner Prüfpfad ausgewiesen

4. Kommunen / Verwaltungen
- Segmentfokus + Paket/Add-on-Übernahme konsistent
- Status/Next-Step inkl. internem Review-Hinweis

5. Admin / Backoffice
- Login-Zielpfad `/admin`
- Pricing-Order-Surface vorhanden
- Statusübergänge bleiben kontrolliert und gültig

## Testgruppen

Pflichtgruppen:
- `auth-registration-flow`
- `role-routing`
- `dashboard-role-contracts`
- `pricing-order-role-followup`
- `addon-availability-contracts`
- `e2e-critical-journeys`

Neu in diesem Slice:
- `apps/web/tests/e2e-critical-journeys.test.ts`

## Add-on-Reifestand (SSOT-gebunden)

Quelle: `features/pricing/domain/institutionalPricing.de.ts`

Verbindliche Reifestandsstufen:
- `direct_orderable`
- `orderable_review_required`
- `followup_required`
- `in_rollout`

Public UX muss diesen Reifestand abbilden, nicht überbieten.

## Garantierte Pfade (Stand dieses Slices)

- Public Bestellbarkeit bleibt für Privat/Journalismus low-friction.
- Institutionelle Bestellungen bleiben öffentlich bestellbar, intern reviewbar.
- Add-ons sind bestellbar, aber je Reifestand mit Review-/Folgeabstimmungslogik.
- Admin-/Backoffice-Pfade für Review und Statussteuerung bleiben sichtbar und testbar.

## Grenzen der aktuellen Automatisierung

Nicht Teil dieses Slices:
- vollständige Billing-/Finance-Automation
- vollständige Kalender-/Outlook-Integration
- vollständige Discount-UI-Engine

Diese Folgeprojekte werden strukturell vorbereitet, aber nicht vorgezogen.

## Done-Kriterien

Der Slice gilt als done, wenn:
1. alle Pflicht-Testgruppen grün sind,
2. Kernreisen A-E automatisiert und manuell nachvollziehbar abgesichert sind,
3. Add-on-Reifestände im SSOT definiert und in der öffentlichen UX sichtbar sind,
4. OpenTasks diesen Block explizit als essenziellen Pflichtpfad führt.
