import mongoose from "mongoose";

const uri = process.env.MONGODB_URI!;
if (!uri) throw new Error("MONGODB_URI missing");

let cached = (global as any)._mongoose as Promise<typeof mongoose> | undefined;

export async function mongo() {
  if (!cached) {
    cached = mongoose.connect(uri, { dbName: process.env.MONGODB_DB || "vog" });
    (global as any)._mongoose = cached;
  }
  return cached;
}
