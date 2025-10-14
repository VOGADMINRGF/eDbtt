import crypto from "node:crypto";
type Val = { v: any; exp?: number };
const mem = new Map<string, Val>();
let redis: any = null;
(async () => {
  try {
    const url = process.env.REDIS_URL;
    if (!url) return;
    const { createClient } = await import("redis");
    const client = createClient({ url });
    client.on("error", () => {});
    await client.connect();
    redis = client;
  } catch { redis = null; }
})();
function k(key: string){ return "ai:" + crypto.createHash("sha1").update(key).digest("hex"); }
export async function cacheGet(key: string){
  const ck = k(key);
  if (redis) { const raw = await redis.get(ck); return raw ? JSON.parse(raw) : null; }
  const hit = mem.get(ck); if (!hit) return null;
  if (hit.exp && Date.now() > hit.exp) { mem.delete(ck); return null; }
  return hit.v;
}
export async function cacheSet(key: string, value: any, ttlSec = 300){
  const ck = k(key);
  if (redis) { await redis.set(ck, JSON.stringify(value), { EX: ttlSec }); return; }
  const exp = ttlSec > 0 ? Date.now() + ttlSec * 1000 : undefined;
  mem.set(ck, { v: value, exp });
}
