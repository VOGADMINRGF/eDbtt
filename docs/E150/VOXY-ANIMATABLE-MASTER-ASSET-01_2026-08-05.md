# VOXY-ANIMATABLE-MASTER-ASSET-01

Stand: 2026-08-11

## Kontrollbefund

Der lokale SVG-/Layer-/Masked-Raster-Weg wurde nach Human Review auf `#589@c6e2971f5ab5aa477258dbdeec6bf0671b8c1daf` verworfen. Attempt 6 erzeugte keine belastbare unabhängige Augen-/Armbewegung. Der Operator hat weitere lokale Masken-, Crop-, SVG-, CSS-Affine- oder Segmentierungsverfeinerungen ausdrücklich gestoppt.

Die zuvor erzeugten Rig-Layer, lokalen Renderer und deren dedizierter Render-Workflow sind deshalb keine akzeptierte kanonische Voxy-Identität und dürfen nicht als Grundlage nachgelagerter Runtime-/Studio-/Publishing-Slices behandelt werden.

## Technisch zulässiger Zustand

Der Branch enthält nur noch einen provider-neutralen, fail-closed Motion-Gate-Contract:

- kanonische visuelle Referenz bleibt `apps/web/public/brand/voxy/voxy-podcast-stage.png`;
- keine Providerentscheidung wird im Code vorweggenommen;
- keine Credentials oder Accounts werden angelegt oder aktiviert;
- kein externer Datentransfer findet statt;
- keine Retention-/Privacy-Annahme wird erfunden;
- kein Budget oder Spend wird freigegeben;
- kein generiertes Artefakt darf ohne explizite Human Visual Acceptance publiziert werden.

## Verbleibende Human Gates

1. `provider_selection` — Provider/Verfahren menschlich auswählen und freigeben.
2. `account_credentials` — Account- und Credential-Nutzung menschlich freigeben.
3. `external_data_transfer` — Übertragung der visuellen Quelle an einen externen Dienst freigeben.
4. `privacy_retention` — Datenschutz-, Retention- und Löschbedingungen prüfen und freigeben.
5. `budget_spend` — Kosten-/Budgetgrenze freigeben.
6. `visual_acceptance` — resultierende Voxy-Identität visuell gegen die kanonische Referenz abnehmen.

## Status

- technischer Zustand: `review`, sobald Exact-Head-Checks grün sind;
- operativer Zustand: `manual_gate`;
- PR bleibt Draft;
- kein Merge, kein Ready-for-Review, kein Production-Deployment, kein externes Publishing.

## Abhängigkeit zu #588

`#588` ist durch diesen Zustand **noch nicht freigegeben**. Der provider-neutrale Contract stabilisiert nur die technische Grenze. Eine belastbare kanonische animierbare Identität liegt erst nach den oben genannten menschlichen Gates und insbesondere nach `visual_acceptance` vor.

Wenn nach Exact-Head-Validierung ausschließlich diese Human Gates verbleiben, ist auf `#589` zu stoppen; es darf nicht künstlich weiterimplementiert werden.
