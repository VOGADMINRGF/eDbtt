/**
 * Öffentlicher Report für die Nutzeransicht – enthält Kernbotschaften (Statements).
 * Wird für die Darstellung auf der Plattform genutzt.
 */
export interface Statement {
  id: string;                         // Eindeutige ID des Statements
  text: string;                       // Text der Kernbotschaft
  sentiment: "pro" | "contra" | "neutral"; // Bewertung durch User oder Redaktion
  votes?: number;                     // Optionale Stimmenanzahl für diese Botschaft
}

export interface PublicReport {
  id: string;                         // Eindeutige Report-ID
  title: string;                      // Titel des Berichts
  slug: string;                       // URL-Slug für Sharing/Links
  category: string;                   // Kategorie/Themenfeld
  region: string;                     // Regionale Zuordnung
  language: string;                   // Sprachcode (z. B. "de", "en")
  description: string;                // Kurzbeschreibung
  image?: string;                     // Optionales Vorschaubild
  createdAt: string;                  // Erstellungszeitpunkt
  createdBy: string;                  // User-ID des Erstellers
  statements: Statement[];            // Liste der Kernbotschaften
  streamId?: string;                  // Optional: verbundener Stream
}
