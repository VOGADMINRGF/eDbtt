import type { VoxySharedProps } from "./VoxyGuide";
import { VoxyAvatar } from "./VoxyGuide";
import { resolveVoxyAsset } from "@/features/voxy/voxyAssets";
import { VOXY_EXPERIENCE_LAYOUT_GUARD } from "@/features/voxy/voxyExperienceShellContract";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function VoxyBubble({
  children,
  compact = false,
  title,
  variant = "neutral",
}: VoxySharedProps) {
  const asset = resolveVoxyAsset(variant);

  return (
    <div
      className={joinClasses(
        "inline-flex max-w-2xl items-start gap-3 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm",
        VOXY_EXPERIENCE_LAYOUT_GUARD.bubbleClassName,
        compact ? "px-3 py-2.5" : "px-4 py-3",
      )}
      data-voxy-bubble=""
      data-voxy-variant={asset.variant}
    >
      <VoxyAvatar compact={compact} variant={asset.variant === "podcastStage" ? "miniAvatar" : asset.variant} />
      <div className="min-w-0 flex-1">
        {title ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            {title}
          </p>
        ) : null}
        <div className={joinClasses("text-[rgb(var(--fg))]", compact ? "text-sm leading-5" : "text-sm leading-6")}>
          {children}
        </div>
      </div>
    </div>
  );
}
