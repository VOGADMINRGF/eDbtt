import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { isDemoUser } from "@/lib/demo/demoAccess";
import { DEMO_STATUS_GLOSSARY } from "@/features/demo/statusLanguage";
import DemoHeaderClient from "./DemoHeaderClient";

type Props = {
  children: ReactNode;
};

export default async function DemoLayout({ children }: Props) {
  const user = await getSessionUser();
  if (!isDemoUser(user)) notFound();

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <DemoHeaderClient statuses={DEMO_STATUS_GLOSSARY.slice(0, 4)} />
      {children}
    </div>
  );
}
