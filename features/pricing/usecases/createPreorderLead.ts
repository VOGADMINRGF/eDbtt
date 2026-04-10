import "server-only";
import { z } from "zod";
import { getEdebatePackageById, normalizePackageId } from "../domain/helpers";
import type {
  ConfirmationMail,
  CreatePreorderLeadResult,
  PackageAudience,
  PreorderLeadRecord,
  PreorderUserUpdate,
  UserContact,
} from "../domain/types";
import { findPreorderUserById, insertPreorderLead, updatePreorderUser } from "../server/leadsRepo";

export type LeadRepo = {
  insertLead: (lead: PreorderLeadRecord) => Promise<void>;
};

export type UserRepo = {
  findById: (userId: string) => Promise<UserContact | null>;
  updatePreorder: (userId: string, update: PreorderUserUpdate) => Promise<void>;
};

export type CreatePreorderLeadDeps = {
  leadRepo?: LeadRepo;
  userRepo?: UserRepo;
  now?: () => Date;
  publicOrigin?: () => string;
  buildConfirmationMail?: (args: {
    displayName?: string | null;
    planLabel: string;
    monthlyPrice?: number | null;
    accountUrl?: string;
    locale?: string;
  }) => ConfirmationMail;
  sendMail?: (payload: { to: string; subject: string; html: string; text: string }) => Promise<void>;
};

export type CreatePreorderLeadOptions = {
  userId?: string | null;
};

const schema = z
  .object({
    packageId: z.string().min(1).optional(),
    package: z.string().min(1).optional(),
    email: z.string().email().optional(),
    name: z.string().max(120).optional(),
    source: z.string().max(120).optional(),
    locale: z.string().max(12).optional(),
    plz: z.string().min(3).max(12).optional(),
    note: z.string().max(800).optional(),
    type: z.enum(["buerger", "organisation"]).optional(),
  })
  .refine((data) => Boolean(data.packageId || data.package), {
    message: "package_required",
  });

type ParsedInput = z.infer<typeof schema>;

function buildDisplayName(user: UserContact | null, fallback?: string | null) {
  if (fallback?.trim()) return fallback.trim();
  if (!user) return null;
  return (
    user.displayName ||
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    null
  );
}

function normalizeEmail(value?: string | null) {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || null;
}

export async function createPreorderLead(
  raw: unknown,
  options: CreatePreorderLeadOptions = {},
  deps: CreatePreorderLeadDeps = {},
): Promise<CreatePreorderLeadResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const data: ParsedInput = parsed.data;
  const packageValue = data.packageId ?? data.package ?? "";
  const normalizedPackage = normalizePackageId(packageValue);
  if (!normalizedPackage) {
    return { ok: false, error: "unknown_plan" };
  }

  const plan = getEdebatePackageById(normalizedPackage);
  if (!plan) {
    return { ok: false, error: "unknown_plan" };
  }

  const now = deps.now ? deps.now() : new Date();
  const source = data.source ?? "package_start";
  const emailFromPayload = normalizeEmail(data.email);
  const payloadType: PackageAudience | null = data.type ?? plan.typ ?? null;

  const leadRepo: LeadRepo = deps.leadRepo ?? { insertLead: insertPreorderLead };
  const userRepo: UserRepo | null = deps.userRepo ?? {
    findById: findPreorderUserById,
    updatePreorder: updatePreorderUser,
  };

  const lead: PreorderLeadRecord = {
    packageId: normalizedPackage,
    planLabel: plan.titel,
    type: payloadType,
    email: emailFromPayload,
    plz: data.plz?.trim() || null,
    note: data.note?.trim() || null,
    source,
    priceMonthly: plan.preisMonat ?? null,
    status: "vormerkung",
    userId: options.userId ?? null,
    createdAt: now,
  };

  await leadRepo.insertLead(lead);

  let contactEmail = emailFromPayload;
  let displayName = data.name?.trim() || null;

  if (options.userId && userRepo) {
    const isFree = plan.preisMonat === 0;
    await userRepo.updatePreorder(options.userId, {
      packageId: normalizedPackage,
      status: isFree ? "active" : "preorder",
      source,
      updatedAt: now,
      preorderAt: now,
    });

    const user = await userRepo.findById(options.userId);
    contactEmail = contactEmail || normalizeEmail(user?.email || null);
    displayName = buildDisplayName(user, displayName);
  }

  let mailSent = false;
  if (contactEmail && deps.sendMail && deps.buildConfirmationMail) {
    try {
      const origin = deps.publicOrigin ? deps.publicOrigin() : "";
      const accountUrl = origin
        ? `${origin.replace(/\/$/, "")}/account?preorder=thanks`
        : undefined;

      const mail = deps.buildConfirmationMail({
        displayName,
        planLabel: plan.titel,
        monthlyPrice: plan.preisMonat ?? null,
        accountUrl,
        locale: data.locale,
      });

      await deps.sendMail({
        to: contactEmail,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      });
      mailSent = true;
    } catch {
      mailSent = false;
    }
  }

  return { ok: true, mailSent, planLabel: plan.titel };
}
