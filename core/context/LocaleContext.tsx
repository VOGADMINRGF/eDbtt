// core/context/LocaleContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import {
  DEFAULT_LOCALE,
  getDir,
  isSupportedLocale,
  type SupportedLocale,
} from "@core/locale/locales";

type LocaleCtx = {
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
};

const Ctx = createContext<LocaleCtx | null>(null);

type Props = PropsWithChildren<{
  defaultLocale?: SupportedLocale;   // vom Server (getServerLocale) übergeben
  syncUrl?: boolean;                 // ?lang=de in der URL halten
}>;

export function LocaleProvider({
  children,
  defaultLocale = DEFAULT_LOCALE,
  syncUrl = true,
}: Props) {
  const [locale, _setLocale] = useState<SupportedLocale>(defaultLocale);
  const bc = useRef<BroadcastChannel | null>(null);
  const initialised = useRef(false);

  // Initial aus localStorage / Cookie / Navigator „hydraten“
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    let next = defaultLocale;

    try {
      const ls = localStorage.getItem("vog:locale");
      if (isSupportedLocale(ls)) next = ls;
      else {
        const cookieLang = document.cookie
          .split("; ")
          .find((c) => c.startsWith("lang="))
          ?.split("=")[1];
        if (isSupportedLocale(cookieLang)) next = cookieLang;
        else {
          const nav = navigator.language?.slice(0, 2) ?? "";
          if (isSupportedLocale(nav)) next = nav;
        }
      }
    } catch {
      /* ignore */
    }

    _applyLocale(next, { pushUrl: false });
  }, [defaultLocale]);

  // BroadcastChannel für Cross-Tab-Sync
  useEffect(() => {
    try {
      bc.current = new BroadcastChannel("vog:locale");
      bc.current.onmessage = (ev) => {
        const l = String(ev.data ?? "");
        if (isSupportedLocale(l)) _applyLocale(l, { broadcast: false });
      };
      return () => bc.current?.close();
    } catch {
      return;
    }
  }, []);

  // URL-Sync (optional)
  useEffect(() => {
    if (!syncUrl) return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("lang") !== locale) {
        url.searchParams.set("lang", locale);
        window.history.replaceState(null, "", url.toString());
      }
    } catch {
      /* ignore */
    }
  }, [locale, syncUrl]);

  function _applyLocale(l: SupportedLocale, opts?: { broadcast?: boolean; pushUrl?: boolean }) {
    _setLocale(l);

    // <html lang / dir>
    try {
      const html = document.documentElement;
      html.setAttribute("lang", l);
      html.setAttribute("dir", getDir(l));
    } catch {
      /* ignore */
    }

    // Persistenz
    try {
      localStorage.setItem("vog:locale", l);
      document.cookie = `lang=${l}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
      /* ignore */
    }

    // optional URL-Push (wird ansonsten von useEffect geregelt)
    if (opts?.pushUrl) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", l);
        window.history.replaceState(null, "", url.toString());
      } catch {/* ignore */}
    }

    // Cross-Tab informieren
    if (opts?.broadcast !== false) {
      try { bc.current?.postMessage(l); } catch { /* ignore */ }
    }
  }

  const setLocale = (l: SupportedLocale) => _applyLocale(l, { pushUrl: true });

  const value = useMemo(() => ({ locale, setLocale }), [locale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLocale(): LocaleCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLocale must be used within <LocaleProvider>");
  return ctx;
}
