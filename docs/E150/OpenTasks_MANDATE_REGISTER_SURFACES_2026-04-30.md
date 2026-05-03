# OpenTasks Addendum: Mandatsregister, Mandats-Surface und B2B/Print-Bridge

Stand: 2026-04-30

Dieses Addendum normalisiert die im Chat neu entstandenen Produktideen als `codex_ready`-Tasks fuer `edebatte-org`. Es ist bewusst als OpenTasks-Ergaenzung formuliert, damit Codex die Eintraege in `docs/E150/OpenTasks.md` uebernehmen oder direkt aus diesem Dokument abarbeiten kann.

## Produktentscheidung aus dem Chat

- **eDebatte ist der Arbeitsraum**: Check, Dossier, Runde, Beteiligung, Ergebnis, Mandat, Status.
- **VoiceOpenGov ist Initiative und Register-Schicht**: Mitgliedschaft, Rollen, Verifizierung, Mandatsregister.
- **Gemeinsame Brueckenobjekte sind Mitgliedschaft/Identity und Mandat**, nicht alle Aktivitaeten.
- **Mandate sind oeffentlich nachvollziehbar, aber nicht fuer alle gleich bearbeitbar.**
- **Kein Parteienbuch-Wording.** Zulassige Begriffe: `Mandatsregister`, `VoiceOpenGov Mandatsregister`, `Beteiligungs- und Mandatsregister`, `Verantwortungsregister`.
- **Keine automatische politische Zuordnung.** Ein Mandat beschreibt Verantwortung, Herkunft und Status, nicht Meinungslager oder Parteizugehoerigkeit.

