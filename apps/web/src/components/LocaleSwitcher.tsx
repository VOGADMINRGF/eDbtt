"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LOCALE_CONFIG,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/config/locales";
import { useLocale } from "@/context/LocaleContext";

export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();
  const router = useRouter();
  const pathname = typeof window !== "undefined" ? window.location.pathname : null;
  const [open, setOpen] = React.useState(false);

  const current = LOCALE_CONFIG.find((item) => item.code === locale);

  const handleSelect = (code: SupportedLocale) => {
    if (code === locale) {
      setOpen(false);
      return;
    }

    setLocale(code);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", code);
      if (pathname && url.pathname !== pathname) {
        url.pathname = pathname;
      }
      window.history.replaceState(null, "", url.toString());
      router.refresh();
    }
    setOpen(false);
  };

  React.useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (target.closest?.("[data-locale-switcher-root]")) return;
      setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative text-sm" data-locale-switcher-root>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 text-[rgb(var(--muted))] shadow-sm transition hover:border-[rgb(var(--border))]"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span role="img" aria-label={current?.label ?? locale}>
          {current?.flagEmoji ?? "🏳️"}
        </span>
        <span className="hidden sm:inline">{current?.label ?? locale.toUpperCase()}</span>
        <span className="sm:hidden uppercase">{locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-40 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-2 text-sm shadow-lg">
          <ul className="space-y-1">
            {SUPPORTED_LOCALES.map((code: SupportedLocale) => {
              const option = LOCALE_CONFIG.find((cfg) => cfg.code === code);
              const active = code === locale;
              return (
                <li key={code}>
                  <button
                    type="button"
                    onClick={() => handleSelect(code)}
                    className={[
                      "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition",
                      active ? "bg-[rgb(var(--bg))] font-semibold text-[rgb(var(--fg))]" : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]",
                    ].join(" ")}
                  >
                    <span role="img" aria-hidden="true">
                      {option?.flagEmoji ?? "🏳️"}
                    </span>
                    <span>{option?.label ?? code.toUpperCase()}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
