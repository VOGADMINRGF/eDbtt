type StepId = 1 | 2 | 3;

type StepDef = { id: StepId; title: string; subtitle: string };

const DEFAULT_STEPS: StepDef[] = [
  { id: 1, title: "Konto", subtitle: "Basisdaten" },
  { id: 2, title: "Verifikation", subtitle: "E-Mail und OTP" },
  { id: 3, title: "Paketstart", subtitle: "Optional" },
];

export function RegisterStepper({ current, steps = DEFAULT_STEPS }: { current: StepId; steps?: StepDef[] }) {
  const currentStep = steps.find((step) => step.id === current) ?? steps[0];

  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[rgb(var(--muted))]">
        <span>Schritt {current} von {steps.length}</span>
        <span className="truncate text-right text-[rgb(var(--fg))]">{currentStep.title} · {currentStep.subtitle}</span>
      </div>

      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {steps.map((step) => {
          const isActive = step.id === current;
          const isDone = step.id < current;
          return (
            <span
              key={step.id}
              className={[
                "h-1.5 flex-1 rounded-full transition-colors",
                isActive
                  ? "bg-[linear-gradient(90deg,#0ea5e9,#10b981)]"
                  : isDone
                    ? "bg-emerald-400"
                    : "bg-[rgb(var(--border))]",
              ].join(" ")}
            />
          );
        })}
      </div>
    </div>
  );
}
