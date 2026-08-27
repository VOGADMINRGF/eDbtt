"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import {
  buildPublicQrCodeHref,
  validateQrCodeValue,
} from "@/features/qr/security";

type SummaryResponse = {
  ok: boolean;
  set?: { code: string; title?: string | null; status?: string };
  totalVotes?: number;
  questions?: Array<{
    id: string;
    title: string;
    description?: string | null;
    totalVotes: number;
    options: Array<{ label: string; count: number }>;
  }>;
  error?: string;
};

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function summaryErrorMessage(reason: unknown) {
  if (
    reason === "not_found" ||
    reason === "set_not_found" ||
    reason === "qr_set_not_found"
  ) {
    return "Zu diesem Code wurde keine freigegebene Beteiligung gefunden.";
  }
  return "Die Daten zu diesem Code konnten nicht geladen werden. Bitte versuche es erneut.";
}

const STUDIO_MODES = [
  {
    id: "public",
    title: "Öffentlich",
    text: "Für Bürgerdialoge, Kampagnen und offene Beteiligung mit bewusst freigegebenem Teilnahmepfad.",
  },
  {
    id: "internal",
    title: "Intern",
    text: "Für Unternehmen, Vereine, Gremien und Teams. Rollen und Zugang bleiben im Organisationskontext.",
  },
  {
    id: "event",
    title: "Event & live",
    text: "Für Townhalls, Workshops, Mitgliederversammlungen, Bühnen und moderierte Live-Sessions.",
  },
] as const;

