import { StreamOverlayClient } from "./StreamOverlayClient";

export default async function StreamOverlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="min-h-screen">
      <h1 className="sr-only">Stream Overlay</h1>
      <StreamOverlayClient sessionId={id} />
    </main>
  );
}
