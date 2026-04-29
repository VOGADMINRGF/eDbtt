import {
  formatProviderSmokeSummary,
  parseProviderSmokeCliArgs,
  redactSecretsInValue,
  runProviderSmokeCli,
} from "../src/features/ai/providerSmokeCli";

function printUsage(): void {
  console.log(
    [
      "Usage:",
      "  pnpm -C apps/web ai:provider-smoke --provider=openai --mode=probe",
      "  pnpm -C apps/web ai:provider-smoke --provider=anthropic --mode=runtime",
      "  pnpm -C apps/web ai:provider-smoke --providers=openai,anthropic,mistral --mode=full",
      "  pnpm -C apps/web ai:provider-smoke --providers=openai,anthropic,mistral --mode=full-lite --allow-built-valid --no-repair",
      "  pnpm -C apps/web ai:provider-smoke --providers=all-primary --mode=full --allow-built-valid",
      "",
      "Flags:",
      "  --provider <name>          One provider: openai|anthropic|mistral",
      "  --providers <csv|alias>    CSV list or all-primary",
      "  --mode <probe|runtime|full|full-lite>",
      "  --allow-built-valid        Treat built_valid as success",
      "  --allow-degraded           Treat repaired_degraded as success",
      "  --no-repair                Disable repair fallback in full/full-lite runs",
      "  --dry-run                  Print execution/budget plan without provider calls",
      "  --max-output-tokens <n>    Override output token budget for full/full-lite",
      "  --json-only                Print sanitized JSON only",
      "  --output-dir <path>        Override log directory (default: ../../.logs/ai-smoke from apps/web)",
      "  --help",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const args = parseProviderSmokeCliArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  const result = await runProviderSmokeCli(args);
  const sanitized = redactSecretsInValue(result);

  if (args.jsonOnly) {
    console.log(JSON.stringify(sanitized, null, 2));
  } else {
    console.log(
      formatProviderSmokeSummary({
        mode: result.mode,
        dryRun: result.dryRun,
        summary: sanitized.summary,
        dryRunPlan: sanitized.dryRunPlan,
        totals: sanitized.totals,
        evaluation: sanitized.evaluation,
        outputFilePath: sanitized.outputFilePath,
      }),
    );
  }

  process.exitCode = result.evaluation.exitCode;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "provider_smoke_cli_unhandled_error";
  console.error(`provider_smoke_cli_failed: ${message}`);
  process.exit(2);
});
