# V3 Claim-to-Dossier Pipeline

Stand: 2026-07-03
Task: `V3-CLAIM-TO-DOSSIER-PIPELINE-01`

## Was in diesem Slice gebaut wurde

- `/create` zeigt jetzt neben Candidate Preview und Candidate Review Handoff
  auch eine typed Claim-to-Dossier-Pipeline.
- Claims, Gegenpositionen und Fragen werden sichtbar auf den bestehenden
  Zielpfad `dossier_runtime_record` / `dossier_runtime_draft` ausgerichtet.
- Aus dem vorhandenen Create-Handoff-Kontext wird lokal eine
  Dossier-Draft-Vorschau mit Titel, Summary, offenen Fragen und Visibility
  abgeleitet.
- Umfragen werden bewusst nicht in eine falsche Dossier- oder Persistenzlogik
  gedrueckt; sie bleiben als geplanter
  `participation_space_runtime_record`-Folgepfad sichtbar.
- Frontend-Transparenz und Provenance-Trace benennen diesen Zustand jetzt
  explizit als review-first Dossier-Handoff statt als versteckten Runtime-Write.

## Reality Audit

1. `dossier_runtime_record` ist bereits ein realer persistenter Runtime-Pfad.
   Dieser Slice hat keinen zweiten Dossier-Pfad gebaut.
2. `participation_space_runtime_record` ist ebenfalls bereits real vorhanden.
   Auch hier wurde kein Parallelpfad eingefuehrt.
3. Beide bestehenden Runtime-Pfade erwarten heute einen vorhandenen
   `PersistedCreateHandoffRecord` als Input.
4. Der in `V3-CANDIDATE-REVIEW-HANDOFF-01` sichtbare Candidate-Handoff ist
   dagegen nur ein typed Envelope im Frontend und nicht selbst persistiert.
5. Deshalb behauptet diese Pipeline keine echte Persistenz fuer Claim-,
   Gegenpositions-, Fragen- oder Poll-Kandidaten.
6. Claims, Gegenpositionen und Fragen sind in diesem Slice nur als
   `dossier_handoff_prepared` sichtbar gemacht worden.
7. Umfragen bleiben nur `planned_handoff`, weil fuer sie an dieser Stelle noch
   kein belastbarer persistierter Participation-Handoff existiert.
8. Provider-/Modelltruth wird weiterhin nur aus realem Runtime-Kontext
   gezeigt; fehlende technische Wahrheit bleibt `missing_runtime_truth`.
9. Graph-, Dossier- und Anlassraum-Ziele werden nicht automatisch erzeugt,
   publiziert oder als bestaetigte Runtime-Wahrheit ausgegeben.
10. Die bestehende No-AI-/No-Auto-Publish-/No-DeepSearch-Haltung wurde nicht
    gelockert.

## Was bewusst nicht gebaut wurde

- keine neue Persistenzmigration
- kein neuer Write in `dossier_runtime_records`
- kein neuer Write in `participation_space_runtime_records`
- kein Auto-Dossier
- kein Auto-Factcheck
- kein Auto-Graph-Write
- kein Auto-Publish
- keine Feed-Anreicherung
- keine Social-Output-Drafts
- kein Voxy-Briefing-Folgepfad

## Warum Feed-Anreicherung nicht Teil dieses Slices ist

- Feed-Anreicherung braucht erst einen belastbaren review-first Carrier fuer
  Claim-/Dossier-Folgearbeit.
- Dieser Slice schafft genau diese sichtbare Zielstruktur, aber noch keine
  persistierte Candidate-Handoff-Wahrheit.
- Vor einer spaeteren Feed-/Social-/Programm-Anreicherung bleibt deshalb die
  ehrliche Aussage: vorbereitet, nicht geschrieben.

## Offene Folgepfade

- `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
- spaetere Feed-Enrichment- und Review-Suggestion-Folgepfade
- dossier-/anlassraum-nahe Graph-Handoff-Praezisierung
- spaeterer Programm-Kandidatenpfad
- spaeterer Voxy-Video-Briefing-Folgepfad

## Betroffene Runtime-Wahrheit

- real vorhanden und unveraendert:
  `dossier_runtime_record`, `dossier_runtime_audits`,
  `participation_space_runtime_record`
- neu sichtbar, aber nicht persistiert:
  typed Claim-to-Dossier-Pipeline im `/create`-Preview
- weiter offen:
  persistierter Candidate-Handoff als direkter Input in diese Pipeline

