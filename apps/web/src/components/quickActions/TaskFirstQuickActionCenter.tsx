import Link from "next/link";
import type { TaskFirstQuickActionCenterModel } from "@/features/quickActions/taskFirstQuickActions";

type TaskFirstQuickActionCenterProps = {
  model: TaskFirstQuickActionCenterModel;
  tone?: "light" | "dark";
};

function actionHrefNeedsPrivacyGate(href: string) {
  return href.startsWith("/create");
}

export default function TaskFirstQuickActionCenter({
  model,
  tone = "light",
}: TaskFirstQuickActionCenterProps) {
  const isDark = tone === "dark";

  return (
    <section
      className={
        isDark
          ? "rounded-3xl border border-cyan-300/25 bg-slate-900/80 p-5 sm:p-7"
          : "rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
      }
    >
      <div className="space-y-2">
        <p
          className={
            isDark
              ? "text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200"
              : "text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]"
          }
        >
          {model.eyebrow}
        </p>
        <h2
          className={
            isDark
              ? "text-2xl font-semibold text-white sm:text-3xl"
              : "text-xl font-semibold text-[rgb(var(--fg))]"
          }
        >
          {model.title}
        </h2>
        <p
          className={
            isDark
              ? "max-w-3xl text-sm text-slate-200"
              : "max-w-3xl text-sm text-[rgb(var(--muted))]"
          }
        >
          {model.description}
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {model.primaryActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            data-requires-privacy-gate={
              actionHrefNeedsPrivacyGate(action.href) ? "true" : undefined
            }
            className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
              isDark
                ? action.priority === "primary"
                  ? "border-cyan-300/45 bg-cyan-500/10"
                  : "border-slate-700 bg-slate-950/55"
                : action.priority === "primary"
                  ? "border-sky-300/70 bg-sky-50 text-sky-950"
                  : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
            }`}
          >
            {action.badge ? (
              <span
                className={
                  isDark
                    ? "inline-flex rounded-full border border-cyan-300/35 px-2.5 py-1 text-[11px] font-semibold text-cyan-100"
                    : "inline-flex rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))]"
                }
              >
                {action.badge}
              </span>
            ) : null}
            <p className={isDark ? "mt-3 text-sm font-semibold text-white" : "mt-3 text-sm font-semibold"}>
              {action.label}
            </p>
            <p className={isDark ? "mt-2 text-sm text-slate-200" : "mt-2 text-sm text-[rgb(var(--muted))]"}>
              {action.description}
            </p>
          </Link>
        ))}
      </div>

      {model.secondaryActions.length > 0 ? (
        <div className="mt-5 space-y-3">
          <p
            className={
              isDark
                ? "text-xs font-semibold uppercase tracking-[0.14em] text-slate-300"
                : "text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]"
            }
          >
            Weitere passende Einstiege
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {model.secondaryActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                data-requires-privacy-gate={
                  actionHrefNeedsPrivacyGate(action.href) ? "true" : undefined
                }
                className={
                  isDark
                    ? "rounded-2xl border border-slate-700 bg-slate-950/55 p-4 transition hover:-translate-y-0.5"
                    : "rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 transition hover:-translate-y-0.5"
                }
              >
                {action.badge ? (
                  <span
                    className={
                      isDark
                        ? "inline-flex rounded-full border border-slate-600 px-2.5 py-1 text-[11px] font-semibold text-slate-200"
                        : "inline-flex rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))]"
                    }
                  >
                    {action.badge}
                  </span>
                ) : null}
                <p
                  className={
                    isDark ? "mt-3 text-sm font-semibold text-white" : "mt-3 text-sm font-semibold"
                  }
                >
                  {action.label}
                </p>
                <p
                  className={
                    isDark ? "mt-2 text-sm text-slate-200" : "mt-2 text-sm text-[rgb(var(--muted))]"
                  }
                >
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
