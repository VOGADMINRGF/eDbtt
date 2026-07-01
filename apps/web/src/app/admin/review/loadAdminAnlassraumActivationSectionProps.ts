import {
  getAnlassraumActivationWorkflowPersistenceState,
  listAnlassraumActivationAudits,
  listAnlassraumActivationRecords,
} from "@/features/create/anlassraumActivationWorkflowServer";

export async function loadAdminAnlassraumActivationSectionProps() {
  const [anlassraumActivationRecords, anlassraumActivationAudits] =
    await Promise.all([
      listAnlassraumActivationRecords(80),
      listAnlassraumActivationAudits({ limit: 240 }),
    ]);

  const anlassraumActivationAuditMap = new Map<
    string,
    typeof anlassraumActivationAudits
  >();
  for (const record of anlassraumActivationRecords) {
    anlassraumActivationAuditMap.set(
      record.sourceHandoffId,
      anlassraumActivationAudits.filter(
        (entry) => entry.sourceHandoffId === record.sourceHandoffId,
      ),
    );
  }

  return {
    anlassraumActivationRecords,
    anlassraumActivationAuditMap,
    anlassraumActivationPersistence:
      getAnlassraumActivationWorkflowPersistenceState(),
  };
}