export default function StudioCodeWorkspaceClient({ code }: { code: string }) {
  const normalizedCode = useMemo(() => validateQrCodeValue(code), [code]);
  const publicHref = useMemo(
    () => (normalizedCode ? buildPublicQrCodeHref(normalizedCode) : null),
    [normalizedCode],
  );
  const [origin, setOrigin] = useState("");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!normalizedCode) {
      setLoading(false);
      setError("Der übergebene Code ist nicht gültig.");
      return;
    }

    setLoading(true);
    setError(null);
    void fetch(`/api/qr/sets/summary?code=${encodeURIComponent(normalizedCode)}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as SummaryResponse | null;
        if (!response.ok || !body?.ok) {
          throw new Error(body?.error || "summary_failed");
        }
        return body;
      })
      .then((body) => {
        if (!cancelled) setSummary(body);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setSummary(null);
          setError(summaryErrorMessage(reason instanceof Error ? reason.message : reason));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedCode]);

  const verifiedPublicHref =
    normalizedCode && summary?.set?.code === normalizedCode ? publicHref : null;

  useEffect(() => {
    let cancelled = false;
    if (!origin || !verifiedPublicHref) {
      setQrImage(null);
      return;
    }
    const absoluteTarget = new URL(verifiedPublicHref, origin).toString();
    void QRCode.toDataURL(absoluteTarget, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((dataUrl) => {
        if (!cancelled) setQrImage(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrImage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [origin, verifiedPublicHref]);

  const questions = toArray(summary?.questions);
  const absolutePublicHref = origin && publicHref ? new URL(publicHref, origin).toString() : publicHref;

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] px-4 py-8 text-[rgb(var(--fg))] md:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Studio · verteilen, einladen und live begleiten
          </p>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {summary?.set?.title?.trim() || "Beteiligung im Studio vorbereiten"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))] md:text-base">
                Das Studio bearbeitet nicht erneut den Inhalt. Es bündelt Zugang, QR, Event,
                Live-Begleitung und Auswertung für eine bereits vorbereitete Beteiligung.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="vog-chip vog-chip--active">Code: {normalizedCode ?? "ungültig"}</span>
              <span className="vog-chip">{questions.length} Fragen</span>
              <span className="vog-chip">{summary?.totalVotes ?? 0} Teilnahmen</span>
            </div>
          </div>
          <div className="mt-6 grid gap-2 text-xs sm:grid-cols-5">
            {[
              "1 Ziel",
              "2 Zugang",
              "3 Auftritt",
              "4 Live",
              "5 Auswertung",
            ].map((step, index) => (
              <div
                key={step}
                className={`rounded-xl border px-3 py-2 font-semibold ${
                  index === 0
                    ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                    : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    Kanonisches Teilnahmeziel
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Direkt teilnehmen – ohne zweite Eingabe</h2>
                </div>
                <span className="vog-chip vog-chip--status">
                  {error
                    ? "nicht verfügbar"
                    : summary?.set?.status || (loading ? "wird geladen" : "vorbereitet")}
                </span>
              </div>
              <p className="mt-3 break-all rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm text-[rgb(var(--muted))]">
                {absolutePublicHref || "Teilnahmelink wird vorbereitet."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {publicHref ? (
                  <Link href={publicHref} className="btn btn-primary text-sm">
                    Teilnahme testen
                  </Link>
                ) : null}
                <Link href="/runden" className="btn-secondary text-sm">
                  Runde und Kontext öffnen
                </Link>
                <Link
                  href="/create?intent=participation&returnTo=%2Fstudio"
                  className="btn-secondary text-sm"
                >
                  Neuen Beteiligungsentwurf vorbereiten
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-semibold">Einsatz festlegen</h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Derselbe freigegebene Beteiligungsgegenstand kann öffentlich, intern oder als
                Event ausgespielt werden. Das Studio erzeugt dafür keine zweite Inhaltswelt.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {STUDIO_MODES.map((mode) => (
                  <article
                    key={mode.id}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                  >
                    <p className="font-semibold">{mode.title}</p>
                    <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{mode.text}</p>
                  </article>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-[rgb(var(--muted))]">
                Branding, Rollen, Einladungen und Ergebnisfreigabe bleiben im bestehenden
                Organisations-, Runden- und Eventkontext. Es entsteht keine parallele Studio-Persistenz.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/account/organization/dashboard" className="btn-secondary text-sm">
                  Organisation einbeziehen
                </Link>
                <Link href="/dashboard/streams" className="btn-secondary text-sm">
                  Event oder Live-Session vorbereiten
                </Link>
              </div>
            </section>

            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Live-Auswertung</h2>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                    Die Auswertung des geöffneten Ziels wird automatisch geladen.
                  </p>
                </div>
                <span className="vog-chip">Gesamt: {summary?.totalVotes ?? 0}</span>
              </div>

              {loading ? (
                <p className="mt-4 text-sm text-[rgb(var(--muted))]">Auswertung wird geladen …</p>
              ) : error ? (
                <p className="mt-4 rounded-2xl border border-amber-500/50 bg-amber-300/10 p-3 text-sm text-amber-900 dark:text-amber-100">
                  Die Auswertung ist noch nicht verfügbar: {error}
                </p>
              ) : questions.length ? (
                <div className="mt-4 space-y-3">
                  {questions.map((question) => (
                    <article
                      key={question.id}
                      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold">{question.title}</p>
                        <span className="text-xs text-[rgb(var(--muted))]">
                          {question.totalVotes} Antworten
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
                        {toArray(question.options).map((option) => (
                          <span key={`${question.id}-${option.label}`} className="vog-chip">
                            {option.label}: {option.count}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-[rgb(var(--muted))]">
                  Noch liegen keine auswertbaren Fragen vor.
                </p>
              )}

              <details className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  Andere Auswertung öffnen
                </summary>
                <form action="/studio" method="get" className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <label htmlFor="studio-evaluation-code" className="sr-only">
                    Code für eine andere Auswertung
                  </label>
                  <input
                    id="studio-evaluation-code"
                    name="code"
                    placeholder="Code eingeben"
                    className="min-w-0 flex-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                  />
                  <button type="submit" className="btn-secondary text-sm">
                    Öffnen
                  </button>
                </form>
              </details>
            </section>
          </div>

          <aside className="h-fit rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              QR und Zugang
            </p>
            <h2 className="mt-1 text-xl font-semibold">Direkter Einstieg</h2>
            <div className="mt-4 flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--border))] bg-white p-4">
              {qrImage ? (
                <img src={qrImage} alt="QR-Code zur direkten Beteiligung" className="h-64 w-64" />
              ) : (
                <span className="text-center text-sm text-slate-600">
                  {error
                    ? "QR-Code ist erst nach erfolgreicher Zielprüfung verfügbar."
                    : "QR-Code wird vorbereitet …"}
                </span>
              )}
            </div>
            <p className="mt-4 text-xs leading-5 text-[rgb(var(--muted))]">
              Der Scan öffnet direkt die Beteiligung unter <strong>/qr/[code]</strong>. Das Studio
              selbst bleibt die Betreiberfläche für Verteilung, Event und Auswertung.
            </p>
            {qrImage ? (
              <a
                href={qrImage}
                download={`edebatte-studio-${normalizedCode ?? "beteiligung"}.png`}
                className="btn-secondary mt-4 inline-flex w-full items-center justify-center text-sm"
              >
                QR-Code speichern
              </a>
            ) : null}
          </aside>
        </section>
      </div>
    </main>
  );
}
