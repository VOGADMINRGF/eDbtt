# E150 Master Spec – Part 12: Campaigns, Admin & Telemetry

## 1. Zweck dieses Dokuments

Part12 bündelt drei zentrale Bereiche:

1. **Campaigns** – orchestrierte Fragestrecken für B2G/B2B und größere Community-Aktionen.
2. **Admin Console** – zentrale Steuerung der Plattform.
3. **Telemetry & Monitoring** – technische und inhaltliche Messung (inkl. KI-Telemetrie).

Viele Bausteine existieren bereits (z.B. AI-Telemetrie in `features/ai/telemetry.ts` und `/admin/telemetry/ai/dashboard`).  
Part12 macht daraus ein konsistentes Konzept.

---

## 2. Campaigns (Frage- & Beteiligungspakete)

### 2.1 Kampagnen-Modell

```ts
type Campaign = {
  id: string;
  ownerType: "b2g" | "b2b" | "community";
  ownerOrgId?: string;        // bei B2G/B2B
  title: string;
  description: string;
  locale: string;
  regionCode?: string;        // AGS/NUTS etc.
  startAt: string;
  endAt?: string;
  status: "draft" | "scheduled" | "running" | "paused" | "finished" | "archived";
  maxQuestions: number;       // z.B. bis 10 Fragen free bei B2B
  maxParticipantsHint?: number;
  qrCodeSlug: string;         // für QR-Sessions
};
```

### 2.2 Kampagnen-Inhalte
Jede Campaign besteht aus:

einer oder mehreren Fragen (Statements/Contributions),

optional:

Eventualitäten,

Streams,

ResearchTasks.

```ts
type CampaignQuestion = {
  id: string;
  campaignId: string;
  statementId: string;
  order: number;
  isMandatory: boolean;
};
```

### 2.3 QR-Sessions
Für jede Kampagne können QR-Sessions generiert werden:

z.B.:

- Wartesaal im Rathaus,
- Firmenveranstaltungen,
- Stadtfeste.

```ts
type CampaignSession = {
  id: string;
  campaignId: string;
  code: string;          // kurzer Code / QR-Ziel
  createdAt: string;
  expiresAt?: string;
  locationHint?: string; // "Rathaus-Foyer", "Betriebsversammlung"
};
```

Teilnehmer:innen:

- scannen QR,
- landen in einer reduzierten UI,
- Fokus auf Fragen dieser Kampagne,
- optional Registrierung oder leichte Pseudonymisierung (z.B. nur E-Mail oder SMS).

Ist/Unerledigt (QR, 2026-02-12):

| Bereich | Ist | Unerledigt |
| --- | --- | --- |
| QR-Resolve | `/qr/[qrId]` leitet auf Campaign/Session Join | Optional: QR-Scan-Tracking (anonym) |
| Landing-Text | QR-Landing mit klarer Teilnahme-CTA aktiv | Optional: Lokale Hinweise (z.B. Rathaus) |
| Session-Links | `/campaign/[id]/join?session=...` aktiv | Optional: Session-Label direkt im Join anzeigen |

### 2.4 Implementierungsstand (Pfad-Referenzen, 2026-02-12)

Aktuell umgesetzt (MVP):

- **Admin UI**
  - `/admin/campaigns`
  - `/admin/campaigns/[id]`
- **Public UI**
  - `/campaign`
  - `/campaign/[id]`
  - `/campaign/[id]/join?session=<sessionId>`
- **APIs**
  - `GET/POST /api/campaigns`
  - `GET/PATCH /api/campaigns/[id]`
  - `POST /api/campaigns/[id]/join`
  - `GET/POST /api/admin/campaigns/[id]/sessions` (inkl. QR-Code)
  - `GET/POST /api/admin/campaigns/[id]/qr` (Campaign-QR)
  - `GET /api/admin/campaigns/[id]/report`
- **QR-Resolve**
  - `/qr/[qrId]` → `GET /api/qr/resolve` (targetType: `campaign` | `campaign_session`)

Hinweis:
- Report-Filter und Vergleichsansichten sind im Admin-UI angelegt (PR-0032).

### 2.5 QR-Session-Reporting & Rollen-Gating (MVP)

Reporting (Session- und Quellen-Segmente):

- `GET /api/admin/campaigns/[id]/report`
  - Teilnehmerzahl gesamt
  - Join-Volumen pro Tag (letzte 14 Tage)
  - Segmente nach `source` und `sessionId`

Rollen-Gating (Admin-Only):

- Admin-Endpoints in diesem Block sind **staff-only** (siehe `requireAdminOrResponse`).
- Public Join bleibt offen (`/campaign/[id]/join`), QR-Targets werden nur durch Admins erzeugt.

### 2.6 Unterstuetzen (Crowdfunding) pro Kampagne/Projekt

Funktion (Skizze):

- Jede Campaign kann optional als `SupportCampaign` freigeschaltet werden (`supportEnabled`, `supportSlug`).
- Nutzer:innen erstellen `SupportPledge` mit Betrag und erhalten eine Zahlungsreferenz (`CF-xxxxxx`).
- Nach Zahlungseingang markiert Admin den Pledge als `paid`.
- Fortschritt ist oeffentlich sichtbar (nur aggregiert / anonymisiert), ohne Einfluss auf Stimmen oder XP.

Minimalmodell (Zielbild):

