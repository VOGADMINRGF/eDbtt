import Link from "next/link";
import type { TaskFirstQuickActionCenterModel } from "@/features/quickActions/taskFirstQuickActions";

type TaskFirstQuickActionCenterProps = {
  model: TaskFirstQuickActionCenterModel;
  tone?: "light" | "dark" | "landing";
};

function actionHrefNeedsPrivacyGate(href: string) {
  return href.startsWith("/create") || href.startsWith("/swipes") || href.startsWith("/runden/new");
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function TaskFirstQuickActionCenter({
  model,
  tone = "light",
}: TaskFirstQuickActionCenterProps) {
  const isSpotlight = tone === "dark";
  const isLanding = tone === "landing";
  const primaryAction = model.primaryActions[0] ?? null;
  const visibleSecondaryActions = [...model.primaryActions.slice(1), ...model.secondaryActions].slice(
    0,
    2,
  );
  const overflowActions = [...model.primaryActions.slice(1), ...model.secondaryActions].slice(2);

  return (
    <section
      data-testid="task-first-quick-action-center"
      className={joinClasses(
        isLanding
          ? "landing-quick-actions"
          : `${isSpotlight ? "vog-landing-band vog-landing-band--accent" : "vog-landing-band"} p-5 sm:p-7`,
      )}
    >
      <div className={joinClasses("space-y-2", isLanding && "max-w-2xl")}>
        <p
          className={joinClasses(
            "text-xs font-semibold uppercase tracking-[0.16em] vog-text-secondary",
            isLanding && "landing-eyebrow",
          )}
        >
          {model.eyebrow}
        </p>
        <h2 className="text-xl font-semibold vog-text-primary sm:text-3xl">{model.title}</h2>
        <p className="max-w-3xl text-sm vog-text-secondary">{model.description}</p>
      </div>

      {primaryAction ? (
        <div className="mt-5">
          <Link
            href={primaryAction.href}
            data-testid="task-first-primary-action"
            data-requires-privacy-gate={
              actionHrefNeedsPrivacyGate(primaryAction.href) ? "true" : undefined
            }
            className={joinClasses(
              isLanding
                ? "landing-primary-link vog-focus-ring"
                : "vog-landing-composer vog-focus-ring block p-5 transition hover:-translate-y-0.5",
            )}
          >
            {primaryAction.badge ? (
              <span className={joinClasses(isLanding ? "landing-soft-pill landing-soft-pill--active" : "vog-chip vog-chip--active")}>
                {primaryAction.badge}
              </span>
            ) : null}
            <p
              className={joinClasses(
                "text-base font-semibold vog-text-primary",
                isLanding ? "mt-4 text-lg" : "mt-3",
              )}
            >
              {primaryAction.label}
            </p>
            <p className={joinClasses("text-sm vog-text-secondary", isLanding ? "mt-2 max-w-2xl" : "mt-2")}>
              {primaryAction.description}
            </p>
          </Link>
        </div>
      ) : null}

      {visibleSecondaryActions.length > 0 ? (
        <div className={joinClasses(isLanding ? "landing-inline-actions mt-5" : "mt-5 grid gap-3 md:grid-cols-2")}>
          {visibleSecondaryActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              data-testid="task-first-secondary-action"
              data-requires-privacy-gate={
                actionHrefNeedsPrivacyGate(action.href) ? "true" : undefined
              }
              className={joinClasses(
                isLanding
                  ? "landing-inline-action vog-focus-ring"
                  : "vog-surface-soft vog-focus-ring rounded-2xl p-4 transition hover:-translate-y-0.5",
              )}
            >
              {action.badge ? (
                <span className={joinClasses(isLanding ? "landing-soft-pill" : "vog-chip")}>
                  {action.badge}
                </span>
              ) : null}
              <p
                className={joinClasses(
                  "text-sm font-semibold vog-text-primary",
                  isLanding ? "mt-3" : "mt-3",
                )}
              >
                {action.label}
              </p>
              <p className="mt-2 text-sm vog-text-secondary">{action.description}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {overflowActions.length > 0 ? (
        <div className={joinClasses("mt-5 space-y-3", isLanding && "landing-flow-line")}>
          <p
            className={joinClasses(
              "text-xs font-semibold uppercase tracking-[0.14em] vog-text-secondary",
              isLanding && "landing-eyebrow",
            )}
          >
            Weitere passende Einstiege
          </p>
          <ul className={joinClasses(isLanding ? "landing-overflow-list" : "grid gap-2 md:grid-cols-2")}>
            {overflowActions.map((action) => (
              <li key={action.id}>
                <Link
                  href={action.href}
                  data-testid="task-first-overflow-action"
                  data-requires-privacy-gate={
                    actionHrefNeedsPrivacyGate(action.href) ? "true" : undefined
                  }
                  className={joinClasses(
                    isLanding
                      ? "landing-overflow-link vog-focus-ring"
                      : "vog-surface-soft vog-focus-ring flex flex-col gap-1 rounded-2xl p-4 text-sm vog-text-secondary transition hover:-translate-y-0.5",
                  )}
                >
                  <span className="font-semibold vog-text-primary">{action.label}</span>
                  <span>{action.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
