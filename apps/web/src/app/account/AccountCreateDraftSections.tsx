"use client";

import type { CreateContributionLedgerEntry } from "@features/create/createContributionLedger";
import type { AccountUserScopedRuntimeLinkage } from "@features/account/userScopedRuntimeLinkageTypes";
import type { RoleInfo } from "./AccountClient";
import AccountResumeWorkbenchSection from "./AccountResumeWorkbenchSection";
import CreateContributionLedgerSection from "./CreateContributionLedgerSection";

type Props = {
  entries: CreateContributionLedgerEntry[];
  roles: RoleInfo[];
  runtimeLinkages: AccountUserScopedRuntimeLinkage[];
};

export default function AccountCreateDraftSections({ entries, roles, runtimeLinkages }: Props) {
  const canDeepResearch = roles.some((role) => ["admin", "staff", "superadmin"].includes(role.id));

  return (
    <>
      <AccountResumeWorkbenchSection
        entries={entries}
        canDeepResearch={canDeepResearch}
        runtimeLinkages={runtimeLinkages}
      />
      <CreateContributionLedgerSection entries={entries} />
    </>
  );
}
