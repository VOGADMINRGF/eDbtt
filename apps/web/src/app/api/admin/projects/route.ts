import { NextRequest, NextResponse } from "next/server";
import { projectsCol } from "@features/project/db";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const col = await projectsCol();
  const items = await col.find({}).sort({ createdAt: -1 }).limit(200).toArray();

  return NextResponse.json({
    ok: true,
    items: items.map((project) => {
      const proposed = project.topics.reduce((sum, topic) => {
        return sum + topic.options.filter((opt) => opt.status === "proposed").length;
      }, 0);
      return {
        id: project._id?.toString() ?? "",
        title: project.title,
        status: project.status,
        regionCode: project.regionCode ?? null,
        topicsCount: project.topics.length,
        proposedOptions: proposed,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      };
    }),
  });
}
