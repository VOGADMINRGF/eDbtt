import type {
  VoxyRenderAssetProviderRegistryModel,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";

type VoxyRenderAssetProviderRegistryPanelProps = {
  model: VoxyRenderAssetProviderRegistryModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean }) {
  return (
    <span
      className={
        props.subtle
          ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
          : "rounded-full border border-sky-300/60 bg-sky-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-900"
      }
    >
      {props.label}
    </span>
  );
}

function TextList(props: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {props.title}
      </p>
      {props.items.length > 0 ? (
        <div className="mt-2 space-y-1 text-sm leading-6 text-[rgb(var(--muted))]">
          {props.items.map((item) => (
            <p key={`${props.title}-${item}`}>{item}</p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{props.emptyLabel}</p>
      )}
    </div>
  );
}

export default function VoxyRenderAssetProviderRegistryPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderAssetProviderRegistryPanelProps) {
  if (!model) return null;

  const availableAssets = model.assetInventory.filter((item) => item.status === "available");
  const missingAssets = model.assetInventory.filter(
    (item) => item.status === "missing" || item.status === "blocked",
  );
  const requirementAssets = model.assetInventory.filter(
    (item) => item.status === "requirement_only" || item.status === "needs_review",
  );
  const requirementProviders = model.providerRegistry.filter(
    (item) => item.status === "requirement_only",
  );

  return (
    <section
      data-testid={dataTestId}
      className="mt-5 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            {title ?? model.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{model.summary}</p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            Manifest: {model.manifestPath}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.languageRequirements.label}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Original bleibt erhalten. Übersetzung ist Lesehilfe und kein Beleg.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.registryStatusLabel} />
          <StatusChip label={model.publicSafeLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <TextList
          title="Was ist vorhanden?"
          items={availableAssets.map((item) =>
            item.publicPath
              ? `${item.label} · ${item.sourceLabel} · ${item.publicPath}`
              : `${item.label} · ${item.sourceLabel}`,
          )}
          emptyLabel="Noch keine belastbaren Repo-Assets sichtbar."
        />
        <TextList
          title="Was fehlt?"
          items={missingAssets.map((item) => `${item.label} · ${item.reviewerVisibleReason}`)}
          emptyLabel="Kein zusätzlicher Pflichtasset-Blocker sichtbar."
        />
        <TextList
          title="Was ist nur Anforderung?"
          items={[
            ...requirementAssets.map((item) => `${item.label} · ${item.reviewerVisibleReason}`),
            ...requirementProviders.map((item) => `${item.label} · ${item.reviewerVisibleReason}`),
          ]}
          emptyLabel="Keine zusätzlichen Requirement-only Bausteine sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Asset-Inventur
          </p>
          <div className="mt-3 space-y-2">
            {model.assetInventory.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
                <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                  {item.statusLabel} · {item.sourceLabel}
                  {item.publicPath ? ` · ${item.publicPath}` : ""}
                </p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                  {item.reviewerVisibleReason}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Provider-Registry
          </p>
          <div className="mt-3 space-y-2">
            {model.providerRegistry.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
                <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                  {item.statusLabel}
                  {item.providerName ? ` · ${item.providerName}` : " · kein realer Providername belegt"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                  {item.reviewerVisibleReason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Warum noch kein Rendering?"
          items={model.blockers}
          emptyLabel="Kein zusätzlicher Registry-Blocker sichtbar."
        />
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Nächste Registry-Entscheidung
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.registryDecision.label}</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.registryDecision.reason}
          </p>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{model.userVisibleReason}</p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.reviewerVisibleReason}</p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">Nächster Schritt: {model.nextStep}</p>
        </div>
      </div>
    </section>
  );
}
