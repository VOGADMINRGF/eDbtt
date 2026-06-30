import {
  getDossierRuntimePersistenceState,
  listDossierRuntimeAudits,
  listDossierRuntimeRecords,
} from "@/features/create/dossierRuntimeServer";

export async function loadAdminDossierRuntimeCreationSectionProps() {
  const [dossierRuntimeRecords, dossierRuntimeAudits] = await Promise.all([
    listDossierRuntimeRecords(80),
    listDossierRuntimeAudits({ limit: 240 }),
  ]);

  const dossierRuntimeAuditMap = new Map<string, typeof dossierRuntimeAudits>();
  for (const record of dossierRuntimeRecords) {
    dossierRuntimeAuditMap.set(
      record.sourceHandoffId,
      dossierRuntimeAudits.filter(
        (entry) => entry.sourceHandoffId === record.sourceHandoffId,
      ),
    );
  }

  return {
    dossierRuntimeRecords,
    dossierRuntimeAuditMap,
    dossierRuntimePersistence: getDossierRuntimePersistenceState(),
  };
}
