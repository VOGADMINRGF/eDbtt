import { describe, expect, it } from "vitest";
import {
  formatDecisionPathLabel,
  formatFeedReviewStateLabel,
  formatOutputActionLabel,
  formatOutputSeedReviewStateLabel,
  formatOutputSeedStatusLabel,
  formatVoteDraftStatusLabel,
  getOperatorSystemTexts,
  resolveOperatorLocale,
} from "@/features/i18n/operatorSystemTexts";

describe("operator system texts i18n", () => {
  it("resolves supported locales and falls back to de", () => {
    expect(resolveOperatorLocale("es")).toBe("es");
    expect(resolveOperatorLocale("fr")).toBe("fr");
    expect(resolveOperatorLocale("zh")).toBe("zh");
    expect(resolveOperatorLocale("it")).toBe("de");
    expect(resolveOperatorLocale(undefined)).toBe("de");
    expect(resolveOperatorLocale("en")).toBe("en");
  });

  it("returns localized feed draft and decision labels", () => {
    expect(formatVoteDraftStatusLabel("published", "de")).toBe("Veröffentlicht");
    expect(formatVoteDraftStatusLabel("published", "en")).toBe("Published");
    expect(formatVoteDraftStatusLabel("published", "es")).toBe("Publicado");
    expect(formatVoteDraftStatusLabel("published", "fr")).toBe("Publié");
    expect(formatVoteDraftStatusLabel("published", "zh")).toBe("已发布");
    expect(formatVoteDraftStatusLabel("draft", "de")).toBe("Entwurf");
    expect(formatFeedReviewStateLabel("all", "de")).toBe("Alle Warteschlangen-Zustände");
    expect(formatFeedReviewStateLabel("all", "en")).toBe("All queue states");
    expect(formatFeedReviewStateLabel("all", "es")).toBe("Todos los estados de cola");
    expect(formatFeedReviewStateLabel("all", "fr")).toBe("Tous les états de file");
    expect(formatFeedReviewStateLabel("all", "zh")).toBe("所有队列状态");
    expect(formatFeedReviewStateLabel("queued", "de")).toBe("In Warteschlange");
    expect(formatFeedReviewStateLabel("attached", "en")).toBe("Linked");
    expect(formatDecisionPathLabel("manual_fast_path_via_create", "de")).toBe("Manuell via /create");
    expect(formatDecisionPathLabel("manual_fast_path_via_create", "en")).toBe("Manual via /create");
    expect(formatDecisionPathLabel("manual_fast_path_via_create", "es")).toBe("Manual mediante /create");
    expect(formatDecisionPathLabel("manual_fast_path_via_create", "fr")).toBe("Manuel via /create");
    expect(formatDecisionPathLabel("manual_fast_path_via_create", "zh")).toBe("通过 /create 手动处理");
    expect(formatDecisionPathLabel("attach_to_existing_anlassraum", "en")).toBe("Link to Anlassraum");
    expect(formatDecisionPathLabel("create_anlassraum_candidate", "en")).toBe("Create Anlassraum candidate");
  });

  it("exposes localized output action and shared text bundles", () => {
    expect(formatOutputActionLabel("publish", "de")).toBe("Manuell publizieren");
    expect(formatOutputActionLabel("publish", "en")).toBe("Manual publish");
    expect(formatOutputActionLabel("publish", "es")).toBe("Publicación manual");
    expect(formatOutputActionLabel("publish", "fr")).toBe("Publication manuelle");
    expect(formatOutputActionLabel("publish", "zh")).toBe("手动发布");
    expect(formatOutputActionLabel("queue", "de")).toBe("In Warteschlange setzen");
    expect(formatOutputActionLabel("send_to_review", "de")).toBe("Zur Prüfung senden");
    expect(formatOutputSeedStatusLabel("ready", "de")).toBe("Bereit");
    expect(formatOutputSeedStatusLabel("ready", "en")).toBe("Ready");
    expect(formatOutputSeedStatusLabel("ready", "es")).toBe("Listo");
    expect(formatOutputSeedStatusLabel("ready", "fr")).toBe("Prêt");
    expect(formatOutputSeedStatusLabel("ready", "zh")).toBe("就绪");
    expect(formatOutputSeedReviewStateLabel("approved", "de")).toBe("Freigegeben");
    expect(formatOutputSeedReviewStateLabel("approved", "en")).toBe("Approved");
    expect(formatOutputSeedReviewStateLabel("approved", "es")).toBe("Aprobado");
    expect(formatOutputSeedReviewStateLabel("approved", "fr")).toBe("Approuvé");
    expect(formatOutputSeedReviewStateLabel("approved", "zh")).toBe("已批准");
    expect(formatOutputSeedReviewStateLabel("queued", "de")).toBe("In Warteschlange");
    expect(getOperatorSystemTexts("de").feeds.headerTitle).toBe("Feed-Leitstand");
    expect(getOperatorSystemTexts("en").feeds.headerTitle).toBe("Feed control plane");
    expect(getOperatorSystemTexts("es").feeds.headerTitle).toBe("Centro de control de Feed");
    expect(getOperatorSystemTexts("fr").feeds.headerTitle).toBe("Centre de contrôle Feed");
    expect(getOperatorSystemTexts("zh").feeds.headerTitle).toBe("Feed 控制台");
  });
});
