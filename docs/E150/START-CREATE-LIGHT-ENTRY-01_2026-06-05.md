# START-CREATE-LIGHT-ENTRY-01

## Was wurde gebaut?

- `/start` zeigt fuer unbekannte Besucher jetzt einen leichten Beteiligungseinstieg mit Textfeld, Guardrails und Preview direkt auf derselben Seite.
- Primaere Hero-Aktion ist `Beitrag einordnen`; sekundaere CTAs sind `Beispiele ansehen`, `Für Verwaltung / Organisation ansehen` und `Demo anfragen`.
- `LandingContributionDraft` und `LandingContributionPreview` liefern einen guenstigen, rein clientseitigen Preview-Status mit Beitragstyp, Themenfeldern, naechsten Schritten und Handoff nach `/create?prefill=...`.
- Voxy wurde als erklaerender Guide verkleinert und sprachlich auf Einordnung statt Marketing gezogen.
- Beispielkarten unter `Oder schnell mitmachen` sind explizit als Beispiele markiert und schreiben keine produktiven Votes.

## Guardrails

- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein DeepSearch auf `/start`
- kein produktiver Graph-Write
- kein produktiver Vote-Write
- keine LocalStorage-Persistenz als echter Beitrag

## Was bleibt bewusst offen?

- echte serverseitige Rate-Limits oder Persistenz fuer Landing-Drafts
- tieferer Preview-Aufbau ueber Planner-/AI-Calls
- echte Swipe-/Vote-Beteiligung direkt von `/start`
- weitere B2B-/Institutionen-Funnels ausserhalb des leichten Start-Hero

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- gezielte Landing-/Start-Contracts fuer Hero-Copy, Create-Light-Preview, Privacy-/Route-Links und Mobile-Core-Shell
