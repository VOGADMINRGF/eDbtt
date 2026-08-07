# ECOSYSTEM-I18N-CONTRACT-01 · Codex Run-Pack

Stand: 2026-08-07

Status: `preflight_passed / adapter_dispatch_authorized`

## Zweck

Dieses Run-Pack operationalisiert den bereits auf `main` serialisierten Contract `ECOSYSTEM-I18N-CONTRACT-01`. Es ändert keine Produkt-, Runtime-, API-, Datenbank-, Provider- oder Publish-Fläche.

## Verifizierte Governance-Wahrheit

- PR #591 ist gemergt.
- `ECOSYSTEM-I18N-CONTRACT-01` steht im operativen Kopf von `docs/E150/OpenTasks.md` auf `codex_ready`.
- Der Post-Merge-Preflight wurde auf sauberem aktualisiertem `main` erfolgreich ausgeführt.
- Ergebnis: `status: codex_ready`, `executable: true`, `branchCreationAllowed: true`.
- eDebatte bleibt die I18N-SSOT; keine zweite Locale-/Translation-Wahrheit.

## Kanonischer Vertrag

Initiale Locales: `de`, `en`, `fr`, `es`, `tr`, `ar`.

Offen erweiterbar auf gültige BCP-47-Tags ohne Schema-, API- oder Datenbankumbau.

Vier getrennte Sprachdimensionen:

- `originalLocale`
- `readingLocale`
- `uiLocale`
- `outputLocale`

Stabile fachliche IDs bleiben sprachunabhängig. Übersetzungen sind Lesefassungen und niemals Evidenz.

## Adapterstrategie

### eDebatte

- bestehenden I18N-Go-Vertrag aus #456 wiederverwenden;
- PR #557 ist der vorhandene Adapterkandidat;
- kein neuer paralleler Public-Ballot- oder Locale-Branch, solange #557 diese Fläche führt;
- stabile Frage-/Options-/Release-IDs bleiben sprachunabhängig;
- semantisch abweichende Übersetzungen schlagen fail-closed fehl.

### Vote4Gov

- bestehende Vote4Gov-Adapterfläche weiterverwenden;
- keine zweite fachliche ID aus Sprache, Slug oder Übersetzung ableiten;
- Cross-Domain-Handoff über bestätigte kanonische IDs und Locale-Kontext;
- kein unbestätigter eDebatte-Handoff.

### VoiceOpenGov

- bestehende VoiceOpenGov-Adapterfläche weiterverwenden;
- Charta, Grundfragen, Mitgliedschaft und Anlassräume verwenden denselben Locale-Vertrag;
- ungeprüfte Übersetzungen bleiben sichtbar ungeprüft;
- keine Übersetzung erzeugt Freigabe, Rolle oder Beteiligungsrecht.

## Pflichtinvarianten

- keine Übersetzung als Evidenz;
- keine sprachabhängigen Ergebniswelten;
- keine automatische Veröffentlichung ungeprüfter Übersetzung;
- fehlende Übersetzungen werden ehrlich angezeigt;
- keine stille englische Ersatzfassung;
- Arabisch nutzt vollständiges `dir="rtl"`;
- logische CSS-Eigenschaften statt hartem links/rechts;
- Tastatur, Screenreader, Mobile und 200-%-Zoom;
- Sprachwechsel ohne Verlust stabiler Frage-/Options-/Topic-IDs;
- Cross-Domain-Handoff überträgt keine PII, Rechte oder Freigaben;
- Canonical/hreflang behaupten keine nicht vorhandenen Fassungen.

## Kollisionsvertrag

Vor Änderungen an bestehenden PRs oder Branches jeweils:

1. aktuellen Exact Head lesen;
2. geänderte Dateiliste gegen offene PRs prüfen;
3. bestehende Adapterbranchs synchronisieren statt Duplikate anzulegen;
4. `docs/E150/OpenTasks.md` nicht erneut schreiben;
5. reservierte Voxy-Stränge nicht berühren.

## Testvertrag je Adapter

Mindestens:

- DE/EN/FR/ES/TR/AR;
- Arabisch RTL;
- fehlende Übersetzung;
- ungeprüfte KI-Übersetzung;
- Original-/Lesefassung getrennt;
- stabile IDs über Sprachwechsel;
- semantisch abweichende Vote-Optionen fail-closed;
- Canonical/hreflang;
- Cross-Domain-Locale-Handoff ohne PII-/Rechteausweitung;
- Tastatur, Screenreader, Mobile und 200-%-Zoom;
- Typecheck, Lint, relevante Contract-/Security-Tests, Build und `git diff --check`.

Manuelle Produkt-/Geräte-Smokes dürfen nicht als automatisiert behauptet werden.

## Rollback

Adapter bleiben additiv und fail-closed. Bei unvollständiger Locale-, Translation- oder Handoff-Wahrheit wird die jeweilige neue Adapterwirkung deaktiviert beziehungsweise auf den bereits vorhandenen sicheren Zustand zurückgeführt; keine Freigabe wird aus Übersetzungsdaten rekonstruiert.

## Evidence

Je Adapter dokumentieren:

- Base und Exact Head;
- tatsächliche Dateiliste;
- Kollisionsprüfung;
- ausgeführte Tests mit echten Ergebnissen;
- verbleibende manuelle Gates;
- keine Secrets, Provideraktivierung, Veröffentlichung oder Deployment.

## Abschlusszustand

Dieses Run-Pack selbst ist reine Governance-Dokumentation. Es autorisiert nur bereits durch den positiven Preflight freigegebene, getrennte Adapterarbeit auf bestehenden zuständigen Branches. Merge und Production bleiben Betreiberentscheidungen.
