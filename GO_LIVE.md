# IT-Dart — Go-Live-Definition

Was erfüllt sein muss, bevor die Selbstregistrierung wieder geöffnet wird (aktuell auf Einladung beschränkt, siehe `CLAUDE.md`). Entwurf vom 2026-07-27, mit dem Nutzer abgestimmt — bei Bedarf hier weiter präzisieren, nicht als starr betrachten.

| Bereich | Punkt | Status |
|---|---|---|
| Rechtlich | Gewerbeanmeldung abgeschlossen | ✅ erledigt (2026-07-28) — Gegenstand siehe `dokumentation/18_Gewerbeanmeldung_Gegenstand.docx` |
| Rechtlich | AGB/Datenschutz/Impressum/Consent-Checkbox bei Registrierung | ✅ erledigt |
| Preismodell | Premium-Preis final festgelegt | ✅ erledigt (2026-07-28) — 3,99 €/Monat Einführungspreis, siehe `dokumentation/03_Vermarktungs_Preisstrategie.docx` Abschnitt 5.2 |
| Infrastruktur | Bezahlte Supabase-/Vercel-Tarife falls für echten Nutzerandrang nötig | ✅ erledigt — Supabase Pro (2026-07-28), Vercel Pro (2026-07-31) |
| Rechtlich | Betriebs-/IT-Haftpflichtversicherung abgeschlossen | ✅ erledigt (unterschrieben 2026-07-31, andsafe über Finanzchef24) — **gültig erst ab 2026-08-03**, Wartungsmodus bleibt bis dahin bewusst aktiv (To-Do #54) |
| Content | Hero-Bild auf der Unternehmensseite | ✅ erledigt (2026-07-27) |
| Content | Bereits generiertes 7er-Icon-Set einbinden | ✅ erledigt (2026-07-27) |
| Content | Alle 8 Kernmodule inhaltlich vollständig und geprüft | ✅ erledigt (2026-08-01) — Item-Zahlen gegen `totalItems` verifiziert, keine Platzhalter, ein doppelter `intro`-Key bereinigt |
| Compliance | Unit-Tests für `lernnachweis.js`/`websiteCheckReport.js`/`e2eReport.js` | ✅ erledigt (2026-07-27) |
| Compliance | Markenklassen-Frage IT-Dart-Kids (DPMA) | offen, liegt beim Anwalt/Anmelder — betrifft nur die zurückgestellte Kids-Submarke, nicht IT-Dart selbst |
| Rechtlich | Markenanmeldung "IT-Dart" (Wortmarke) beim DPMA | ✅ eingereicht (20.07.2026, Aktenzeichen 30 2026 239 824.3, Klassen 09/41/42, Gebühr 290 € gezahlt) — Eintragung selbst steht noch aus, ist aber keine Go-Live-Voraussetzung |

**Stand 2026-08-02: Alle harten Punkte sind erledigt oder terminiert.** Einzig verbleibende Hürde ist das Versicherungs-Datum (gültig ab 2026-08-03) — der Wartungsmodus (`WARTUNGSMODUS` in `src/App.jsx`) kann ab diesem Datum abgeschaltet werden, sofern der restliche "Vor Go Live"-Check (To-Do #74) bis dahin ebenfalls erledigt ist.

## Konkrete Schritte für 2026-08-03

1. Rest von To-Do #74 abschließen: E2E-Gesamtlauf übers Admin-Dashboard auslösen (grün abwarten) + die 5 bestätigten Test-Accounts (`+test8/9/10/11/15@gmail.com`) im Admin-Bereich löschen — beides bewusst erst nach Abschluss des manuellen Testens durch den Nutzer, da es gegen dieselbe Produktivdatenbank läuft.
2. `WARTUNGSMODUS` in `src/App.jsx` von `true` auf `false` setzen.
3. Committen + pushen (löst automatisches Vercel-Deployment aus).
4. Nach dem Deployment: `it-dart.de` in einem Inkognito-Fenster/ohne Login öffnen und prüfen, dass die echte Unternehmensseite (nicht mehr `WartungScreen.jsx`) erscheint.
5. PROJEKT-STATUS.md entsprechend aktualisieren.

**Nicht blockierend, aber gut vorher erledigt:** die beiden Compliance-Punkte sind Qualitäts-/Rechtsklarheits-Fragen, kein hartes Show-Stopper-Kriterium für den Go-Live selbst — anders als Gewerbeanmeldung und Preismodell, ohne die eine offene Registrierung geschäftlich/rechtlich keinen Sinn ergibt.

Siehe auch [COMPLIANCE.md](COMPLIANCE.md) für den detaillierten Compliance-Stand.
