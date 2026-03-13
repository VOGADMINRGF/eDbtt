import { redirect } from "next/navigation";
import { buildNewsroomCompanionPath } from "@features/newsroom";

type PageProps = {
  params: Promise<{ dossierId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function read(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function NewsroomShortRedirect({ params, searchParams }: PageProps) {
  const { dossierId } = await params;
  if (!dossierId?.trim()) {
    return (
      <main>
        <h1>Newsroom Short Redirect</h1>
      </main>
    );
  }
  const resolved = searchParams ? await searchParams : {};
  const target = buildNewsroomCompanionPath({
    dossierId,
    anchorId: read(resolved.anchor),
    medium: read(resolved.medium),
    format: read(resolved.format),
    publishedAt: read(resolved.publishedAt),
    cta: read(resolved.cta),
  });
  redirect(target);
}
