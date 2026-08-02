# VOG-PUBLIC-BALLOT-ENTRY-01 · Implementierung und Evidence

Stand: 2026-08-02

Branch: `fix/vog-public-ballot-entry-01`

Draft-PR: `#557`

Basis vor Implementierung: `origin/main@56aea8e4d336328482ad1ca886f8ed942f18dfe0`

## Ergebnis

Der Slice ergänzt einen direkten, VOG-spezifischen Public-Ballot-Pfad auf der
bestehenden QR-Frage- und Vote-Persistenz:

```text
/vog/fragen/{setCode}/{questionId}
  ?source=vote4gov
  &origin=voiceopengov
  &origin_id=vog-question-01
  &locale=de
```

Die Route öffnet die konkrete Frage ohne vorgeschalteten Login. Sie verwendet
weder `/qr/[code]` noch eine kopierte Resolver-, Redirect- oder Auth-Runtime aus
PR `#520`. `source`, `origin`, `origin_id` und `locale` werden ausschließlich als
validierte Metadaten behandelt. Der serverseitige Release-Contract bleibt die
einzige Freigabewahrheit.

## Root Cause und reale Runtime vor diesem Slice

### Vorhandene Einstiege

- Im eDebatte-Repo existierte kein dedizierter Vote4Gov- oder VOG-Fragenlink.
- `/qr/[qrId]` löste QR-Codes über `/api/qr/resolve` auf. Aktive
  `qr_question_sets` wurden als `set` an `QuestionSetClient` übergeben.
- `QuestionSetClient` lud `/api/qr/sets/[code]` und sendete Stimmen an
  `/api/qr/sets/[code]/vote`.
- Allgemeine VoiceOpenGov-Links im Repo führten zur Initiative oder zu
  Membership-/Informationsflächen, nicht zu einer konkreten VOG-Grundfrage.
- Es gab im Repo weder eine produktive VOG-Grundfragen-Fixture noch einen
  kanonischen `vog-question-01`-Datensatz. Deshalb war ein konkreter öffentlicher
  End-to-End-Fragenlink vor diesem Slice nicht nachweisbar.

### Login- und Verifikations-Gate

- Die QR-Vote-Route verlangte bei `publicAttribution === "public"` zuerst
  `u_id` und anschließend `u_verified === "1"`.
- `allowAnonymousVoting` war kein eigenständiger Public-Release-Vertrag. Das
  Feld entschied nur, wie die technische `sessionId` abgeleitet wurde.
- Die Stream-Vote-Route koppelte zusätzlich
  `requireVerifiedParticipants`, `publicAttribution` und
  `allowAnonymousVoting` an denselben Vote-Pfad.

### Bereits mögliche Gaststimmen

- Die öffentliche QR-Set-Erstellung setzte Fragen ohne Creator-Kontext auf
  `publicAttribution: "hidden"` und `allowAnonymousVoting: true`.
- Damit waren Gaststimmen technisch bereits möglich. Diese Konfiguration
  belegte aber weder VoiceOpenGov-Herkunft noch öffentliche VOG-Freigabe oder
  demokratische Legitimationsklasse.
- Dieser Slice ändert die globale Bedeutung beider Felder nicht. Eine VOG-Frage
  benötigt zusätzlich einen vollständigen `vog-public-ballot-v1`-Release.

### Attribution, Legitimation und Mehrfachstimmen

- `publicAttribution` vermischte öffentliche Namenszuordnung mit einem
  Login-/Verifikations-Gate.
- `allowAnonymousVoting` vermischte Gastzugang mit der technischen
  Teilnehmerkennung.
- Eine ausdrückliche Legitimationsklasse für offene Konsultation gegenüber
  verifizierter VOG-Mitgliederentscheidung fehlte.
- Anonyme QR-Stimmen wurden aus Roh-IP, vollständigem User-Agent, Set-Code und
  Frage gehasht. Die Rohwerte landeten nicht im Vote-Dokument, bildeten aber
  allein die pseudonyme Session-Grundlage. Der QR-Resolver schrieb außerdem
  Roh-IP und vollständigen User-Agent in `qr_scans`; dieser von PR `#520`
  geführte Resolverpfad wurde hier nicht verändert oder verwendet.
