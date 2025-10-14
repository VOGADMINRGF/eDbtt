// apps/web/src/app/api/statements/create/route.ts
import dbConnect from "@/lib/db";
import Statement from "@/models/core/Statement"; // Kein Plural!
import generateVOGImage from "@features/utils/ai/generateImage";

export async function POST(req: Request) {
  await dbConnect();
  const {
    title,
    statement,
    shortText,
    category,
    cluster,
    tags,
    sources,
    facts,
    language,
    imageUrl,
    regionScope,
    impactLogic,
    arguments: args,
    summary,
    recommendation,
    alternatives,
    eventualities,
    createdBy,
    analysis,
  } = await req.json();

  // Minimalprüfung
  if (!title || !statement || !category) {
    return new Response(
      JSON.stringify({ error: "Title, statement and category are required" }),
      { status: 400 },
    );
  }

  // Bild generieren falls keines mitgegeben
  let finalImageUrl = imageUrl;
  if (!finalImageUrl) {
    try {
      finalImageUrl = await generateVOGImage({ prompt: statement, fallbackText: "VoiceOpenGov" });
    } catch (err) {
      console.error("[generateVOGImage] KI-Fehler:", err);
      finalImageUrl = "/dummy/default.jpg"; // Optional: Dummybild als Fallback
    }
  }

  const doc = new Statement({
    title,
    statement,
    shortText,
    category,
    cluster,
    tags,
    sources,
    facts,
    language,
    imageUrl: finalImageUrl,
    regionScope,
    impactLogic,
    arguments: args,
    summary,
    recommendation,
    alternatives,
    eventualities,
    createdBy,
    createdAt: new Date(),
    ...(analysis ? { aiAnnotations: analysis } : {}),
  });

  await doc.save();

  return new Response(JSON.stringify(doc), { status: 201 });
}

// GET als eigene Funktion:
export async function GET() {
  return new Response(JSON.stringify({ error: "GET not allowed. Use POST." }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}
