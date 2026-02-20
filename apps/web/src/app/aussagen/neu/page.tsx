import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function AussagenNeuPage({ searchParams }: PageProps) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else if (typeof value === "string") {
        params.set(key, value);
      }
    }
  }
  const query = params.toString();
  redirect(query ? `/statements/new?${query}` : "/statements/new");
}
