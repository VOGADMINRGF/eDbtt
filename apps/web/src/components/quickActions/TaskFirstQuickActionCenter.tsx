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
  const isSpotlight = tone === "dark";
  const primaryAction = model.primaryActions[0] ?? null;
  const visibleSecondaryActions = [...model.primaryActions.slice(1), ...model.secondaryActions].slice(0, 2);
  const overflowActions = [...model.primaryActions.slice(1), ...model.secondaryActions].slice(2);

  return (
    <section
      data-testid="task-first-quick-action-center"
      className={`${isSpotlight ? "vog-landing-band vog-landing-band--accent" : "vog-landing-band"} p-5 sm:p-7`}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] vog-text-secondary">{model.eyebrow}</p>
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
            className="vog-landing-composer vog-focus-ring block p-5 transition hover:-translate-y-0.5"
          >
            {primaryAction.badge ? (
              <span className="vog-chip vog-chip--active">
                {primaryAction.badge}
              </span>
            ) : null}
            <p className="mt-3 text-base font-semibold vog-text-primary">{primaryAction.label}</p>
            <p className="mt-2 text-sm vog-text-secondary">{primaryAction.description}</p>
          </Link>
        </div>
      ) : null}

      {visibleSecondaryActions.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {visibleSecondaryActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              data-testid="task-first-secondary-action"
              data-requires-privacy-gate={
                actionHrefNeedsPrivacyGate(action.href) ? "true" : undefined
              }
              className="vog-surface-soft vog-focus-ring rounded-2xl p-4 transition hover:-translate-y-0.5"
            >
              {action.badge ? (
                <span className="vog-chip">
                  {action.badge}
                </span>
              ) : null}
              <p className="mt-3 text-sm font-semibold vog-text-primary">{action.label}</p>
              <p className="mt-2 text-sm vog-text-secondary">{action.description}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {overflowActions.length > 0 ? (
        <div className="mt-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] vog-text-secondary">Weitere passende Einstiege</p>
          <ul className="grid gap-2 md:grid-cols-2">
            {overflowActions.map((action) => (
              <li key={action.id}>
                <Link
                  href={action.href}
                  data-testid="task-first-overflow-action"
                  data-requires-privacy-gate={
                    actionHrefNeedsPrivacyGate(action.href) ? "true" : undefined
                  }
                  className="vog-surface-soft vog-focus-ring flex flex-col gap-1 rounded-2xl p-4 text-sm vog-text-secondary transition hover:-translate-y-0.5"
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
