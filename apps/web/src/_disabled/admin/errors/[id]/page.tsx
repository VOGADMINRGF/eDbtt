import { notFound } from "next/navigation";

interface ErrorDetailProps {
  params: {
    id: string;
  };
}

// 🚧 Temporär Mock-Daten

export default function ErrorDetailPage({ params }: ErrorDetailProps) {
  const error = MOCK_ERRORS[params.id];
  if (!error) return notFound();

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Fehler-Details</h1>
      <div className="space-y-3">
        <div>
          <span className="font-semibold">Trace-ID:</span> {params.id}
        </div>
        <div>
          <span className="font-semibold">Pfad:</span> {error.path}
        </div>
        <div>
          <span className="font-semibold">Zeitpunkt:</span>{" "}
          {new Date(error.timestamp).toLocaleString()}
        </div>
        <div>
          <span className="font-semibold">Fehlermeldung:</span> {error.message}
        </div>
        <div>
          <span className="font-semibold">Ursache:</span>
          <pre className="bg-gray-100 rounded p-2 mt-1 text-sm text-red-600">
            {error.cause}
          </pre>
        </div>
        <div>
          <span className="font-semibold">Payload:</span>
          <pre className="bg-gray-50 rounded p-2 mt-1 text-sm">
            {JSON.stringify(error.payload, null, 2)}
          </pre>
        </div>
      </div>
    </main>
  );
}
