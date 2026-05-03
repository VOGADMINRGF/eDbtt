import { z } from "zod";

export const WORKBENCH_SURFACE_KEYS = ["dossier", "runde", "mandat"] as const;
export type WorkbenchSurfaceKey = (typeof WORKBENCH_SURFACE_KEYS)[number];

const WorkbenchSurfaceSchema = z
  .object({
    key: z.enum(WORKBENCH_SURFACE_KEYS),
    title: z.string().trim().min(1),
    purpose: z.string().trim().min(1),
    primaryFocus: z.string().trim().min(1),
    readOnlyEvidenceFirst: z.boolean(),
    allowsCommentColumnBehavior: z.literal(false),
    exampleLabelRequiredWhenMockup: z.boolean(),
  })
  .strict();

export type WorkbenchSurface = z.infer<typeof WorkbenchSurfaceSchema>;

export const MandateWorkbenchFamilySchema = z
  .object({
    familyName: z.literal("Dossier-Runde-Mandat Workbench Familie"),
    visualLanguage: z
      .object({
        cardRadius: z.literal("rounded-3xl"),
        borderStyle: z.literal("subtle-border"),
        statusChips: z.literal(true),
        evidenceHintPlacement: z.literal("header_or_intro"),
      })
      .strict(),
    surfaces: z.array(WorkbenchSurfaceSchema).length(3),
    guardrails: z
      .object({
        mandateMustNotLookLikeCommentSurface: z.literal(true),
        mockupsMustBeMarkedAsExample: z.literal(true),
        noRoutingCanonChangeInThisSlice: z.literal(true),
      })
      .strict(),
    regionalAnlassraumCompatibility: z
      .object({
        keepsRundenAsOperationalSurface: z.literal(true),
        allowsRegionalAnlassraumLinking: z.literal(true),
        keepsDossierRoundMandateFlow: z.literal("anlassraum_to_dossier_to_runde_to_mandat"),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const keys = value.surfaces.map((surface) => surface.key);
    const unique = new Set(keys);
    if (unique.size !== 3 || !keys.includes("dossier") || !keys.includes("runde") || !keys.includes("mandat")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["surfaces"],
        message: "workbench_family_must_contain_dossier_runde_mandat_once_each",
      });
    }
  });

export type MandateWorkbenchFamily = z.infer<typeof MandateWorkbenchFamilySchema>;

export function buildMandateWorkbenchFamilyContract(): MandateWorkbenchFamily {
  return MandateWorkbenchFamilySchema.parse({
    familyName: "Dossier-Runde-Mandat Workbench Familie",
    visualLanguage: {
      cardRadius: "rounded-3xl",
      borderStyle: "subtle-border",
      statusChips: true,
      evidenceHintPlacement: "header_or_intro",
    },
    surfaces: [
      {
        key: "dossier",
        title: "Dossier-Workbench",
        purpose: "Verdichtung von Fragen, Claims, Quellen, Optionen und offenen Punkten.",
        primaryFocus: "Evidenz, Abwägung und Nachvollziehbarkeit vor Entscheidung.",
        readOnlyEvidenceFirst: true,
        allowsCommentColumnBehavior: false,
        exampleLabelRequiredWhenMockup: true,
      },
      {
        key: "runde",
        title: "Runden-Workbench",
        purpose: "Beteiligung, Optionen, Rückmeldungen und Zwischenstände im Anlasskontext.",
        primaryFocus: "Arbeitsstand und Teilhabe statt statischer Ergebnisdarstellung.",
        readOnlyEvidenceFirst: true,
        allowsCommentColumnBehavior: false,
        exampleLabelRequiredWhenMockup: true,
      },
      {
        key: "mandat",
        title: "Mandats-Workbench",
        purpose: "Beschluss, Verantwortung, Status und Umsetzungsverlauf öffentlich dokumentieren.",
        primaryFocus: "Nachweisraum für Umsetzung, nicht neue Debattenspalte.",
        readOnlyEvidenceFirst: true,
        allowsCommentColumnBehavior: false,
        exampleLabelRequiredWhenMockup: true,
      },
    ],
    guardrails: {
      mandateMustNotLookLikeCommentSurface: true,
      mockupsMustBeMarkedAsExample: true,
      noRoutingCanonChangeInThisSlice: true,
    },
    regionalAnlassraumCompatibility: {
      keepsRundenAsOperationalSurface: true,
      allowsRegionalAnlassraumLinking: true,
      keepsDossierRoundMandateFlow: "anlassraum_to_dossier_to_runde_to_mandat",
    },
  });
}

export function parseMandateWorkbenchFamily(value: unknown): MandateWorkbenchFamily {
  return MandateWorkbenchFamilySchema.parse(value);
}

export function getWorkbenchSurface(
  family: MandateWorkbenchFamily,
  key: WorkbenchSurfaceKey,
): WorkbenchSurface {
  const found = family.surfaces.find((surface) => surface.key === key);
  if (!found) {
    throw new Error(`missing_workbench_surface:${key}`);
  }
  return found;
}
