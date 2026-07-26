// apps/web/src/context/LocaleContext.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  getDir,
  type SupportedLocale,
  isSupportedLocale,
} from "@/config/locales";

const UI_LOCALE_KEY = "vog:locale";
const READING_LOCALE_KEY = "vog_content_lang";
const OUTPUT_LOCALES_KEY = "vog:preferred_output_locales";
const SHOW_ORIGINAL_KEY = "vog:show_original_by_default";

export type LanguagePreferences = {
  uiLocale: SupportedLocale;
  readingLocale: SupportedLocale;
  preferredOutputLocales: SupportedLocale[];
  showOriginalByDefault: boolean;
};

type LocaleContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  uiLocale: SupportedLocale;
  setUiLocale: (locale: SupportedLocale) => void;
  readingLocale: SupportedLocale;
  setReadingLocale: (locale: SupportedLocale) => void;
  preferredOutputLocales: SupportedLocale[];
  setPreferredOutputLocales: (locales: SupportedLocale[]) => void;
  showOriginalByDefault: boolean;
  setShowOriginalByDefault: (value: boolean) => void;
  preferences: LanguagePreferences;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

type ProviderProps = {
  initialLocale?: SupportedLocale;
  children: React.ReactNode;
};

export function LocaleProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: ProviderProps) {
  const [uiLocale, setUiLocaleState] = useState<SupportedLocale>(initialLocale);
  const [readingLocale, setReadingLocaleState] = useState<SupportedLocale>(initialLocale);
  const [preferredOutputLocales, setPreferredOutputLocalesState] = useState<SupportedLocale[]>([
    initialLocale,
  ]);
  const [showOriginalByDefault, setShowOriginalByDefaultState] = useState(false);

  useEffect(() => {
    let nextUiLocale = initialLocale;
    let nextReadingLocale = initialLocale;
    let nextPreferredOutputLocales: SupportedLocale[] = [initialLocale];
    let nextShowOriginalByDefault = false;

    const pathLocale = readPathLocale(window.location.pathname);
    if (pathLocale) {
      nextUiLocale = pathLocale;
    }

    try {
      const url = new URL(window.location.href);
      const urlLocale = url.searchParams.get("lang");
      if (!pathLocale && isSupportedLocale(urlLocale)) {
        nextUiLocale = urlLocale;
        persistUiLocale(urlLocale);
      }
    } catch {
      /* ignore */
    }

    try {
      const storedUiLocale = window.localStorage.getItem(UI_LOCALE_KEY);
      if (isSupportedLocale(storedUiLocale)) {
        nextUiLocale = storedUiLocale;
      }

      const storedReadingLocale = window.localStorage.getItem(READING_LOCALE_KEY);
      if (isSupportedLocale(storedReadingLocale)) {
        nextReadingLocale = storedReadingLocale;
      } else {
        const navigatorLocale = normalizeBrowserLocale(navigator.language);
        nextReadingLocale = navigatorLocale ?? nextUiLocale;
      }

      nextPreferredOutputLocales = normalizeStoredLocaleList(
        window.localStorage.getItem(OUTPUT_LOCALES_KEY),
        nextReadingLocale,
      );
      nextShowOriginalByDefault = window.localStorage.getItem(SHOW_ORIGINAL_KEY) === "true";
    } catch {
      nextReadingLocale = nextUiLocale;
      nextPreferredOutputLocales = [nextReadingLocale];
    }

    setUiLocaleState(nextUiLocale);
    setReadingLocaleState(nextReadingLocale);
    setPreferredOutputLocalesState(nextPreferredOutputLocales);
    setShowOriginalByDefaultState(nextShowOriginalByDefault);
    updateHtmlAttrs(nextUiLocale);
  }, [initialLocale]);

  useEffect(() => {
    updateHtmlAttrs(uiLocale);
  }, [uiLocale]);

  const setUiLocale = useCallback((next: SupportedLocale) => {
    setUiLocaleState(next);
    persistUiLocale(next);
    syncUrl(next);
    updateHtmlAttrs(next);
  }, []);

  const setReadingLocale = useCallback((next: SupportedLocale) => {
    setReadingLocaleState(next);
    persistReadingLocale(next);
  }, []);

  const setPreferredOutputLocales = useCallback(
    (next: SupportedLocale[]) => {
      const normalized = sanitizeLocaleList(next, readingLocale);
      setPreferredOutputLocalesState(normalized);
      persistPreferredOutputLocales(normalized);
    },
    [readingLocale],
  );

  const setShowOriginalByDefault = useCallback((next: boolean) => {
    setShowOriginalByDefaultState(next);
    persistShowOriginalByDefault(next);
  }, []);

  const value = useMemo(
    () => ({
      locale: uiLocale,
      setLocale: setUiLocale,
      uiLocale,
      setUiLocale,
      readingLocale,
      setReadingLocale,
      preferredOutputLocales,
      setPreferredOutputLocales,
      showOriginalByDefault,
      setShowOriginalByDefault,
      preferences: {
        uiLocale,
        readingLocale,
        preferredOutputLocales,
        showOriginalByDefault,
      },
    }),
    [
      uiLocale,
      setUiLocale,
      readingLocale,
      setReadingLocale,
      preferredOutputLocales,
      setPreferredOutputLocales,
      showOriginalByDefault,
      setShowOriginalByDefault,
    ],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within <LocaleProvider>");
  }
  return ctx;
}