```ts
type SupportCampaign = {
  id: string;
  targetType: "campaign" | "project" | "question";
  targetId: string;
  slug: string;
  title: string;
  goalCents: number;
  status: "draft" | "active" | "closed";
};

type SupportPledge = {
  id: string;
  supportCampaignId: string;
  amountCents: number;
  status: "waiting_payment" | "paid" | "canceled";
  paymentReference: string; // CF-xxxxxx
  isAnonymous: boolean;
  publicName?: string | null;
  publicRegionCode?: string | null;
  createdAt: string;
};
```

Ist/Unerledigt:

| Bereich | Ist | Unerledigt |
| --- | --- | --- |
| Campaign-Basis | `SupportCampaign`/`SupportPledge` Modelle + Collection-Indexes vorhanden | Optional: owner-gesteuerte Aktivierung ohne Staff-API |
| Zahlungslogik | Zahlungsreferenz `CF-xxxxxx`, Statusflow `waiting_payment -> paid/canceled` aktiv | Optional: Guided Payment UX im Public Flow |
| Public-UI | `/support/[slug]` inkl. Progress, Pledge-Form, Zahlungsinfo aktiv | Optional: Feineres Social-Proof/Region-Filter |
| Admin-UI | `/admin/support` und `/admin/support/[id]` mit mark-paid/cancel + CSV aktiv | Optional: Bulk-Action fuer Pledges |
| Governance | Sichtbarer Hinweis in Support- und Campaign-UI aktiv | Optional: Zusatzhinweis in weiteren Funnel-Seiten |

## 3. Admin Console
### 3.1 Rollen
staff – Plattform-Admin / Redaktionsleitung.

orgAdmin – Admin einer Organisation (Gemeinde/Firma).

council (optional) – inhaltliche Aufsicht.

### 3.2 Admin-Bereiche
User & Orgs

Account-Übersicht,

Plan & Limits,

Status (verifiziert, gesperrt, etc.).

Campaigns

Kampagnen erstellen/bearbeiten,

Status umschalten (draft → running),

QR-Sessions verwalten.

Content & Graph

Statements, Questions, Knots,

Reports,

ResearchTasks.

Streams

Übersicht kommender Streams,

Moderationshistorie.

Telemetry & Health

KI-Provider,

Responsezeiten,

Fehlerraten,

System-Health (CPU, Memory – je nach Hosting).

PII & Security

Audit-Logs,

Zugriffspfade,

Einstellbare Retention-Zeiten.

## 4. Telemetry (AI & Plattform)
### 4.1 AI Telemetry (E150-Stufe)
Bereits in Code vorhanden (siehe Codex-Änderungen):

features/ai/telemetry.ts

/admin/telemetry/ai/dashboard

Part12 spezifiziert:

Datenpunkte je AI-Call:

ProviderId

Latenz (ms)

Erfolg/Fehler

Fehlertyp (Timeout, JSON, Schema)

Output-Metriken (Anzahl Claims, Notes, Questions, Knots)

Fallback verwendet: ja/nein

Dashboards:

Zeitreihen für Latenz/Fehler,

Balken je Provider,

Fallback-Heatmap,

Liste letzter Fehler-Events (PII-maskiert).

### 4.2 Plattform-Telemetrie
Daten, die nicht personenbeziehbar ausgewertet werden:

Anzahl Swipes pro Zeitraum,

Anzahl Contributions,

Anzahl aktiver Kampagnen,

Anzahl Streams,

Traffic pro Region & Thema (aggregiert),

Engagement-Verteilung (Levels).

Diese Daten dienen:

Produktverbesserung,

Kapazitätsplanung,

B2G/B2B-Reporting (aggregiert, anonymisiert).

## 5. Kampagnen-Reporting
### 5.1 Standard-Report für B2G/B2B
Enthält:

Teilnehmerzahl gesamt,

Stimmungsbild je Frage (Pro/Neutral/Contra, Verteilung),

Top-Argumente/Statements,

Eventualitäten (wichtigste Szenarien),

offene Fragen (ResearchTasks),

regionale / demografische Segmente (nur wenn datenschutzkonform).

### 5.2 Export-Formate
Web-Dashboard,

PDF,

JSON (für Weiterverarbeitung intern).

## 6. Grenzen & Datenschutz
### 6.1 Keine Tracking-Orgie
Keine individuellen Click-Profile,

Keine Third-Party-Tracker,

Telemetry nur in aggregierter Form.

### 6.2 Kampagnen-Datenschutz
Für B2G-Kampagnen: klare Hinweise

Zweck,

Speicherdauer,

Ansprechpartner.

Anonymisierte Auswertung wo möglich.

## 7. Codex-Anweisungen (kompakt)
Codex MUSS:

Models für Campaign, CampaignQuestion, CampaignSession implementieren.

API-Routen für:

/api/campaigns (CRUD),

/api/campaigns/:id/questions,

/api/campaigns/:id/sessions.

Admin-UI für Campaigns, User/Orgs, Telemetry fertigstellen/ausbauen.

AI-Telemetry-Hooks ausbauen (Fallbacks, Schemafehler etc.).

Plattform-Telemetry (Swipes, Contributions, Streams, Kampagnen) erheben – aggregiert.

Reports & Exporte für Kampagnen implementieren.

PII-Redaktion und Privacy-Best-Practices anwenden (Part00, PII_ZONES_E150).

Part12 macht die Plattform dauerhaft steuerbar und messbar –
ohne in Überwachung oder Dark-Patterns abzurutschen.
