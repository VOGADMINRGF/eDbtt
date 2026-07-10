import type {
  VoxyRenderAssetPackDraftPanelModel,
} from "@/features/create/voxyRenderAssetPackDraftContract";

type VoxyRenderAssetPackDraftPanelProps = {
  model: VoxyRenderAssetPackDraftPanelModel | null;
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

function GuardrailCards() {
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-4">
      {[
        {
          title: "Noch keine Datei",
          summary: "Es wird weder eine Medien-Datei noch ein Export- oder Subtitle-File erzeugt.",
        },
        {
          title: "Keine Asset-Erzeugung",
          summary: "Keine Fake-Datei, kein Upload, kein generiertes Voice- oder Template-Artefakt.",
        },
        {
          title: "Kein Providerlauf",
          summary: "Kein Voice-, Avatar- oder Render-Provider wird aufgerufen.",
        },
        {
          title: "Keine Kosten",
          summary: "Keine Queue, keine Debit- oder Credit-Buchung und keine Veröffentlichung.",
        },
      ].map((card) => (
        <div
          key={card.title}
          className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            {card.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{card.summary}</p>
        </div>
      ))}
    </div>
  );
}

export default function VoxyRenderAssetPackDraftPanel({
  model,
  title,
  dataTestId,
}: VoxyRenderAssetPackDraftPanelProps) {
  if (!model) return null;

  const availableAssets = model.preview.assetEntries
    .filter((item) => item.status === "available")
    .map((item) =>
      item.publicPath ? `${item.label}: ${item.publicPath}` : `${item.label}: ${item.userVisibleReason}`,
    );
  const missingAssets = model.preview.assetEntries
    .filter((item) => item.status === "missing" || item.status === "blocked")
    .map((item) => `${item.label}: ${item.userVisibleReason}`);
  const requirementOnlyAssets = model.preview.assetEntries
    .filter((item) => item.status === "requirement_only")
    .map((item) => `${item.label}: ${item.userVisibleReason}`);
  const reviewAssets = model.preview.assetEntries
    .filter((item) => item.status === "needs_review")
    .map((item) => `${item.label}: ${item.userVisibleReason}`);

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
            Quelle: {model.preview.sourceLanguage} · Lesefassung: {model.preview.readingLanguage} ·
            Script: {model.preview.scriptLanguage} · Render-Ziel: {model.preview.renderLanguage}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Original bleibt erhalten. Übersetzung ist Lesehilfe und kein Beleg.
            {model.preview.subtitleLanguage
              ? ` Untertitel: ${model.preview.subtitleLanguage}.`
              : " Untertitel bleiben noch offen."}
            {model.preview.rtlRequired ? " RTL-Hinweis bleibt sichtbar." : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip label={model.assetPackStatusLabel} />
          <StatusChip label={model.storeStateLabel} subtle />
        </div>
      </div>

      <GuardrailCards />

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Vorhandene Assets"
          items={availableAssets}
          emptyLabel="Noch keine belastbaren Repo- oder Manifest-Assets sichtbar."
        />
        <TextList
          title="Fehlende Assets"
          items={missingAssets}
          emptyLabel="Keine zusätzlichen fehlenden Pflichtassets sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Requirement-only Assets"
          items={requirementOnlyAssets}
          emptyLabel="Keine reinen Requirement-Assets sichtbar."
        />
        <TextList
          title="Review-Punkte"
          items={reviewAssets}
          emptyLabel="Keine zusätzlichen Asset-Review-Punkte sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Store-Grenze
          </p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.storeStateLabel}</p>
          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
            {model.storeStateSummary}
          </p>
          {model.latestRecord ? (
            <>
              <p className="mt-3 text-sm font-medium text-[rgb(var(--fg))]">
                Letzter Asset-Pack-Draft
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.statusLabel}
                {model.latestRecord.assetPackVersion
                  ? ` · Version ${model.latestRecord.assetPackVersion}`
                  : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {model.latestRecord.persistedAt
                  ? `Gespeichert: ${model.latestRecord.persistedAt}`
                  : "Noch nicht gespeichert"}
                {model.latestRecord.persistedBy ? ` · ${model.latestRecord.persistedBy}` : ""}
              </p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                Cost-Policy: {model.latestRecord.costPolicyPreviewId ?? "keine"}
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
              Noch kein gespeicherter Asset-Pack-Draft sichtbar.
            </p>
          )}
        </div>
        <TextList
          title="Blocker"
          items={model.blockedReasons}
          emptyLabel="Keine zusätzlichen Blocker sichtbar."
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextList
          title="Evidence"
          items={model.evidenceLines}
          emptyLabel="Noch keine Evidence-Linien sichtbar."
        />
        <TextList
          title="Audit-Lesart"
          items={model.auditLines}
          emptyLabel="Noch keine Audit-Linien sichtbar."
        />
      </div>

      <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Nächste Aktion
        </p>
        <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{model.nextStep}</p>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
          Dieser Schritt bleibt review-first und erzeugt weder Datei noch Providerlauf noch Veröffentlichung.
        </p>
      </div>
    </section>
  );
}
