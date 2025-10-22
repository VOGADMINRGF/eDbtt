// features/analyze/clarify.ts
export function needsClarify(input: { text: string; categoryMain?: string | null; region?: string | null }) {
    const tooShort = input.text.trim().split(/\s+/).length < 6;
    const generic =
      !input.region &&
      /^(Wirtschaft|Preise|Tarife|Meinung|Allgemein)?$/i.test(input.categoryMain || "");
    return tooShort || generic;
  }
  
  export function clarifyForPrices() {
    return {
      ask: [
        "Welche Preiserhöhungen genau? (Strom, Gas, Miete, ÖPNV, Gebühren, Lebensmittel, Pharma)",
        "Welche Region/Träger? (Bund, Land, Kommune, Stadtwerk, Verkehrsverbund)",
        "Welche Zielgruppe? (Haushalte, Unternehmen, bestimmte Branche)"
      ],
      options: [
        { key: "strom",        label: "Strom" },
        { key: "gas",          label: "Gas" },
        { key: "miete",        label: "Mieten" },
        { key: "oepnv",        label: "ÖPNV" },
        { key: "gebuehren",    label: "Kommunale Gebühren" },
        { key: "lebensmittel", label: "Lebensmittel" }
      ],
      quickSources: [
        { name: "Destatis",            url: "https://www.destatis.de" },
        { name: "Verbraucherzentrale", url: "https://www.verbraucherzentrale.de" },
        { name: "Bundesanzeiger",      url: "https://www.bundesanzeiger.de" }
      ]
    };
  }
  