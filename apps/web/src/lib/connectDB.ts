import { coreDb } from "@core/triMongo";
export async function connectDB() {
  try { return await coreDb(); } catch { return null as any; }
}
