# E150 Master Spec – Part 6: Consequences, Fairness & Responsibility

> Status-Hinweis (2026-02-12): Dieses Part ist eine Spezifikation/Zusammenfassung. Der verbindliche Aufgabenstand liegt in `docs/E150/OpenTasks.md`. Keine neuen Runs aus diesem Part ableiten.


## 1. Zweck dieses Dokuments

Part 06 definiert die **gesellschaftliche, demokratische und technische Logik** hinter:

- **Consequences** (Folgenabschätzung),
- **Responsibility Mapping** (wer ist wofür zuständig),
- **Fairness Guardrails** (Vermeidung von Bias, moralischer Druck, Empfehlungen),
- **lokale vs. nationale vs. globale Perspektiven**,
- **Reihenfolge der Darstellung** nach gesellschaftlicher Relevanz.

Part 06 ergänzt somit Part 05 (Orchestrator) und erweitert das AnalyzeResult um  
**mehrdimensionale Konsequenz- und Zuständigkeits-Informationen**, ohne jemals  
zu werten, zu empfehlen oder inhaltlich politische Positionen einzunehmen.

Ziel:  
**Jede Aussage strukturiert und demokratisch verständlich einordnen.**  
Nicht bewerten – nicht beeinflussen.

---

## 2. Warum Consequences?

E150 folgt einem Kernprinzip:

> „Ein Statement ohne Betrachtung der Folgen ist demokratietechnisch wertlos.“

Daher erzeugt das System (KI + Ableitungen) zu jeder Aussage eine strukturierte,  
mehrstufige Folgenabschätzung („Consequences Grid“):

1. **Kurzfristige lokale Folgen** (`local_short`)
2. **Langfristige lokale Folgen** (`local_long`)
3. **Nationale Folgen** (`national`)
4. **EU- / globale Folgen** (`global`)
5. **Systemische Wechselwirkungen** (`systemic_interactions`)

Diese Struktur ist **verpflichtend**, aber jede Zelle kann leer sein.

---

## 3. Datenmodell – Consequences

Konkretes Typmodell für spätere Integration in AnalyzeResult,  
aber **noch nicht** verpflichtend für Part05 (kommt ab E200 aktiv):

```ts
type Consequence = {
  id: string;
  scope: "local_short" | "local_long" | "national" | "global" | "systemic";
  statementIndex: number;
  text: string;
  confidence?: number; // 0-1, optional
};

type Responsibility = {
  id: string;
  level: "municipality" | "district" | "state" | "federal" | "eu" | "ngo" | "private" | "unknown";
  actor?: string;      // z.B. "Bundestag", "Kommunalrat", "EU-Kommission"
  text: string;        // Beschreibender Satz
  relevance: number;   // 0-1 Skala für Wichtigkeit
};

type ConsequenceBundle = {
  consequences: Consequence[];
  responsibilities: Responsibility[];
};
```

Integration in AnalyzeResult (E200):

ts
Code kopieren
type AnalyzeResult = {
  ...
  consequences?: ConsequenceBundle;
};
4. Regeln zur Folgenabschätzung (E150.6.x)
E150.6.1 – Keine Empfehlungen
Keine Sätze wie "Man sollte", "Es wäre besser", "Optimal wäre".

Nur Fakten, Wechselwirkungen, Sachlogiken.

Keine normative Bewertung.

E150.6.2 – Fokus auf demokratische Relevanz
Die Reihenfolge ist vorgegeben, damit Bürger:innen Folgen strukturierter sehen:

Auswirkungen vor Ort (typisch stärkster Bezug)

Effekte auf nationale Systeme

Wechselwirkungen mit EU/Global

systemische „Wenn X, dann Y“-Effekte

E150.6.3 – Mehrsprachig, aber kontextgleich
Jede Consequence muss in der Sprache des Inputs erscheinen.

Später kann das System automatisch übersetzen (E300), aber nicht jetzt.

E150.6.4 – Gesellschaftliche Fairness
Keine Einseitigkeit zugunsten bestimmter Bevölkerungsgruppen.

Konsequenzen müssen gleichgewichtig beleuchten:

ökonomische,

ökologische,

soziale,

rechtliche,

organisatorische Aspekte.

E150.6.5 – Keine Schuldzuweisung
Auch wenn Zuständigkeiten abgebildet werden:

Verantwortung ≠ Schuld.

