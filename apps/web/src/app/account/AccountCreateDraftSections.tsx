"use client";

import type { CreateContributionLedgerEntry } from "@features/create/createContributionLedger";
import type { CreateSavedWorkstateRecord } from "@/features/create/createSavedWorkstateContract";
import type { AccountUserScopedRuntimeLinkage } from "@features/account/userScopedRuntimeLinkageTypes";
import type { ManualAnlassraumServerDraftSnapshot } from "@/features/surfaces/runden/manualAnlassraumSetup";
import type { RoleInfo } from "./AccountClient";
import AccountResumeWorkbenchSection from "./AccountResumeWorkbenchSection";
import CreateContributionLedgerSection from "./CreateContributionLedgerSection";

type Props = {
  entries: CreateContributionLedgerEntry[];
  savedWorkstates: CreateSavedWorkstateRecord[];
  manualAnlassraumServerDrafts: ManualAnlassraumServerDraftSnapshot[];
  roles: RoleInfo[];
  runtimeLinkages: AccountUserScopedRuntimeLinkage[];
};

export default function AccountCreateDraftSections({
  entries,
  savedWorkstates,
  manualAnlassraumServerDrafts,
  roles,
  runtimeLinkages,
}: Props) {
  const canDeepResearch = roles.some((role) => ["admin", "staff", "superadmin"].includes(role.id));

  return (
    <>
      <AccountResumeWorkbenchSection
        entries={entries}
        savedWorkstates={savedWorkstates}
        manualAnlassraumServerDrafts={manualAnlassraumServerDrafts}
        canDeepResearch={canDeepResearch}
        runtimeLinkages={runtimeLinkages}
        canViewInternalSavedWorkstates={canDeepResearch}
      />
      <CreateContributionLedgerSection entries={entries} />
    </>
  );
}
