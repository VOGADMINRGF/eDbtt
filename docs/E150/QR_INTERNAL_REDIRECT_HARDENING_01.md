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

- prüft den unveränderten Rohwert vor `trim`, Kürzung, separatem URL-Parsing,
  Fragmententfernung oder anderer Normalisierung;
- lehnt rohe Backslashes, C0-Control-Zeichen, DEL, Tab, CR und LF ab;
- prüft dieselben Zeichen nach höchstens zwei Decoding-Schritten;
- lehnt Network Paths, unvollständige Prozentfolgen, Nicht-Hex-Oktette,
  abgeschnittene oder ungültige UTF-8-Folgen und größere Decoding-Tiefen ab;
- begrenzt Navigationsziele auf 1.000 Zeichen;
- verlangt für interne Ziele nach URL-Auflösung exakt die erwartete Origin;
- lehnt Browser-Normalisierungen ab, die Pfad, Query oder Fragment verändern würden;
- gibt bei Ablehnung keinen bereinigten Ersatzpfad zurück;
- liefert bei Erfolg Pfad, Query, Fragment, absolute URL und die begrenzt
  dekodierten Query-Einträge als gemeinsam geprüftes Ergebnis.

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

Die aktiven Studio-, Agenda-, Wrapper-, Auth- und Create-Consumer reichen ihren
Originalwert zuerst in den gemeinsamen Vertrag. Nach erfolgreicher Prüfung
verwenden sie nur dessen Ergebnis; insbesondere werden absolute Studio-Ziele
nicht erneut geparst und Wrapper-Pfade behalten Query und Fragment. Externe
Wrapper-Links werden erst nach einer fehlgeschlagenen internen Klassifikation
gegen ihren getrennten, eng begrenzten Protokollvertrag geprüft.

`sanitizeRedirect` liefert jetzt explizit `InternalRedirectPath | null`.
Ungültige Werte werden nicht mehr als `/` ausgegeben. Auth-Caller behandeln
`null` kontrolliert über ihren bereits dokumentierten rollenbezogenen
Post-Login- oder `/account`-Fallback; API-Antworten werden vor Client-Navigation
erneut mit demselben Vertrag geprüft.

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
- `/%`, `/%G0`, `/%GG`, abgeschnittene Multibyte-Sequenzen, ungültige
  UTF-8-Prozentfolgen sowie Kombinationen mit Backslash und Control-Zeichen;
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
- identische Rohwert-Klassifikation in Auth, QR, Studio, Wrapper und Agenda;
- unveränderte Query und Fragmente in allen akzeptierenden Consumer-Verträgen;
- das Fehlen von Agenda-Persistenz, QR-Erzeugung und Zieltest sowie das
  Ausbleiben jeder Navigation zum abgelehnten Rohwert.

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

`docs/E150/OpenTasks.md` wurde ausschließlich mechanisch und bytegleich auf den
aktuellen `origin/main`-Blob
`b590a495c8d22cf502a1fb8bc06b1ea85ce39e46` synchronisiert. Dabei wurde kein
Taskstatus geändert oder ergänzt. Nach vollständiger technischer Validierung ist für
`QR-INTERNAL-REDIRECT-HARDENING-01` maximal der Status `review` empfohlen. Die
kanonische Statusänderung bleibt dem alleinigen SSOT-Schreiber vorbehalten.
