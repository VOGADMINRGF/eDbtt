// apps/web/src/app/stream/[slug]/page.tsx
import { notFound } from "next/navigation";
import { streamData } from "@features/stream/data/streamData";

export async function generateStaticParams() {
  return streamData.map((s) => ({ slug: s.slug }));
}

export default function StreamDetail({ params }: { params: { slug: string } }) {
  const stream = streamData.find((s) => s.slug === params.slug);
  if (!stream) return notFound();

  const trailerUrl =
    (stream as any)?.media?.trailerUrl ?? (stream as any)?.trailerUrl;

  return (
    <main className="max-w-4xl mx-auto px-4 py-24 space-y-8">
      <h1 className="text-3xl font-bold text-coral">{stream.title}</h1>

      <div className="text-gray-700 text-sm space-y-1">
        <p>
          {stream.region.name} · {stream.topic.label}
        </p>
        <p>
          {stream.stats.viewers} Zuschauer:innen · Status:{" "}
          <strong>{stream.status}</strong>
        </p>
      </div>

      {trailerUrl && (
        <video
          className="w-full rounded-lg outline-none"
          controls
          preload="metadata"
          src={trailerUrl}
        />
      )}

      {stream.description && (
        <p className="text-lg text-gray-800">{stream.description}</p>
      )}
    </main>
  );
}
