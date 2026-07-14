"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { resolveVoxyAsset, type VoxyVariant } from "@/features/voxy/voxyAssets";
import { VOXY_EXPERIENCE_LAYOUT_GUARD } from "@/features/voxy/voxyExperienceShellContract";

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
        "public-voxy-image relative shrink-0",
        VOXY_EXPERIENCE_LAYOUT_GUARD.avatarContainerClassName,
        VOXY_EXPERIENCE_LAYOUT_GUARD.safeHeightClassName,
        resolvedAppearance === "hero"
          ? isStage
            ? "w-[12rem] sm:w-[14rem] lg:w-[16rem]"
            : "w-[11rem] sm:w-[12.5rem] lg:w-[14.5rem]"
          : resolvedAppearance === "panel"
            ? isStage
              ? "w-[9rem] sm:w-[10rem] lg:w-[11rem]"
              : "w-[7.75rem] sm:w-[8.75rem] lg:w-[9.75rem]"
            : resolvedAppearance === "inline"
              ? "w-12"
              : "w-14",
      )}
      style={{ aspectRatio: asset.aspectRatio, maxWidth: "100%" }}
      data-voxy-avatar=""
      data-voxy-appearance={resolvedAppearance}
      data-voxy-variant={asset.variant}
    >
      <span className="public-voxy-aura" aria-hidden="true" />
      <Image
        alt={asset.alt}
        className="relative z-[1] object-contain"
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
        "public-voxy-stage text-[rgb(var(--fg))]",
        VOXY_EXPERIENCE_LAYOUT_GUARD.shellClassName,
        isHero
          ? "min-h-[19rem] md:min-h-[21rem]"
          : isInline || isCompact
            ? "gap-2"
            : "gap-3",
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
          priority={asset.variant === "welcome" || asset.variant === "confident"}
          variant={asset.variant}
        />
        <div className="min-w-0 flex-1">
          {title ? (
            <div className="public-voxy-marker">
              <span
                aria-hidden="true"
                className="inline-flex h-1.5 w-1.5 rounded-full bg-[rgb(var(--grad-to))]"
              />
              <p
                className={joinClasses(
                  "font-semibold tracking-[0.01em] text-[rgb(var(--muted))]",
                  isHero ? "text-[11px]" : "text-[10px] sm:text-xs",
                )}
              >
                {title}
              </p>
            </div>
          ) : null}
          <div
            className={joinClasses(
              "text-[rgb(var(--fg))]",
              isHero
                ? "mt-2 max-w-xl text-[15px] leading-7"
                : isInline || isCompact
                  ? "mt-1.5 text-sm leading-5"
                  : "mt-2 max-w-lg text-sm leading-6",
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}