Formulierungen sind neutral:

„Zuständig ist …“

„Formell betroffen ist …“

„Genehmigungsrahmen liegt bei …“

5. Responsibility Mapping (Zuständigkeiten)
Jedes Statement bekommt optional strukturierte Informationen darüber:

welches Level (Ort, Kreis, Land, Bund, EU)

welche Art von Akteur (gesetzgebende Gewalt, Verwaltung, private Akteure)

welcher Prozesspfad (Rat → Ausschuss → Exekutive → Umsetzung)

Typische Zielgruppen
Level	Beispiel
municipality	Städte, Gemeinden, Stadtrat
district	Landkreise
state	Bundesländer
federal	Bundestag / Bundesregierung
eu	EU-Kommission / EU-Parlament
ngo	UNICEF, Amnesty
private	Unternehmen, Verbände
unknown	wenn nicht eindeutig

Regeln
Wenn unklar → unknown, nicht spekulieren.

Keine politische Empfehlung, nur Struktur.

Wenn mehrere Ebenen relevant → mehrere Responsibility-Einträge.

6. Fairness-Framework (AI Guardrails)
6.1 Ziel
Das System muss systematisch sicherstellen, dass:

keine Gruppe bevorzugt oder benachteiligt wird,

keine Ideologie in die Formulierungen „hineinrutscht“,

die Darstellung pluralistisch und ausgewogen bleibt.

6.2 Mechanismen
Symmetrische Exploration
KI muss mindestens zwei Perspektiven strukturell abdecken:

Vorteile / Chancen

Risiken / Herausforderungen

Kontextualisierung statt Empfehlung
Beispiel:
❌ „Man sollte alternative Energie fördern“
✔️ „Die Maßnahme könnte den Ausbau alternativer Energie beeinflussen …“

Verbot von Suggestionen
Keine Formulierungen wie:

„offensichtlich“

„klarerweise“

„jeder weiß“

Minority Protection
Statements, die Minderheiten betreffen, müssen immer:

neutral,

rechtssicher,

ohne Stigmatisierung präsentiert werden.

Locale Fairness
Die Reihenfolge der Konsequenzen wird nach folgendem Prinzip sortiert:

lokale Relevanz zuerst

dann nationale Effekte

dann globale Effekte

zum Schluss systemische Wechselwirkungen

7. Einbindung in den Orchestrator (Part05)
Der Orchestrator muss:

Consequences-Abschnitt im Prompt berücksichtigen,

Ergebnisse nach Schema validieren,

fehlende Felder nicht „erfinden“,

keine Empfehlungen generieren,

Konsequenzen in Zukunft als optionales Modul an AnalyzeResult anhängen.

Diese Features werden erst in E200 voll aktiviert,
aber müssen jetzt schon sauber vorbereitet werden.

8. UI-Darstellung (Frontend-Regeln)
8.1 Level 1 Ansicht (Kurzform)
kurze, 1–2 Satz-Bullets pro Bereich:

„lokale Folgen“

„nationale Folgen“

„globale Wechselwirkungen“

8.2 Level 2 (Expertenmodus)
vollständiges Consequences-Grid

sortierte Listen

hervorhebung der Zuständigkeits-Ebenen (Badges)

optional: Klappbereiche für „Tiefe Analyse“

8.3 Mobile
kompakte Chips:

„Lokal (3)“

„National (1)“

„Global (0)“

„Zuständigkeiten (2)“

9. Zusammenfassung (Codex-Anweisungen)
Codex MUSS:

Prompts so erweitern, dass KI strukturiert:

local_short

local_long

national

global

systemic

Consequences streng nach Schema validieren.

Null-Werte erlauben statt halluzinieren.

Responsibility Mapping hinzufügen.

Fairness-Guardrails einbauen:

keine Empfehlungen

keine Suggestion

symmetrische Betrachtung

Minderheiten neutral behandeln

Reihenfolge der Abschnitte strikt einhalten:

Lokal → National → Global → Systemisch.

Output kompatibel zu AnalyzeResult halten.

Alle Consequences sprachkonsistent mit Input-Text zurückgeben.

Nichts politisch bewerten oder empfehlen.

Part06 bildet damit den gesellschaftlichen Kern der Plattform.
Part07 integriert diese Logiken in Reports, Graph und Wissensvernetzung.
Part08 erweitert alles um Eventualitäten & Entscheidungsbäume.
