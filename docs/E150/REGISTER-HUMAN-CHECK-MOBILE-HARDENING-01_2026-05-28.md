# REGISTER-HUMAN-CHECK-MOBILE-HARDENING-01

Stand: 2026-05-28
Status: done

## Ziel

Den Registrierungs- und Legitimations-Sicherheitscheck auf Mobile Safari und Desktop so härten, dass die einfache Rechenaufgabe zuverlässig funktioniert, keine doppelten Fehlermeldungen erzeugt und Hidden-/Honeypot-State nicht mit Browser-Autofill kollidiert.

## Scope

- `apps/web/src/components/security/HumanCheck.tsx`
- `apps/web/src/lib/security/{human-puzzle.ts,humanCheckContract.ts}`
- `apps/web/src/features/auth/registerSecurityContract.ts`
- `apps/web/src/app/register/RegisterPageClient.tsx`
- `apps/web/src/app/api/security/verify-human/route.ts`
- `apps/web/src/app/api/auth/register/route.ts`

## Umsetzung

- Der Human-Check nutzt jetzt einen stabilen Challenge-Seed und rollt die Aufgabe bei falscher Antwort oder technischem Fehler nicht mehr automatisch neu.
- Die Rechenaufgabe wird robust normalisiert und verglichen:
  - `trim`
  - sichere Ziffern-Normalisierung
  - String-/Number-Vergleich ohne Locale-Drift
- Der Verify-Endpoint blockiert richtige Antworten nicht mehr über die alte `timeToSolve`-Heuristik.
- Erfolgreich bestätigte Checks bleiben im selben Formular gültig und erscheinen visuell als `Bestätigt`.
- Wenn der Server einen alten oder ungültigen Human-Token zurückweist, wird der Client-State jetzt sauber zurückgesetzt, ohne dass CAPTCHA- und Form-State auseinanderlaufen.
- Die Register-UI zeigt keine zweite Sicherheitscheck-Meldung mehr unterhalb der Check-Karte.
- Die finale Step-3-Validierung priorisiert Pflichtfelder sauber:
  - zuerst E-Mail
  - dann Passwort
  - dann Sicherheitscheck
- Das Registrierungs-Honeypot nutzt jetzt einen weniger autofill-anfälligen Feldnamen und zusätzliche Ignore-Attribute; der Server akzeptiert für Übergangszeit auch den Legacy-Namen.

## Guardrails

- kein Produktions-Bypass für Human-Check
- Honeypot-Hits werden nur in Dev/Test geloggt
- öffentlich bleibt die Fehlermeldung generisch
- keine sensiblen Produktionsdetails im Response

## Tests

- `tests/security-verify-human.route.test.ts`
- `tests/auth-register.route.test.ts`
- `tests/register-security.contract.test.ts`
- bestehende Register-/Auth-/Security-Regressionen

## Ergebnis

Ein Nutzer kann die Registrierung jetzt auch auf Mobile Safari zuverlässig abschließen, wenn Pflichtfelder korrekt gesetzt sind und die Rechenaufgabe richtig gelöst wird. Der kleine Sicherheitscheck ist deterministisch, mobil lesbar, formulargebunden stabil und erzeugt keine widersprüchlichen Register-Fehlermeldungen mehr.
