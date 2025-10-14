// apps/web/src/app/api/contributions/save/route.ts
import dbConnect from "@/lib/db";
import Contribution from "@/models/Contribution";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "POST required" });

  await dbConnect();

  const {
    title,
    summary,
    content,
    language,
    userContext,
    topics,
    level,
    context,
    suggestions,
    statements,
    alternatives,
    facts,
    media,
    links,
    analysis,
    authorId,
  } = req.body;

  // Minimalprüfung
  if (!content) return res.status(400).json({ error: "Kein Inhalt." });

  // Provenance-Log initialisieren
  const provenance = [
    {
      action: "created",
      by: authorId || "anonymous",
      date: new Date(),
      details: "Initial contribution",
    },
  ];

  const doc = new Contribution({
    title,
    summary,
    content,
    language,
    userContext,
    topics,
    level,
    context,
    suggestions,
    statements,
    alternatives,
    facts,
    media,
    links,
    analysis,
    provenance,
    authorId,
    createdAt: new Date(),
  });

  await doc.save();

  res.status(201).json(doc);
}
