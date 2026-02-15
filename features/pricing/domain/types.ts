export type PackageStatus = "verfuegbar" | "pilot" | "vormerkung" | "bald";
export type PackageAudience = "buerger" | "organisation";
export type EDebattePackageId = "basis" | "start" | "pro" | "pilot-b2g" | "pilot-b2b";

export type EDebattePackageDefinition = {
  id: EDebattePackageId;
  titel: string;
  zielgruppe: string;
  typ: PackageAudience;
  status: PackageStatus;
  preisMonat?: number;
  preisJahr?: number;
  beschreibungKurz: string;
  leistungen: string[];
  hervorgehoben?: boolean;
  ctaText: string;
  ctaHref: string;
  sekundarCtaText?: string;
  sekundarCtaHref?: string;
};

export type CreatePreorderLeadInput = {
  packageId: string;
  email?: string;
  name?: string;
  source?: string;
  locale?: string;
  plz?: string;
  note?: string;
  type?: PackageAudience;
};

export type CreatePreorderLeadResult =
  | { ok: true; mailSent: boolean; planLabel: string }
  | { ok: false; error: "invalid_input" | "unknown_plan" };

export type PreorderLeadStatus = "vormerkung";

export type PreorderLeadRecord = {
  packageId: EDebattePackageId;
  planLabel: string;
  type: PackageAudience | null;
  email: string | null;
  plz: string | null;
  note: string | null;
  source: string;
  priceMonthly: number | null;
  status: PreorderLeadStatus;
  userId: string | null;
  createdAt: Date;
};

export type PreorderUserUpdate = {
  packageId: EDebattePackageId;
  status: "active" | "preorder";
  source: string;
  updatedAt: Date;
  preorderAt: Date;
};

export type UserContact = {
  email?: string | null;
  displayName?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type ConfirmationMail = {
  subject: string;
  html: string;
  text: string;
};
