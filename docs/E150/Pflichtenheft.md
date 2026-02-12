# E150 Pflichtenheft (Intern + Extern)

## Zweck

Dieses Pflichtenheft definiert verbindlich:
- was pro Bereich geliefert werden muss,
- wie Abnahme erfolgt,
- welche Guardrails nie gebrochen werden.

Es ist fuer interne Umsetzung und fuer Freelancer/Externe gedacht.

## Verbindliche Quellen

1. `docs/E150/OpenTasks.md` fuer Reihenfolge und Status.
2. `docs/E150/Part14_Implementation_Roadmap.md` fuer Block-DoD.
3. `docs/E150/Part15_Codex_Safe_Mode.md` fuer Prozess- und Dateigrenzen.

## Guardrails

- Maximal 6 Aufgaben pro PR/Run, ausser explizitem Safe-Mode-Profil.
- Keine Billing-/Payment-Provider-Refactors.
- Keine CI/Infra-Umbauten ohne Auftrag.
- Keine Rollen-/Auth-Kernlogik ohne expliziten Scope.
- Jede Aenderung braucht `lint + typecheck` und Doku-Update in `Part15.md`.

## Lieferformat je Aufgabe

Jede Lieferung muss enthalten:
1. Funktion (Skizze)
2. Ist/Unerledigt Tabelle
3. Implementierungsumfang (Dateien, APIs, UI)
4. Verification (exakte Commands + PASS/FAIL)
5. Next Steps (max 5, konkret)

## Abnahmekriterien (global)

- Fachlich: Scope gemaess Drift vollstaendig umgesetzt.
- Technisch: `pnpm -C apps/web run lint` und `pnpm -C apps/web run typecheck` gruen.
- Dokumentation: `Part15.md` und `OpenTasks.md` aktualisiert.
- Konsistenz: keine widerspruechlichen Status zwischen Part14/Part15/OpenTasks.

## Bereichsanforderungen

### Block I Unterstuetzen/Crowdfunding

Muss liefern:
- Datenmodell `SupportCampaign`, `SupportPledge`.
- Public `/support/[slug]` mit Progress und Pledge-Flow.
- Admin `/admin/support` inkl. Statuswechsel `waiting_payment -> paid|canceled`.
- Sichtbarer Hinweis: Unterstuetzen beeinflusst niemals Votes/XP/Credits.

Abnahme:
- End-to-End manuell pruefbar (Pledge anlegen, Referenz sehen, Admin mark-paid, Progress aktualisiert).

### Block F Stream-Kit (naechster Ausbau)

Muss liefern:
- Overlay-URL pro Session.
- QR-Ziel pro aktivem Agenda-Item.
- Host-Aktion zum Umschalten des aktiven Agenda-Punkts.
- Produktseite "Streamer werden" mit Setup und Moderationsregeln.

Abnahme:
- Stream-Kit-Pfad ohne Realtime-Provider lauffaehig (MVP/Skeleton kompatibel).

### Block G/H Polishing

Muss liefern:
- Campaign-CTA/Reports konsistent.
- I18N/A11y/Social-Skeleton zu produktionsreifen Mindestpfaden erweitern.

Abnahme:
- Keine Regression in bestehenden Campaign-/Stream-/Research-Pfaden.

## Externe Onboarding-Checkliste

1. `OpenTasks.md` lesen und aktives Paket bestaetigen.
2. Relevante Parts lesen (meist Part12, Part14, Part15, Safe Mode).
3. Drift mit max 6 Aufgaben formulieren.
4. Umsetzung + Verification.
5. Doku-Update in `Part15.md` und `OpenTasks.md`.

## Nicht-Ziele

- Kein kompletter Rebuild.
- Kein neues Produktmodell ausserhalb E150.
- Keine versteckte "Nebenmigration" ohne Dokumentation.
