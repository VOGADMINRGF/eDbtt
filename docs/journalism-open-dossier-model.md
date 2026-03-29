# Journalism Open Dossier Model

## Grundidee

Journalismus wird im System nicht als fertige Wahrheit, sondern als Anlassgeber und Kontextlieferant modelliert.

## source_anchor

Ein journalistischer Beitrag kann sein:
- article
- print
- video
- podcast
- talkshow
- social_post

Er kann:
- einen Anlassraum ausloesen
- einem bestehenden Anlassraum als Quelle hinzugefuegt werden
- in ein offenes Dossier einmünden

## Regeln

- journalistischer Anlass = kein automatischer Wahrheitsstatus
- Gegenquellen / offene Fragen muessen sichtbar bleiben
- Truth Guardrails bleiben aktiv
- Redaktionen koennen offene Dossier-Companions per Embed / QR betreiben
- beschleunigte journalistische Pfade sind nur transparente Workflow-Erleichterungen
- kein Wahrheits-/Prioritaetsprivileg aus `source_anchor`

Operativer Contract-Stand (`GOV-JOURNALISM-02`, 2026-03-29):
- shared Guardrail-Resolver: `features/anlassraum/journalismGuardrails.ts`
- route-nahe Meta-Ausgabe: `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- Evidenz: `docs/E150/GOV-JOURNALISM-02_TRUTH_GUARDRAILS_FACTCHECK_CONTRACT_2026-03-29.md`

Operativer Contract-Stand (`GOV-JOURNALISM-03`, 2026-03-29):
- shared Companion-/Embed-/QR-Contract: `features/anlassraum/journalismCompanionContract.ts`
- route-nahe Meta-Ausgabe: `meta.journalismCompanionContract` in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- Evidenz: `docs/E150/GOV-JOURNALISM-03_COMPANION_EMBED_QR_CONTRACT_2026-03-29.md`

Operativer Contract-Stand (`GOV-JOURNALISM-04`, 2026-03-29):
- shared Rollen-/Profil-/Publisher-Contract: `features/anlassraum/journalismRoleProfileContract.ts`
- route-nahe Meta-Ausgabe: `meta.journalismRoleProfile` + `meta.journalismConsistency` in `apps/web/src/app/api/admin/governance/anlassraum/route.ts`
- Evidenz: `docs/E150/GOV-JOURNALISM-04_ROLE_PROFILE_PUBLISHER_CONTRACT_2026-03-29.md`

## Team-/Rollenanschluss

- Redaktion/Publisher/journalistische Teams sind teamfaehige professionelle Kontexte (Review/Publish/Moderation), nicht nur Einzeluser.
- Institutionelle/verwaltungsnahe Nutzung kann auf derselben Grundinfrastruktur andocken, folgt aber eigener Fachlogik.
- Gleiche Grundinfrastruktur bedeutet nicht gleiche Rolle, Prioritaet oder UI-Logik.
- Kein Zwang zur Vollredaktion: auch kleinere Formate, Einzeljournalisten und regionale Medien bleiben anschlussfaehig.

## Sondertools / Spezialpfade

- Sondertools sind zulaessig, wenn sie transparent eingeordnet und anschlussfaehig bleiben.
- Sie duerfen den kanonischen Anlassraum-/Dossier-/Pruef-/Nachverfolgungskern nicht verdraengen.
- Keine erzwungene Monokultur: produktive Spezialpfade duerfen als Hilfswerkzeuge bestehen.

## Nutzen fuer Redaktionen
- Anlassraeume zu Beitragen
- Community-Feedback
- offene Fragen
- Factcheck Assist
- QR / Embed Begleitlogik
