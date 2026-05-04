# PR-UX-PRICING-02 – Umsetzungsnachweis

Stand: 2026-05-04  
Status: done

## Umgesetzt
- `apps/web/src/app/pricing/page.tsx` als öffentliche B2C-Entscheidungsseite vereinfacht:
  - Hero-Copy auf kostenlosen Einstieg fokussiert (Themen swipen/Hinweise einbringen),
  - CTA-Set ergänzt:
    - `Kostenlos starten`
    - `Anonym / vertraulich Hinweis geben`
    - `Paket wählen`
    - `Professionell nutzen`
    - `Kontakt aufnehmen`
  - Vier B2C-Pfade im Fokus (`Beteiligung frei`, `Interessiert`, `Aktiv`, `Mitgestaltend`),
  - Jahresvorteil klar benannt: `Jahreszahlung spart 15 %`, Monatszahlung bleibt möglich,
  - Segmentauswahl visuell nachrangig als `details`-Block.
- Trust-Block ergänzt:
  - freiwillige Nutzung,
  - eDebatte strukturiert Informationen, keine Umsetzungs-Garantie,
  - Anonym/Nickname/Klarname je Kontext,
  - nachvollziehbare Zählung,
  - Widerruf/Kündigung/Datenschutz,
  - keine amtliche Wahl ohne explizit rechtssicheres Verfahren.
- Mitgliedschaftstrennung geschärft:
  - Mitgliedschaft bleibt freiwillig und getrennt vom Paketkauf.

## Tests
- Pricing-Contracts aktualisiert und grün, u. a.:
  - `tests/pricing-page.contract.test.ts`
  - `tests/pricing-main-page-simplified-decision-flow.contract.test.ts`
  - `tests/pricing-membership-block-clarity.contract.test.ts`
  - `tests/pricing-short-main-flow.contract.test.ts`
  - `tests/pricing-b2b-secondary-only.contract.test.ts`
  - `tests/pricing-order-shared-entry.contract.test.tsx`

## Offene Decision Boundaries
- Finale juristische Formulierungen zu verbindlichen/rechtssicheren Abstimmungen.
- Finale Legal-/Security-Formulierung für vertrauliche Hinweise bleibt in separater Klärung.
