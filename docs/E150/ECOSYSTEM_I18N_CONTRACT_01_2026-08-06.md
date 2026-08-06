# ECOSYSTEM-I18N-CONTRACT-01

Stand: 2026-08-06

Status: Governance- und Contract-Slice. Keine Produktimplementierung, kein Merge und kein Deployment.

## Ziel

eDebatte, VoiceOpenGov und Vote4Gov verwenden einen gemeinsamen, offen erweiterbaren Mehrsprachenvertrag.

## Verbindlicher Vertrag

- Initiale Sprachen: `de`, `en`, `fr`, `es`, `tr`, `ar`.
- Weitere gültige BCP-47-Tags ohne Schema-, API- oder Datenbankumbau.
- `originalLocale`, `readingLocale`, `uiLocale` und `outputLocale` bleiben getrennt.
- Artikel-, Topic-, Frage-, Options-, Quellen-, Ergebnis- und Audit-IDs bleiben sprachunabhängig.
- Übersetzungen sind Lesefassungen und keine Evidenz.
- KI-Übersetzungen werden sichtbar gekennzeichnet.
- Fehlende oder ungeprüfte Übersetzungen werden ehrlich angezeigt.
- Keine stille englische Ersatzfassung.
- Stimmen werden nicht nach Sprache aufgespalten.
- Semantisch abweichende Optionen schlagen fail-closed fehl.
- Arabisch verwendet vollständiges `dir="rtl"`.
- Tastatur, Screenreader, Mobile und 200-%-Zoom sind verbindlich.
- Canonical und `hreflang` dürfen keine nicht vorhandenen Sprachfassungen behaupten.
- Cross-Domain-Handoffs erhalten Locale, kanonische ID, Herkunft und Version.
- Cross-Domain-Handoffs übertragen keine PII, Rechte oder neuen Freigaben.

## Repository-Grenzen

- eDebatte nutzt weiterhin I18N Go aus Issue #456.
- PR #557 bleibt der eDebatte-Adapterkandidat.
- Vote4Gov PR #9 erhält nur einen kleinen Adapter.
- VoiceOpenGov PR #6 erhält nur einen kleinen Adapter.
- Keine zweite i18n-SSOT und kein repositoryübergreifender Mega-PR.

## Harte Grenzen

- keine Übersetzung als Evidenz
- keine sprachabhängigen Ergebniswelten
- kein Auto-Publish
- keine erfundene Sprachvollständigkeit
- kein Produktcode in diesem Slice

Nach Merge ist der Preflight auf sauberem `main` erneut auszuführen.
