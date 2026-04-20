import DemoCreateClient from "./DemoCreateClient";
import { parseDemoPersona } from "@/features/demo/personas";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function DemoCreatePage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const persona = parseDemoPersona(readParam(resolved?.persona));

  return (
    <>
      <h1 className="sr-only">Demo Create</h1>
      <DemoCreateClient persona={persona} />
    </>
  );
}
