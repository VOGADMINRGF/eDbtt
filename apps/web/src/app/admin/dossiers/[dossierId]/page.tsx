import AdminDossierClient from "./AdminDossierClient";

export default async function AdminDossierPage({
  params,
}: {
  params: Promise<{ dossierId: string }>;
}) {
  const { dossierId } = await params;
  return (
    <main className="min-h-screen bg-white">
      <h1 className="sr-only">Admin Dossier</h1>
      <AdminDossierClient dossierId={dossierId} />
    </main>
  );
}
