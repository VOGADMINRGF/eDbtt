import DossierSurface from "@/components/dossier/DossierSurface";
import DossierShell from "@/components/dossier/DossierShell";

export default function DemoDossierPage() {
  return (
    <DossierShell>
      <DossierSurface entry="demo" source="demo" />
    </DossierShell>
  );
}
