import {
  getDossierPublicationPersistenceState,
  listDossierPublicationAudits,
  listDossierPublicationRecords,
} from "@/features/create/dossierPublishWorkflowServer";

export async function loadAdminDossierPublishSectionProps() {
  const [dossierPublicationRecords, dossierPublicationAudits] = await Promise.all([
    listDossierPublicationRecords(80),
    listDossierPublicationAudits({ limit: 240 }),
  ]);

  const dossierPublicationAuditMap = new Map<
    string,
    typeof dossierPublicationAudits
  >();
  for (const record of dossierPublicationRecords) {
    dossierPublicationAuditMap.set(
      record.sourceHandoffId,
      dossierPublicationAudits.filter(
        (entry) => entry.sourceHandoffId === record.sourceHandoffId,
      ),
    );
  }

  return {
    dossierPublicationRecords,
    dossierPublicationAuditMap,
    dossierPublicationPersistence: getDossierPublicationPersistenceState(),
  };
}
