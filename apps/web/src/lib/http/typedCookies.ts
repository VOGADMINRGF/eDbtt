// apps/web/src/lib/http/typedCookies.ts
"use server";
import { cookies, headers } from "next/headers";

export async function getCookie(name: string): Promise<string | null> {
  return cookies().get(name)?.value ?? null;
}
export async function setCookie(
  name: string,
  value: string,
  opts: {
    path?: string;
    httpOnly?: boolean;
    secure?: boolean;
    maxAge?: number;
  } = {},
) {
  cookies().set(name, value, { path: "/", httpOnly: true, ...opts });
}
export async function getHeader(name: string): Promise<string | null> {
  return headers().get(name) ?? null;
}
