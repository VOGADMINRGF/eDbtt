import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { coreCol, ObjectId } from "@core/db/triMongo";
import { sendMail } from "@/utils/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  package: z.string(),
  source: z.string().optional(),
  billingInterval: z.enum(["monthly", "yearly"]).optional(),
  prepay: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const userId = jar.get("u_id")?.value;
  if (!userId || !ObjectId.isValid(userId)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const normalizedPackage = parsed.data.package.replace(/^edb-/, "");
  if (!["basis", "start", "pro"].includes(normalizedPackage)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (normalizedPackage !== "basis") {
    return NextResponse.json(
      {
        ok: false,
        error: "requires_preorder",
        message: "Für Start/Pro bitte zuerst vormerken (unverbindlich, ohne Zahlung).",
      },
      { status: 400 },
    );
  }

  const Users = await coreCol("users");
  const userObjectId = new ObjectId(userId);
  const existing = await Users.findOne(
    { _id: userObjectId },
    { projection: { email: 1, profile: 1, displayName: 1, firstName: 1, lastName: 1, edebatte: 1 } },
  );

  const currentPackage = (existing as any)?.edebatte?.package;
  const currentStatus = (existing as any)?.edebatte?.status;

  await Users.updateOne(
    { _id: userObjectId },
    {
      $set: {
        "edebatte.package": normalizedPackage,
        "edebatte.status": "active",
        "edebatte.updatedAt": new Date(),
        "edebatte.preorderAt": new Date(),
        "edebatte.source": parsed.data.source || "self_service",
        "edebatte.billingInterval": parsed.data.billingInterval || null,
        "edebatte.prepay": parsed.data.prepay ?? null,
      },
    },
  );

  const to =
    (existing as any)?.email ||
    (existing as any)?.profile?.email ||
    (existing as any)?.profile?.contactEmail ||
    null;

  const displayName =
    (existing as any)?.profile?.displayName ||
    (existing as any)?.displayName ||
    [existing?.firstName, existing?.lastName].filter(Boolean).join(" ") ||
    "";

  const isSame = currentPackage === normalizedPackage && currentStatus === "active";
  if (to && !isSame) {
    const subject = "eDebatte Basis aktiviert";
    const greeting = displayName ? `Hallo ${displayName},` : "Hallo,";
    const html = `
      <p>${greeting}</p>
      <p>dein Paket <strong>eDebatte Basis</strong> ist jetzt aktiv.</p>
      <p>Du kannst sofort swipen, lesen und dich in Themen einbringen.</p>
      <p>– Dein eDebatte‑Team</p>
    `;
    const text = `${greeting}\n\ndein Paket eDebatte Basis ist jetzt aktiv.\nDu kannst sofort swipen, lesen und dich in Themen einbringen.\n\n– Dein eDebatte‑Team`;
    await sendMail({ to, subject, html, text });
  }

  return NextResponse.json({ ok: true });
}
