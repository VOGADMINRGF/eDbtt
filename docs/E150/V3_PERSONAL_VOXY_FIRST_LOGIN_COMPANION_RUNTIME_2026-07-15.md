# V3 Personal Voxy First Login Companion Runtime

Status: implementation slice
Date: 2026-07-15
Task: `V3-PERSONAL-VOXY-FIRST-LOGIN-COMPANION-RUNTIME-01`

## Ziel

Die vorbereitete Personal-Voxy-Architektur wird auf `/account` erstmals als echte, nutzbare B2C-Begleitoberfläche sichtbar. Der Nutzer wird persönlich begrüßt, kann den gewünschten Begleitmodus auswählen, Region und Themen festlegen und die drei freiwilligen Civic Impulses sehen.

## Umgesetzt

- persönliche Voxy-Begrüßung auf `/account`;
- aufgeklappte Einrichtung bei `?welcome=1|true|yes`;
- kompakter Einstieg für bestehende Nutzer;
- Begleitmodi:
  - nur auf Anfrage;
  - relevante Hinweise;
  - regelmäßiger Überblick;
  - aktiv begleiten;
- Region und Themeninteressen;
- expliziter Browser-Speicher-Consent;
- vollständiges Zurücksetzen;
- drei tägliche Impulse zur Wahrnehmung, Einordnung und gewünschten Wirkung;
- direkte Übergänge zu `/create` und `/themen`;
- kein Voxy-Bild-Asset im neuen Surface, damit fehlerhafte oder fehlende globale Styles kein ungebremstes Vollbild-Rendering verursachen.

## Persistenzgrenze

Der Slice nutzt ausschließlich `localStorage` nach einer expliziten Checkbox. Er aktiviert noch keinen serverseitigen Profilstore, keine politische Profilbildung, keine externe Weitergabe, keine Benachrichtigung und keine regionale Live-Recherche.

## Guardrails

- kein Auto-Publish;
- kein Voting im Namen des Nutzers;
- keine versteckte politische Einstufung;
- keine serverseitige Profilpersistenz;
- keine Provider- oder Modellaufrufe;
- keine Agenten-Parallelarchitektur;
- keine Fake-Themen oder Fake-Beteiligungen;
- regionale Live-Recherche bleibt transparent als noch nicht aktiv gekennzeichnet.

## Geänderte Dateien

- `apps/web/src/app/account/PersonalVoxyFirstLoginCompanion.tsx`
- `apps/web/src/app/account/page.tsx`
- `apps/web/tests/personal-voxy-first-login-companion.runtime.test.tsx`

## Manueller Smoke

1. anmelden;
2. `/account?welcome=1` öffnen;
3. Begrüßung und ausgeklappte Einrichtung prüfen;
4. Modus, Region und Interessen auswählen;
5. ohne Consent prüfen, dass Speichern deaktiviert bleibt;
6. Consent setzen und speichern;
7. Seite neu laden und Browser-Persistenz prüfen;
8. Zurücksetzen und vollständige Löschung prüfen;
9. Links zu `/create` und `/themen` prüfen.

## Nächste Runtime-Slices

1. serverseitiger, widerrufbarer Personal-Voxy-Profilstore;
2. echter regionaler Civic Radar mit Quellen- und Abrufzeit;
3. dialogischer Impuls-Flow mit Nutzerbestätigung;
4. gemeinsamer persistenter Agent-Run-Kernel;
5. echter B2C-Vertikalpilot bis Dossier und Beteiligungsformat.
