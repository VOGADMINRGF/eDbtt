// features/report/data/reportData.ts
import { Report } from "../types/Report";

const reportData: Report[] = [
  {
    id: "1",
    title: "Beteiligung an lokalen Wasserprojekten",
    description: "Ergebnisse der Abstimmung über die Nutzung kommunaler Wasserressourcen im Bezirk Berlin-Lichtenberg.",
    status: "Abgeschlossen",
    region: "Berlin",
    topic: "Wasser",
    language: "de",
    date: "2025-06-18",
    author: "Stadtverwaltung Berlin",
    likes: 33,
    bookmarks: 12,
    statements: { agreed: 25, rejected: 7, unanswered: 1 },
    tags: ["Wasser", "Lokal", "Berlin"],
    images: ["/dummy/wasser.jpg"],
    trailerUrl: "/dummy/wasser_trailer.mp4",
    swipes: [
      { userId: "u1", decision: "Ja", date: "2025-06-18" },
      { userId: "u2", decision: "Nein", date: "2025-06-18" }
    ],
  },
  {
    id: "2",
    title: "ÖPNV-Ticket für Schüler",
    description: "Abstimmungsergebnisse zum kostenlosen ÖPNV-Ticket für alle Schüler:innen im Landkreis München.",
    status: "Offen",
    region: "München",
    topic: "Mobilität",
    language: "de",
    date: "2025-06-20",
    author: "Landkreis München",
    likes: 41,
    bookmarks: 18,
    statements: { agreed: 35, rejected: 5, unanswered: 1 },
    tags: ["Mobilität", "Schule", "ÖPNV"],
    images: ["/dummy/oepnv.jpg"],
    trailerUrl: "/dummy/oepnv_trailer.mp4",
    swipes: [
      { userId: "u3", decision: "Ja", date: "2025-06-20" },
      { userId: "u4", decision: "Neutral", date: "2025-06-20" }
    ],
  },
  // weitere Dummy-Reports…
];

export default reportData;
