import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { coreCol } from "@core/triMongo";
import { readSession } from "src/utils/session";

function safeLang(v:any){ const ok=new Set(["de","en","fr","it","es","pl","uk","ru","tr","hi","zh","ar"]); const x=typeof v==="string"?v.slice(0,2).toLowerCase():"de"; return ok.has(x)?x:"de"; }
async function isCsrfValid(){ const c=(await cookies()).get("csrf-token")?.value; const h=(await headers()).get("x-csrf-token"); return !!c && !!h && c===h; }
function bad(msg:string,status=400){ return NextResponse.json({ok:false,error:msg},{status}); }

export async function POST(req: NextRequest){
  try {
    if(!(await isCsrfValid())) return bad("forbidden_csrf",403);

    let body:any; try{ body=await req.json(); }catch{ return bad("invalid_json"); }
    const items = Array.isArray(body?.items)?body.items:[];
    if(!items.length) return bad("items_required");

    const sess = readSession();
    const now = new Date();
    const docs = items.map((it:any)=>({
      title: String(it.title||"").slice(0,200) || (String(it.text||"").split(/\n+/).find(Boolean)||"Beitrag").slice(0,120),
      text: String(it.text||"").slice(0,4000),
      category: String(it.categoryMain||"Allgemein").slice(0,80),
      subcategories: Array.isArray(it.categorySubs)?it.categorySubs.slice(0,6):[],
      language: safeLang(it.language||"de"),
      region: it.region || null,
      authority: it.authority || null,
      analysis: it.analysis || null,
      createdAt: now, updatedAt: now,
      userId: (sess as any)?.uid ?? null,
      factcheckStatus: "queued",
      stats: { views:0, votesAgree:0, votesNeutral:0, votesDisagree:0, votesTotal:0 }
    })).filter((d: any) => d?.text);

    if(!docs.length) return bad("no_valid_texts");

    const col = await coreCol("statements");

    // 1) Versuche insertMany (schnell)
    try {
      const res = await col.insertMany(docs, { ordered:false });
      const ids = Object.values(res.insertedIds||{}).map(String);
      return NextResponse.json({ ok:true, ids }, { status:201 });
    } catch (e:any) {
      // 2) Fallback: einzeln insertOne (um Rechte/ordered-Fehler zu umgehen)
      const ids:string[]=[];
      for(const d of docs){
        try { const r = await col.insertOne(d); ids.push(String(r.insertedId)); }
        catch (e2:any) { console.warn("[ingest insertOne fail]", e2?.code||"", e2?.message||e2); }
      }
      if(ids.length) return NextResponse.json({ ok:true, ids }, { status:201 });
      return NextResponse.json({ ok:false, error: String(e?.message||e) }, { status:500 });
    }
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: String(e?.message||e) }, { status:500 });
  }
}
