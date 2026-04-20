# Manual-QA-Checkliste – Kritische Kernreisen (2026-04-12)

## Verbindliche Regel

Diese Checkliste ist Pflicht für Releases mit Änderungen an Auth, Rollenrouting, Dashboards, Pricing, Orderflow oder Add-ons.

Zusatzregel Final Closure:

- Oeffentlich nur: **fertig und abgesichert**
- Sonst: **intern, nicht versprochen** oder **aus oeffentlicher UX entfernt**

## 1) Registrierung

- [ ] Registrierung kann vollständig abgeschlossen werden.
- [ ] Fehlerzustände (`invalid_input`, `rate_limited`, Human-Check) sind verständlich.
- [ ] Weiterleitung nach erfolgreicher Registrierung entspricht Rollen-/Zielbildvertrag.

## 2) Login und Wiederanmeldung

- [ ] Login mit gültigen Daten funktioniert.
- [ ] 2FA-Pfade funktionieren konsistent (falls aktiv).
- [ ] Wiederanmeldung respektiert sichere `next`-Parameter.
- [ ] Nicht-Admin landet nicht auf Admin-Routen.

## 3) Rollenrouting

- [ ] Bürger:innen landen auf Account-Kontext.
- [ ] freie Journalist:innen landen auf Journalismus-Kontext.
- [ ] Organisationen landen auf Organisations-Kontext.
- [ ] Kommunen landen auf Kommunen-Kontext.
- [ ] Admin/Backoffice landet auf `/admin`.

## 4) Dashboard-Erstansicht

- [ ] Headline und Primärmodule passen zur Rolle.
- [ ] Primär-CTA passt zur Rolle.
- [ ] Keine unbegründeten Fremdmodule sichtbar.
- [ ] Keine Sackgassen oder leeren Endzustände ohne nächste Aktion.

## 5) Paketwahl und Add-on-Wahl

- [ ] Segmentfokus zeigt relevante Pakete direkt sichtbar.
- [ ] Paketunterschiede sind klar lesbar.
- [ ] Add-ons zeigen USP, Einsatzkontext, Empfehlung, Bestellbarkeit.
- [ ] Add-ons zeigen Reifestand sichtbar.

## 6) Bestellung und Bestätigung

- [ ] Bestellung kann direkt abgesendet werden.
- [ ] Bestätigung zeigt: Paket, Preis/Modell, Add-ons, Next Steps.
- [ ] Für institutionelle Segmente ist Review vor Aktivierung klar ausgewiesen.

## 7) Review-/Freigabeflow (Admin)

- [ ] Pricing-Orders sind im Admin-Bereich aufrufbar.
- [ ] Statuswechsel funktioniert innerhalb gültiger Übergänge.
- [ ] Interne Notiz kann erfasst werden.
- [ ] Freigabe/Ablehnung ist nachvollziehbar.

## 8) Copy gegen Systemreife

- [ ] Kein überzogener Aktivierungsclaim (kein „voll aktiv“ ohne Systemgrundlage).
- [ ] Formulierungen folgen Reifestand (`bestellbar`, `intern geprüft`, `Folgeabstimmung`, `im Ausbau`).
- [ ] Keine internen System-/Tier-Namen im UI.

## 9) Wrapper / Shell / Layout-Hardening

- [ ] `/pricing`, `/vormerken`, `/pricing/institutionen` sind mobile-first sauber eingebettet.
- [ ] Keine Doppel-Wrapper oder widersprüchlichen Container auf diesen Flächen.
- [ ] Header-/Footer-/Bottom-Bar-Übergänge wirken konsistent (kein abgeschnittener Content).
- [ ] Safe-Area-/Bottom-Spacing erzeugt keine unnötigen Leerzonen am Seitenende.
- [ ] Segmentfokus und Add-on-Karten verursachen keinen Layout-Drift zwischen Mobile/Tablet/Desktop.

## Go/No-Go

- Go nur, wenn alle Pflichtpunkte erfüllt sind.
- No-Go bei Bruch von Rollenrouting, irreführender Reifestands-Copy oder unklaren Order-Followups.

## Device-/Browser-Run-Protokoll (Release Ops)

- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] Desktop DE
- [ ] Desktop EN

Hinweis:
- Diese vier Checks sind als verpflichtender Release-Operations-Schritt zu dokumentieren.
