import {
  getAnlassraumRuntimePersistenceState,
  listAnlassraumRuntimeAudits,
  listAnlassraumRuntimeRecords,
} from "@/features/create/anlassraumRuntimeServer";

export async function loadAdminAnlassraumRuntimeCreationSectionProps() {
  const [anlassraumRuntimeRecords, anlassraumRuntimeAudits] = await Promise.all([
    listAnlassraumRuntimeRecords(80),
    listAnlassraumRuntimeAudits({ limit: 240 }),
  ]);

  const anlassraumRuntimeAuditMap = new Map<string, typeof anlassraumRuntimeAudits>();
  for (const record of anlassraumRuntimeRecords) {
    anlassraumRuntimeAuditMap.set(
      record.sourceHandoffId,
      anlassraumRuntimeAudits.filter(
        (entry) => entry.sourceHandoffId === record.sourceHandoffId,
      ),
    );
  }

  return {
    anlassraumRuntimeRecords,
    anlassraumRuntimeAuditMap,
    anlassraumRuntimePersistence: getAnlassraumRuntimePersistenceState(),
  };
}