- `updateOne(..., { upsert: true })` aktualisierte gleiche Session-/Frage-Filter,
  aber es war im betrachteten QR-Pfad kein dedizierter Unique Index für diese
  Idempotenz erkennbar.
- Die QR-Ergebnisprojektion aggregierte alle Stimmen einer Frage ohne
  Beteiligungs- oder Legitimationsklasse.

### Produktiv, Fixture, Vertrag oder geplant

| Teil | Wahrheitsstand vor dem Slice |
| --- | --- |
| QR-Set GET und Vote-POST | produktiver Codepfad |
| `allowAnonymousVoting` / `publicAttribution` | produktive QR-/Stream-Felder mit überlagerter Semantik |
| IP-/User-Agent-basierte Session | produktiver QR-/Stream-Code |
| QR-Summary | produktive, nicht nach Legitimation getrennte Projektion |
| VOG-Public-Ballot-Release | nicht vorhanden |
| Direkter Vote4Gov-/VOG-Fragenlink | nicht vorhanden |
| 50 VOG-Grundfragen | nicht als produktive Repo-Daten vorhanden; weiterhin außerhalb dieses Slices |
| Verifiziertes VOG-Mitgliedermandat | Governance-/Eligibility-Entscheidung weiterhin nicht implementiert |

## Zugangs-, Attributions- und Legitimationsmodell

| Dimension | Neuer Vertrag |
| --- | --- |
| Zugang | `accessMode: "public_guest"` plus `publicRelease: true` und `publicVotingEnabled: true` |
| Attribution | `attributionMode: "hidden"`; keine öffentliche Namenszuordnung |
| Legitimation | `legitimacyClass: "open_public_consultation"` |
| gespeicherte Gastklasse | `participationClass: "open_guest"` |
| getrennte Mitgliederklasse | `participationClass: "verified_vog_member"` wird ausschließlich getrennt projiziert; dieser Slice erzeugt sie nicht |
| Ergebnisstatus | `public_consultation`, niemals repräsentativer Bevölkerungswille |

Der Release ist fail-closed und verlangt gleichzeitig:

- aktives bestehendes QR-Fragen-Set,
- bestehende Frage mit `publicAttribution: "hidden"`,
- bestehende Frage mit `allowAnonymousVoting: true`,
- Contract-Version `vog-public-ballot-v1`,
- ausdrückliche Public- und Vote-Freigabe,
- VOG-Origin-ID,
- DE- und EN-Fassung mit identischer Optionsanzahl,
- mindestens eine HTTPS-Quelle und eine Gegenposition,
- Lifecycle und Ergebnis-Sichtbarkeitsregel.

Nur ein bestehender Admin mit dem kanonischen Admin-/2FA-Gate kann den
additiven Release über
`PUT /api/admin/vog/public-ballots/[code]/[questionId]` setzen. Der Endpunkt
ändert `allowAnonymousVoting` und `publicAttribution` nicht still; inkompatible
Fragen werden mit `409` abgelehnt. Release-Mutationen verlangen zusätzlich
Same-Origin, `Sec-Fetch-Site: same-origin` und einen expliziten CSRF-Intent.

## Datenschutz, Idempotenz und Missbrauchsschutz

- Beim ersten erfolgreichen Vote wird ein zufälliges 256-Bit-Token als
  erstseitiges `HttpOnly`-Cookie gesetzt.
- Cookie: Host-only, `SameSite=Lax`, `Secure` in Production, Pfad `/`, Laufzeit
  90 Tage.
- Im Vote-Dokument liegt ausschließlich SHA-256 des Zufallstokens.
- Der neue Vote-Datensatz enthält weder Roh-IP noch vollständigen User-Agent.
- IP wird nur im Requestspeicher gehasht und als nicht umkehrbarer Subject-Hash
  an das getrennte kurzlebige persistente Rate-Limit übergeben.
- Gasttoken und IP besitzen getrennte Minutenlimits. Fällt der persistente
  Limiter aus, schlägt die Mutation fail-closed fehl.
- Vote-POST verlangt Same-Origin, `Sec-Fetch-Site: same-origin`, expliziten
  CSRF-Intent und ein begrenztes Request-Volumen.
- Ein partieller Unique Index über Set, Frage, Beteiligungsklasse und
  Gasttoken-Hash macht den Upsert auch bei Parallelität idempotent.
