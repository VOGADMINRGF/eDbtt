# Mobile Navigation Pattern (Core + Focus Modes)

Stand: 2026-03-17

## Ziel

- Mobile-Navigation auf Kernnutzung ausrichten.
- Utility-Elemente getrennt von Hauptnavigation halten.
- Vertikale Nutzfläche in Fokus-Flows (insbesondere Swipes/Eventualitäten) maximieren.

## Kernmuster

### 1) Core Bottom Navigation

- Primäre Tabs mobil: `Swipes`, `Create`, `Dossier`, `Profil`.
- Keine zusätzlichen Haupttabs in derselben Leiste.

### 2) Utility getrennt

- Inbox/Briefkasten als separate Utility mit Badge.
- Nicht als fünfter Haupttab in der Bottom-Nav.

### 3) Scroll-adaptives Verhalten

- Mobile Leisten nutzen `useMobileChromeVisibility`.
- Scroll nach unten: Leisten reduzieren/ausblenden.
- Scroll nach oben oder nahe Seitenanfang: Leisten wieder sichtbar.

## Swipe-Sondermodus

- In Swipes wird mobil `vog-mobile-swipe-focus` auf `body` gesetzt.
- Dadurch werden mobile Header-Ebenen reduziert:
  - Site-Header (`data-site-header="true"`) ausgeblendet.
  - Demo-Header (`data-demo-header="true"`) ausgeblendet.
- Ergebnis: mehr vertikale Fläche für Karte, Eventualitäten und Entscheidungsaktionen.

## Eventualitäten-Viewport

- Eventualitäten-Sheet mobil auf größere Höhe (`90dvh`) angehoben.
- Innenbereich mit zusätzlichem Bottom-Padding, damit letzte Varianten zuverlässig erreichbar bleiben.
- Footer-Controls kompakter (`min-h` reduziert), um weniger Inhalt zu verdecken.

## Hinweise

- Dieses Muster priorisiert in Vollfokus-Flows Inhalt + Primäraktionen.
- Utility bleibt erreichbar, aber konkurriert nicht mit der Kernnavigation.