export function useLanguagePreferences(): LocaleContextValue {
  return useLocale();
}

export function useOptionalLanguagePreferences(): LocaleContextValue | null {
  return useContext(LocaleContext) ?? null;
}

function persistUiLocale(locale: SupportedLocale) {
  try {
    window.localStorage.setItem(UI_LOCALE_KEY, locale);
  } catch {
    /* ignore */
  }

  try {
    document.cookie = `lang=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

function persistReadingLocale(locale: SupportedLocale) {
  try {
    window.localStorage.setItem(READING_LOCALE_KEY, locale);
  } catch {
    /* ignore */
  }
}

function persistPreferredOutputLocales(locales: SupportedLocale[]) {
  try {
    window.localStorage.setItem(OUTPUT_LOCALES_KEY, JSON.stringify(locales));
  } catch {
    /* ignore */
  }
}

function persistShowOriginalByDefault(value: boolean) {
  try {
    window.localStorage.setItem(SHOW_ORIGINAL_KEY, value ? "true" : "false");
  } catch {
    /* ignore */
  }
}

function syncUrl(locale: SupportedLocale) {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const current = url.searchParams.get("lang");
    if (current !== locale) {
      url.searchParams.set("lang", locale);
      window.history.replaceState(null, "", url.toString());
    }
  } catch {
    /* ignore */
  }
}

function updateHtmlAttrs(locale: SupportedLocale) {
  if (typeof document === "undefined") return;
  try {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDir(locale);
  } catch {
    /* ignore */
  }
}

function normalizeBrowserLocale(value: string | null | undefined): SupportedLocale | null {
  const short = value?.slice(0, 2).toLowerCase();
  return isSupportedLocale(short) ? short : null;
}

export function readPathLocale(pathname: string | null | undefined): SupportedLocale | null {
  if (!pathname) return null;
  const [segment] = pathname.split("/").filter(Boolean);
  return isSupportedLocale(segment) ? segment : null;
}

export function sanitizeLocaleList(
  input: readonly string[] | null | undefined,
  fallback: SupportedLocale,
): SupportedLocale[] {
  const locales = Array.isArray(input)
    ? input.filter((value): value is SupportedLocale => isSupportedLocale(value))
    : [];
  const unique = Array.from(new Set(locales));
  return unique.length > 0 ? unique : [fallback];
}

export function normalizeStoredLocaleList(
  storedValue: string | null,
  fallback: SupportedLocale,
): SupportedLocale[] {
  if (!storedValue) return [fallback];
  try {
    const parsed = JSON.parse(storedValue);
    return sanitizeLocaleList(Array.isArray(parsed) ? parsed : [], fallback);
  } catch {
    return [fallback];
  }
}
