"use client";

import type { ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { UserProvider } from "@features/user/context/UserContext";
import { LocaleProvider } from "@context/LocaleContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <Tooltip.Provider>
      <UserProvider>
        <LocaleProvider>{children}</LocaleProvider>
      </UserProvider>
    </Tooltip.Provider>
  );
}
