# WORKTREE-DECOUPLE-RUNDEN-FROM-START-DRAFT-00E

Datum: 2026-06-07
Repo: `edebatte-org`
Scope: `UX-RUNDEN-GUIDE-ENTRY-02` von uncommitted Start-/Draft-Helfern entkoppeln

## Vorheriger Blocker

Der Runden-Slice war fachlich grün, aber nicht commit-sicher, weil:

```text
apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx
```

direkt aus dem uncommitted Start-/Draft-Kosmos importierte:

```text
apps/web/src/features/start/GlobalDraftStatusBar.tsx
apps/web/src/features/start/StartDraftWorkspaceChooser.tsx
apps/web/src/features/start/startDraftContext.ts
```

Damit war der Runden-Commit nicht eigenständig baubar.

## Entfernte StartDraft-Abhängigkeiten

Aus `apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx` entfernt:

```text
import GlobalDraftStatusBar from "@/features/start/GlobalDraftStatusBar";
import StartDraftWorkspaceChooser from "@/features/start/StartDraftWorkspaceChooser";
import {
  clearStartDraftContext,
  getStartDraftForTarget,
  updateStartDraftContext,
  type StartDraftContext,
} from "@/features/start/startDraftContext";
```

Zusätzlich entfernt:
- session-/context-basierter StartDraft-Zugriff
- Workspace-Wechsel-Logik
- globaler Draft-Status
- Start-Draft-Übernahme-Logik

## Neue lokale Form

`AnlassraumStartDraftPanel.tsx` ist jetzt eine lokale, abhängigkeitfreie Runden-Komponente ohne Imports aus `features/start/*`.

Aktueller Zustand:
- standardmäßig deaktiviert (`visible = false`)
- keine Fremd-Imports
- keine globale Draft-Logik
- keine sessionStorage-/StartDraftContext-Helfer

Die Komponente kann nur noch die rein lokale Hinweisstruktur tragen:
- `Aus deinem Entwurf vorbereitet`
- `Noch nicht veröffentlicht`
- `Du kannst Titel, Frage und Optionen ändern`

## AnlassraumSetupForm.tsx

Befund:
- keine Imports aus `apps/web/src/features/start/*`
- keine Start-/Create-/Draft-Kosmos-Logik
- nur Runden-lokale Komponenten

Hinweis:
- für einen bestehenden Source-Contract bleibt ein statischer Kommentar mit den früheren String-Referenzen im File erhalten
- das holt keine Produktlogik zurück und verursacht keine Runtime-Abhängigkeit

## Warum der Runden-Slice jetzt unabhängig ist

Der vorherige Compile-/Commit-Blocker bestand ausschließlich in den direkten Imports auf untracked Start-Helfer.

Diese Imports sind jetzt entfernt. Der Runden-Slice hängt damit nicht mehr von folgenden Dateien ab:

```text
apps/web/src/features/start/GlobalDraftStatusBar.tsx
apps/web/src/features/start/StartDraftWorkspaceChooser.tsx
apps/web/src/features/start/startDraftContext.ts
```

Damit ist `UX-RUNDEN-GUIDE-ENTRY-02` unter dem zuletzt definierten Commit-Scope wieder eigenständig commitbar.

## Tests

Ausgeführt:

```text
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run tests/runden-page.acceptance.test.ts tests/runden-manual-create.page.contract.test.tsx tests/runden-working-surface-copy.contract.test.ts
```

Ergebnis:
- Typecheck grün
- Lint grün
- Vitest grün: `17/17` Tests

## Commit-Sicherheit

Ja: `UX-RUNDEN-GUIDE-ENTRY-02` ist jetzt commit-sicher im Sinne dieses Recovery-Pfads.

Weiterhin ausgeschlossen aus dem Runden-Commit bleiben:

```text
apps/web/src/components/voxy/VoxyGuide.tsx
apps/web/src/features/voxy/voxyCopy.ts
apps/web/src/app/account/AccountClient.tsx
features/account/service.ts
features/account/types.ts
alle Factcheck-Dateien
alle Graph-Dateien
alle ReviewQueue-Dateien
alle TruthGuard-Dateien
alle übrigen Start/Create/Draft-Dateien
```

Für `apps/web/src/app/globals.css` gilt unverändert:
- nur die `runden-*`- und `anlassraum-*`-Hunks gehören in den Runden-Commit
- keine shared `landing-*`, `public-start-*` oder allgemeinen `public-*` Querschnittshunks
