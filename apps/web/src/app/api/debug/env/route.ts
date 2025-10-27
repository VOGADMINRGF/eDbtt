import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET(){
  const k = process.env.OPENAI_API_KEY || null;
  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV || "development",
    hasOpenAI: !!k,
    OPENAI_API_KEY: k ? { len: k.length, head: k.slice(0,4), tail: k.slice(-3) } : null
  });
}
