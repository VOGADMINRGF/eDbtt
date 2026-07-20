# V3 AI Orchestration and Research Credit Policy

Stand: 2026-07-18

## Zweck

Diese Datei ist die kanonische SSOT fuer oeffentliche Produktbegriffe und Guardrails rund um KI-Orchester, Quellenpruefung und Recherche-Kontingente.

Sie gilt fuer:

- Public Pricing
- `/create` UX
- CTA-/Paket-/Add-on-Texte
- oeffentliche Produkt- und Contract-Dokumente

## 1. Public Wording

Oeffentliche Produkttexte sprechen ausschliesslich generisch von:

- `KI-Orchester`
- `Quellenpruefung`
- `Recherche-Kontingent`
- `Premium-Recherche`
- `externe Quellenanalyse`
- `Kosten-/Provider-Policy`

Zulaessige public Varianten im gleichen Wortsinn:

- `KI-Orchester-Kontingent`
- `erweiterte Pruefung`
- `vertiefte externe Quellenanalyse`

Nicht zulaessig in Public UX, Public Pricing, CTA, Paketversprechen oder Produkttexten:

- konkrete Provider-Namen
- `Perplexity`
- `ARI`
- `Deep Search`
- `Deep Research` als Produktbegriff
- `Search Credit`
- `Provider Credit`

## 2. Internal Provider Routing

Konkrete Provider-Namen bleiben interne Policy-/Orchestrierungsbegriffe:

- `Mistral`
- `Anthropic`
- `OpenAI`
- `Google`
- weitere Provider nach Policy

Diese Begriffe duerfen nur in internen Orchestrierungs-, Routing-, Policy-, Telemetrie- oder Betriebsdokumenten stehen, nicht in oeffentlichen Produktsurfaces.

## 3. Guardrails

- kein Auto-Search
- kein Auto-Deep-Research
- keine Provider-Namen in Public UX
- keine unbekannten Kosten als `0 EUR`
- keine externe Quellenanalyse ohne bewusste Bestaetigung
- Standard Analyze bleibt ohne automatische externe Recherche lauffaehig
- konkrete Provider-Auswahl bleibt interne Policy-Entscheidung nach Aufgabe, Sprache, Kosten, Qualitaet und Verfuegbarkeit

## 4. `/create` Verhalten

Wenn Link oder viele Themen erkannt werden:

- drei Themen kompakt anzeigen
- weitere erkannte Themen oder Kandidaten erwaehnen
- Kontingentfrage stellen
- keine automatische externe Recherche starten

Verbindliche public Copy:

- `Ich habe 4 Themenbereiche und 11 Unterthemen erkannt. Drei zeige ich dir als Einstieg.`
- `Ein weiteres Thema wurde erkannt.`
- `Weiteres Thema anzeigen`
- `Alle Themen oeffnen`
- `Linkinhalt pruefen`
- `Nur diese Themen weiterfuehren`
- `Spaeter`
- `Fuer die vollstaendige Quellenpruefung ist ein Recherche-Kontingent erforderlich.`

Ergaenzende Guardrail-Regel:

- Wenn der Linkinhalt noch nicht geladen wurde, darf Public UX das offen benennen und nur eine bewusste Folgeaktion `Linkinhalt pruefen` anbieten; keine automatische externe Link-Auswertung und kein Provider-Leak.

## 5. Pricing-Leitplanken

- `0 EUR`: keine Recherche-Kontingente
- `Interessiert`: begrenzte Contributions, keine erweiterten Recherche-Kontingente
- `Aktiv`: Contributions plus Anlassraum-Credit, keine automatische externe Quellenanalyse
- `Mitgestaltend`: Contributions plus Anlassraum-Credit plus Entwicklungsthema plus optionales Recherche-Kontingent, sofern die Kosten-/Provider-Policy aktiv ist

Optionale Add-ons:

- `Quellenpruefung / Recherche-Kontingent`
- `Premium-Recherche / vertiefte externe Quellenanalyse`

## 6. Referenzen

Diese Policy wird in oeffentlichen Pricing-/Create-Dokumenten referenziert, waehrend interne Provider- und Lane-Entscheide weiterhin in Architektur-/Policy-Dokumenten wie Part16 verbleiben.
