"use client";

import Link from "next/link";
import useUser from "@features/user/context/UserContext";
import StreamList from "@features/stream/components/StreamList";

export default function StreamPage() {
  const { user, role } = useUser();
  const needsVerification = user && user.verification !== "legitimized";
  const canSeeViews = ["admin", "superadmin", "moderator", "creator"].includes(role);

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-6xl px-4 py-12 space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
            Live &amp; Replay
          </p>
          <h1 className="text-3xl font-extrabold text-[rgb(var(--fg))] md:text-4xl">
            Streams zu aktuellen Themen
          </h1>
          <p className="text-sm text-[rgb(var(--muted))] md:text-base">
            Schau live rein, diskutier mit und verfolge die wichtigsten Fragen im Kontext der
            aktuellen Debatten.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          {!user && (
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--fg))]">
              <p className="font-semibold">Teilnahme</p>
              <p className="mt-1 text-[rgb(var(--muted))]">
                Streams sind offen. Für Abstimmungen und eigene Fragen brauchst du ein Konto.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/login?next=/stream"
                  className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700"
                >
                  Einloggen
                </Link>
                <Link
                  href="/register?next=/stream"
                  className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-xs font-semibold text-[rgb(var(--fg))] hover:border-sky-300"
                >
                  Konto anlegen
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--fg))]">
            <p className="font-semibold">Verifizierung</p>
            <p className="mt-1 text-[rgb(var(--muted))]">
              Live-Votes sind mit verifiziertem Konto möglich. Ohne Verifizierung bleibt der Stream
              inklusive Replay nutzbar.
            </p>
            {needsVerification ? (
              <Link
                href="/verify?next=/stream"
                className="mt-3 inline-flex items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-900 hover:border-amber-400"
              >
                Verifizierung starten
              </Link>
            ) : (
              <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                Hinweis: Status wird im Stream pro Session transparent angezeigt.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-800">Live</span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-800">Kommend</span>
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1">Replay &amp; Highlights</span>
          </div>
          <StreamList showViews={canSeeViews} statusSections />
        </div>
      </section>
    </main>
  );
}
