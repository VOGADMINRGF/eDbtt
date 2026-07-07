# V3 Voxy Cocreation Human Loop Dialog Audit

Stand: 2026-07-07  
Branch: `pr/v3-voxy-cocreation-human-loop-dialog-01`

Scope: einen multilingualen, respektvollen Voxy-Human-Loop-Dialog auf
bestehenden Readmodels sichtbar machen. Keine neue Queue, keine neue Route,
keine neue Persistenz, kein echter Chat, kein Providerlauf, kein Rendern,
kein Auto-Publish und keine neue Produktwelt.

## Ergebnis

- `operational_basic`: Voxy stellt jetzt auf bestehenden Arbeitsflächen
  sichtbare, deterministische Rückfragen und Ergänzungshinweise.
- `readmodel_only`: der Dialog bleibt Vorschau- und Arbeitsstand-Lesart,
  solange keine echte Chat-/Antwort-Persistenz vorhanden ist.
- `blocked_by_runtime_truth`: ein möglicher Voxy-Briefing-Anschluss wird nur
  dort sichtbar, wo bereits bestehende Voxy-Readmodels existieren; Render-,
  Publish- und Provider-Runtime bleiben ehrlich blockiert.
- Keine Hochstufung auf Chat-Runtime, Moderationsruntime, Publishing oder
  produktive Voxy-Providerausführung.

## Verwendete Flächen

| Fläche | Status | Datei(en) | aktueller Stand | bleibt bewusst offen |
| --- | --- | --- | --- | --- |
| `/create` | operational_basic / preview_only | `apps/web/src/features/create/{createCandidatePreview.ts,CreateCandidatePreviewPanel.tsx}` | Die bestehende Candidate-Preview zeigt jetzt `Mit Voxy weiterdenken` mit 2-5 deterministischen Fragen zu Beispiel, Quellenbedarf, Sprachwahl, Gegenperspektive, Gemeinwohl oder Vergleichsraum. | Kein Chat-Verlauf, keine Antwort-Persistenz, kein Auto-Handoff und kein Providerlauf. |
| `/account` | operational_basic / readmodel_only | `features/account/buildAccountUnifiedWorkItems.ts`, `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx` | Lokale Drafts, Ledger-Branches und bestehende user-scoped Runtime-Linkages zeigen jetzt additiv, welche menschlichen Ergänzungen den Beitrag stärken würden. | Keine Admin-only Details, keine neue Nutzerpersistenz und keine Fake-Linkage. |
| `/admin/review` | operational_basic | `apps/web/src/app/admin/review/page.tsx` | Review-Items mit `v3ReviewContext` zeigen Voxy-Hinweise als offenen Ergänzungsbedarf, nicht als Review-Entscheid. | Keine Freigabe, keine Moderationsentscheidung, keine neue Queue. |
| `/dossier/[id]/studio` | operational_basic | `apps/web/src/app/dossier/[id]/studio/page.tsx` | Studio zeigt denselben Human-Loop-Dialog additiv neben Review-Kontext, Workflow und Downstream-Transparenz. | Keine Dossier-Finalisierung, kein Social-Publish, kein Voxy-Render. |

## Neuer Contract

- `apps/web/src/features/create/voxyCocreationDialogContract.ts`
- `apps/web/src/features/create/V3VoxyCocreationDialogPanel.tsx`

Der Contract trennt:

- `sourceLanguage` und `readingLanguage`
- `originalTextAvailable` und `translationAvailable`
- `rtl`
- `dialogueMode`
- `promptType`
- `status`
- sichtbare Frage, Begründung, Antwortformat, nächster Schritt
- `originalPreserved: true`
- `noManipulation: true`

Die Builder bleiben deterministisch. Sie nutzen nur bestehende Text-,
Sprach-, Evidence-, Review- und Voxy-Briefing-Hinweise.

## Multilingualität

- Originalsprache und Lesefassung bleiben getrennt sichtbar.
- Übersetzung bleibt Hilfsfassung und ersetzt nie das Original.
- Cross-lingual-Fälle wie `tr -> de`, `ar -> de` oder `fr -> de` werden als
  normaler Arbeitsstand behandelt, nicht als Fehler.
- RTL-Sprachen erzeugen einen sichtbaren Hinweis im Readmodel.
- Minderheitenperspektiven werden nicht dedupliziert oder geglättet.

## Deterministische Dialogkarten

Der aktuelle Slice leitet Fragen nur regelbasiert ab, zum Beispiel:

- offengebliebene Rückfrage aus bestehendem Arbeitsstand
- fehlendes Beispiel
- fehlender Quellen- oder Beobachtungsbezug
- fehlende Gegenposition
- unklare Betroffenengruppen
- unklarer lokaler / nationaler / europäischer / globaler Vergleichsraum
- Forderung ohne erkennbaren Lösungsweg
- Gemeinwohl- und Konfliktfrage
- Sprachwahl zwischen Original und getrennter Lesefassung

## Guardrails, die explizit erhalten bleiben

- Kein echter KI- oder Provider-Aufruf
- Kein Fake-Voxy-Chat
- Keine Fake-Recherche
- Keine erfundene Quelle
- Kein Auto-Publish
- Keine öffentliche Aktivierung ohne Review
- Kein Social Posting
- Kein Voxy-Rendering
- Kein Auto-Graph-Write
- Kein Auto-Merge
- `review_ready` ist nicht `approved`
- `publish_ready` ist nicht `published`
- Vorschlag ist nicht Entscheidung
- Allgemeinwohlfrage ist keine Bewertung des Verfassers

## Tests

- `pnpm -C apps/web exec vitest run tests/voxy-cocreation-dialog.contract.test.tsx tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`

## Bewusst offen

- echte Chat- oder Antwort-Persistenz fuer Human-Loop-Eingaben
- neue Draft-Metadaten fuer Voxy-Antwortslots
- Providergebundene Voxy-Dialogruntime
- Video-Render-, Voice- oder Publish-Runtime
- oeffentliche oder halbautomatische Aktivierung aus Voxy-Hinweisen

## Nächster sinnvoller Slice

- optionale additive Persistenz fuer `requiredHumanInput`, aber nur wenn sie
  ohne neue riskante Migration im bestehenden Draft-/Ledger-/Handoff-Pfad
  belegbar anhaengbar ist
- breitere Einbettung in `V3-VOXY-GUIDED-EXPERIENCE-01`, ohne die Grenzen
  zwischen Hilfsdialog, Review und Entscheidung zu verwischen
