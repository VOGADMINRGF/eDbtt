# CREATE-MULTIBRANCH-PRODUCTION-POLISH-02

## Was wurde gebaut?

- Das Mehrthemen-Action-Board in `/create` ordnet GPT-Fragen jetzt branch-sicher zu. Ein Ast bekommt nur noch Fragen, die lexikalisch eindeutig zu diesem GPT-Thema passen.
- Wenn keine eindeutige Frage vorliegt, bleibt der Ast bewusst neutral und zeigt `Noch keine passende Frage erkannt.` plus `Frage mit GPT vorbereiten`.
- `ClaimCandidate` wurde um `branchId`, `inferredStance`, `stanceConfirmationStatus` und `userStanceDecision` erweitert.
- Die UI zeigt pro Ast klarere Abschnitte für Thema, Beitragsteil, mögliche Frage, vermutete Haltung, Hinweis und Aktionswahl.
- `Swipe-Aussagen vorbereiten` ersetzt die alte Swipes-Copy; QR-, Swipe-, Prüf- und Save-Aktionen zeigen jetzt konkrete Entwurfs-Vorschauen.
- `ExistingMatch` erscheint nur noch bei echten Count-Daten. Die Entscheidung bleibt vorgemerkt und führt zu keinem automatischen Zählen oder Mergen.
- `CreateClient` merkt Haltungs- und Match-Entscheidungen nur im Draft vor, öffnet bei fehlender Branch-Frage den Korrekturpfad und verwendet durchgehend ehrliche lokale Save-Fallback-Copy.

## Was ist bewusst nur vorbereitet?

- `ExistingMatch` bleibt ein UI-/Contract-Vorschlag. Es gibt kein echtes Mitzählen, kein Graph-Merge und keine Claim-Zusammenführung.
- `Frage mit GPT vorbereiten` öffnet nur den vorhandenen Korrektur-/Weiterbearbeitungspfad. Es gibt noch keinen separaten zweiten Atomisierungs-Call pro Ast.
- Branch-Aktionen bleiben reine Vorbereitung. Es entsteht weder ein öffentlicher QR-Publish noch ein sofortiger Swipe-/Vote-Livegang.

## Was bleibt Folge-Slice?

- Echter per-Ast-Follow-up für QR-/Swipe-/Review-Preparation im Backend.
- Reale Existing-Match-Auflösung gegen Graph-/Claim-Daten inklusive sauberem Support/Oppose-Handoff.
- Optional feinere GPT-basierte Claim-Atomisierung für Aste ohne eindeutige Frage.

## Guardrails

- Keine lokale fachliche Heuristik für Themen oder Claims.
- Keine automatische Veröffentlichung.
- Kein automatisches Mitzählen.
- Kein automatisches Merge in bestehende Claims.
- Jede Branch-, Match- und Haltungsentscheidung bleibt ein reviewbarer Nutzerentwurf.

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-planner-openai-happy-path.contract.test.ts tests/create-planner-complex-civic-input.contract.test.ts tests/create-degraded-followup-actions.contract.test.tsx tests/create-handoff.persistence.route.test.ts tests/create-multibranch-actions.contract.test.tsx`
