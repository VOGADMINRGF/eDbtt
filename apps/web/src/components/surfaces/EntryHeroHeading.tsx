import type { ReactNode } from "react";
import type { CreateComposerHeadlineText } from "@/features/create/createSurfaceConfig";
import type { EntrySurfaceTone } from "@/features/surfaces/entryHeroIdentity";

function AccentWord({
  children,
  gradient,
}: {
  children: ReactNode;
  gradient: "opinion" | "voice" | "weight";
}) {
  const backgroundImage =
    gradient === "opinion"
      ? "linear-gradient(90deg, rgba(26,140,255,1), rgba(24,207,200,1))"
      : gradient === "voice"
        ? "linear-gradient(90deg, rgba(139,92,246,1), rgba(236,72,153,1), rgba(56,189,248,1))"
        : "linear-gradient(90deg, rgba(20,184,166,1), rgba(24,207,200,1), rgba(26,140,255,1))";

  return (
    <span
      className="font-extrabold text-[rgb(var(--fg))] supports-[background-clip:text]:bg-clip-text supports-[background-clip:text]:text-transparent"
      style={{
        backgroundImage,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      }}
    >
      {children}
    </span>
  );
}

type EntryHeroHeadingProps = {
  badge: string;
  headline: CreateComposerHeadlineText;
  subline: string;
  tone: EntrySurfaceTone;
  topMeta?: ReactNode;
  headingTag?: "h1" | "h2";
};

export default function EntryHeroHeading({
  badge,
  headline,
  subline,
  tone,
  topMeta,
  headingTag = "h2",
}: EntryHeroHeadingProps) {
  const headingClass =
    tone === "lively"
      ? "max-w-3xl text-balance text-3xl font-semibold leading-[1.05] tracking-tight text-[rgb(var(--fg))] sm:text-4xl lg:text-5xl"
      : "max-w-3xl text-balance text-2xl font-semibold leading-[1.1] tracking-tight text-[rgb(var(--fg))] md:text-4xl";

  const sublineClass =
    tone === "lively"
      ? "mt-3 max-w-2xl text-pretty text-sm leading-6 text-[rgb(var(--muted))] sm:text-base"
      : "max-w-2xl text-sm leading-relaxed text-[rgb(var(--muted))]";

  const HeadingTag = headingTag;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{badge}</p>
      <HeadingTag className={headingClass}>
        <span className="block">
          {headline.line1Lead} <AccentWord gradient="opinion">{headline.line1Accent}</AccentWord>{" "}
          {headline.line1Tail}
        </span>
        <span className="block">
          {headline.line2Lead} <AccentWord gradient="voice">{headline.line2Accent}</AccentWord>{" "}
          {headline.line2Mid} <AccentWord gradient="weight">{headline.line2AccentB}</AccentWord>
          {headline.line2Tail}
        </span>
      </HeadingTag>
      <p className={sublineClass}>{subline}</p>
      {topMeta}
    </div>
  );
}
