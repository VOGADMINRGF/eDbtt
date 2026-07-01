import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  approveDossierPublication,
  archiveDossierPublication,
  blockDossierPublication,
  publishApprovedDossier,
  rejectDossierPublication,
  requestDossierPublicationReview,
  unpublishPublishedDossier,
} from "@/features/create/dossierPublishWorkflowServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    action: z.enum([
      "requestDossierPublicationReview",
      "approveDossierPublication",
      "publishApprovedDossier",
      "unpublishPublishedDossier",
      "rejectDossierPublication",
      "blockDossierPublication",
      "archiveDossierPublication",
    ]),
  })
  .strict();

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{
      sourceHandoffId: string;
    }>;
  },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const actorUserId = gate?._id?.toHexString?.() ?? "";
  if (!actorUserId) {
    return NextResponse.json(
      { ok: false, error: "admin_user_id_missing" },
      { status: 400 },
    );
  }

  try {
    const { sourceHandoffId } = await context.params;
    const body = BodySchema.parse(await req.json());

    const result =
      body.action === "requestDossierPublicationReview"
        ? await requestDossierPublicationReview({
            sourceHandoffId,
            actorUserId,
          })
        : body.action === "approveDossierPublication"
          ? await approveDossierPublication({
              sourceHandoffId,
              actorUserId,
            })
          : body.action === "publishApprovedDossier"
            ? await publishApprovedDossier({
                sourceHandoffId,
                actorUserId,
              })
            : body.action === "unpublishPublishedDossier"
              ? await unpublishPublishedDossier({
                  sourceHandoffId,
                  actorUserId,
                })
              : body.action === "rejectDossierPublication"
                ? await rejectDossierPublication({
                    sourceHandoffId,
                    actorUserId,
                  })
                : body.action === "blockDossierPublication"
                  ? await blockDossierPublication({
                      sourceHandoffId,
                      actorUserId,
                    })
                  : await archiveDossierPublication({
                      sourceHandoffId,
                      actorUserId,
                    });

    return NextResponse.json({ ok: true, record: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "dossier_publish_action_failed";
    const status =
      message === "dossier_publication_record_not_found" ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
