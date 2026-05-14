# PRIVACY-GATE-DOSSIER-01

Stand: 2026-05-11
Status: done

## Ziel

Datenschutz nicht als manipulierendes Cookie-Banner, sondern als versionierten Privacy-/Datenschutz-Gate verankern, der aktive Verarbeitung in eDebatte erst nach notwendiger Kenntnisnahme freigibt und optionale Einwilligungen getrennt hält.

## Umgesetzt

- Neuer versionierter Consent-/Notice-Contract in `apps/web/src/lib/privacy/consent.ts`
  - `privacyNoticeVersion = 2026-05-privacy-v1`
  - `requiredNoticeAcknowledged`
  - optionale Kategorien `comfort`, `analytics`, `externalMedia`, `productImprovement`
  - Legacy-Cookie wird nur migriert, nicht still als neue Kenntnisnahme akzeptiert
- Globaler Privacy-Gate in `apps/web/src/components/privacy/PrivacyGateProvider.tsx`
  - ruhiger Trust-Dialog statt klassischem Cookie-Banner
  - Hintergrund sichtbar, aber inert / nicht klickbar
  - Focus-Trap, Tab-Begrenzung, Body-Scroll-Lock
  - ESC schließt nur die Optionen, nicht den Gate
  - `Nur Notwendiges nutzen` reicht zum Weitergehen
  - Dossier-Link `/datenschutz-dossier` prominent verankert
- Root-Integration in `apps/web/src/app/layout.tsx`
  - alter Banner entfernt
  - Gate ist kanonischer Einstieg für aktive Verarbeitung
- Server-/Settings-Sync
  - `/api/account/consent` auf neuen Contract umgestellt, mit Legacy-Payload-Kompatibilität
  - `apps/web/src/app/settings/page.tsx` auf neuen versionierten Datenschutz-/Optionen-Status gehärtet
- Datenschutz-Dossier
  - neue Surface `apps/web/src/app/datenschutz-dossier/page.tsx`
- Aktive Verarbeitung zusätzlich auf Action-Ebene gehärtet
  - `/create`: Start, Weiterführung, Save, Handoffs
  - `/swipes`: Vote-Persistenz
  - `/dossier`: Vote, Watchlist, Klärungsanfrage, Companion-Nachfrage

## Verifikation

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web exec vitest run tests/privacy-consent.contract.test.ts tests/privacy-gate-dialog.contract.test.tsx tests/create-privacy-gate.contract.test.ts tests/swipes-privacy-gate.contract.test.ts tests/dossier-privacy-gate.contract.test.ts tests/live-click-hardening.contract.test.ts tests/create-entry-hierarchy.contract.test.tsx tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`

## Ergebnis

- Typecheck: grün
- Lint: grün
- Build: grün
- Privacy-/Guard-Contracts: grün
- bestehende Create-/Live-Click-Contracts: grün

## Browser-QA

- Revalidierung gegen lokalen Browserlauf auf `http://127.0.0.1:3001/start`
- Desktop Light:
  - vor Interaktion bleibt öffentliches Lesen offen (`gateVisible=false`, kein `inert`, kein Scroll-Lock)
  - Klick auf `Thema prüfen` öffnet den Gate statt direkt zu navigieren
  - nach Bestätigung mit `Nur Notwendiges nutzen` schließt der Gate sauber
  - erneuter Klick auf `Thema prüfen` führt weiter nach `/create?intent=check`
- Desktop Dark:
  - ruhige, lesbare Dark-Variante ohne überzeichnete CTA-Gewichtung
- Mobile `390px` Light:
  - Gate bleibt einspaltig, ohne übergroßes Overlay oder abgeschnittene Primäraktion
- Screenshots:
  - `docs/E150/privacy-gate-qa/privacy-gate-desktop-light.png`
  - `docs/E150/privacy-gate-qa/privacy-gate-desktop-light-options.png`
  - `docs/E150/privacy-gate-qa/privacy-gate-desktop-dark.png`
  - `docs/E150/privacy-gate-qa/privacy-gate-mobile-light.png`

## Hinweise

- Während der Browser-QA wurde ein echter Produktfehler behoben: der Gate blockierte zunächst auch bloßes öffentliches Lesen. Jetzt öffnet er erst bei aktiven Start-/Create-/Beteiligungsaktionen bzw. aktiver Verarbeitung.
- Ein möglicher Folgeslice bleibt nur dann nötig, wenn `externalMedia` oder weitere optionale Kategorien später noch tiefer produktweit ausgewertet werden sollen.
