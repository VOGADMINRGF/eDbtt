# QR-INTERNAL-REDIRECT-HARDENING-01

Stand: 2026-07-30

Task: `QR-INTERNAL-REDIRECT-HARDENING-01`

Issue: `#540`

Delivery: bestehender Branch `fix/qr-public-entry-02-main-sync`, Draft-PR `#520`

## Ziel

Der technische P0-Slice schließt den reproduzierten Origin-Escape bei vermeintlich
internen Redirect-, QR- und Studio-Zielen. Die drei öffentlichen Verträge
`normalizeInternalRedirectPath`, `validateQrTarget` und `resolveQrStudioTarget`
verwenden denselben fail-closed Kern.

Der Slice trifft keine Rollen-, Public-Data-, Protocol-, Scan-Privacy-,
Campaign-/Session- oder Retention-Entscheidung.

## Gemeinsame Sicherheitswahrheit

`apps/web/src/lib/security/internalNavigation.ts` ist der gemeinsame strukturelle
Vertrag. Er:

- lehnt rohe Backslashes, C0-Control-Zeichen, DEL, Tab, CR und LF ab;
- prüft dieselben Zeichen nach höchstens zwei Decoding-Schritten;
- lehnt Network Paths, malformed Encoding und größere Decoding-Tiefen ab;
- begrenzt Navigationsziele auf 1.000 Zeichen;
- verlangt für interne Ziele nach URL-Auflösung exakt die erwartete Origin;
- lehnt Browser-Normalisierungen ab, die Pfad, Query oder Fragment verändern würden;
- gibt bei Ablehnung keinen bereinigten Ersatzpfad zurück.

`validateQrTarget` ergänzt auf diesem Kern ausschließlich die bestehende engere
QR-Policy:

- nur die erwartete Origin;
- keine Credentials oder unsicheren Schemes;
- keine `/admin`-, `/api`- oder `/_next`-Ziele;
- keine sensitiven oder verschachtelten Redirectparameter;
- keine stillen Studio-Wrapper oder abgeschnittenen Zielwerte.

`resolveQrStudioTarget` besitzt keinen eigenen URL- oder Hostparser mehr. Der
Resolver adaptiert nur noch das Ergebnis von `validateQrTarget` für den
Studio-Vertrag.

## Ablehnungsverhalten

Ein abgelehntes Ziel:

- wird nicht zu `/` oder einem anderen Ziel umgeschrieben;
- wird nicht in einen Studio-Link übernommen;
- erzeugt keinen QR-Code;
- erzeugt keinen „Ziel testen“-Link;
- löst keine Navigation oder automatische Folgeaktion aus;
- erscheint nicht als sensitiver Rohwert im Fehlerzustand.

Der sichtbare Studio-Zustand meldet ausschließlich, dass das Ziel die
Sicherheitsregeln nicht erfüllt.

## Angriffsmatrix

Die gemeinsame parametrisierte Matrix prüft:

- `/\evil.example`;
- rohe Backslashes innerhalb interner Pfade;
- `%5C` und `%255C`;
- rohe, encodierte und doppelt encodierte C0-, NUL-, DEL-, Tab-, CR- und LF-Werte;
- `//evil.example` sowie encodierte Network Paths;
- mehrstufiges Encoding über der erlaubten Tiefe;
- `javascript:`, `data:`, `file:` und `vbscript:`;
- URLs mit Credentials;
- fremde HTTPS-Origins;
- Browser-Normalisierung durch Dot-Segmente;
- `/admin`, `/api` und `/_next`;
- sensitive Query-Parameter;
- einfache, encodierte und doppelt encodierte `next`-, `redirect`- und
  `target`-Parameter;
- maximale Länge und `max + 1`;
- erlaubte interne Pfade mit harmloser Query und Fragment;
- die Origin-Invariante für jedes akzeptierte Ziel;
- das Fehlen von QR-Erzeugung und Zieltest bei Ablehnung.

## Automatische Evidence

- fokussierte Auth-/QR-/Studio-Security: 5 Testdateien, 112 Tests grün;
- Web Critical Guardrails: 17 Testdateien, 63 Tests grün;
- Production Guardrails: 12 Testdateien, 36 Tests grün;
- `node scripts/ci/check-web-critical-guardrails.mjs`: grün;
- vollständiger nicht-inkrementeller Typecheck: grün;
- vollständiger Repository-Lint und dateigenaue Scope-Prüfung: grün;
- Production-Build mit der CI-konformen `apps/web/.env.example`-Umgebung:
  322 von 322 statischen Seiten grün;
- `git diff --check`: grün.

Die lokale Laufzeit meldete Node `25.9.0` statt des Repository-Ziels `20.x`.
Die GitHub-CI verwendet den kanonischen Node-20-Vertrag.

## Task-Lifecycle

`docs/E150/OpenTasks.md` bleibt in diesem Delivery-Branch unverändert. Nach
vollständiger technischer Validierung ist für
`QR-INTERNAL-REDIRECT-HARDENING-01` maximal der Status `review` empfohlen. Die
kanonische Statusänderung bleibt dem alleinigen SSOT-Schreiber vorbehalten.