## OpenTasks-Block zur Uebernahme in `docs/E150/OpenTasks.md`

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GOV-MANDATE-01 | codex_ready | high | GOV-AI-03, PR-RUNDEN-OPS-03 | Domain contract fuer Mandate, VoiceOpenGov Identity und Mandatsregister | Mandat als gemeinsames Brueckenobjekt zwischen eDebatte und VoiceOpenGov definieren | Typed Contract fuer `Mandate`, `MandateHolder`, `MandateType`, `MandateStatus`, `MandateVisibility`, `ConsentStatus`, `VerificationStatus`; keine Begriffe wie Parteienbuch, Lager, Fraktion ausser in expliziten Negativtests; Mandat verweist optional auf `sourceDossierId`, `sourceRoundId`, `holderId`, `publicSummary`, `responsibilityScope`, `validFrom`, `validUntil`; Unit-Tests sichern Status-/Visibility-/Consent-Normalisierung | no | Chat-Entscheid: VoiceOpenGov fuehrt Mitglieder- und Mandatsregister, eDebatte erzeugt Beteiligungs-/Entscheidungsmandate. Mandat ist Verantwortung, nicht politische Zuordnung. |
| GOV-MANDATE-02 | codex_ready | high | GOV-MANDATE-01 | `/mandat/[id]` Lesesurface | Oeffentlichen Nachweisraum fuer Entscheidungen und Umsetzung schaffen | Route `/mandat/[id]` rendert public/read-only Mandatsuebersicht fuer alle; zeigt Herkunft aus Dossier/Runde, Beschluss-/Ergebnistext, Beteiligungsstand, offene Einwaende, Quellen-/Protokollbezug, Verantwortliche Stelle, Status, naechste Schritte; keine freie Debattenlogik wie `Dein Beitrag zaehlt`; CTAs: `Herkunft ansehen`, `Status verfolgen`, `Quelle/Einwand ergaenzen`, `Folgerunde starten` je Rolle/Status | no | Semantik: Dossier/Runde = Meinungsbildung und Beteiligung; Mandat = Ergebnis, Auftrag, Umsetzung. |
| GOV-MANDATE-03 | codex_ready | high | GOV-MANDATE-01, GOV-MANDATE-02 | Rollen- und Berechtigungscontract fuer Mandate | Gleiche Sichtbarkeit, unterschiedliche Bedienrechte sauber trennen | Public/guest darf lesen; logged-in user darf Quelle, Einwand, Folgefrage oder Umsetzungsbeobachtung einreichen; journalist/fachakteur darf Quellen-/Factcheck-Hinweise beitragen; org/verband/verwaltung/representative darf eigene Mandate annehmen/pflegen; admin darf verifizieren, Sichtbarkeit setzen, Konflikte markieren; Tests sichern, dass nur legitimierte Rollen Status/Verantwortliche/Beschlussdetails aendern koennen | no | Grundsatz: Das Mandat gehoert der Oeffentlichkeit. Die Bearbeitung gehoert legitimierten Rollen. |
| GOV-MANDATE-04 | codex_ready | medium | GOV-MANDATE-01, GOV-MANDATE-03 | VoiceOpenGov Membership-/Register-Handoff aus eDebatte | Eintragung in VoiceOpenGov aus eDebatte heraus zustimmungsbasiert und nachvollziehbar machen | Mandat-Annahme-Flow mit Checkboxen fuer Rolle/Zustaendigkeit, Zustimmung zur Registerfuehrung, Governance-Regeln, Sichtbarkeit; kein stilles Uebernehmen aus Abstimmungsverhalten; Verifizierungsstatus bleibt intern; oeffentliche Sichtbarkeit folgt explizitem Consent; Tests decken consent-required, private-by-default und revoke/withdrawn states ab | yes: konkrete Datenhaltung/DB-Adapter fuer VoiceOpenGov-Identity muss mit bestehender Auth/Account-Struktur abgeglichen werden | Prozessregel: VoiceOpenGov kann autark Mitgliedschaft aufnehmen; eDebatte darf nur in diesen Prozess ueberleiten oder mit Zustimmung ein Registerobjekt erzeugen. |
| GOV-MANDATE-05 | codex_ready | medium | GOV-MANDATE-02, GOV-MANDATE-03 | Mandats-Workbench Design-Familie | Brochure-Mockup als echte Produkt-Surface-Familie uebersetzen, ohne Screenshot-Fake | Gemeinsame UI-Sprache fuer Dossier/Runde/Mandat: Dossier-Workbench fuer Themen/Quellen/Beitraege; Runden-Workbench fuer Beteiligung/Optionen/Abstimmung; Mandats-Workbench fuer Beschluss/Verantwortung/Status/Umsetzung; Screenshot-/Broschuerenclaims markieren Mockups als `Beispielhafte Produktansicht`, solange UI nicht live identisch ist; visual regression/contract tests fuer Haupttexte und CTAs | no | Kritischer Punkt: `/mandat` darf nicht wie Kommentarspalte oder neue Debatte wirken. |
| GOV-B2B-01 | codex_ready | medium | PRICING-HARM-01 | B2B/Verband/Medien/Kommunal Landing- und Print-Bridge | Brief+QR-Kampagne produkt- und rechtssicher an eDebatte andocken | Zielgruppen-Landingpages oder eine parameterisierte `/b2b`-Surface fuer Verbaende, Medien, kommunale Akteure; QR-Ziele fuehren nicht pauschal zur Startseite, sondern zu passendem Pilot-/Demo-Kontext; Copy vermeidet Cold-Mail-Verkaufslogik und positioniert eDebatte als Arbeitsprobe/Pilot/Advisor-Mandat; Druckmaterialien markieren Beispielansichten sauber | yes: finale Preis-/Retainer-Pakete und rechtliche Review-Texte bleiben vor Versand zu pruefen | Chat-Idee: hochwertiger Brief als analoger Impuls, QR als Einstieg in digitale Beteiligung. |

## Priorisierte Umsetzungsreihenfolge

1. `GOV-MANDATE-01`: Domain-/Wording-/Statuscontract. Ohne diesen Slice wird jede UI semantisch unscharf.
2. `GOV-MANDATE-02`: Public `/mandat/[id]` als read-only Nachweisraum.
3. `GOV-MANDATE-03`: Rollen- und Rechte-Matrix fuer Mandate.
4. `GOV-MANDATE-04`: Zustimmungspflichtiger VoiceOpenGov-Handoff.
5. `GOV-MANDATE-05`: Surface-Familie Dossier/Runde/Mandat visuell vereinheitlichen.
6. `GOV-B2B-01`: Print-/QR-/Landingpage-Bruecke fuer Pilotakquise.

