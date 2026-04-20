# PR-QUALITY-HARM-01 – Registrierung, Rollenrouting, Dashboards und Erwartungspfade (2026-04-12)

## Ziel

Qualitätsslice zur operativen Absicherung von:
- Registrierung und Login-Pfaden
- Rollenrouting nach Login/2FA
- Dashboard-Zielbildern
- Pricing/Order-Followups inkl. interner Reviewpfade
- Add-on-Aussagen vs. tatsächliche Bestellbarkeit

Kein neues Feature-Set, sondern Contract-Härtung.

## 1) Rolle-zu-Zielbild-Matrix (SSOT)

Quelle: `apps/web/src/features/auth/roleExperienceContract.ts`

| Rolle | Post-Login Route | Post-Registration Route | Primärmodule | Primär-CTAs | Sichtbarkeit |
| --- | --- | --- | --- | --- | --- |
| Bürger:innen | `/account` | `/account?welcome=1` | Profil & Sicherheit, Paketstatus, Interessen/Themen | Pakete & Preise, Paket bestellen, Mitgliedschaft beantragen | Account sichtbar, Admin verborgen |
| freie Journalist:innen | `/account?context=journalismus` | `/account?context=journalismus&welcome=1` | Profil & Sicherheit, Paketstatus Journalismus, Anlassraum/Dossier-Start | Journalismus-Paket auswählen, Faktencheck optional | Account sichtbar, Admin verborgen |
| Organisationen/Verbände/Vereine | `/account?context=organisationen` | `/account?context=organisationen&welcome=1` | Paketstatus Institution, Bestell-/Review-Status, Governance-Kontext | Institutionelle Preise im Detail, Bestellung absenden, Gespräch optional | Account sichtbar, Admin verborgen |
| Kommunen/Verwaltungen | `/account?context=kommunen` | `/account?context=kommunen&welcome=1` | Paketstatus Kommune, Bestell-/Review-Status, Transparenz-/Report-Kontext | Institutionelle Preise im Detail, Bestellung absenden, Gespräch optional | Account sichtbar, Admin verborgen |
| Admin/Backoffice | `/admin` | `/admin` | Admin-Dashboard, Pricing Orders, Governance-Queues | Pricing Orders öffnen, Status ändern, Freigabe dokumentieren | Admin sichtbar |

## 2) Garantierte Pfade

- Login/2FA verwenden dieselbe Redirect-Policy:
  - interne `next`-Ziele werden respektiert
  - admin-only Ziele (`/admin`, `/dashboard`) sind für Nicht-Admin blockiert
  - ohne `next` wird rollenspezifisch geroutet
- Registrierung/Identity-Fortsetzung:
  - sicherer Fallback auf Post-Registration-Zielroute
  - unsafe Redirects werden verworfen
- `/register/preorder` bleibt Alias auf `/vormerken` mit sicherer Query-Normalisierung

## 3) Reviewpflichtige Pfade

- Privat/Journalismus: initial `submitted` (kein Pflicht-Review vor Aktivierung)
- Organisationen/Kommunen: initial `under_review` (interne Prüfung vor Aktivierung möglich)
- Order-Followup-Kontrakt ist zentralisiert in `features/pricing/domain/orderFollowup.de.ts`

## 4) Add-on-Reifestand

Quelle: `features/pricing/domain/institutionalPricing.de.ts`

Für jedes Add-on sind verbindlich vorhanden:
- USP
- wann sinnvoll
- für wen relevant
- redaktionelle Empfehlung
- Bestellbarkeit inkl. Folgeabstimmungs-Hinweis

Operativer Stand:
- Add-ons sind öffentlich auswählbar im Orderflow (segmentabhängig)
- Auswahl wird persistiert (`selectedAddOns`) und im Public Price Summary verständlich abgelegt
- institutionelle Aktivierung/Add-on-Umfang bleibt bei Bedarf review-/abstimmbar

## 5) Testabdeckung (neu/erweitert)

- `tests/auth-registration-flow.contract.test.ts`
- `tests/role-routing.contract.test.ts`
- `tests/dashboard-role-contracts.test.ts`
- `tests/pricing-order-role-followup.contract.test.ts`
- `tests/addon-availability-contracts.test.ts`
- erweitert: `tests/auth-login.route.test.ts`

Zusätzlich weiterhin aktiv:
- `tests/pricing-order-flow.contract.test.ts`
- `tests/pricing-preorder-segment.contract.test.ts`
- `tests/edebatte-preorder.route.test.ts`
- `tests/admin-pricing-orders.route.test.ts`

## 6) UX-Reifeaussage

Öffentliche Aussagen bleiben an den operativen Stand gekoppelt:
- bestellbar, reviewbar, nachvollziehbar
- keine Behauptung unkontrollierter Sofortaktivierung für institutionelle Pfade
- Add-ons werden als Produktbausteine gezeigt, nicht als automatisch vollautomatisierte Nebenengine
