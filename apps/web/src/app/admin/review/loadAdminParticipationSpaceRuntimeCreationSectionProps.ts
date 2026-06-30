import {
  getParticipationSpaceRuntimePersistenceState,
  listParticipationSpaceRuntimeAudits,
  listParticipationSpaceRuntimeRecords,
} from "@/features/create/participationSpaceRuntimeServer";

export async function loadAdminParticipationSpaceRuntimeCreationSectionProps() {
  const [participationSpaceRuntimeRecords, participationSpaceRuntimeAudits] =
    await Promise.all([
      listParticipationSpaceRuntimeRecords(80),
      listParticipationSpaceRuntimeAudits({ limit: 240 }),
    ]);

  const participationSpaceRuntimeAuditMap = new Map<
    string,
    typeof participationSpaceRuntimeAudits
  >();
  for (const record of participationSpaceRuntimeRecords) {
    participationSpaceRuntimeAuditMap.set(
      record.sourceHandoffId,
      participationSpaceRuntimeAudits.filter(
        (entry) => entry.sourceHandoffId === record.sourceHandoffId,
      ),
    );
  }

  return {
    participationSpaceRuntimeRecords,
    participationSpaceRuntimeAuditMap,
    participationSpaceRuntimePersistence:
      getParticipationSpaceRuntimePersistenceState(),
  };
}
