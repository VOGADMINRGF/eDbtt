# E150 Pilot Backbone

## Phase 2: Media Ready Projekte (PR-0012)

Ziel:
- Projekte mit 5-10 Themen, pro Thema mindestens 5 Optionen (Pflicht).
- Ergebnisse sind strikt projektgebunden (keine globale Vermischung).
- Community kann weitere Optionen vorschlagen (moderiert).

Control:
- Admin-UI: `/admin/projects`
- Admin-API: `GET/POST /api/admin/media-projects`
- Moderation: `POST /api/admin/media-projects/options` (approve/reject)

Public:
- `GET /api/media-projects` (aktive Projekte)
- `GET /api/media-projects/:projectId` (Themen + Optionen + Ergebnisse)
- `POST /api/media-projects/:projectId/vote`
- `POST /api/media-projects/:projectId/topics/:topicId/options` (Vorschlag)
