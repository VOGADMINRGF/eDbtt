# Codex PR Prompt – VOG Beteiligungsradar 01

Ziel: Uebersetze den RUWE-Bid-OS-Ansatz in einen produktischen VoiceOpenGov/eDebatte-Beteiligungsradar.

Referenz:
- `docs/E150/PR-VOG-BETEILIGUNGSRADAR-01_RUWE_TRANSFER_2026-04-30.md`
- `docs/E150/OpenTasks.md`
- bestehender Flow: Signal -> Anlassraum -> Dossier -> Runde -> Mandat -> Umsetzung -> Impact

## Arbeitsmodus

Arbeite als fokussierter PR-Slice, nicht als grosser Umbau.

Keine bestehenden Hauptflaechen zerbrechen. Keine Auto-Publish-Logik einfuehren. Keine externen Scraper mit Live-Abhaengigkeiten im ersten Slice. Baue zuerst typed Contracts, Demo-Daten, Tests und eine einfache Operator-Surface.

## Umsetzungsscope

### 1. Typed Contract

Lege einen typed Contract fuer Beteiligungsradar-Signale an, z. B. unter:

- `features/participationRadar/participationSignal.ts`

oder, falls die Repo-Konvention besser passt:

- `apps/web/src/features/participationRadar/participationSignal.ts`

Mindesttypen:

```ts
export type ParticipationSignalType =
  | "public_tender"
  | "planning_process"
  | "council_information"
  | "participation_portal"
  | "press_signal"
  | "funding_program"
  | "community_signal"
  | "media_signal";

export type ParticipationRadarStatus =
  | "observed"
  | "qualified"
  | "dossier_candidate"
  | "round_candidate"
  | "outreach"
  | "archived";

export type ParticipationRadarNextStep =
  | "observe"
  | "create_anlassraum"
  | "draft_dossier"
  | "prepare_round"
  | "outreach_partner"
  | "no_action";

export type ParticipationSignalScore = {
  urgency: number;
  publicRelevance: number;
  participationFit: number;
  dossierReadiness: number;
  mandatePotential: number;
  partnerPotential: number;
  riskLevel: "low" | "medium" | "high";
  recommendedNextStep: ParticipationRadarNextStep;
  explanation: string[];
};

export type ParticipationSignal = {
  id: string;
  title: string;
  type: ParticipationSignalType;
  status: ParticipationRadarStatus;
  region?: string;
  municipality?: string;
  issuer?: string;
  deadline?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  summary: string;
  tags: string[];
  score: ParticipationSignalScore;
  createdAt: string;
  updatedAt: string;
};
```

### 2. Scoring Helper

Implementiere eine kleine deterministische Scoring-/Normalisierungslogik.

Anforderungen:

- keine KI-Abhaengigkeit
- Scores im Bereich 0–100 normalisieren
- `recommendedNextStep` aus Score-Feldern ableiten
- `explanation` als lesbare Begruendung liefern
- Fristnaehe muss `urgency` beeinflussen, aber nicht allein entscheiden
- `riskLevel=high` darf nicht automatisch zu `prepare_round` fuehren

### 3. Demo-/Seed-Daten

Ergaenze 5–10 Demo-Signale fuer:

- oeffentliche Ausschreibung Buergerbeteiligung
- Nahverkehrsplan
- Stadtentwicklung / Quartiersentwicklung
- Beteiligungsportal / informelles Beteiligungsverfahren
- Medien-/Community-Signal
- Foerder-/Programmhinweis

Die Daten muessen demo-tauglich sein und duerfen keine ungepruefte personenbezogene Kontaktinformation prominent ausspielen.

### 4. Operator-Surface

Baue eine erste einfache Surface, bevorzugt:

```text
/admin/radar/beteiligung
```

Falls Admin-Routing-Konventionen anders sind, an bestehende Admin-Struktur anpassen.

Die Surface soll zeigen:

- Titel
- Typ
- Region/Kommune
- Frist
- Status
- Score-Kurzwerte
- empfohlener naechster Schritt
- Begruendung
- Tags
- Link/Handoff nach `/create?entryIntent=issue_signal&source=participation_radar...`

Handoff muss intern bleiben und darf keine externen Redirects bauen.

### 5. Public-/Pitch-Copy vorbereiten

Noch keine grosse Public-Surface bauen, aber Copy/Config vorbereiten:

```text
VoiceOpenGov erkennt, wo Beteiligung gebraucht wird. eDebatte macht daraus ein belastbares oeffentliches Verfahren.
```

und:

```text
Vom Ausschreibungsradar zum Beteiligungsbetriebssystem.
```

### 6. Tests

Ergaenze Tests fuer:

- Typ-/Status-/NextStep-Klassifikation
- Score-Normalisierung
- Fristnaehe vs. Risiko-Guardrail
- Handoff-URL ist intern und nutzt `entryIntent=issue_signal`
- Demo-Daten enthalten verschiedene Signaltypen

Nutze bestehende Test-Konventionen im Repo. Falls vitest vorhanden ist, nutze gezielte Unit-Tests.

### 7. Docs / OpenTasks

- Verlinke den Slice in `docs/E150/OpenTasks.md` als `PR-VOG-BETEILIGUNGSRADAR-01`.
- Verweise auf die Spezifikation:
  `docs/E150/PR-VOG-BETEILIGUNGSRADAR-01_RUWE_TRANSFER_2026-04-30.md`
- Wenn umgesetzt, Status auf `done` erst nach Tests setzen und Evidence-Datei anlegen.

## Guardrails

- Kein Auto-Publish.
- Kein `window.location` zu externen URLs.
- Keine Live-Scraper ohne Mock-/Fallback-Contract.
- Keine Vermischung von formeller gesetzlicher Beteiligung und informeller Beteiligung ohne klaren Hinweis.
- Keine politische Wahrheits- oder Prioritaetsbehauptung aus dem Score ableiten.
- Score ist Operator-Hilfe, nicht demokratisches Ergebnis.

## Erwarteter PR-Titel

`feat(vog): add participation radar contract and operator surface`

## Validierung

Mindestens ausfuehren:

```bash
pnpm -C apps/web exec vitest run <neue-tests>
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
```

Wenn Repo-Skripte abweichen, aequivalente bestehende Scripts nutzen und in der PR-Beschreibung dokumentieren.
