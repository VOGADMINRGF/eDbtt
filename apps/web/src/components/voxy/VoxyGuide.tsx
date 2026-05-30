"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { resolveVoxyAsset, type VoxyVariant } from "@/features/voxy/voxyAssets";

export type VoxyRenderableVariant = VoxyVariant | string | null | undefined;
export type VoxyGuideAppearance = "hero" | "panel" | "inline" | "compact";

export type VoxySharedProps = {
  appearance?: VoxyGuideAppearance;
  children: ReactNode;
  compact?: boolean;
  title?: string;
  variant?: VoxyRenderableVariant;
};

type VoxyAvatarProps = {
  appearance?: VoxyGuideAppearance;
  compact?: boolean;
  priority?: boolean;
  variant?: VoxyRenderableVariant;
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function VoxyAvatar({
  appearance = "panel",
  compact = false,
  priority = false,
  variant = "neutral",
}: VoxyAvatarProps) {
  const asset = useMemo(() => resolveVoxyAsset(variant), [variant]);
  const candidateKey = asset.candidates.join("|");
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidateKey]);

  const src = asset.candidates[candidateIndex] ?? asset.png;
  const isStage = asset.variant === "podcastStage";
  const resolvedAppearance: VoxyGuideAppearance = compact ? "compact" : appearance;

  return (
    <div
      className={joinClasses(
        "relative shrink-0 overflow-hidden border border-[rgb(var(--border))] bg-[linear-gradient(180deg,color-mix(in_oklab,rgb(var(--card))_84%,rgb(var(--grad-from))_16%),color-mix(in_oklab,rgb(var(--card))_96%,rgb(var(--bg))_4%))] shadow-[0_18px_38px_rgba(15,23,42,0.12)]",
        resolvedAppearance === "hero"
          ? isStage
            ? "w-full max-w-[24rem] rounded-[2rem]"
            : "w-52 rounded-[2rem] sm:w-60 lg:w-64"
          : resolvedAppearance === "panel"
            ? isStage
              ? "w-full max-w-[22rem] rounded-[1.9rem]"
              : "w-40 rounded-[1.85rem] sm:w-44 lg:w-52"
            : resolvedAppearance === "inline"
              ? "w-14 rounded-xl"
              : "w-16 rounded-xl",
      )}
      style={{ aspectRatio: asset.aspectRatio }}
      data-voxy-avatar=""
      data-voxy-appearance={resolvedAppearance}
      data-voxy-variant={asset.variant}
    >
      <Image
        alt={asset.alt}
        className="object-contain p-1.5"
        fill
        priority={priority}
        sizes={
          resolvedAppearance === "hero"
            ? isStage
              ? "(max-width: 1024px) 100vw, 24rem"
              : "(max-width: 768px) 144px, 176px"
            : resolvedAppearance === "panel"
              ? isStage
                ? "(max-width: 1024px) 100vw, 20rem"
                : "(max-width: 768px) 128px, 160px"
              : resolvedAppearance === "inline"
                ? "56px"
                : "64px"
        }
        src={src}
        onError={() => {
          setCandidateIndex((current) =>
            current < asset.candidates.length - 1 ? current + 1 : current,
          );
        }}
      />
    </div>
  );
}

export default function VoxyGuide({
  appearance,
  children,
  compact = false,
  title,
  variant = "neutral",
}: VoxySharedProps) {
  const asset = resolveVoxyAsset(variant);
  const resolvedAppearance: VoxyGuideAppearance = compact ? "compact" : appearance ?? "panel";
  const isInline = resolvedAppearance === "inline";
  const isCompact = resolvedAppearance === "compact";
  const isHero = resolvedAppearance === "hero";

  return (
    <aside
      className={joinClasses(
        "vog-voxy-panel border text-[rgb(var(--fg))]",
        isHero
          ? "min-h-[22rem] rounded-[2rem] p-5 md:min-h-[24rem] md:p-6 lg:p-7"
          : isInline || isCompact
            ? "rounded-xl p-3"
            : "rounded-[1.9rem] p-4 md:p-5",
      )}
      data-voxy-guide=""
      data-voxy-appearance={resolvedAppearance}
      data-voxy-variant={asset.variant}
    >
      <div
        className={joinClasses(
          "flex",
          isHero
            ? "flex-col justify-between gap-5 md:gap-6"
            : isInline || isCompact
              ? "items-start gap-2.5"
              : "flex-col gap-4 md:flex-row md:items-start lg:flex-col lg:gap-5",
        )}
      >
        <VoxyAvatar
          appearance={resolvedAppearance}
          compact={isCompact || isInline}
          priority={asset.variant === "welcome" || asset.variant === "podcastStage"}
          variant={asset.variant}
        />
        <div className="min-w-0 flex-1">
          {title ? (
            <p
              className={joinClasses(
                "font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]",
                isHero ? "text-[11px]" : "text-[10px] sm:text-xs",
              )}
            >
              {title}
            </p>
          ) : null}
          <div
            className={joinClasses(
              "border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]",
              isHero
                ? "mt-2 rounded-[1.6rem] px-4 py-4 text-[15px] leading-7 md:px-5 md:py-5"
                : isInline || isCompact
                  ? "mt-1.5 rounded-xl px-3 py-2.5 text-sm leading-5"
                  : "mt-2 rounded-[1.35rem] px-4 py-3 text-sm leading-6",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}
