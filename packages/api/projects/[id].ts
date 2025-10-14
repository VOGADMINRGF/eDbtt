// packages/api/projects/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getProjectByIdFromMongo } from "../../../lib/db/mongo";
import { getProjectRelationsFromGraphDB } from "../../../lib/db/graphdb";
import { getSimilarProjectsFromElastic } from "../../../lib/db/elastic";

// Hier alle Datenquellen kombinieren
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // 1. Hole das Basisprojekt aus MongoDB (Master-Datensatz)
  const project = await getProjectByIdFromMongo(id as string);
  if (!project) return res.status(404).json({ error: "Projekt nicht gefunden" });

  // 2. Hole Beziehungsdaten/Ontologien aus der GraphDB
  const relations = await getProjectRelationsFromGraphDB(id as string);

  // 3. Hole ähnliche Projekte/Vorschläge aus Elasticsearch (Volltextsuche, Empfehlung, Autocomplete)
  const similar = await getSimilarProjectsFromElastic(project.name);

  // 4. Kombiniere alles für das Frontend
  return res.status(200).json({
    ...project,
    relations,
    similarProjects: similar
  });
}
