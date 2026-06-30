import {
  getParticipationSpacePublishWorkflowPersistenceState,
  listParticipationSpacePublishAudits,
  listParticipationSpacePublishRecords,
} from "@/features/create/participationSpaceRuntimeServer";

export async function loadAdminParticipationSpacePublishSectionProps() {
  const [participationSpacePublishRecords, participationSpacePublishAudits] =
    await Promise.all([
      listParticipationSpacePublishRecords(80),
      listParticipationSpacePublishAudits({ limit: 240 }),
    ]);

  const participationSpacePublishAuditMap = new Map<
    string,
    typeof participationSpacePublishAudits
  >();
  for (const record of participationSpacePublishRecords) {
    participationSpacePublishAuditMap.set(
      record.sourceHandoffId,
      participationSpacePublishAudits.filter(
        (entry) => entry.sourceHandoffId === record.sourceHandoffId,
      ),
    );
  }

  return {
    participationSpacePublishRecords,
    participationSpacePublishAuditMap,
    participationSpacePublishPersistence:
      getParticipationSpacePublishWorkflowPersistenceState(),
  };
}
