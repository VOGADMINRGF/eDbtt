type PersistQuestionGuardReviewFailClosedInput<TRecord, TAuditEntry> = {
  reviewedRecord: TRecord;
  auditEntry: TAuditEntry;
  persistAudit: (entry: TAuditEntry) => Promise<unknown>;
  persistRecord: (record: TRecord) => Promise<unknown>;
};

/**
 * Persists the durable review evidence before making the reviewed guard state
 * effective. If the audit write fails, the previously blocked record remains
 * untouched. A later record-write failure may leave an audit without a release,
 * but never a released guard without its audit evidence.
 */
export async function persistQuestionGuardReviewFailClosed<TRecord, TAuditEntry>(
  input: PersistQuestionGuardReviewFailClosedInput<TRecord, TAuditEntry>,
): Promise<TRecord> {
  await input.persistAudit(input.auditEntry);
  await input.persistRecord(input.reviewedRecord);
  return input.reviewedRecord;
}
