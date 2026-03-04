# DRIFT CODEX — eDebatte Dossier Header Premium + Mobile + No-Duplicates

> Status-Hinweis (2026-03-04): Dieses Part ist eine Spezifikation/Zusammenfassung. Der verbindliche Aufgabenstand liegt in `docs/E150/OpenTasks.md`. Keine neuen Runs aus diesem Part ableiten.

## Ziel
Die Darstellung im Dossier-Header soll deutlich hochwertiger ("premium") und mobilfähig werden:
- Wappen/Initiator-Logo oben rechts (Identity-Card) statt separater/duplizierter Initiatoren-Box.
- Keine Doppelungen/Wiederholungen (z.B. Initiatoren & Träger Karussell + Emblem + Meta-Chips).
- Mehr "geraﬀt": weniger Fläche, weniger Wrap-Chips, klarere Informationshierarchie.
- Desktop: ruhiger, Dashboard-Charakter. Mobile: sauber gestapelt, nichts wird winzig.

## Scope (nur diese 2 Files ändern)
- dossier/DossierViewer.tsx  (IST ~1687 Zeilen -> MUSS vollständig bleiben, nur gezielte Änderungen)
- dossier/InstitutionalHeader.tsx

## Harte Constraints
1) KEIN "Rewrite" der Datei. DossierViewer.tsx bleibt vollständig (≈1687 Zeilen).
2) Keine Logik entfernen, die außerhalb des Headers gebraucht wird.
3) Keine neuen Abhängigkeiten / keine neuen Files.
4) TypeScript noUnusedLocals beachten: wenn Karussell-State entfernt wird, dann auch die Variablen/Effects sauber entfernen oder weiterverwenden.
5) Mobile First: Header muss bei <768px komplett sauber sein.

---

## Umsetzung — Schritt-für-Schritt

### A) dossier/InstitutionalHeader.tsx: kompakt + Details
**Ist-Zustand:** 4 Chips + SnapshotPanel + WorkflowPanel immer sichtbar (nimmt zu viel Platz).

**Änderung:**
1) Ersetze das Chip-Flex-Wrap durch ein kleines Grid aus 4 Mini-Karten:
   - Workflow
   - Zuletzt geändert
   - Snapshot-Status
   - Letztes Ereignis
2) SnapshotPanel + WorkflowPanel kommen in ein `<details>` (standardmäßig geschlossen).
3) KEINE Änderungen an Funktionen/Props/Exports (InstitutionalHeader bleibt wie bisher importierbar).

**Acceptance:**
- Header rechts ist deutlich kürzer.
- Snapshot/Workflow sind erreichbar, aber nicht dauernd im Weg.

---

### B) dossier/DossierViewer.tsx: Header refactor ohne File zu kürzen
**Wichtig:** Nicht die Datei neu schreiben. Nur gezielt innerhalb des bestehenden `const header = (...)` umbauen.

#### B1) Layout Breakpoints verbessern (Titel nicht mehr gequetscht)
- Ändere Header-Grid Breakpoint von `lg:grid-cols-[1.6fr_1fr]` zu `xl:grid-cols-[1.55fr_1fr]`
  → Unter XL stackt es, Titel bekommt Breite zurück.

#### B2) Meta-Chips von Wrap -> Grid (ruhiger, mobil stabil)
- Ersetze:
  `div.flex.flex-wrap.gap-2` + `span.vog-chip`
- durch:
  `div.grid.gap-2 sm:grid-cols-2 lg:grid-cols-3`
  und jede Meta-Info als kleine "MetaCard" (label/value) mit `rounded-xl border bg card px-3 py-2`.

#### B3) Neue “Identity Card” oben rechts (Wappen/Initiator oben)
- Direkt im rechten Column-Stack (ganz oben) einbauen:
  - Emblem/Wappen (wenn `presentation.emblem?.asset`) oder origin icon fallback
  - Kommune/Region (presentation.region)
  - Ebene/Jurisdiction Badge
  - Mini-Avatare (max 4) für sekundäre Origins (community/org/media/research)
- Dadurch: „Initiatoren & Träger“ im Header NICHT nochmal separat.

**Implementationshinweis:**
- Nutze vorhandene `renderOriginIcon()` und `orderedOrigins`.
- Wähle:
  - `primaryOrigin` = Admin/Emblem/primary
  - `secondaryOrigins` = Rest, max 4

#### B4) Initiatoren-Karussell entfernen ODER in Details verschieben
Du hast 2 Optionen – wähle **die bessere**:

**Option 1 (empfohlen): Karussell komplett entfernen**
- Entferne den gesamten Block:
  `{orderedOrigins.length ? ( ... Initiatoren & Träger ... ) : null}`
- Entferne dazu konsequent:
  `carouselRef`, `activeCarouselIndex`, `loopOrigins`, `primaryLoopIndex`, den Effect der scrollt.
- ABER: `canEditOrigins` kann bleiben (falls später für UI).
- Ergebnis: keine Dopplungen, weniger schweres UI, deutlich mobilfreundlicher.

**Option 2: Karussell als `<details>` nur für Admin/Staff**
- Nur wenn `canEditOrigins`, dann `<details>` "Initiatoren verwalten" mit dem existierenden Karussell.
- Für normale Rollen wird NUR die neue Identity Card gezeigt.
- In dem Fall bleiben carouselRef/state/effect aktiv und werden genutzt → keine noUnusedLocals.

→ Ziel: egal welche Option: kein doppeltes „Initiatoren & Träger“ mehr für normale User.

#### B5) Dokumentationsstand + Status & Protokoll:
- Dokumentationsstand bleibt als Card, aber kompakter:
  - Label + Statusline + 1 Satz Erklärung (kein doppelter Text)
- Status & Protokoll bleibt, aber ohne redundante "Stand" Infos, wenn bereits in MetaGrid.
  - Entweder: entferne "Stand:" aus dieser Card ODER entferne "Stand" aus MetaGrid.
  - Regel: "Stand" nur EINMAL sichtbar im Header.

---

## Definition of Done
- Desktop (>=1280): Links Titel/Intro, rechts kompakter Stack (Identity + Dokumentationsstand + InstitutionalHeader + Status/Protokoll).
- Mobile (<768): Alles stacked, Title groß, Cards full width, keine winzigen Karussells.
- Keine Dopplung: Initiatoren nicht doppelt, Stand/Datum nicht doppelt.
- TS/ESLint clean: keine ungenutzten Variablen.

---

## Verifikation (lokal)
1) Typecheck + Lint:
   - pnpm -w lint
   - pnpm -w typecheck
2) Page check:
   - /dossier/demo auf Desktop & Mobile viewport (Chrome devtools)
3) Quick sanity:
   - Kein Layout-Overflow, keine horizontal scrollbars im Header.
   - Identity Card zeigt Emblem/Wappen wenn vorhanden.

---

## Patch-Hinweise (wo editieren)
- DossierViewer.tsx:
  - Änderungen konzentrieren auf Bereich um Zeile ~940–1120 (`const header = (...)`)
  - Karussell-States/Effects um Zeile ~409–520 nur anfassen, wenn Karussell entfernt/conditional wird.
- InstitutionalHeader.tsx:
  - Chips-Container ersetzen + Snapshot/Workflow in `<details>` packen.

## Output
- Nur die zwei Dateien ändern, nichts anderes.
- Keine neuen Dateien.
- Keine inhaltlichen Daten ändern, nur Darstellung/Struktur.


_____
