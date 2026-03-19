# Part 20 – Truth, Trust, Factcheck & Anti-Capture

## 1. Ziel

Dieses Part beschreibt, wie das System:
- Vertrauen aufbaut,
- mit unklaren / strittigen Fakten umgeht,
- Anlassraeume vor Kaperung schuetzt,
- und Factcheck skalierbar ohne Vollredaktion vorbereitet.

## 2. Trust-Modell

### 2.1 Personen-Trust
- `anonymous`
- `registered`
- `verified`
- `institutional`
- `editorial`

### 2.2 Inhalts-Trust
- `unverified`
- `source_based`
- `disputed`
- `checked`

### 2.3 Quellrollen
- `origin_source`
- `official_source`
- `supporting_source`
- `counter_source`
- `context_source`
- `community_source`
- `investigative_source`

## 3. Publish Gate

Ein Anlassraum oder Dossier darf nur publiziert werden, wenn:
- `reviewedBy` gesetzt ist
- `approvedBy` gesetzt ist
- kritische Themen ausreichende Quellenbasis haben
- keine haengen gebliebenen Eskalationen offen sind

## 4. Factcheck Assist

### 4.1 Ziel
KI-gestuetzte Vorpruefung, nicht automatische Wahrheit.

### 4.2 Pipeline
1. Claim Detection
2. Source Lookup
3. Contradiction Detection
4. Study / Statistic Matching
5. Confidence / Uncertainty Marking
6. Escalation if conflict high

### 4.3 Output
Nicht nur „wahr/falsch“, sondern:
- stuetzende Quellen
- widersprechende Quellen
- unklare Datenlage
- offene Fragen

## 5. Hinweise / Tips

### 5.1 Submit Modes
- `anonymous`
- `nickname`
- `verified`

### 5.2 Review Status
- `received`
- `triaged`
- `under_review`
- `promoted`
- `discarded`
- `escalated`

### 5.3 Evidence Status
- `none`
- `asserted`
- `attached`
- `partially_verified`
- `corroborated`
- `disproven`

Regel:
- anonyme Hinweise koennen Anlass / Review triggern,
- aber nie allein publikationsfaehig sein

## 6. Anti-Capture Regeln

### 6.1 Anlassraum-Kern schuetzen
Nicht jede Person darf aendern:
- Titel
- Summary
- Scope
- decisionScope
- Narrativkern
- Hauptstatus

### 6.2 Input offen, Struktur kontrolliert
Jeder darf:
- Signale geben
- Hinweise einreichen
- Quellen vorschlagen
- Fragen stellen

Nicht jeder darf:
- Struktur final setzen
- Dossiers freigeben
- Wahrheit labeln
- Raumdefinition aendern

### 6.3 Brigade / Spam / Flood
Mechanismen:
- Dedupe
- Clustering
- Rate Limits
- repeated / coordinated submission detection
- Merge statt Vervielfachung

### 6.4 Funding Capture
- max. Anteil einzelner Akteure
- Transparenz
- KYC / Zusatzpruefung bei grossen Summen
- keine Verbindung zu Wahrheitsstatus

## 7. Revisionsspur

Jede kritische Aktion braucht:
- wer
- wann
- was
- warum

Beispiele:
- Anlassraum merge / split
- Publikation
- Quellenentfernung
- Statussetzung
- Trust-Aenderung
- Rabatt >20 %
- Funding-Freigabe

## 8. Failure Handling

- falsche Informationen -> markieren / disputen / korrigieren
- eskalierter Konflikt -> Moderator / Reviewer einschalten
- keine belastbare Quellenlage -> nicht publizieren
- koordinierte Kampagne -> markieren / bremsen / de-dupen

## 9. Grundsatzsatz

**Jeder darf Signale geben. Nicht jeder darf Struktur bestimmen. Und fast nichts wird ohne Review sichtbar.**
