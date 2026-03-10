import DossierSurface from "@/components/dossier/DossierSurface";
import DossierShell from "@/components/dossier/DossierShell";

export default function DemoDossierPage() {
  return (
    <DossierShell>
      <h1 className="sr-only">Demo Dossier</h1>
      <DossierSurface entry="demo" source="demo" />
    </DossierShell>
  );
}