- Eine neue Auswahl aktualisiert das vorhandene Dokument. Sie erzeugt keine
  zweite Stimme.
- `source`, `origin` und `locale` werden allowlist-validiert und nur beim ersten
  Insert gespeichert. `origin_id` stammt immer aus dem Release-Contract und
  kann durch Query oder Body nicht überschrieben werden.
- Das Gasttoken wird nicht mit `u_id`, `userHash` oder einem späteren Login
  verbunden.

Der sichtbare Methodenhinweis bleibt bewusst ehrlich: Ohne verifizierte
Identität kann Mehrfachteilnahme reduziert, aber nicht vollständig verhindert
werden.

## Beteiligungspass

Nach einer erfolgreichen Gaststimme beziehungsweise bei einem wiederkehrenden
Gasttoken zeigt die Oberfläche:

- eigene Auswahl und idempotente Aktualisierung,
- Stimmen insgesamt,
- offene Gaststimmen,
- explizit verifizierte VOG-Mitgliedsstimmen als getrennte Klasse,
- Optionen und Zählstände,
- Release-Zeitraum,
- Status `Öffentliche Konsultation`,
- Nicht-Repräsentativitäts- und Mehrfachteilnahmehinweis,
- Quellen und Gegenpositionen,
- freiwilligen Login erst nach der Stimme.

Eine spätere Mitglieder-Vote-Mutation ist nicht Teil dieses Slices. Solange
kein freigegebener VOG-Membership-/Eligibility-Vertrag existiert, erzeugt der
neue Gastpfad niemals `verified_vog_member` und konvertiert keine Gaststimme.

## Zustände, Sprache und Accessibility

- Missing/ungültiger Release: fail-closed ohne Vote-CTA; Herkunftsparameter
  können den Zustand nicht öffnen.
- Scheduled und Closed: konkrete Frage bleibt lesbar, Vote-Controls sind
  deaktiviert.
- Bereits abgestimmt: Auswahl und Update-Möglichkeit statt Doppelzählung.
- Rate limit: eigener `429`-Zustand mit `Retry-After`.
- Network: keine Erfolgsbestätigung und keine Offline-Synchronisationsbehauptung.
- Ergebnisprojektion nach erfolgreichem Write: Vote-Erfolg bleibt ehrlich
  bestätigt; ein separat ausgefallener Beteiligungspass wird als vorübergehend
  nicht verfügbar ausgewiesen.
- DE/EN, getrennte Original- und Lesesprache.
- Native Radio-Inputs, `fieldset`/`legend`, Tastaturbedienung, sichtbare
  Touch-Ziele, `aria-live`-Status und fokussierbare Statusmeldung.
- Kompakter Mobile-first-Kopf zeigt Frage, Kurzkontext, Optionen und
  Beteiligungsklasse vor allgemeiner Navigation oder Login.

## Konkrete Kollisionsmatrix PR #557 ↔ PR #520

PR `#520` bleibt offener Draft auf `fix/qr-public-entry-02-main-sync`. Kein
Commit wurde gemergt, cherry-gepickt oder nachgebaut. Gegen den bei Start
gelesenen Dateistand von PR `#520` ergibt sich:

