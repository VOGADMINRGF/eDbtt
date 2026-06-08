import Link from "next/link";

export type StartDraftWorkspaceOptionKey =
  | "create"
  | "themes"
  | "rounds"
  | "editorial"
  | "later";

export type StartDraftWorkspaceOption = {
  key: StartDraftWorkspaceOptionKey;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
};

type StartDraftWorkspaceChooserProps = {
  title?: string;
  body?: string;
  activeKey?: StartDraftWorkspaceOptionKey | null;
  options: StartDraftWorkspaceOption[];
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function StartDraftWorkspaceChooser(
  props: StartDraftWorkspaceChooserProps,
) {
  return (
    <section
      className="rounded-[1.4rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4"
      data-testid="start-draft-workspace-chooser"
    >
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Arbeitsmodus
        </p>
        <h2 className="text-base font-semibold text-[rgb(var(--fg))]">
          {props.title ?? "Was möchtest du als Nächstes tun?"}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--fg))]/84">
          {props.body ??
            "Du kannst mit demselben Anliegen zwischen Ausarbeiten, Thema, Runde oder redaktioneller Prüfung wechseln, ohne den Text zu verlieren."}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {props.options.map((option) => {
          const className = joinClasses(
            "rounded-2xl border px-4 py-4 text-left transition",
            props.activeKey === option.key
              ? "border-sky-300/70 bg-sky-100/80 text-sky-950 dark:border-sky-400/40 dark:bg-sky-500/14 dark:text-sky-50"
              : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] hover:border-sky-300/55",
          );

          const content = (
            <>
              <p className="text-sm font-semibold">{option.title}</p>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]/78">{option.description}</p>
            </>
          );

          if (option.href) {
            return (
              <Link
                key={option.key}
                href={option.href}
                className={className}
                onClick={option.onClick}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={option.key}
              type="button"
              className={className}
              onClick={option.onClick}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
