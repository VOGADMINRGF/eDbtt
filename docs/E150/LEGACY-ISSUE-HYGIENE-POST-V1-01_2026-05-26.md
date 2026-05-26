# LEGACY-ISSUE-HYGIENE-POST-V1-01

Stand: 2026-05-26

## Ziel

Alle verbliebenen offenen Alt-Issues vor `#208` gegen den dokumentierten `production_ready-v1`-Stand prüfen und sauber einsortieren:

- erledigt / superseded durch V1
- bewusst Post-V1 offen
- wirklich noch relevant

Kein neuer Feature-Slice, keine neue Matrix-Hochstufung, keine neuen Produktversprechen.

## Geprüfte Quellen

- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/V1-PRODUCTION-READY-RUNTIME-PARITY-AUDIT-01_2026-05-26.md`
- frühere V1-, Rollout-, Persistenz- und UX-Evidence-Dateien
- GitHub: offene Issues im Bereich `#82–#205`

## Remote-Bestand vor Hygiene

Im Bereich `#82–#205` waren noch diese offenen Issues vorhanden:

- `#205`
- `#200`
- `#193`
- `#185`
- `#172`
- `#162`
- `#123`
- `#120`
- `#119`
- `#117`
- `#114`
- `#98`
- `#84`
- `#83`
- `#82`

## Entscheidungstabelle

| Issue | GitHub-Status vor Hygiene | SSOT-/Evidence-Status | Entscheidung |
| --- | --- | --- | --- |
| `#205` `PILOT-DEMO-OPS-01` | open | `done` in `OpenTasks.md`; Evidence: `PILOT-DEMO-OPS-01_CONTROLLED_PILOT_DEMO_STORY_2026-05-22.md` | schließen als erledigt / durch späteren `production_ready-v1`-Stand historisch überholt |
| `#200` `PRODUCTION-READINESS-CHECKPOINT-03` | open | `done`; Evidence: `PRODUCTION-READINESS-CHECKPOINT-03_POST_SECURITY_AUTH_ROLLOUT_2026-05-22.md` | schließen als erledigt |
| `#193` `PRODUCTION-READINESS-CHECKPOINT-02` | open | `done`; Evidence: `PRODUCTION-READINESS-CHECKPOINT-02_GENERIC_ORG_ROLLOUT_2026-05-20.md` | schließen als erledigt |
| `#185` `PERSISTENCE-HARDENING-01` | open | `done`; Evidence: `PERSISTENCE-INVENTORY-HARDENING-01_PRODUCTION_PERSISTENCE_MAP_2026-05-20.md`, flankiert von `DB-BACKED-REVIEW-OPERATIONS-01_PERSISTENT_REVIEW_WORKLIST_2026-05-20.md`, `DB-BACKED-CONTENT-RELEASE-01_*`, V1-Paritätsaudit `2026-05-26` | schließen als erledigt, nicht blind; final gegen Persistenz-Evidence und Runtime-Paritätsaudit bestätigt |
| `#172` `CREATE-HANDOFF-QUEUE-PERSISTENCE-01` | open | `done`; Evidence: `CREATE-HANDOFF-QUEUE-PERSISTENCE-01_PERSISTENT_CREATE_REVIEW_QUEUE_2026-05-19.md` | schließen als erledigt |
| `#162` `RATHAUS-DEMO-GRAPH-SEED-01` | open | fachlich durch generischen Produktpfad ersetzt; in `OpenTasks.md` als `REGION-INTELLIGENCE-SOURCE-CONNECTION-01` erledigt mit Issue-Verweis `#162`; Evidence: `REGION-INTELLIGENCE-SOURCE-CONNECTION-01_2026-05-17.md` | schließen als superseded / generisch ersetzt |
| `#123` `UX/Create: Production mobile surface with register slides and scope-aware sense points` | open | durch spätere `/create`- und `/start`-/Workspace-Slices erledigt; Evidence u. a. `UX-FIRST-RUN-RETURNING-USER-01_*`, `PR-CREATE-MOBILE-FOCUS-CARDS-01_*` | schließen als superseded durch spätere V1-UX-Arbeit |
| `#120` `PR-CREATE-SAFETY-QUALITY-GATE-05` | open | in `OpenTasks.md` durch spätere Create-/Quality-/Review-Härtungen geschlossen; V1-Paritätsaudit bestätigt keinen offenen Kernrest | schließen als erledigt / superseded |
| `#119` `UX/Create: Mobile-first focus cards and sticky action flow` | open | `done`; Evidence: `PR-CREATE-MOBILE-FOCUS-CARDS-01_2026-05-09.md` | schließen als erledigt |
| `#117` `UX/Create: Reduce first answer density and make response progressively actionable` | open | `done`; Evidence: `PR-CREATE-PROGRESSIVE-ANSWER-DENSITY-01_2026-05-09.md` | schließen als erledigt |
| `#114` `UX/Create: Start the chat immediately after input and reduce pre-form controls` | open | `done`; Evidence: `PR-CREATE-STARTS-CHAT-AFTER-INPUT-01_2026-05-09.md` | schließen als erledigt |
| `#98` `UX/Create: Start-Composer, editierbarer Strukturbaum und echte Submit-/Review-Flows` | open | in `OpenTasks.md` explizit über mehrere Slices (`Issue #98 Slice A/C`) erledigt; Evidence u. a. `PR-AI-CREATE-01GH_*`, `PR-AI-CREATE-01I_*` | schließen als erledigt / in spätere Slices aufgelöst |
| `#84` `Bugfix/Create: Broad-topic dossier inference und finaler Structure-Chat` | open | durch spätere Create-/Structure-/Handoff-/Review-V1-Slices erledigt | schließen als superseded |
| `#83` `UX/Create: Unified Structure Chat Composer als primäres Arbeitsfenster` | open | durch shared Composer-/Create-Slices erledigt | schließen als superseded |
| `#82` `UX/Create: Struktur-Chat, Dossier-vor-Claim Logik und funktionierende Folgeaktionen` | open | durch spätere shared Composer-, Structure-Chat-, Handoff- und Review-Slices im V1-Pfad erledigt | schließen als superseded |

