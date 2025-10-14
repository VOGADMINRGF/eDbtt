import mongoose from "mongoose";
import Contribution from "@/data/models/Contribution";

export async function storeContribution({
  originalText,
  language,
  statements,
  topics,
  level,
  context,
  suggestions,
  translations,
  region,
  userId
}: {
  originalText: string;
  language: string;
  statements: string[];
  topics: { name: string }[];
  level: string;
  context: string;
  suggestions: string[];
  translations: {
    original: string;
    de: string;
    en: string;
  };
  region?: string;
  userId?: string;
}) {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }

  const entry = new Contribution({
    originalText,
    language,
    statements,
    topics,
    level,
    context,
    suggestions,
    translations,
    region,
    userId: userId ?? "anonymous",
    status: "confirmed",
    createdAt: new Date()
  });

  await entry.save();
  return entry;
}
