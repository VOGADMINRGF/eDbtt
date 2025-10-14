# Organization Feature

## Übersicht

Das `features/organization/`-Modul verwaltet Organisationen, Parteien und Medien.

## Struktur

- **`models/Organization.ts`**: Organisationen-Datenmodell.
- **`utils/orgHelper.ts`**: Hilfsfunktionen für Premium-Checks, Limits.
- **`components/OrgDashboard.tsx`**: Dashboard-Komponente mit dynamischer UI.

## Features

- Verwaltung von Mitgliedern (mit Limits).
- Premium-Funktionen und Limits-Überwachung.
- Status- und Verifikationsanzeige.

## Erweiterbarkeit

Neue Subrollen, Rechte oder Limits können im Modell und den Helpern einfach ergänzt werden.
