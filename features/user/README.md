# User Feature

## Übersicht

Das `features/user/`-Modul enthält:
- **UserProfile-Model**: Datenstruktur für User (inkl. Multi-Rollen, TrustScore, Badges, Voting-Historie, Status, Premium, Verifikation, Geo, etc.).
- **Utils**: Onboarding-Logik und TrustScore-Berechnung.
- **Hooks**: Permission-Checks für rollenbasiertes Rechtemanagement im Frontend.
- **Komponenten**: UserDashboard für dynamische, statusbasierte User-Interfaces.
- **Tests**: Unit-Tests für Onboarding-Logik (Jest).

## Wichtige Dateien

- `models/UserProfile.ts`: Hauptdatenmodell inkl. Multi-Account-Support.
- `utils/onboarding.ts`: Helper für Onboarding-Status, Fortschritt, User-Journey.
- `hooks/usePermission.ts`: React-Hook für Berechtigungsprüfungen in Komponenten.
- `components/UserDashboard.tsx`: Dashboard-Komponente mit dynamischer Anzeige nach Rolle, Status, Premium.
- `__tests__/onboarding.test.ts`: Tests für Onboarding- und Statuslogik.

## Onboarding-Status

Das System unterscheidet verschiedene Stufen:
- **"none"**: Nicht verifiziert (keine Mail/Telefonbestätigung)
- **"verified"**: Basis-Check bestanden
- **"legitimized"**: Bürger-ID/Wohnort geprüft (regionale Beteiligung möglich)
- **Premium**: Bezahlstatus, exklusive Features

## Rollen

- **user/citizen**: Privatperson, kann Beiträge verfassen und voten.
- **ngo**: Organisation, Subrollen: admin, editor, user.
- **politics/party**: Partei/Bewegung, Subrollen: admin, speaker, user.
- **moderator/admin**: Höhere Rechte, globale Kontrolle.
- **multi-account**: User kann mehrere Rollen parallel besitzen.

## Erweiterung

Weitere Rollen, Status oder Features lassen sich problemlos hinzufügen (siehe Typen und Permission-Hook).

---
