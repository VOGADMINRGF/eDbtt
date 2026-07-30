import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { coreCol, ObjectId } from "@core/db/triMongo";
import { sendMail } from "@/utils/mailer";
import {
  mailLocaleFromUser,
  renderTransactionalMail,
  resolveMailLocale,
} from "@/utils/mailRenderer";

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
        message: "Für Start/Pro bitte zuerst den Paketstart über /order anlegen. Die Freischaltung folgt anschließend.",
      },
      { status: 400 },
    );
  }

  const Users = await coreCol("users");
  const userObjectId = new ObjectId(userId);
  const existing = await Users.findOne(
    { _id: userObjectId },
    {
      projection: {
        email: 1,
        profile: 1,
        settings: 1,
        displayName: 1,
        firstName: 1,
        lastName: 1,
        edebatte: 1,
      },
    },
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
  let activationMailDelivered: boolean | null = null;
  if (to && !isSame) {
    const locale = mailLocaleFromUser(existing);
    const isEnglish = resolveMailLocale(locale) === "en";
    const subject = isEnglish
      ? "eDebatte Basic activated"
      : "eDebatte Basis aktiviert";
    const greeting = displayName
      ? `${isEnglish ? "Hello" : "Hallo"} ${displayName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,";
    const mail = renderTransactionalMail({
      locale,
      subject,
      preheader: isEnglish
        ? "Your eDebatte Basic package is active."
        : "Dein eDebatte-Basispaket ist aktiv.",
      title: isEnglish ? "eDebatte Basic activated" : "eDebatte Basis aktiviert",
      greeting,
      blocks: [
        {
          kind: "paragraph",
          text: isEnglish
            ? "Your eDebatte Basic package is now active."
            : "Dein Paket eDebatte Basis ist jetzt aktiv.",
        },
        {
          kind: "paragraph",
          text: isEnglish
            ? "You can start swiping, reading and contributing to topics right away."
            : "Du kannst sofort swipen, lesen und dich in Themen einbringen.",
        },
      ],
      reason: isEnglish
        ? "your eDebatte Basic package was activated."
        : "dein eDebatte-Basispaket aktiviert wurde.",
    });
    const mailResult = await sendMail({
      to,
      mail,
      delivery: "best_effort_delivery",
      tag: "package_activation",
    });
    activationMailDelivered = mailResult.ok;
  }

  return NextResponse.json({ ok: true, activationMailDelivered });
}
