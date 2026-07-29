import Link from "next/link";
import type { AccountSupportNotification } from "@/features/support/createSupportTickets";

export default function CreateSupportNotifications(props: {
  notifications: AccountSupportNotification[];
}) {
  if (props.notifications.length === 0) return null;

  return (
    <section
      data-account-support-notifications
      aria-labelledby="support-notifications-title"
      className="rounded-3xl border border-emerald-300/30 bg-emerald-500/[0.06] p-5 md:p-6"
    >
      <h2
        id="support-notifications-title"
        className="text-base font-semibold text-[rgb(var(--fg))]"
      >
        Nachrichten vom technischen Support
      </h2>
      <div className="mt-3 space-y-3">
        {props.notifications.map((notification) => (
          <article
            key={notification.id}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
          >
            <p className="font-semibold text-[rgb(var(--fg))]">
              {notification.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
              {notification.body}
            </p>
            <Link
              className="mt-3 inline-flex text-sm font-semibold text-cyan-700 hover:underline dark:text-cyan-200"
              href={notification.href}
            >
              Ticket ansehen
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
