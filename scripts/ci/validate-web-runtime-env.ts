import process from "node:process";
import {
  CriticalProductionWebRuntimeEnvError,
  assertCriticalProductionWebRuntimeEnv,
} from "../../apps/web/src/lib/server/webRuntimeEnv";

try {
  assertCriticalProductionWebRuntimeEnv(process.env);
  console.log("[validate-web-runtime-env] PASS");
} catch (error) {
  if (error instanceof CriticalProductionWebRuntimeEnvError) {
    console.error("[validate-web-runtime-env] FAIL");
    for (const issue of error.issues) {
      console.error(`- ${issue.code}: ${issue.message}`);
    }
    process.exit(1);
  }
  throw error;
}
