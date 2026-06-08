"use client";

import type { CreateContributionLedgerEntry } from "@features/create/createContributionLedger";
import type { RoleInfo } from "./AccountClient";
import AccountResumeWorkbenchSection from "./AccountResumeWorkbenchSection";
import CreateContributionLedgerSection from "./CreateContributionLedgerSection";

type Props = {
  entries: CreateContributionLedgerEntry[];
  roles: RoleInfo[];
};

export default function AccountCreateDraftSections({ entries, roles }: Props) {
  const canDeepResearch = roles.some((role) => ["admin", "staff", "superadmin"].includes(role.id));

  return (
    <>
      <AccountResumeWorkbenchSection entries={entries} canDeepResearch={canDeepResearch} />
      <CreateContributionLedgerSection entries={entries} />
    </>
  );
}