## Codex PR-Prompt fuer direkte Umsetzung

```text
Ziel: Setze die Mandatsregister- und Mandats-Surface-Architektur fuer edebatte-org in kleinen, reviewbaren Slices um.

Kontext:
- eDebatte = Arbeitsraum fuer Check, Dossier, Runde, Beteiligung, Ergebnis, Mandat, Status.
- VoiceOpenGov = Initiative/Register-Schicht fuer Mitgliedschaft, Rollen, Verifizierung und Mandatsregister.
- Mandate sind oeffentlich nachvollziehbar, aber nur durch legitimierte Rollen bearbeitbar.
- Kein Parteienbuch-Wording. Verwende Mandatsregister / VoiceOpenGov Mandatsregister / Beteiligungs- und Mandatsregister.
- Mandat bedeutet Verantwortung und Herkunft, nicht politische Meinung oder Lagerzuordnung.

Slice 1: GOV-MANDATE-01
- Erstelle einen typed Domain-Contract fuer Mandate, MandateHolder, MandateType, MandateStatus, MandateVisibility, ConsentStatus, VerificationStatus.
- Ergaenze Normalizer/Guards fuer Status, Visibility und Consent.
- Fuege Negativtests hinzu, die verbotene/gefährliche Wording-Drift in UI-Strings oder Domainlabels vermeiden, soweit sinnvoll repo-nah testbar.
- Dokumentiere den Contract in docs/E150.

Slice 2: GOV-MANDATE-02
- Erstelle `/mandat/[id]` als read-only Mandatsuebersicht mit Seed-/Mockdaten, solange kein Backend existiert.
- Inhalt: Herkunft aus Dossier/Runde, Beschluss/Ergebnis, Beteiligungsstand, offene Einwaende, Quellen/Protokoll, Verantwortliche Stelle, Status, naechste Schritte.
- Keine freie Kommentarspaltenlogik und kein generisches `Dein Beitrag zaehlt`-Eingabefeld auf Mandat.
- CTAs: Herkunft ansehen, Status verfolgen, Quelle/Einwand ergaenzen, ggf. Folgerunde starten.

Slice 3: GOV-MANDATE-03/04
- Fuehre Role/Permission-Contract ein: public read, logged-in contribution, journalist/fachakteur source/factcheck hints, org/verwaltung/representative mandate maintenance, admin verification.
- Mandat-Annahme nur mit explizitem Consent fuer Registerfuehrung und Sichtbarkeit.
- Keine automatische Uebernahme aus Abstimmungsverhalten.

Tests:
- Unit-/Contract-Tests fuer Status/Visibility/Consent.
- Page-Tests fuer `/mandat/[id]` Haupttexte, CTAs und Rollenhinweise.
- Guard-Test, dass Mandat nicht als Debatte/Kommentarspalte gerendert wird.

Docs:
- Aktualisiere `docs/E150/OpenTasks.md` mit den neuen Tasks oder markiere die abgearbeiteten Tasks entsprechend.
- Fuege Evidence-Datei pro Slice hinzu.
- Halte Part01/Part16 bzw. Surface-Doku synchron, wenn dort Mandat/VoiceOpenGov/Identity beruehrt wird.

Validation:
- pnpm -C apps/web run typecheck
- pnpm -C apps/web exec vitest run <neue tests>
- falls Layout-/Route-Aenderung: pnpm -C apps/web run build, soweit lokal praktikabel
```

## Nicht-Ziele / Guardrails

- Kein Parteibuch, keine Lagerdatenbank, keine automatische politische Klassifizierung.
- Kein Mandat aus blossem Abstimmungsverhalten.
- Keine versteckte Uebernahme von eDebatte-Nutzern in VoiceOpenGov-Mitgliederlisten.
- Kein freies Kommentarfeld als Hauptfunktion auf Mandat.
- Kein Broschueren-Screenshot als echte UI behaupten, solange die Surface nicht umgesetzt ist.
