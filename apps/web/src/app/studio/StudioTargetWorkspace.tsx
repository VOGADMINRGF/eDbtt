import Link from "next/link";
import QrStudioTargetPreview from "@/app/qr-studio/QrStudioTargetPreview";
import { STUDIO_PATH, validateQrTarget } from "@/features/qr/security";
import { getQrStudioCallerLabel } from "@features/qr";

function targetTypeLabel(pathname: string) {
  if (pathname.startsWith("/anlassraum") || pathname.startsWith("/runden")) {
    return "Anlassraum oder Runde";
  }
  if (pathname.startsWith("/dossier")) return "Dossier";
  if (pathname.startsWith("/beteiligung") || pathname.startsWith("/swipes")) {
    return "Beteiligung";
  }
  if (pathname.startsWith("/live") || pathname.startsWith("/stream")) {
    return "Event oder Live";
  }
  if (pathname.startsWith("/companion")) return "Begleitformat";
  return "Öffentliches Ziel";
}

export default function StudioTargetWorkspace({
  rawTarget,
  caller,
}: {
  rawTarget: string;
  caller?: string | null;
}) {
  const validation = validateQrTarget(rawTarget);
  const callerLabel = getQrStudioCallerLabel(caller);

  if ("message" in validation) {
    return (
      <main
        className="mx-auto flex min-h-[100svh] max-w-3xl flex-col gap-6 px-4 py-12"
        data-testid="qr-target-invalid"
      >
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Studio · Zielprüfung
          </p>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Ziel wurde blockiert</h1>
          <p className="text-sm leading-6 text-[rgb(var(--muted))]">
            Das übergebene Ziel erfüllt die Sicherheitsregeln nicht. Es wird weder ein QR-Code
            erzeugt noch eine automatische Navigation ausgelöst.
          </p>
        </header>
        <section className="rounded-2xl border border-rose-300/50 bg-rose-300/10 p-4 text-sm">
          <p className="text-xs text-[rgb(var(--muted))]">Aufrufer: {callerLabel}</p>
          <p className="mt-2 font-semibold">Grund</p>
          <p className="mt-1 text-[rgb(var(--muted))]">{validation.message}</p>
        </section>
        <div className="flex flex-wrap gap-2">
          <Link href={STUDIO_PATH} className="btn btn-primary text-sm">
            Zum Studio
          </Link>
          <Link
            href="/create?intent=participation&returnTo=%2Fstudio"
            className="btn-secondary text-sm"
          >
            Beteiligungsentwurf vorbereiten
          </Link>
        </div>
      </main>
    );
  }

  const target = validation.value;
  const publicHref = target.kind === "internal" ? target.normalizedTarget : target.absoluteTarget;
  let pathname = publicHref;
  try {
    pathname = new URL(target.absoluteTarget).pathname;
  } catch {
    // Keep publicHref as a readable fallback.
  }
  const targetLabel = targetTypeLabel(pathname);

  return (
    <main
      className="min-h-screen bg-[rgb(var(--bg))] px-4 py-8 text-[rgb(var(--fg))] md:py-12"
      data-testid="qr-target-gateway"
      data-qr-target-kind={target.kind}
    >
      <div className="mx-auto max-w-6xl space-y-6" data-testid="studio-target-workspace">
        <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Studio · verteilen, einladen und live begleiten
          </p>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {targetLabel} ausspielen
              </h1>
              <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))] md:text-base">
                Das Ziel ist geprüft und bleibt der kanonische öffentliche Pfad. Im Studio werden
                QR, Zugang, Event und Verteilung vorbereitet – ohne den Inhalt erneut einzugeben.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="vog-chip vog-chip--active">{targetLabel}</span>
              <span className="vog-chip">Aufrufer: {callerLabel}</span>
              <span className="vog-chip">{target.kind === "internal" ? "eDebatte" : target.host}</span>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Kanonisches Ziel
              </p>
              <h2 className="mt-1 text-xl font-semibold">Direkter öffentlicher Pfad</h2>
              <p className="mt-3 break-all rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm text-[rgb(var(--muted))]">
                {target.absoluteTarget}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={publicHref} className="btn btn-primary text-sm">
                  Ziel testen
                </a>
                <Link href="/runden" className="btn-secondary text-sm">
                  Kontext und Runde öffnen
                </Link>
                <Link href="/dashboard/streams" className="btn-secondary text-sm">
                  Event oder Live vorbereiten
                </Link>
              </div>
            </article>

            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
              <h2 className="text-xl font-semibold">Betreiber-Kontext</h2>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                Unternehmen, Vereine, Verbände und öffentliche Betreiber können denselben
                Beteiligungsgegenstand öffentlich, intern oder als Event einsetzen. Rollen,
                Einladungen, Branding, Moderation und Ergebnisfreigabe bleiben in den bestehenden
                Organisations-, Runden- und Live-Workflows.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  ["Öffentlich", "Offener, bewusst freigegebener Teilnahmepfad."],
                  ["Intern", "Organisation, Team, Mitglieder oder Gremium mit Rollenbezug."],
                  ["Event & live", "Session, Bühne, Beamer, Moderation und Live-Auswertung."],
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                  >
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{text}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <aside className="h-fit rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              QR und Verteilung
            </p>
            <h2 className="mt-1 text-xl font-semibold">Direkter Einstieg</h2>
            <div className="mt-4 flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--border))] bg-white p-4">
              <QrStudioTargetPreview absoluteTarget={target.absoluteTarget} />
            </div>
            <p className="mt-4 text-xs leading-5 text-[rgb(var(--muted))]">
              Der QR-Code enthält das kanonische Ziel selbst. Er führt nicht zurück in einen
              separaten Editor und verlangt keine erneute Inhaltseingabe.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
