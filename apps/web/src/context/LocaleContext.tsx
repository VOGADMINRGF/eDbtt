import React, { createContext, useContext } from "react";

type Ctx = { locale: string };
const LocaleCtx = createContext<Ctx>({ locale: "de" });

export function LocaleProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return <LocaleCtx.Provider value={{ locale }}>{children}</LocaleCtx.Provider>;
}

export function useLocale() {
  return useContext(LocaleCtx);
}
export default LocaleCtx;
