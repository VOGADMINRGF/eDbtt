import { createPwaIconResponse } from "../pwaIconResponse";

export const runtime = "edge";

export function GET() {
  return createPwaIconResponse(192);
}
