# DRAFTS-LEGACY-SSOT-ALIGN-01 Closure

Datum: 2026-07-27

Status: `done`

## Ergebnis

Die aktive Contribution-Write-Wahrheit ist geschlossen:

- `apps/web/src/server/serverDrafts.ts` ist der gemeinsame Persistenzpfad.
- Aktive Writes aus `/api/create/save` und `/api/drafts/save` nutzen
  `saveUserScopedServerDraft`.
- Kanonische Records liegen user-scoped in der `drafts`-Collection, verwenden
  MongoDB-ObjectIds und tragen `draft_ssot_runtime.v1` als Runtime-Schema.
- Save, Resume, Finalize und Folge-Lookups verwenden dieselbe normalisierte
  Draft-ID- und Schema-Wahrheit.

Die technische Umstellung wurde mit PR `#418`
(`fix(web): align draft writes to canonical SSOT`) auf `main` integriert.

## Legacy-Grenze

Es gibt keine zweite aktive Persistenzwelt:

- `/api/contributions/save` ist entfernt.
- `POST /api/drafts`, `POST /api/drafts/create` und
  `PATCH /api/drafts/[id]` brechen mit HTTP `410` fail-closed ab.
- Die Writer in `apps/web/src/server/drafts.ts` und
  `apps/web/src/server/draftStore.ts` brechen ebenfalls fail-closed ab.
- Alte String-ID-Drafts und bestehende `contribution_drafts`-Records bleiben
  nur als Read-only-Resume-Fallback lesbar.
- Legacy-Records werden weder still fortgeschrieben noch automatisch
  migriert, finalisiert oder zusammengeführt.

Damit bleibt bestehendes Resume-Verhalten erhalten, ohne neue Writes in das
alte ID-/Schema-Modell zuzulassen.

## Scope-Grenzen

Dieser Abschluss:

- löscht keine bestehenden Legacy-Daten,
- führt keine automatische Datenmigration aus,
- ändert keine Dossier-, Anlassraum-, Review- oder Publish-Semantik,
- erzeugt keine neue Route oder Persistenzschicht,
- erlaubt kein Auto-Publish und keinen stillen Merge.

Eine spätere physische Bereinigung historischer Records wäre ein eigener
Operator-/Migration-Slice und ist keine Voraussetzung für die geschlossene
Write-SSOT.

## Verifikation

Fokussierte Contracts decken ab:

- Legacy-Routen und Writer bleiben fail-closed.
- Aktive Contribution-Writes nutzen die kanonische Collection.
- Idempotente Saves erzeugen stabile ObjectIds und keine doppelten Records.
- Fremde Draft-IDs können nicht user-übergreifend aktualisiert werden.
- Legacy-Records bleiben Read-only.
- Der `/runden/new`-Kanon beschreibt Legacy-Drafts nicht mehr als aktive
  zweite Write-Wahrheit.