## Gruppierung

### 1. Erledigt / superseded durch V1

Alle geprüften offenen Issues `#82–#205` fallen aktuell in diese Gruppe:

- `#205`
- `#200`
- `#193`
- `#185`
- `#172`
- `#162`
- `#123`
- `#120`
- `#119`
- `#117`
- `#114`
- `#98`
- `#84`
- `#83`
- `#82`

### 2. Bewusst Post-V1 offen

Im aktuell offenen Bereich `#82–#205` blieb **kein** Thema übrig, das als echtes Post-V1-Issue auf GitHub offen bleiben sollte.

Post-V1-Themen werden bereits über SSOT-Tasks geführt, z. B.:

- `SOCIAL-LIVE-CONNECTORS-POST-V1`
- `BILLING-CHECKOUT-POST-V1`
- `STREAM-VIDEO-ENCODING-POST-V1`
- `WRAPPER-STORE-RELEASE-POST-V1`
- `ADVANCED-SOURCE-AUTOMATION-POST-V1`

### 3. Wirklich noch relevant

Im geprüften offenen Alt-Issue-Bereich `#82–#205` blieb **kein** echter V1-Restblocker offen.

## Spezieller Befund zu `#185`

`#185` wurde nicht pauschal geschlossen.

Entscheidungsgrundlage:

- `OpenTasks.md` führt `PERSISTENCE-INVENTORY-HARDENING-01` explizit als `done`
- `ProductionReadinessMatrix.md` referenziert die Persistenzinventur sowie die DB-backed Folge-Härtungen
- Evidence:
  - `PERSISTENCE-INVENTORY-HARDENING-01_PRODUCTION_PERSISTENCE_MAP_2026-05-20.md`
  - `DB-BACKED-REVIEW-OPERATIONS-01_PERSISTENT_REVIEW_WORKLIST_2026-05-20.md`
  - `DB-BACKED-CONTENT-RELEASE-01_*`
  - `AUDIT-READSIDE-UNIFICATION-01_*`
  - `V1-PRODUCTION-READY-RUNTIME-PARITY-AUDIT-01_2026-05-26.md`

Fazit:

Der Persistenz-Slice ist für den dokumentierten V1-Pfad erledigt. Verbleibende Komfort- oder spätere Tiefenarbeit läuft nicht mehr als offener V1-Blocker, sondern wäre eigener Post-V1-/Optional-Scope.

## GitHub-Aktion

Für alle obigen Issues wird ein Kommentar mit Evidence-Verweis hinterlegt und das Issue geschlossen.

Kommentarstil:

- erledigt durch konkrete Evidence-Datei(en)
- synchron mit `OpenTasks.md`
- final bestätigt durch `V1-PRODUCTION-READY-RUNTIME-PARITY-AUDIT-01`
- Referenz auf Commit `c6c996c2` als Runtime-Paritätsnachweis

## Ergebnis

Nach diesem Hygiene-Slice sollen offene Alt-Issues vor `#208` nicht mehr den Eindruck offener V1-Create-/UX-/Readiness-/Persistenzblocker erzeugen. Offene Folgearbeit wird über die expliziten Post-V1-Tasks in `OpenTasks.md` geführt statt über überholte Legacy-Issues.
