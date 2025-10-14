import fs from "fs";
import path from "path";

const repo = process.cwd();
const file = path.join(repo, "apps", "web", "src", "utils", "aiProviders.ts");
if (!fs.existsSync(file)) {
  console.error("Not found:", file);
  process.exit(1);
}
let s = fs.readFileSync(file, "utf8");

// 1) extractMetadata(input as any, userContext as any) -> input: any, userContext: any
s = s.replace(
  /export\s+async\s+function\s+extractMetadata\(\s*input\s+as\s+any\s*,\s*userContext\s+as\s+any\s*\)/,
  "export async function extractMetadata(input: any, userContext: any)"
);

// 2) runContextualization({ gptData, ariData, meta } as any) -> ... }: any)
s = s.replace(
  /export\s+async\s+function\s+runContextualization\(\s*\{\s*gptData\s*,\s*ariData\s*,\s*meta\s*\}\s*as\s+any\s*\)/,
  "export async function runContextualization({ gptData, ariData, meta }: any)"
);

// 3) runMetaLayer({ gptData, ariData, meta } as any) -> ... }: any)
s = s.replace(
  /export\s+async\s+function\s+runMetaLayer\(\s*\{\s*gptData\s*,\s*ariData\s*,\s*meta\s*\}\s*as\s+any\s*\)/,
  "export async function runMetaLayer({ gptData, ariData, meta }: any)"
);

fs.writeFileSync(file, s, "utf8");
console.log("✓ aiProviders signatures fixed");
