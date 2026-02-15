# PR-0010B – DecisionArchitecture v2.0: Publishing Pack + Drift-Validator (ohne Parallelstrukturen)

**Ziel:** Codex soll in *einem* Run sicherstellen, dass das Referenzdokument „Digitale Entscheidungsarchitektur“ **kanonisch** in `docs/E150` liegt, als Download bereitsteht, auf einer neutralen Landingpage verlinkt ist, und dass ein Validator verhindert, dass später Divergenzen („Parallelstrukturen“) entstehen.

## Kanonische Regeln (wichtig)

1. **Single Source of Truth:** `docs/E150/Part16_Digitale_Entscheidungsarchitektur.md` ist die Quelle. Keine zweite Volltext-Kopie an anderer Stelle.
2. Landingpage enthält **nur Auszüge / Zusammenfassung** + Download-Links. Kein zweites Volltext-Dokument in TS/MDX.
3. Version/Datum müssen überall identisch sein (MD → Landingpage → Download-Dateiname).
4. **Hard-Fail**, wenn im veröffentlichbaren Text Platzhalter wie `turn\d+search\d+` auftauchen.

---

## Deliverables (Dateien)

### A) Dokument

- **Pflicht:** `docs/E150/Part16_Digitale_Entscheidungsarchitektur.md` (existiert; ggf. nur Korrekturen)

### B) Public Downloads

Lege die Dateien in `apps/web/public/docs/` ab:

- **Pflicht:** `apps/web/public/docs/DecisionArchitecture_v2_0.docx`
- Optional: `apps/web/public/docs/DecisionArchitecture_v2_0.pdf`
- Optional: `apps/web/public/docs/DecisionArchitecture_ExecutiveSummary_1p_v2_0.pdf`
- Optional: `apps/web/public/docs/DecisionArchitecture_PilotSteckbrief_1p_v2_0.pdf`

**Regel:** Keine generischen Dateinamen ohne Version.

### C) Landingpage (neutral, nicht aktivistisch)

Pfad:

- `apps/web/src/app/[locale]/referenzarchitektur/page.tsx`

Inhalt:

- Titel + Untertitel + Status („Arbeitsfassung / Diskussionsgrundlage“)
- 6–10 Kernaussagen als Bulletpoints
- TOC-Jumplinks zu Sektionen (nur auf Landingpage, nicht Volltext)
- Download-Block (DOCX zuerst)
- Feedback-Block („Kontakt / Hinweise / Korrekturen willkommen“)

Wording-Leitlinie:

- Nutze: **strukturelles Problem**, **institutionelle Überlastung**, **Informationsarchitektur**, **Legitimationslogik**, **Governance-Modell**.
- Vermeide aktivistische Trigger.

### D) Drift-Validator (CI/verify)

Pfad:

- `scripts/validate-decision-architecture.ts`

Checks (Hard Fail bei Fehler):

1. Kanonische Datei existiert.
2. Pflicht-Tokens im MD vorhanden:
   - Titel, Untertitel, Autor, Version, Datum
   - Abstract + Schlüsselwörter
   - Kapitel 1–11 Überschriften
   - Forschungsfragen (F1–F3) + Abgrenzung
   - Bausteine (Behauptungen/Quellen/Prüffragen/Handlungsoptionen/Auswirkungen)
   - Statuslogik (unbestätigt/teilbestätigt/bestätigt/widerlegt)
   - Prüfpfade A/B/C + Ombud + RACI
   - Auditierbarkeit + Versionierung + Nachweisführung/Provenienz
   - Pilot (12 Wochen, 5–10 Themen)
   - Methodik (Gestaltungsforschung)
   - Risiken/Schutzmechanismen
   - Publikations- und Referenzstrategie + Zitiervorschlag
3. Blockiere Platzhalter: Regex `turn\d+search\d+`.
4. Public DOCX existiert (Dateiname mit Version `DecisionArchitecture_v2_0.docx`).
5. Landingpage enthält Download-Link auf `DecisionArchitecture_v2_0.docx` und zeigt die Version sichtbar an.

Wiring:

- `verify.sh` ruft `node scripts/validate-decision-architecture.ts` auf.

---

## Akzeptanzkriterien

- Kein Volltext-Doppel in App-Content.
- Download funktioniert lokal und deployed.
- Validator bricht CI ab, wenn etwas fehlt.
- Landingpage wirkt wie „Referenz-/Diskussionspapier“, nicht wie politisches Manifest.
