import { BRAND } from "@/lib/brand";
import {
  STUDIO_PATH,
  validateQrTarget,
  type QrTargetValidationFailureReason,
} from "@/features/qr/security";

export const QR_STUDIO_CALLER_INVENTORY = {
  content_release_workbench: "Review-to-Publish Workspace",
  public_topic_page: "Öffentliche Themenseite",
  organization_dashboard: "Organisations-Dashboard",
  legacy_qrcodegenerator: "Legacy QR Generator",
  legacy_qrcodewizard: "Legacy QR Wizard",
  qr_studio: "Studio",
} as const;

export type QrStudioCaller = keyof typeof QR_STUDIO_CALLER_INVENTORY;

export type QrStudioTargetResolution =
  | {
      status: "empty";
      caller: QrStudioCaller;
    }
  | {
      status: "blocked";
      caller: QrStudioCaller;
      reason: QrTargetValidationFailureReason;
    }
  | {
      status: "ready";
      caller: QrStudioCaller;
      targetKind: "internal" | "allowed_https";
      normalizedTarget: string;
      absoluteHref: string;
      displayHref: string;
    };

const DEFAULT_CALLER: QrStudioCaller = "qr_studio";

export function parseQrStudioCaller(value: string | null | undefined): QrStudioCaller {
  if (value && value in QR_STUDIO_CALLER_INVENTORY) {
    return value as QrStudioCaller;
  }
  return DEFAULT_CALLER;
}

export function getQrStudioCallerLabel(caller: string | null | undefined): string {
  return QR_STUDIO_CALLER_INVENTORY[parseQrStudioCaller(caller)];
}

export function resolveQrStudioTarget(input: {
  target: string | null | undefined;
  caller?: string | null | undefined;
  publicOrigin?: string | null | undefined;
}): QrStudioTargetResolution {
  const caller = parseQrStudioCaller(input.caller);
  const rawTarget = typeof input.target === "string" ? input.target : "";
  if (!rawTarget.trim()) {
    return { status: "empty", caller };
  }

  const baseOrigin = normalizeBaseOrigin(input.publicOrigin);
  const validation = validateQrTarget(rawTarget, {
    expectedOrigin: baseOrigin,
  });
  if ("reason" in validation) {
    return {
      status: "blocked",
      caller,
      reason: validation.reason,
    };
  }

  const target = validation.value;
  const isInternal = target.kind === "internal";

  return {
    status: "ready",
    caller,
    targetKind: isInternal ? "internal" : "allowed_https",
    normalizedTarget: target.normalizedTarget,
    absoluteHref: target.absoluteTarget,
    displayHref: isInternal ? target.normalizedTarget : target.absoluteTarget,
  };
}

export function buildQrStudioHref(input: {
  target?: string | null | undefined;
  caller?: string | null | undefined;
  publicOrigin?: string | null | undefined;
}): string {
  const resolved = resolveQrStudioTarget({
    target: input.target ?? null,
    caller: input.caller,
    publicOrigin: input.publicOrigin,
  });
  const params = new URLSearchParams();

  if (resolved.caller !== DEFAULT_CALLER) {
    params.set("caller", resolved.caller);
  }

  if (resolved.status === "ready") {
    params.set("target", resolved.normalizedTarget);
  } else if (resolved.status === "blocked") {
    params.set("targetState", "blocked");
  }

  const query = params.toString();
  return query ? `${STUDIO_PATH}?${query}` : STUDIO_PATH;
}

function normalizeBaseOrigin(publicOrigin: string | null | undefined): string {
  const candidates = [publicOrigin, BRAND.baseUrl];
  for (const candidate of candidates) {
    try {
      const url = new URL(String(candidate ?? "").trim());
      return url.origin;
    } catch {
      // ignore
    }
  }
  return "https://www.edebatte.org";
}
