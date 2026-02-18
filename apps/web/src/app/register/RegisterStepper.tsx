type StepId = 1 | 2 | 3;

const STEPS: { id: StepId; title: string; subtitle: string }[] = [
  { id: 1, title: "Konto", subtitle: "Basisdaten anlegen" },
  { id: 2, title: "Verifikation", subtitle: "E-Mail & OTP" },
  { id: 3, title: "Vormerkung", subtitle: "Paketwahl" },
];

export function RegisterStepper({ current }: { current: StepId }) {
  return (
    <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-3">
        {STEPS.map((step) => {
          const active = step.id === current;
          const done = step.id < current;

          return (
            <div
              key={step.id}
              className={[
                "rounded-2xl border px-4 py-3",
                active ? "border-sky-300 bg-sky-50" : done ? "border-emerald-200 bg-emerald-50/40" : "border-[rgb(var(--border))] bg-[rgb(var(--card))]",
              ].join(" ")}
            >
              <p className="text-[11px] font-semibold tracking-[0.18em] text-[rgb(var(--muted))]">
                SCHRITT {step.id} / {STEPS.length} · {step.title}
              </p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{step.subtitle}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
