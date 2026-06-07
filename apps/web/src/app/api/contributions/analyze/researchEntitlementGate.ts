import type { NextRequest } from "next/server";

import { getCreateEntitlementsForRequest } from "@/lib/server/entitlements/createEntitlements";
import {
  getFactcheckEntitlementGateMessage,
  resolveFactcheckEntitlementGate,
  type FactcheckEntitlementAction,
} from "@features/factcheck/entitlementGate";

import type { AnalyzeRequestParsed } from "./parseAnalyzeRequest";

type AnalyzeResearchGateMeta = {
  lane: "standard";
  journeyProfile: "analyze";
  noAutoDeepSearch: true;
  noAutoPublish: true;
  noAutoGraphPromotion: true;
};

export type AnalyzeResearchGateBlock = {
  entitlementGate: ReturnType<typeof resolveFactcheckEntitlementGate>;
  message: string;
  meta: AnalyzeResearchGateMeta;
  status: number;
};

function toEntitlementGateStatus(reason: string) {
  if (reason === "login_required") return 401;
  if (reason === "confirmation_required") return 409;
  if (reason === "entitlement_missing" || reason === "pricing_required") return 402;
  return 400;
}

function resolveAnalyzeResearchAction(body: AnalyzeRequestParsed): FactcheckEntitlementAction | null {
  if (body.researchMode === "gpt_deepsearch" || body.allowDeepSearch === true) {
    return "deep_research";
  }
  if (body.researchMode === "gemini") {
    return "source_check";
  }
  return null;
}

export async function resolveAnalyzeResearchGateBlock(
  req: NextRequest,
  body: AnalyzeRequestParsed,
): Promise<AnalyzeResearchGateBlock | null> {
  const requestedResearchAction = resolveAnalyzeResearchAction(body);
  if (!requestedResearchAction) return null;

  const entitlements = await getCreateEntitlementsForRequest(req).catch(() => null);
  const entitlementGate = resolveFactcheckEntitlementGate(requestedResearchAction, {
    isAuthenticated: Boolean(entitlements?.isAuthenticated),
    hasEntitlement: entitlements?.canDeepResearch ?? false,
    hasPricingAccess: entitlements?.canDeepResearch ?? false,
    confirmationProvided: body.researchConfirmed === true,
  });
  if (entitlementGate.allowed) return null;

  return {
    entitlementGate,
    message: getFactcheckEntitlementGateMessage(entitlementGate),
    meta: {
      lane: "standard",
      journeyProfile: "analyze",
      noAutoDeepSearch: true,
      noAutoPublish: true,
      noAutoGraphPromotion: true,
    },
    status: toEntitlementGateStatus(entitlementGate.reason),
  };
}
