**Dossier Surfaces & Modes**

**Ziel**
Eine gemeinsame Dossier-Oberfläche für öffentliche Demo-Links und interne Ansichten, mit klaren Modi und Persona-Prioritäten.

**Routing & Kompatibilität**
1. `/dossier/[id]` ist die kanonische Oberfläche für öffentliche und interne Dossiers.
2. `/dossier/demo` bleibt eine Demo-Variante, nutzt aber dieselbe Surface.
3. `/dossier/demo2` (und andere `demo*`-IDs) bleiben öffentlich erreichbar.
4. `/demo/dossier` bleibt als Demo-Einstieg erhalten, nutzt dieselbe Surface.

**Access & Datenstatus**
1. `entry` beschreibt den Route-Kontext: `public`, `demo`, `internal`.
2. `access` ist effektiv: ohne Session = `public`/`demo`, mit Session = `internal`.
3. `dataState` zeigt den Ursprung: `live`, `demo`, `fallback`, `loading`.
4. Sichtbare Status-Chips markieren Demo/Simulation/Echt/Fallback.

**Modi**
1. `Lesen` (read): Überblick, Optionen, Evidenz, offene Fragen, Zuständigkeiten, Transparenzspur.
2. `Mitwirken` (work): zusätzlich Creator- und Einreichungs-Tools, Beteiligungsstatus.
3. `Verwalten` (admin): zusätzliche Verwaltungsflächen (Mandat, Audit, Inbox, Export).
4. Nicht jeder Modus ist für jede Rolle verfügbar; der aktuelle Modus ist sichtbar.

**Persona-Priorisierung**
1. Journalismus: Transparenz, Editorial-Inbox, Einsprüche, Evidenz im Fokus.
2. Verwaltung/Institution: Mandat, Audit, Zuständigkeiten, Delegationen priorisiert.
3. Bürger/Community: Transparenzspur, Mitwirken, Creator-CTA, einfache Orientierung.
4. Alle Personas nutzen dieselbe Surface, nur Reihenfolge/Tools variieren.

**Mitwirken/Creator**
1. Einreichungen sind sichtbar und nachvollziehbar (eingereicht → geprüft → übernommen/archiviert).
2. Creator-CTAs verweisen auf bestehende Einreichungsrouten (Beiträge/Statements).

**Transparenzspur**
1. Statusbox zeigt: gesichert, offen, in Prüfung, beantwortet, delegiert, Community, Einsprüche.
2. Kein Eindruck von „fertig analysiert“ ohne klare Kennzeichnung.
