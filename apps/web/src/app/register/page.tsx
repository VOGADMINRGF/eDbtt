import type { Metadata } from "next";
import RegisterPageClient from "./RegisterPageClient";

export const metadata: Metadata = {
  title: "Neues Konto anlegen – eDebatte",
};

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function RegisterPage({ searchParams }: Props) {
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <section className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
        <h1 className="sr-only">Registrieren</h1>
        <RegisterPageClient searchParams={searchParams} />
      </section>
    </main>
  );
}
