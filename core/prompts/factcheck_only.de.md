Gib ausschließlich **gültiges RFC8259-JSON** zurück, ohne Markdown oder Erklärtext.

Eingaben:
- claims: {{claims}}              // Liste zu prüfender Aussagen (Strings)
- links: {{links}}                // erlaubte Quellen (Objekte mit url,type)
- media: {{media}}                // optionale Medienliste
- context: {{content}}            // Rohtext/Umfeld

Ausgabe-Schema (genau diese Keys):
{
  "locale": "de",
  "checks": [
    {
      "claim": "...",
      "verdict": "wahr|teilwahr|unbewiesen|falsch|irreführend",
      "confidence": 0.0,
      "rationale": "...",
      "evidence": [
        {
          "quote": "...",
          "source": { "url": "...", "type": "Quelle|Info|Medien" }
        }
      ],
      "suggestedCorrection": ""
    }
  ],
  "notes": []
}

Regeln:
- Verwende **nur** Quellen aus {{links}}. Keine neuen URLs erfinden.
- Wenn keine belastbaren Belege vorhanden: `verdict`="unbewiesen", `evidence`=[], `rationale` knapp erklären.
- `confidence` zwischen 0 und 1.
- `rationale` präzise, ohne Juristendeutsch; 1–3 Sätze.
- `suggestedCorrection` nur ausfüllen, wenn eine nüchterne Korrekturformulierung sinnvoll ist, sonst "".
- JSON MUSS parsbar sein (kein NaN/Infinity, keine trailing commas).
