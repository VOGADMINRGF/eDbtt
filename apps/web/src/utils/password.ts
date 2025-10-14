import { env } from "@/utils/env";
// apps/web/src/utils/env.MEMGRAPH_PASSWORD.ts
import bcrypt from "bcryptjs";

export async function hashPassword(plain: string) {
  return bcrypt.hash(String(plain), ROUNDS);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(String(plain), String(hash));
}
