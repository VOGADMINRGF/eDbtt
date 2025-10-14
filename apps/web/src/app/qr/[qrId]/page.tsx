import { notFound } from "next/navigation";

export default async function QRScanPage({ params }: any) {
  const { qrId } = params;

  // Call to API (server or client) to resolve QR-Entry
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/qr/resolve?qrId=${qrId}`,
  );
  const { success, data } = await res.json();
  if (!success || !data) return notFound();

  // Route je nach Typ
  if (data.targetType === "statement") {
    return <RedirectToStatement id={data.targetIds[0]} />;
  }
  if (data.targetType === "contribution") {
    return <RedirectToContribution id={data.targetIds[0]} />;
  }
  if (data.targetType === "stream") {
    return <RedirectToStream id={data.targetIds[0]} />;
  }
  if (data.targetType === "set") {
    return <QuestionSetFlow ids={data.targetIds} />;
  }
  if (data.targetType === "custom") {
    return <CustomFlow data={data} />;
  }

  return notFound();
}

// Dummy-Komponenten für das Beispiel
function RedirectToStatement({ id }: any) {
  // Hier Voting-Komponente rendern
  return <div>Statement Voting für ID: {id}</div>;
}
function RedirectToContribution({ id }: any) {
  // Beitrag anzeigen
  return <div>Beitrag ID: {id}</div>;
}
function RedirectToStream({ id }: any) {
  // Stream-Komponente einbinden
  return <div>Stream ID: {id}</div>;
}
function QuestionSetFlow({ ids }: any) {
  // Schritt-für-Schritt alle IDs abfragen
  return <div>Fragen-Set: {ids.join(", ")}</div>;
}
function CustomFlow({ data }: any) {
  // Individueller Flow
  return <div>Individuelle Aktion: {JSON.stringify(data)}</div>;
}
