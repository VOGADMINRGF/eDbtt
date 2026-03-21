import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { closeAll } from "@core/db/triMongo";
import {
  parseCreatePrepareAttachHistoryBackfillArgs,
  runCreatePrepareAttachHistoryBackfill,
} from "@/features/create/attachDraftHistoryBackfill";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envCandidates = [
  resolve(__dirname, "..", ".env.local"),
  resolve(__dirname, "..", ".env"),
  resolve(__dirname, "..", "..", ".env.local"),
  resolve(__dirname, "..", "..", ".env"),
];
for (const path of envCandidates) {
  if (!existsSync(path)) continue;
  config({ path, override: false });
  break;
}

async function main() {
  const options = parseCreatePrepareAttachHistoryBackfillArgs(process.argv.slice(2));
  const report = await runCreatePrepareAttachHistoryBackfill({
    mode: options.mode,
    previewLimit: options.previewLimit,
    scanLimit: options.scanLimit,
  });

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`[history-backfill] mode=${report.mode}`);
  console.log(
    `[history-backfill] scanned=${report.totalScanned} canonical=${report.canonical} normalizable=${report.normalizable} unsafe=${report.unsafe} applied=${report.applied} applySkipped=${report.applySkipped}`,
  );
  if (report.samples.length > 0) {
    console.log("[history-backfill] samples:");
    for (const sample of report.samples) {
      const reasons = sample.reasons.length > 0 ? sample.reasons.join(",") : "none";
      console.log(
        `  row=${sample.rowId ?? "missing"} draft=${sample.draftId ?? "missing"} status=${sample.status} type=${sample.inferredEventType ?? "unknown"} reasons=${reasons}`,
      );
    }
  }
  const sortedReasons = Object.entries(report.reasonBuckets).sort((left, right) => right[1] - left[1]);
  if (sortedReasons.length > 0) {
    console.log("[history-backfill] reasonBuckets:");
    for (const [reason, count] of sortedReasons) {
      console.log(`  ${reason}: ${count}`);
    }
  }
}

main()
  .then(async () => {
    await closeAll();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    await closeAll().catch(() => undefined);
    process.exit(1);
  });