| Von PR #520 geführte Datei | Änderung in PR #557 | Ergebnis |
| --- | --- | --- |
| `apps/web/src/app/api/auth/2fa/email-code/shared.ts` | keine | geschützt |
| `apps/web/src/app/api/auth/2fa/select-method/route.ts` | keine | geschützt |
| `apps/web/src/app/api/auth/login/route.ts` | keine | geschützt |
| `apps/web/src/app/api/auth/sharedAuth.ts` | keine | geschützt |
| `apps/web/src/app/api/auth/verify-2fa/route.ts` | keine | geschützt |
| `apps/web/src/app/api/streams/sessions/[id]/agenda/route.ts` | keine | geschützt |
| `apps/web/src/app/login/LoginPageClient.tsx` | keine | geschützt |
| `apps/web/src/app/qr-studio/QrStudioTargetPreview.tsx` | keine | geschützt |
| `apps/web/src/app/qr-studio/page.tsx` | keine | geschützt |
| `apps/web/src/app/qr/[qrId]/page.tsx` | keine | geschützt |
| `apps/web/src/app/runden/RundenShareActions.tsx` | keine | geschützt |
| `apps/web/src/app/studio/StudioCodeWorkspaceClient.tsx` | keine | geschützt |
| `apps/web/src/app/studio/StudioTargetWorkspace.tsx` | keine | geschützt |
| `apps/web/src/app/studio/page.tsx` | keine | geschützt |
| `apps/web/src/components/auth/TwoFactorSetupClient.tsx` | keine | geschützt |
| `apps/web/src/features/create/finalizeRedirect.ts` | keine | geschützt |
| `apps/web/src/features/qr/publicEntry.tsx` | keine | geschützt |
| `apps/web/src/features/qr/security.ts` | keine | geschützt |
| `apps/web/src/features/wrapper/mobileAppShellContract.ts` | keine | geschützt |
| `apps/web/src/features/wrapper/mvpSurfaceContract.ts` | keine | geschützt |
| `apps/web/src/features/wrapper/productSurfaceLayoutContract.ts` | keine | geschützt |
| `apps/web/src/hooks/useLoginFlow.ts` | keine | geschützt |
| `apps/web/src/lib/security/internalNavigation.ts` | keine | geschützt |
| `apps/web/tests/auth-2fa-login-flow.contract.test.tsx` | keine | geschützt |
| `apps/web/tests/auth-shared.redirect-contract.test.ts` | keine | geschützt |
| `apps/web/tests/content-release-workbench.test.ts` | keine | geschützt |
| `apps/web/tests/internal-navigation-security.contract.test.ts` | keine | geschützt |
| `apps/web/tests/legacy-qr-routes.redirect.test.ts` | keine | geschützt |
| `apps/web/tests/live-campaign-entry.contract.test.tsx` | keine | geschützt |
| `apps/web/tests/live-qr-entry.contract.test.tsx` | keine | geschützt |
| `apps/web/tests/mobile-app-shell-contract.test.ts` | keine | geschützt |
| `apps/web/tests/mobile-entry-routes.contract.test.tsx` | keine | geschützt |
| `apps/web/tests/product-surface-shell.contract.test.tsx` | keine | geschützt |
| `apps/web/tests/qr-studio-security.contract.test.tsx` | keine | geschützt |
| `apps/web/tests/qr-studio-target-ui.security.test.tsx` | keine | geschützt |
| `apps/web/tests/qr-studio-target.contract.test.ts` | keine | geschützt |
| `apps/web/tests/runden-qr-participation-language.contract.test.tsx` | keine | geschützt |
| `apps/web/tests/share-ready-asset-contract.test.ts` | keine | geschützt |
| `apps/web/tests/stream-agenda-qr-target.security.test.ts` | keine | geschützt |
| `apps/web/tests/stream-agenda-route-qr.security.test.ts` | keine | geschützt |
| `apps/web/tests/studio-code-workspace.error-state.test.tsx` | keine | geschützt |
| `apps/web/tests/topic-public-page.contract.test.tsx` | keine | geschützt |
| `apps/web/tests/wrapper-mvp-surface-contract.test.ts` | keine | geschützt |
| `docs/E150/QR-PUBLIC-ENTRY-02_2026-07-25.md` | keine | geschützt |
| `docs/E150/QR_INTERNAL_REDIRECT_HARDENING_01.md` | keine | geschützt |
| `docs/E150/STUDIO-OPERATOR-EVENT-DISTRIBUTION-01_2026-07-29.md` | keine | geschützt |
| `features/anlassraum/shareReadyAssetContract.ts` | keine | geschützt |
| `features/qr/qrStudioTargetContract.ts` | keine | geschützt |
| `features/stream/publicRuntime.ts` | keine | geschützt |

Dateiüberschneidung: **0**. Auch die vom Nutzer zusätzlich als #520-geführt
markierte `apps/web/src/app/qr/[qrId]/QuestionSetClient.tsx` bleibt unverändert.

Minimale spätere Integration nach Merge/Rebase von PR `#520`:

- optionaler QR-Code oder Studio-Link darf auf den bereits kanonischen
  `/vog/fragen/...`-Href zeigen;
- Ziel-/Redirectvalidierung dafür bleibt vollständig Eigentum von PR `#520`;
- dieser PR benötigt keine Änderung an `/qr/[code]`, Auth-Redirects oder
  `features/qr/security.ts`.

