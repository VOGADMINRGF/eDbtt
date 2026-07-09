import type {
  VoxyRenderAdapterNoopModel,
} from "@/features/create/voxyRenderAdapterNoopContract";

type VoxyRenderAdapterNoopPanelProps = {
  model: VoxyRenderAdapterNoopModel | null;
  title?: string;
  dataTestId?: string;
};

function StatusChip(props: { label: string; subtle?: boolean }) {
  return (
    <span
      className={
        props.subtle
          ? "rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
          : "rounded-full border border-emerald-300/60 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-900"
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

function GateGrid(props: {
  title: string;
  items: Array<{ id: string; label: string; statusLabel: string; reason: string }>;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {props.title}
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {props.items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
            <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              {item.statusLabel} · {item.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VoxyRenderAdapterNoopPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderAdapterNoopPanelProps) {
  if (!model) return null;

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
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.languageLabel}</p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Original bleibt erhalten. Übersetzung ist Lesehilfe und kein Beleg.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.adapterStatusLabel} />
          <StatusChip label={model.publicSafeLabel} subtle />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Noch kein Providerlauf
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.adapterTypeLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Adapter-Request ist Vorschau, nicht Render-Job. `adapter_registered` ist nicht `provider_executed`.
          </p>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Adapter-Vertrag vorbereitet
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
            {model.requestPreview.requestedCapabilities.length} Fähigkeiten ·{" "}
            {model.requestPreview.requiredAssets.length} Pflichtassets
          </p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            Format: Briefing-Video · Render-Sprache: {model.renderLanguage}
            {model.subtitleLanguage ? ` · Untertitel: ${model.subtitleLanguage}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Warum blockiert?"
          items={model.blockedReasons}
          emptyLabel="Kein zusätzlicher Blocker sichtbar. Der Layer bleibt trotzdem Noop."
        />
        <TextList
          title="Was muss konfiguriert werden?"
          items={model.configurationNeeds}
          emptyLabel="Kein weiterer Konfigurationsbedarf sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Angeforderte Fähigkeiten"
          items={model.requestedCapabilities.map((item) => `${item.label} · ${item.reason}`)}
          emptyLabel="Keine zusätzlichen Fähigkeiten sichtbar."
        />
        <TextList
          title="Request Preview"
          items={[
            `Request-ID: ${model.requestPreview.adapterRequestId}`,
            `Original bleibt erhalten: ja`,
            `Übersetzung ist Beleg: nein`,
            `RTL erforderlich: ${model.requestPreview.rtlRequired ? "ja" : "nein"}`,
          ]}
          emptyLabel="Keine Preview-Daten sichtbar."
        />
      </div>

      <GateGrid title="Provider" items={model.providerGateItems} />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <GateGrid title="Assets" items={model.requiredAssets} />
        <GateGrid title="Kosten" items={model.costGateItems} />
      </div>
      <GateGrid title="Sprache & Review" items={model.reviewGateItems} />

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Noop-Ergebnis
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
            <p className="text-sm font-medium text-[rgb(var(--fg))]">{model.noopResult.resultKindLabel}</p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              nicht ausgeführt · nichts gerendert
            </p>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
            <p className="text-sm font-medium text-[rgb(var(--fg))]">Keine Datei, keine Kosten</p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              keine Datei erzeugt · keine Kosten gebucht
            </p>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] px-3 py-3">
            <p className="text-sm font-medium text-[rgb(var(--fg))]">Keine Veröffentlichung</p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              nichts veröffentlicht · kein Social- oder Scheduling-Start
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{model.userVisibleReason}</p>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{model.reviewerVisibleReason}</p>
        <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
          Nächste Adapter-Entscheidung: {model.noopResult.nextAdapterDecision.label}
        </p>
        <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
          {model.noopResult.nextAdapterDecision.reason}
        </p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">Nächster Schritt: {model.nextStep}</p>
      </div>
    </section>
  );
}
