"use client";
import React, { createContext, useContext } from "react";
const Ctx = createContext<any>({});
export function useUser() {
  return useContext(Ctx);
}
export default function UserProvider({ children }: { children?: any }) {
  return <Ctx.Provider value={{}}>{children}</Ctx.Provider>;
}