## Übrige offene PRs bei Start

| PR | Scope | Direkte Dateiüberschneidung mit diesem Slice |
| --- | --- | --- |
| `#558` | Voxy Modern Character Runtime Foundation | 0 |
| `#556` | Marketing Regional Agent Runs | 0 |
| `#555` | Ökosystem-Markenvertrag, `OpenTasks.md` | 0; `OpenTasks.md` bleibt hier unverändert |
| `#553` | Agentic-Runtime-Dokumentation | 0 |
| `#536` | Admin Region | 0 |
| `#527` | Home/Voxy Landing, `OpenTasks.md` | 0; `OpenTasks.md` bleibt hier unverändert |
| `#521` | Foundation Canon und `AGENTS.md` | 0; nur als Referenz gelesen |
| `#520` | QR/Auth/Redirect/Security | 0; vollständige Matrix oben |

Die zwischenzeitlichen Vote4Gov-Änderungen zu Abo-Demonstration,
Cookie-/Tracking-Kritik und ausgeblendetem Atlas sind nicht Bestandteil dieses
eDebatte-PRs.

## Geänderte Flächen

- Domain-Contract: `features/vog/publicBallotContract.ts`
- VOG-Readmodel und Vote-Security: `apps/web/src/features/vog/*`
- additive öffentliche Route: `apps/web/src/app/vog/fragen/[code]/[questionId]/*`
- additive Public-Vote-API: `apps/web/src/app/api/vog/public-ballots/...`
- additive Admin-/2FA-Release-API: `apps/web/src/app/api/admin/vog/public-ballots/...`
- bestehender Vote-Dokumenttyp um additive Projektionsfelder erweitert
- fokussierte Contract-, Readmodel-, Release-, Vote-, Page- und Render-Tests

`docs/E150/OpenTasks.md` bleibt absichtlich vollständig unverändert und muss
vor Abschluss byte-identisch zu `origin/main` nachgewiesen werden.

## Tests und Smokes

- Fokussierte VOG-Suite: `6` Testdateien, `24/24` Tests grün.
- VOG plus angrenzende QR-, Stream-, Rate-Limit- und Auth-Regression:
  `18` Testdateien, `84/84` Tests grün.
- Production Guardrails: Public Routes `7/7`, Admin Review `6/6`, Publish
  Guardrails `23/23`; insgesamt `36/36` grün.
- `pnpm -C apps/web run typecheck`: grün.
- `pnpm -C apps/web run lint`: grün.
- `git diff --check`: grün.
- Security-Scan im neuen Scope: kein Roh-IP-, User-Agent-, `u_id`-,
  `u_verified`- oder `userHash`-Write; IP erscheint ausschließlich als sofort
  gehashter Rate-Limit-Subject.
- Vollständiger lokaler Build: Page-Contract-Check, Compiler und TypeScript
  grün; Page-Data-Collect stoppt am bestehenden secret-freien Worktree-Gate
  wegen fehlender Pflicht-ENV (`JWT_SECRET`, Datenbank- und Graph-Runtime). Es
  wurde keine ENV-Datei gelesen oder verändert und der Build wird deshalb
  ausdrücklich nicht als vollständig grün gewertet.

Der vollständige Vercel-Build und Preview-Smoke werden nach dem Push über die
bestehenden Checks von Draft-PR `#557` verifiziert und im PR dokumentiert.

## Bewusst offen

- Keine der 50 VOG-Grundfragen wird in diesem PR erfunden oder automatisch
  veröffentlicht. Eine reale Frage muss über den Admin-/2FA-Release mit
  freigegebenen DE/EN-Texten, Quellen und Gegenpositionen gebunden werden.
- Der echte externe Vote4Gov-/VoiceOpenGov-Link muss im jeweils zuständigen
  externen Produkt auf den hier erzeugten `publicHref` gesetzt und in Preview
  beziehungsweise Production manuell gesmoked werden.
- Ein verifiziertes VOG-Mitgliedermandat benötigt weiterhin einen freigegebenen
  Membership-, Eligibility-, Doppelzählungs- und Consent-Vertrag. Der Slice
  projiziert die Klasse getrennt, erzeugt sie aber nicht.
- Kein Merge, kein Ready-for-Review und kein Deployment erfolgt aus diesem PR.
