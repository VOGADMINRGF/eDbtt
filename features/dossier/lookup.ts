import { ObjectId, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { dossiersCol } from "./db";

export async function findDossierByAnyId(dossierId: string) {
  if (shouldUseInMemoryMongoFallback()) return null;
  const col = await dossiersCol();
  const clauses: Record<string, any>[] = [
    { dossierId },
    { statementId: dossierId },
  ];
  if (ObjectId.isValid(dossierId)) {
    clauses.push({ _id: new ObjectId(dossierId) });
  }
  return col.findOne({ $or: clauses });
}
