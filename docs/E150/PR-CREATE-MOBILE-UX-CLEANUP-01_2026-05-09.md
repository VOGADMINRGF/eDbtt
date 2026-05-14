# PR-CREATE-MOBILE-UX-CLEANUP-01

## Kontext

`/create` wirkte auf Mobile noch wie ein verdichtetes Desktop-Workspace: zu viele Karten, zu viele parallele CTAs, zu frueh sichtbare Analyse-/Statusmodule und ausbrechende Attachment-Vorschauen.

Die Slice reduziert die bestehende `/create`-Oberflaeche auf einen gefuehrten Dialog, ohne eine zweite Create-Welt neben dem kanonischen Flow aufzubauen.

## Umsetzung

- `SharedCreateComposer` nutzt fuer `/create` eine minimale Entry-Variante mit klarer Frage, grossem Texteingabefeld, kleinen Sekundaeraktionen und genau einer Primaeraktion.
- `CreateVisualFollowup` fuehrt mobil jetzt gestuft durch:
  - `Vorlaeufig verstanden` mit drei kompakten Karten
  - prominente Ortsklaerung bei vagem Ortsbezug
  - kompakter Strukturvorschlag mit `So uebernehmen`, `Aendern`, `Redaktionell pruefen lassen`
  - erst danach `Was moechtest du daraus machen?`
- Analyse-/Status-/Detailmodule bleiben erhalten, ruecken aber hinter Details-/Arbeitsmodus-Gates statt den Initialzustand zu ueberladen.
- Attachment-/Preview-Inhalte bleiben mobil gekapselt und koennen horizontal scrollen, statt als weisse Flaechen auszubrechen.
- Ein expliziter Wunsch nach redaktioneller Pruefung wird als manueller Review-Request gespeichert; keine automatische Veroeffentlichung und kein automatischer Faktencheck-/Deep-Search-Start.

## Relevante Dateien

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/api/contributions/save/route.ts`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/createSurfaceConfig.ts`

## Relevante Tests

- `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`
- `apps/web/tests/create-entry-i18n.render.test.tsx`
- `apps/web/tests/create-i18n-no-mixed-locale.contract.test.tsx`
- `apps/web/tests/create-no-chip-overload.contract.test.tsx`
- `apps/web/tests/create-attachment-layout.contract.test.ts`
- `apps/web/tests/create-save.safety-gate.test.ts`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
