import { promises as fs } from "fs";
import path from "path";
import { resolvePromptName } from "./promptRegistry";

function candidatesDir() {
  if (process.env.CORE_PROMPTS_DIR) return [process.env.CORE_PROMPTS_DIR];
  const dev = path.resolve(process.cwd(), "../../core/prompts");
  const standalone = path.resolve(process.cwd(), "core/prompts");
  const local = path.resolve(__dirname, "../../../../core/prompts");
  return [dev, standalone, local];
}

export async function loadPrompt(name: string): Promise<string> {
  const file = resolvePromptName(name);
  for (const base of candidatesDir()) {
    try { return await fs.readFile(path.join(base, file), "utf8"); } catch {}
  }
  throw new Error(`Prompt not found: ${file} (searched ${candidatesDir().join(" | ")})`);
}
