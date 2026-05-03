import type { MasterPost } from "./masterPost";

export type ReviewRequiredState = "ok" | "review_required";

export type ReviewAwareFormatOutput = {
  format: "article" | "briefing" | "letter" | "administrative_note";
  title: string;
  lead: string;
  body: string[];
  sourceSection: string;
  openQuestions: string[];
  options: string[];
  caveats: string[];
  reviewState: ReviewRequiredState;
};

export type ReelScriptOutput = {
  format: "reel_script";
  hook: string;
  scenePlan: string[];
  voiceover: string;
  caption: string;
  sourceSection: string;
  caveats: string[];
  reviewState: ReviewRequiredState;
};

export type VoiceoverTextOutput = {
  format: "voiceover_text";
  text: string;
  sourceSection: string;
  openQuestions: string[];
  caveats: string[];
  reviewState: ReviewRequiredState;
};

export type PodcastScriptOutput = {
  format: "podcast_script";
  title: string;
  segments: string[];
  sourceSection: string;
  openQuestions: string[];
  caveats: string[];
  reviewState: ReviewRequiredState;
};

function normalizeLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function reviewStateFor(post: MasterPost): ReviewRequiredState {
  if (post.reviewStatus === "approved") return "ok";
  if (post.sourceState.status === "missing") return "review_required";
  if (post.options.length === 0) return "review_required";
  if (post.reviewGuardrails.some((entry) => entry.level === "warnung")) return "review_required";
  return "review_required";
}

function sourceSectionFor(post: MasterPost): string {
  const sourceLine =
    post.sourceState.status === "missing"
      ? "Quellenlage: unvollständig, externe Nutzung nur nach Review."
      : `Quellenlage: ${post.sourceState.sourceCount} verknüpfte Quellen dokumentiert.`;
  return normalizeLine(`${sourceLine} ${post.sourceSituation}`);
}

function caveatsFor(post: MasterPost): string[] {
  if (post.reviewGuardrails.length > 0) {
    return post.reviewGuardrails.map((entry) => entry.message);
  }
  return ["Keine automatische Veröffentlichung. Review bleibt verpflichtend."];
}

function bodyBlocksFor(post: MasterPost): string[] {
  return [
    normalizeLine(post.overallPicture),
    normalizeLine(post.body),
    normalizeLine(`Beteiligungsfrage: ${post.participationQuestion}`),
    normalizeLine(`CTA: ${post.cta}`),
    normalizeLine(`Dossier: ${post.backlinkTarget}`),
  ];
}

export function mapToArticle(post: MasterPost): ReviewAwareFormatOutput {
  return {
    format: "article",
    title: post.title,
    lead: post.hook,
    body: bodyBlocksFor(post),
    sourceSection: sourceSectionFor(post),
    openQuestions: post.openQuestions,
    options: post.options,
    caveats: caveatsFor(post),
    reviewState: reviewStateFor(post),
  };
}

export function mapToBriefing(post: MasterPost): ReviewAwareFormatOutput {
  return {
    format: "briefing",
    title: `Briefing: ${post.title}`,
    lead: post.overallPicture,
    body: [
      normalizeLine(`Kontext ${post.regionalContext}: ${post.topic}`),
      normalizeLine(post.body),
      normalizeLine(`Nächster Beteiligungsschritt: ${post.cta}`),
    ],
    sourceSection: sourceSectionFor(post),
    openQuestions: post.openQuestions,
    options: post.options,
    caveats: caveatsFor(post),
    reviewState: reviewStateFor(post),
  };
}

export function mapToLetter(post: MasterPost): ReviewAwareFormatOutput {
  return {
    format: "letter",
    title: `Beteiligungsschreiben: ${post.title}`,
    lead: `Sehr geehrte Damen und Herren, ${post.hook.toLowerCase()}`,
    body: [
      normalizeLine(post.overallPicture),
      normalizeLine(`Zur Einordnung: ${post.sourceSituation}`),
      normalizeLine(`Offene Beteiligungsfrage: ${post.participationQuestion}`),
      normalizeLine(`Weitere Informationen: ${post.backlinkTarget}`),
    ],
    sourceSection: sourceSectionFor(post),
    openQuestions: post.openQuestions,
    options: post.options,
    caveats: caveatsFor(post),
    reviewState: reviewStateFor(post),
  };
}

export function mapToAdministrativeNote(post: MasterPost): ReviewAwareFormatOutput {
  return {
    format: "administrative_note",
    title: `Verwaltungsnotiz: ${post.title}`,
    lead: `Sachstand ${post.regionalContext}`,
    body: [
      normalizeLine(post.overallPicture),
      normalizeLine(`Quellenlage: ${post.sourceSituation}`),
      normalizeLine(`Optionen/Eventualitäten: ${post.options.join(" | ")}`),
      normalizeLine(`Beteiligungsfrage: ${post.participationQuestion}`),
    ],
    sourceSection: sourceSectionFor(post),
    openQuestions: post.openQuestions,
    options: post.options,
    caveats: caveatsFor(post),
    reviewState: reviewStateFor(post),
  };
}

export function mapToReelScript(post: MasterPost): ReelScriptOutput {
  return {
    format: "reel_script",
    hook: post.hook,
    scenePlan: [
      "Szene 1: Anlass und Ort",
      "Szene 2: Was Quellen aktuell zeigen",
      "Szene 3: Was offen bleibt",
      "Szene 4: Optionen/Eventualitäten",
      "Szene 5: Beteiligungsfrage + CTA",
    ],
    voiceover: normalizeLine(`${post.overallPicture} ${post.participationQuestion} ${post.cta}`),
    caption: normalizeLine(`${post.hook} ${post.cta} ${post.backlinkTarget}`),
    sourceSection: sourceSectionFor(post),
    caveats: caveatsFor(post),
    reviewState: reviewStateFor(post),
  };
}

export function mapToVoiceoverText(post: MasterPost): VoiceoverTextOutput {
  return {
    format: "voiceover_text",
    text: normalizeLine(
      `${post.hook} ${post.overallPicture} Offene Frage: ${post.participationQuestion} ${post.cta}`,
    ),
    sourceSection: sourceSectionFor(post),
    openQuestions: post.openQuestions,
    caveats: caveatsFor(post),
    reviewState: reviewStateFor(post),
  };
}

export function mapToPodcastScript(post: MasterPost): PodcastScriptOutput {
  return {
    format: "podcast_script",
    title: `Podcast-Briefing: ${post.title}`,
    segments: [
      `Intro: ${post.hook}`,
      `Sachstand: ${post.overallPicture}`,
      `Quellenlage: ${post.sourceSituation}`,
      `Offene Fragen: ${post.openQuestions.join(" | ")}`,
      `Optionen: ${post.options.join(" | ")}`,
      `Abschluss: ${post.participationQuestion} ${post.cta}`,
    ].map(normalizeLine),
    sourceSection: sourceSectionFor(post),
    openQuestions: post.openQuestions,
    caveats: caveatsFor(post),
    reviewState: reviewStateFor(post),
  };
}
