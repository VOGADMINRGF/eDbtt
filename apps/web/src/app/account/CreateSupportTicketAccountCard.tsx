import Link from "next/link";
import type { CreateSupportTicketRecord } from "@/features/support/createSupportTickets";

const STATUS_LABELS: Record<CreateSupportTicketRecord["status"], string> = {
  open: "Offen",
  investigating: "In Bearbeitung",
  resolved: "Gelöst",
  closed: "Geschlossen",
};

export default function CreateSupportTicketAccountCard(props: {
  ticketNumber: string;
  ticket: CreateSupportTicketRecord | null;
}) {
  return (
    <section
      id="support-tickets"
      data-account-support-ticket
      className="rounded-3xl border border-cyan-300/30 bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--grad-from))_6%)] p-5 shadow-sm md:p-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">
        Technischer Support
      </p>
      {props.ticket ? (
        <>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
              Ticket {props.ticket.ticketNumber}
            </h2>
            <span className="rounded-full border border-cyan-300/35 bg-cyan-500/[0.08] px-3 py-1 text-xs font-semibold text-cyan-900 dark:text-cyan-100">
              {STATUS_LABELS[props.ticket.status]}
            </span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))]">
            Der technische Fall zu deinem gespeicherten Beitrag ist mit deinem Konto
            verknüpft. Sobald er gelöst ist, erhältst du eine Nachricht.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[rgb(var(--muted))]">Erstellt</dt>
              <dd className="mt-1 font-medium text-[rgb(var(--fg))]">
                {new Intl.DateTimeFormat("de-DE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(props.ticket.createdAt))}
              </dd>
            </div>
            <div>
              <dt className="text-[rgb(var(--muted))]">Benachrichtigung</dt>
              <dd className="mt-1 font-medium text-[rgb(var(--fg))]">
                {props.ticket.notificationRecipientLinked
                  ? "Mit deinem Konto verknüpft"
                  : "Nicht verknüpft"}
              </dd>
            </div>
          </dl>
          {props.ticket.draftId ? (
            <div className="mt-5">
              <Link
                className="btn-primary inline-flex min-h-[42px] items-center px-4 py-2 text-sm"
                href={`/create?draftId=${encodeURIComponent(props.ticket.draftId)}`}
              >
                Gespeicherten Beitrag öffnen
              </Link>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
            Ticket nicht gefunden
          </h2>
          <p className="mt-3 text-sm text-[rgb(var(--muted))]">
            Das Ticket {props.ticketNumber} gehört nicht zu diesem Konto oder ist
            nicht mehr verfügbar.
          </p>
        </>
      )}
    </section>
  );
}
