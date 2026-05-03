import { describe, expect, it } from "vitest";
import {
  demoDossierForOutputEngine,
  generateMasterPost,
  generateOutputPackage,
  mapToAdministrativeNote,
  mapToArticle,
  mapToBriefing,
  mapToLetter,
  mapToPodcastScript,
  mapToReelScript,
  mapToVoiceoverText,
} from "@features/outputEngine";

function buildMasterPost() {
  const pkg = generateOutputPackage(demoDossierForOutputEngine, {
    generatedAt: "2026-05-03T09:00:00.000Z",
    baseUrl: "https://edebatte.org",
  });
  return generateMasterPost(pkg);
}

describe("output engine format mappers", () => {
  it("maps deterministic review-aware text formats", () => {
    const post = buildMasterPost();
    const article = mapToArticle(post);
    const briefing = mapToBriefing(post);
    const letter = mapToLetter(post);
    const note = mapToAdministrativeNote(post);

    expect(article.format).toBe("article");
    expect(briefing.format).toBe("briefing");
    expect(letter.format).toBe("letter");
    expect(note.format).toBe("administrative_note");

    [article, briefing, letter, note].forEach((entry) => {
      expect(entry.sourceSection).toContain("Quellenlage");
      expect(entry.openQuestions.length).toBeGreaterThan(0);
      expect(entry.options.length).toBeGreaterThan(0);
      expect(entry.reviewState).toBe("review_required");
    });
  });

  it("maps reel/voiceover/podcast previews from the same master post", () => {
    const post = buildMasterPost();
    const reel = mapToReelScript(post);
    const voiceover = mapToVoiceoverText(post);
    const podcast = mapToPodcastScript(post);

    expect(reel.hook.length).toBeGreaterThan(10);
    expect(reel.scenePlan).toHaveLength(5);
    expect(reel.caption).toContain(post.backlinkTarget);

    expect(voiceover.text).toContain("Offene Frage");
    expect(voiceover.sourceSection).toContain("Quellenlage");
    expect(voiceover.reviewState).toBe("review_required");

    expect(podcast.segments.length).toBeGreaterThanOrEqual(6);
    expect(podcast.sourceSection).toContain("Quellenlage");
  });
});
