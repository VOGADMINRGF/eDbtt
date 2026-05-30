import type { VoxySharedProps } from "./VoxyGuide";
import { VoxyAvatar } from "./VoxyGuide";
import { resolveVoxyAsset } from "@/features/voxy/voxyAssets";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function VoxyInlineHint({
  children,
  compact = true,
  title,
  variant = "miniAvatar",
}: VoxySharedProps) {
  const asset = resolveVoxyAsset(variant);

  return (
    <div
      className={joinClasses(
        "flex items-start gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]",
        compact ? "px-3 py-2" : "px-4 py-3",
      )}
      data-voxy-inline-hint=""
      data-voxy-variant={asset.variant}
    >
      <VoxyAvatar compact variant={asset.variant === "podcastStage" ? "miniAvatar" : asset.variant} />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            {title}
          </p>
        ) : null}
        <div className={joinClasses(compact ? "text-xs leading-5" : "text-sm leading-6")}>{children}</div>
      </div>
    </div>
  );
}
