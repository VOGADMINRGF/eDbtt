# I18N Runtime Guardrails

Datum: 2026-07-27

## Verbindlich

- UI-Lokalisierung und Inhaltsübersetzung bleiben getrennte Laufzeiten.
- Eine fehlende UI-Nachricht darf nicht durch eine freie Inhaltsübersetzung ersetzt werden.
- Originalinhalt bleibt unverändert erhalten und referenzierbar.
- Übersetzungen tragen Locale, Provider-/Modellklasse, Version, Zeitpunkt und Qualitätsstatus, ohne Secrets oder personenbezogene Inhalte in Logs zu schreiben.
- Cross-lingual Matching erzeugt ausschließlich Review-Vorschläge.
- Fehlgeschlagene Übersetzung erzeugt keinen erfundenen Text, Claim, Themenstatus oder Handoff.
- Recht, Consent, Pricing, Payment und Security verwenden keine ungeprüfte Runtime-Übersetzung als freigegebene Fassung.
- Provider werden hinter austauschbaren Adaptern gekapselt; das Datenmodell bleibt providerneutral.
- Retry, Cache, Budget, Rate Limit, Retention und Löschung folgen `AI-RUNTIME-POLICY-01` und den Datenschutz-Gates.
- Kein Auto-Publish und kein stilles Zusammenführen sprachübergreifender Records.

Diese Guardrails ergänzen `docs/E150/I18N_GO_PROGRAM_2026-07-27.md` und ändern keine bestehende Runtime-Freigabe.
