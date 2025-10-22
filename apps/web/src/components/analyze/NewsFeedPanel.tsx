"use client";
import React from "react";

type Item = { title:string; url:string; score?:number; source?:string };
export default function NewsFeedPanel({ topic, region, keywords=[] as string[] }:{
  topic: string; region?: string; keywords?: string[];
}){
  const [items,setItems] = React.useState<Item[]|null>(null);
  const [errors,setErrors] = React.useState<string[]|null>(null);
  const [loading,setLoading] = React.useState(false);

  async function load(){
    setLoading(true);
    setErrors(null);
    try{
      const res = await fetch("/api/search/civic", {
        method:"POST", headers:{ "content-type":"application/json" },
        body: JSON.stringify({ topic, region, keywords, limit: 8 })
      });
      const js = await res.json();
      setItems(Array.isArray(js.items)?js.items:[]);
      if(js.errors) setErrors(js.errors);
    }catch(e:any){
      setErrors([String(e?.message||e)]);
      setItems([]);
    }finally{ setLoading(false); }
  }

  React.useEffect(()=>{ load(); /* on mount/topic change */ }, [topic, region, JSON.stringify(keywords)]);

  if(loading && !items) return <div className="text-sm opacity-70">Lade News …</div>;
  if(!items || items.length===0){
    return (
      <div className="rounded-2xl border p-4">
        <div className="font-semibold mb-1">Aktuelle Recherche</div>
        <div className="text-sm opacity-70 mb-2">Keine Treffer aus konfigurierten Quellen.</div>
        {errors?.length ? (
          <details className="text-xs opacity-70">
            <summary>Details/Fehler</summary>
            <ul className="list-disc ml-4 mt-1">{errors.map((e,i)=><li key={i}>{e}</li>)}</ul>
          </details>
        ) : null}
      </div>
    );
  }
  return (
    <div className="rounded-2xl border p-4">
      <div className="font-semibold mb-3">Aktuelle Recherche</div>
      <ul className="space-y-2">
        {items.map((it, i)=>(
          <li key={i} className="group">
            <a href={it.url} target="_blank" className="block rounded-xl border p-3 hover:bg-muted">
              <div className="font-medium">{it.title}</div>
              <div className="text-xs opacity-70 mt-1">
                {it.source ?? new URL(it.url).host} {typeof it.score==="number" ? `· Score ${it.score.toFixed(2)}` : ""}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
